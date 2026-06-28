import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  MessageSquare, 
  Send, 
  Plus, 
  User, 
  Search,
  MessageCircle,
  MoreVertical,
  Image as ImageIcon,
  Mic,
  Square,
  X,
  Check,
  CheckCheck,
  Trash2,
  Edit3,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { PaginationControls, getTotalPages, paginateItems } from "@/components/PaginationControls";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const THREAD_PAGE_SIZE = 8;

interface Thread { 
  id: number; 
  studentId: number; 
  teacherId: number; 
  studentName?: string; 
  teacherName?: string; 
  courseName?: string; 
  lastMessageAt: string; 
  lastMessagePreview?: string;
  messageCount?: number;
  studentOnline?: boolean;
  teacherOnline?: boolean;
}
interface Message { 
  id: number; 
  senderId: number; 
  body: string; 
  attachmentUrl?: string | null;
  attachmentType?: "image" | "audio" | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  senderName?: string; 
  senderRole?: string; 
  createdAt: string; 
  isRead: boolean; 
  isDelivered?: boolean;
}

// ─── Scoped Subcomponent to eliminate typing re-render latency ─────────────────
interface ChatInputProps {
  onSend: (body: string) => Promise<void>;
  disabled: boolean;
  onType?: () => void;
}

function ChatInput({ onSend, disabled, onType }: ChatInputProps) {
  const [body, setBody] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    
    setBody("");
    await onSend(text);
  };

  return (
    <div className="shrink-0 border-t border-slate-200 bg-[#f0f2f5] p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (onType) onType();
            }}
            onFocus={() => {
              if (onType) onType();
            }}
            placeholder="Type a message to student..."
            className="h-11 rounded-full border-transparent bg-white px-5 pr-12 font-medium shadow-sm transition-all focus:border-emerald-200 focus:bg-white"
            disabled={disabled}
          />
        </div>
        <Button 
          type="submit" 
          disabled={!body.trim() || disabled}
          className="h-11 w-11 shrink-0 rounded-full bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
        >
          {disabled ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
        </Button>
      </form>
    </div>
  );
}


export default function TeacherMessages() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newChatCourseId, setNewChatCourseId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  
  // Modals for deleting chat/messages
  const [deleteThreadDialogOpen, setDeleteThreadDialogOpen] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState<number | null>(null);

  // Edit Message states
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const prevThreadIdRef = useRef<number | null>(null);

  // Pagination states
  const [threadPage, setThreadPage] = useState(1);

  const authHeaders = { Authorization: `Bearer ${token}` };
  const headers = { ...authHeaders, "Content-Type": "application/json" };

  const cacheKey = user?.id ? `teacher_threads_${user.id}` : null;

  const fetchThreads = async (silent = false) => {
    try {
      const r = await fetch(`${BASE}/api/messages/threads?userId=${user?.id}`, { headers });
      if (r.ok) {
        const data = await r.json();
        setThreads(data);
        if (cacheKey) {
          try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        }
      } else if (!silent) setThreads([]);
    } catch {
      if (!silent) setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const msgCacheKey = (threadId: number) => `teacher_messages_${user?.id}_${threadId}`;

  const fetchMessages = async (threadId: number, silent = false) => {
    const r = await fetch(`${BASE}/api/messages/threads/${threadId}?viewerId=${user?.id}`, { headers });
    if (r.ok) {
      const data = await r.json();
      setMessages(data);
      try { localStorage.setItem(msgCacheKey(threadId), JSON.stringify(data)); } catch {}
    }
  };

  const markThreadRead = (threadId: number) => {
    if (!user?.id) return;
    fetch(`${BASE}/api/messages/threads/${threadId}/read`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ userId: user.id }),
    }).catch(() => {});
  };

  // On mount: load cache, then fetch threads
  useEffect(() => {
    if (!user?.id) return;
    if (cacheKey) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as Thread[];
          setThreads(parsed);
          setLoading(false);
          fetchThreads(true);
          return;
        }
      } catch {}
    }
    fetchThreads(false);
  }, [user?.id]);

  // Load students directory and courses exactly once per session when starting new chat
  useEffect(() => {
    if (!isNewChatOpen || !user?.id || students.length > 0) return;
    
    // Fetch students
    fetch(`${BASE}/api/users?role=student`, { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setStudents(data))
      .catch(() => setStudents([]));

    // Fetch teacher's courses
    fetch(`${BASE}/api/courses`, { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const teacherCourses = data.filter((c: any) => c.teacherId === user.id);
        setCourses(teacherCourses);
      })
      .catch(() => setCourses([]));
  }, [isNewChatOpen, user?.id]);

  useEffect(() => {
    if (!selectedThread && threads.length > 0) setSelectedThread(threads[0]);
    if (selectedThread) {
      const updated = threads.find((thread) => thread.id === selectedThread.id);
      if (updated && (updated.studentOnline !== selectedThread.studentOnline || updated.lastMessageAt !== selectedThread.lastMessageAt)) {
        setSelectedThread(updated);
      }
    }
  }, [selectedThread, threads]);

  useEffect(() => {
    if (!selectedThread) return;
    const threadId = selectedThread.id;
    markThreadRead(threadId);
    const cached = (() => {
      try {
        const raw = localStorage.getItem(msgCacheKey(threadId));
        return raw ? (JSON.parse(raw) as Message[]) : null;
      } catch { return null; }
    })();
    if (cached) {
      setMessages(cached);
      fetchMessages(threadId, true);
    } else {
      fetchMessages(threadId, false);
    }
  }, [selectedThread?.id, user?.id]);

  useEffect(() => {
    if (!selectedThread || !user?.id || !token) return;
    const interval = window.setInterval(() => {
      fetchMessages(selectedThread.id);
      fetchThreads();
    }, 2500);
    return () => window.clearInterval(interval);
  }, [selectedThread?.id, user?.id, token]);

  // Professional auto-scroll logic: instant on thread switch, smooth on new message in active thread
  useEffect(() => {
    if (!selectedThread) return;
    const isSwitchingThread = prevThreadIdRef.current !== selectedThread.id;
    prevThreadIdRef.current = selectedThread.id;

    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ 
        behavior: isSwitchingThread ? "auto" : "smooth" 
      });
    }, 60);
    return () => clearTimeout(timer);
  }, [messages, selectedThread?.id]);

  const handleSendMessage = async (text: string) => {
    if (!selectedThread || !user?.id) return;

    // Create optimistic message object
    const tempId = -Date.now();

    const optimisticMsg: Message = {
      id: tempId,
      senderId: user.id,
      body: text,
      attachmentUrl: null,
      attachmentType: null,
      attachmentName: null,
      attachmentSize: null,
      senderName: user.name || "Me",
      senderRole: user.role,
      createdAt: new Date().toISOString(),
      isRead: false,
      isDelivered: false
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setSending(true);

    try {
      const r = await fetch(`${BASE}/api/messages/threads/${selectedThread.id}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          senderId: user.id,
          body: text,
        }),
      });

      if (r.ok) {
        const savedMsg = await r.json();
        setMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m));
        fetchThreads(true);
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast({ title: "Message could not be sent", variant: "destructive" });
      }
    } catch (error: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast({ title: error?.message || "Sending failed", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const startThread = async () => {
    if (!newStudentId) return;
    setCreatingThread(true);
    try {
      const r = await fetch(`${BASE}/api/messages/threads`, {
        method: "POST", 
        headers, 
        body: JSON.stringify({ 
          studentId: Number(newStudentId), 
          teacherId: user?.id,
          courseId: newChatCourseId ? Number(newChatCourseId) : null
        })
      });
      if (r.ok) {
        const newT = await r.json();
        const studentObj = students.find((s: any) => s.id.toString() === newStudentId);
        const courseObj = courses.find((c: any) => c.id.toString() === newChatCourseId);
        
        const formattedT = {
          ...newT,
          studentName: studentObj?.name || "Student",
          courseName: courseObj?.title || "General Support",
          lastMessageAt: new Date().toISOString()
        };
        
        setThreads(prev => {
          if (prev.some(t => t.id === formattedT.id)) return prev;
          return [formattedT, ...prev];
        });
        setSelectedThread(formattedT);
        setIsNewChatOpen(false);
        setNewStudentId("");
        setNewChatCourseId("");
        toast({ title: "Conversation started" });
      }
    } catch {
      toast({ title: "Failed to create thread", variant: "destructive" });
    } finally {
      setCreatingThread(false);
    }
  };

  const deleteThread = async () => {
    if (!selectedThread) return;
    try {
      const r = await fetch(`${BASE}/api/messages/threads/${selectedThread.id}?userId=${user?.id}`, {
        method: "DELETE", headers
      });
      if (r.ok) {
        toast({ title: "Conversation deleted successfully" });
        setThreads(prev => prev.filter(t => t.id !== selectedThread.id));
        setSelectedThread(null);
        setDeleteThreadDialogOpen(false);
      }
    } catch {
      toast({ title: "Failed to delete thread", variant: "destructive" });
    }
  };

  const deleteMessage = async (messageId: number) => {
    try {
      const r = await fetch(`${BASE}/api/messages/${messageId}?userId=${user?.id}`, {
        method: "DELETE", headers
      });
      if (r.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        setDeleteMessageId(null);
        toast({ title: "Message deleted" });
        fetchThreads(true);
      }
    } catch {
      toast({ title: "Failed to delete message", variant: "destructive" });
    }
  };

  const handleEditClick = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.body);
  };

  const saveEditedMessage = async (messageId: number) => {
    if (!editingText.trim()) return;
    try {
      const r = await fetch(`${BASE}/api/messages/${messageId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ body: editingText.trim(), userId: user?.id })
      });
      if (r.ok) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, body: editingText.trim() } : m));
        setEditingMessageId(null);
        toast({ title: "Message updated" });
        fetchThreads(true);
      }
    } catch {
      toast({ title: "Failed to update message", variant: "destructive" });
    }
  };

  // Filter threads
  const filteredThreads = threads.filter(t => 
    t.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginate threads
  const totalThreadPages = getTotalPages(filteredThreads.length, THREAD_PAGE_SIZE);
  const paginatedThreads = paginateItems(filteredThreads, threadPage, THREAD_PAGE_SIZE);

  const getMessageStatus = (msg: Message) => {
    if (msg.isRead) return "seen";
    if (msg.isDelivered) return "delivered";
    return "sent";
  };

  const MessageStatusIcon = ({ msg }: { msg: Message }) => {
    const status = getMessageStatus(msg);
    if (status === "sent") return <Check className="h-4 w-4 text-slate-500" />;
    return <CheckCheck className={`h-4 w-4 ${status === "seen" ? "text-blue-500" : "text-slate-500"}`} />;
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-7rem)] flex-col">
        {/* Page Header */}
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Message Portal</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Provide direct academic assistance to students</p>
          </div>
        </div>

        {/* Messaging Layout */}
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          
          {/* Thread list sidebar */}
          <div className="flex w-[380px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-[#f0f2f5] p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-black text-slate-900">Conversations</p>
                  <p className="text-xs font-medium text-slate-500">{filteredThreads.length} total</p>
                </div>
                <Button 
                  size="sm" 
                  className="rounded-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                  onClick={() => setIsNewChatOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Start Chat
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search student or course..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setThreadPage(1);
                  }}
                  className="h-10 rounded-full border-transparent bg-white pl-11 text-sm font-medium shadow-sm focus:border-emerald-200"
                />
              </div>
            </div>
            
            {/* Sidebar list items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between">
              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Loading Threads...</p>
                  </div>
                ) : paginatedThreads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 p-6 text-center opacity-30">
                    <MessageCircle className="h-12 w-12 mb-4" />
                    <p className="font-bold text-slate-900">No chats found</p>
                  </div>
                ) : (
                  paginatedThreads.map((t) => {
                    const otherName = t.studentName;
                    const isSelected = selectedThread?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedThread(t)}
                        className={`flex w-full items-start gap-3 p-4 text-left transition-all ${
                          isSelected ? "bg-slate-100" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                            {otherName?.charAt(0) ?? "S"}
                          </div>
                          {t.studentOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-sm font-bold text-slate-800">{otherName}</p>
                            <span className="shrink-0 text-[10px] font-bold text-slate-400">
                              {new Date(t.lastMessageAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="truncate text-xs font-semibold text-slate-500 mt-0.5">
                            {t.courseName}
                          </p>
                          <p className="truncate text-xs text-slate-400 mt-1 font-medium">
                            {t.lastMessagePreview || "No messages yet"}
                          </p>
                        </div>
                        {t.messageCount ? (
                          <Badge className="shrink-0 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                            {t.messageCount}
                          </Badge>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Sidebar pagination controls */}
              {totalThreadPages > 1 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                  <PaginationControls 
                    currentPage={threadPage}
                    totalPages={totalThreadPages}
                    onPageChange={setThreadPage}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Active Chat Conversation Board */}
          <div className="flex flex-1 flex-col overflow-hidden bg-[#efeae2]">
            {!selectedThread ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center opacity-30">
                <MessageSquare className="h-16 w-16 text-primary mb-4" />
                <h3 className="text-xl font-black text-slate-900">Academic Chatroom</h3>
                <p className="text-sm font-medium mt-1.5 max-w-xs">
                  Select a student conversation from the sidebar to send instructions.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-[#f0f2f5] px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        {selectedThread.studentName?.charAt(0) ?? "S"}
                      </div>
                      {selectedThread.studentOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">
                        {selectedThread.studentName}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                        {selectedThread.courseName} • {selectedThread.studentOnline ? "Online" : "Away"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setDeleteThreadDialogOpen(true)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

                {/* Messages view body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?.id;
                    const showName = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
                    const previousDay = idx > 0 ? new Date(messages[idx - 1].createdAt).toDateString() : "";
                    const currentDay = new Date(msg.createdAt).toDateString();
                    const showDateSeparator = previousDay !== currentDay;
                    const isEditing = editingMessageId === msg.id;

                    return (
                      <div key={msg.id} className="space-y-3">
                        {showDateSeparator && (
                          <div className="flex justify-center my-4">
                            <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm border border-slate-100">
                              {currentDay}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`relative group max-w-[70%] rounded-2xl p-3 text-sm shadow-sm border border-black/5
                            ${isMe 
                              ? "rounded-tr-none bg-[#d9fdd3] text-slate-900" 
                              : "rounded-tl-none bg-white text-slate-900"}
                          `}>
                            {msg.attachmentUrl && msg.attachmentType === "image" && (
                              <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={msg.attachmentUrl}
                                  alt={msg.attachmentName || "Message image"}
                                  className="mb-2 max-h-72 w-full max-w-sm rounded-md object-cover"
                                />
                              </a>
                            )}
                            {msg.attachmentUrl && msg.attachmentType === "audio" && (
                              <audio controls src={msg.attachmentUrl} className="mb-2 w-64 max-w-full" />
                            )}
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea 
                                  value={editingText}
                                  onChange={e => setEditingText(e.target.value)}
                                  className="w-full min-w-[200px] p-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
                                  rows={2}
                                />
                                <div className="flex justify-end gap-1.5">
                                  <Button size="sm" variant="ghost" onClick={() => setEditingMessageId(null)} className="h-7 text-xs">Cancel</Button>
                                  <Button size="sm" onClick={() => saveEditedMessage(msg.id)} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"><Save className="h-3 w-3" /> Save</Button>
                                </div>
                              </div>
                            ) : (
                              msg.body && <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                            )}
                            <div className="mt-1 flex items-center justify-end gap-1.5 pl-8 text-[10px] font-bold text-slate-500">
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              {isMe && <MessageStatusIcon msg={msg} />}
                            </div>

                            {/* Options dropdown menu for sent text messages */}
                            {isMe && !isEditing && !msg.attachmentUrl && (
                              <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-6 w-6 rounded-full bg-white shadow-sm border border-slate-200 text-slate-500">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="rounded-xl shadow-lg border border-slate-100 text-xs">
                                    <DropdownMenuItem onClick={() => handleEditClick(msg)} className="cursor-pointer">
                                      <Edit3 className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => setDeleteMessageId(msg.id)}
                                      className="text-red-600 focus:text-red-600 cursor-pointer"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Subcomponent handles input, attachments and recording internally */}
                <ChatInput 
                  onSend={handleSendMessage} 
                  disabled={sending} 
                  onType={() => {
                    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* New Message Dialog */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Start Conversation</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Choose a student and an optional course thread to start.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Select Student</Label>
              <Select value={newStudentId} onValueChange={setNewStudentId}>
                <SelectTrigger className="w-full h-12 border-slate-200 rounded-2xl">
                  <SelectValue placeholder={students.length === 0 ? "Loading student list..." : "Choose a student..."} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-60 overflow-y-auto">
                  {students.map((student: any) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.name} • {student.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Select Course (Optional)</Label>
              <Select value={newChatCourseId} onValueChange={setNewChatCourseId}>
                <SelectTrigger className="w-full h-12 border-slate-200 rounded-2xl">
                  <SelectValue placeholder="General Support Chat (No Course)" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="">General Support (No Course)</SelectItem>
                  {courses.map((course: any) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 flex gap-3">
            <Button variant="ghost" onClick={() => setIsNewChatOpen(false)} className="flex-1 font-bold text-slate-600 rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={startThread} 
              disabled={!newStudentId || creatingThread} 
              className="flex-1 bg-primary text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20"
            >
              {creatingThread ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Start Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Thread Confirmation Dialog */}
      <AlertDialog open={deleteThreadDialogOpen} onOpenChange={setDeleteThreadDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this entire conversation with {selectedThread?.studentName}. All messages will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteThread} className="bg-red-600 hover:bg-red-700">
              Delete Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Message Confirmation Dialog */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={(open) => !open && setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this message. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMessageId && deleteMessage(deleteMessageId)} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
