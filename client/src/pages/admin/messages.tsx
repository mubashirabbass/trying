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
  Search, 
  MessageCircle, 
  Plus, 
  ChevronRight, 
  Check, 
  CheckCheck, 
  Trash2, 
  Edit3, 
  X, 
  User,
  MoreVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

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
            placeholder="Type a message..."
            className="h-11 rounded-full border-transparent bg-white px-5 pr-12 font-medium shadow-sm transition-all focus:border-emerald-200 focus:bg-white"
            disabled={disabled}
          />
        </div>
        <Button 
          type="submit" 
          disabled={!body.trim() || disabled}
          className="h-11 w-11 shrink-0 rounded-full bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 text-white"
        >
          {disabled ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  );
}

export default function AdminMessages() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // New Chat modal states
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatRole, setNewChatRole] = useState<"student" | "teacher">("student");
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);

  // Deleting and Editing states
  const [deleteThreadDialogOpen, setDeleteThreadDialogOpen] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const prevThreadIdRef = useRef<number | null>(null);

  const authHeaders = { Authorization: `Bearer ${token}` };
  const headers = { ...authHeaders, "Content-Type": "application/json" };

  const cacheKey = user?.id ? `admin_threads_${user.id}` : null;

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

  const msgCacheKey = (threadId: number) => `admin_messages_${user?.id}_${threadId}`;

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

  // Load contacts when starting new chat or when role filter changes
  useEffect(() => {
    if (!isNewChatOpen || !user?.id) return;
    setLoadingContacts(true);
    fetch(`${BASE}/api/users?role=${newChatRole}`, { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setContacts(data))
      .catch(() => setContacts([]))
      .finally(() => setLoadingContacts(false));
  }, [isNewChatOpen, newChatRole, user?.id]);

  useEffect(() => {
    if (!selectedThread && threads.length > 0) setSelectedThread(threads[0]);
    if (selectedThread) {
      const updated = threads.find((thread) => thread.id === selectedThread.id);
      if (updated && (updated.lastMessageAt !== selectedThread.lastMessageAt)) {
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
    }, 3000);
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

  const handleCreateThread = async () => {
    if (!selectedContactId) return;
    const contact = contacts.find((c: any) => c.id.toString() === selectedContactId);
    if (!contact) return;

    setCreatingThread(true);
    try {
      // Determine columns: support studentId = contact.id (if student) or admin.id (if student role is admin)
      const studentId = newChatRole === "student" ? contact.id : user?.id;
      const teacherId = newChatRole === "student" ? user?.id : contact.id;

      const r = await fetch(`${BASE}/api/messages/threads`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          studentId: Number(studentId),
          teacherId: Number(teacherId),
          courseId: null
        })
      });
      if (r.ok) {
        const newThread = await r.json();
        const formattedThread = {
          ...newThread,
          studentName: newChatRole === "student" ? contact.name : user?.name,
          teacherName: newChatRole === "student" ? user?.name : contact.name,
          lastMessageAt: new Date().toISOString()
        };
        setThreads(prev => {
          if (prev.some(t => t.id === formattedThread.id)) return prev;
          return [formattedThread, ...prev];
        });
        setSelectedThread(formattedThread);
        setIsNewChatOpen(false);
        setSelectedContactId("");
        toast({ title: "Conversation started" });
      } else {
        toast({ title: "Failed to start conversation", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error starting chat", variant: "destructive" });
    } finally {
      setCreatingThread(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!selectedThread) return;
    try {
      const r = await fetch(`${BASE}/api/messages/threads/${selectedThread.id}?userId=${user?.id}`, {
        method: "DELETE",
        headers
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

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const r = await fetch(`${BASE}/api/messages/${messageId}?userId=${user?.id}`, {
        method: "DELETE",
        headers
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

  const getOtherParticipantName = (t: Thread) => {
    if (t.studentId === user?.id) {
      return t.teacherName || "User";
    }
    return t.studentName || "User";
  };

  const filteredThreads = threads.filter(t => {
    const name = getOtherParticipantName(t);
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           t.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-7rem)] flex-col">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Message Hub</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Communicate directly with students and faculty</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Thread List Sidebar */}
          <div className="flex w-[380px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-[#f0f2f5] p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-black text-slate-900">Chats</p>
                  <p className="text-xs font-medium text-slate-500">{filteredThreads.length} conversations</p>
                </div>
                <Button 
                  size="sm" 
                  className="rounded-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                  onClick={() => setIsNewChatOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> New Message
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search chats..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-full border-transparent bg-white pl-11 text-sm font-medium shadow-sm transition-all focus:border-emerald-200 focus:bg-white"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto sidebar-scroll">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-bold uppercase tracking-widest text-[10px]">Syncing chats...</p>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-30">
                  <MessageCircle className="h-12 w-12 mb-4" />
                  <p className="font-bold text-slate-900 text-lg">No chats yet</p>
                  <p className="text-sm font-medium mt-1">Start a conversation by clicking 'New Message'.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredThreads.map((t) => {
                    const otherName = getOtherParticipantName(t);
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
                          <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                            {otherName?.charAt(0) ?? "U"}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-bold text-slate-950">{otherName}</p>
                            <span className="text-[10px] font-medium text-slate-400 shrink-0">
                              {new Date(t.lastMessageAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500 font-medium">{t.lastMessagePreview || "No messages yet"}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active Chat Pane */}
          <div className="flex flex-1 flex-col overflow-hidden bg-[#efeae2]">
            {selectedThread ? (
              <>
                {/* Chat header */}
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-[#f0f2f5] px-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-700">
                      {getOtherParticipantName(selectedThread).charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-950">{getOtherParticipantName(selectedThread)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedThread.courseName || "Private Conversation"}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full text-slate-500 hover:bg-slate-200"
                    onClick={() => setDeleteThreadDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                {/* Messages feed */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 sidebar-scroll">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`relative max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          isMe 
                            ? "bg-[#d9fdd3] text-slate-900 rounded-tr-none" 
                            : "bg-white text-slate-900 rounded-tl-none"
                        }`}>
                          <div className="flex flex-col gap-1">
                            {editingMessageId === msg.id ? (
                              <div className="flex flex-col gap-2 min-w-[200px]">
                                <Input 
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="h-8 text-xs rounded-lg"
                                />
                                <div className="flex justify-end gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => setEditingMessageId(null)} className="h-6 text-[10px]">Cancel</Button>
                                  <Button size="sm" onClick={() => saveEditedMessage(msg.id)} className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700">Save</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="font-medium break-all whitespace-pre-wrap">{msg.body}</p>
                                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                  <span className="text-[9px] font-medium text-slate-400">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isMe && (
                                    <div className="flex gap-1 items-center">
                                      <button onClick={() => handleEditClick(msg)} className="opacity-40 hover:opacity-100 transition-opacity">
                                        <Edit3 className="h-3 w-3 text-slate-500" />
                                      </button>
                                      <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-40 hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-3 w-3 text-red-500" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Chat input */}
                <ChatInput 
                  onSend={handleSendMessage} 
                  disabled={sending} 
                  onType={() => {
                    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center opacity-30">
                <MessageSquare className="h-16 w-16 mb-4" />
                <p className="font-bold text-slate-900 text-xl">Select a conversation</p>
                <p className="text-sm font-medium mt-1">Select one of your chats from the sidebar to load the history.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">New Conversation</DialogTitle>
            <DialogDescription className="text-xs">
              Select student or teacher to start chatting.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider">Select Contact Type</Label>
              <Select 
                value={newChatRole} 
                onValueChange={(val: any) => {
                  setNewChatRole(val);
                  setSelectedContactId("");
                }}
              >
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact" className="text-xs font-bold uppercase tracking-wider">Choose Contact</Label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder={loadingContacts ? "Loading contacts..." : "Select contact..."} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {loadingContacts ? (
                    <div className="py-2 text-center text-xs opacity-50 flex justify-center items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Fetching list...</div>
                  ) : contacts.length === 0 ? (
                    <div className="py-2 text-center text-xs opacity-50">No users found.</div>
                  ) : (
                    contacts.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.email})</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsNewChatOpen(false)}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateThread} 
              disabled={creatingThread || !selectedContactId}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-white"
            >
              {creatingThread ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Thread Confirmation Dialog */}
      <Dialog open={deleteThreadDialogOpen} onOpenChange={setDeleteThreadDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-red-600">Delete Conversation</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete this chat history? This action is permanent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteThreadDialogOpen(false)}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteThread}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
