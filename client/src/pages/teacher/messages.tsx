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
  X
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
}

interface PendingMedia {
  file: File;
  type: "image" | "audio";
  previewUrl: string;
}

export default function TeacherMessages() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newStudentId, setNewStudentId] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [threadPage, setThreadPage] = useState(1);
  const [students, setStudents] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const authHeaders = { Authorization: `Bearer ${token}` };
  const headers = { ...authHeaders, "Content-Type": "application/json" };

  const fetchThreads = async () => {
    const r = await fetch(`${BASE}/api/messages/threads?userId=${user?.id}`, { headers });
    if (r.ok) setThreads(await r.json());
    setLoading(false);
  };

  const fetchMessages = async (threadId: number) => {
    const r = await fetch(`${BASE}/api/messages/threads/${threadId}`, { headers });
    if (r.ok) setMessages(await r.json());
  };

  useEffect(() => { fetchThreads(); }, []);
  useEffect(() => {
    if (!user?.id || !token) return;
    fetch(`${BASE}/api/dashboard/teacher/students?userId=${user.id}`, { headers })
      .then((res) => res.ok ? res.json() : [])
      .then((rows) => {
        const unique = new Map<number, any>();
        (Array.isArray(rows) ? rows : []).forEach((student: any) => {
          if (!unique.has(student.id)) unique.set(student.id, student);
        });
        setStudents(Array.from(unique.values()));
      })
      .catch(() => setStudents([]));
  }, [user?.id, token]);
  useEffect(() => { if (selectedThread) fetchMessages(selectedThread.id); }, [selectedThread]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => () => {
    if (pendingMedia?.previewUrl) URL.revokeObjectURL(pendingMedia.previewUrl);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, [pendingMedia?.previewUrl]);

  const clearPendingMedia = () => {
    if (pendingMedia?.previewUrl) URL.revokeObjectURL(pendingMedia.previewUrl);
    setPendingMedia(null);
  };

  const handleImagePick = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Image must be under 8MB", variant: "destructive" });
      return;
    }
    clearPendingMedia();
    setPendingMedia({ file, type: "image", previewUrl: URL.createObjectURL(file) });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: blob.type });
        clearPendingMedia();
        setPendingMedia({ file, type: "audio", previewUrl: URL.createObjectURL(blob) });
        stream.getTracks().forEach((track) => track.stop());
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast({ title: "Microphone permission is needed to record voice notes", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  const uploadPendingMedia = async () => {
    if (!pendingMedia) return null;
    const formData = new FormData();
    formData.append("media", pendingMedia.file);
    const r = await fetch(`${BASE}/api/messages/upload`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });
    if (!r.ok) {
      const error = await r.json().catch(() => null);
      throw new Error(error?.error || error?.message || "Media upload failed");
    }
    return r.json();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!body.trim() && !pendingMedia) || !selectedThread) return;
    setSending(true);
    try {
      const media = await uploadPendingMedia();
      const r = await fetch(`${BASE}/api/messages/threads/${selectedThread.id}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          senderId: user?.id,
          body,
          attachmentUrl: media?.url,
          attachmentType: media?.type,
          attachmentName: media?.name,
          attachmentSize: media?.size,
        }),
      });
      if (r.ok) {
        setBody("");
        clearPendingMedia();
        fetchMessages(selectedThread.id);
        fetchThreads();
      } else {
        toast({ title: "Message could not be sent", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: error?.message || "Media upload failed", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const startThread = async () => {
    if (!newStudentId) return;
    const r = await fetch(`${BASE}/api/messages/threads`, {
      method: "POST", headers, body: JSON.stringify({ studentId: Number(newStudentId), teacherId: user?.id }),
    });
    if (r.ok) { toast({ title: "Conversation started!" }); fetchThreads(); setNewOpen(false); setNewStudentId(""); }
  };

  const filteredThreads = threads.filter(t => 
    t.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.courseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const visibleThreads = paginateItems(filteredThreads, threadPage, THREAD_PAGE_SIZE);
  const totalThreadPages = getTotalPages(filteredThreads.length, THREAD_PAGE_SIZE);

  useEffect(() => {
    setThreadPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (threadPage > totalThreadPages) setThreadPage(totalThreadPages);
  }, [threadPage, totalThreadPages]);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Messages</h1>
            <p className="text-slate-500 font-medium mt-1">Direct communication with your students</p>
          </div>
          
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl font-bold shadow-lg shadow-primary/20 h-12 px-6">
                <Plus className="h-5 w-5 mr-2" /> Start New Chat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[32px] p-8 border-2 border-slate-100">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">New Conversation</DialogTitle>
                <p className="text-slate-500 text-sm font-medium">Select a student to begin a private chat</p>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">Select Student</Label>
                  <select 
                    value={newStudentId} 
                    onChange={e => setNewStudentId(e.target.value)}
                    className="w-full h-12 rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">Choose a student...</option>
                    {students?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter className="mt-8 gap-3">
                <Button variant="ghost" onClick={() => setNewOpen(false)} className="rounded-xl font-bold text-slate-500">Cancel</Button>
                <Button onClick={startThread} disabled={!newStudentId} className="rounded-xl font-bold px-8 shadow-lg shadow-primary/10">Start Chat</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Messaging Layout */}
        <div className="flex flex-1 gap-6 min-h-0">
          {/* Thread list */}
          <div className="w-96 shrink-0 bg-white rounded-[32px] border-2 border-slate-100 flex flex-col overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-50">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search chats..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 transition-all font-medium text-sm"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-bold uppercase tracking-widest text-[10px]">Syncing chats...</p>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-30">
                  <MessageCircle className="h-12 w-12 mb-4" />
                  <p className="font-bold text-slate-900 text-lg">No chats found</p>
                  <p className="text-sm font-medium mt-1">Start a new conversation with a student.</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {visibleThreads.map((t) => {
                    const otherName = t.studentName;
                    const isSelected = selectedThread?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedThread(t)}
                        className={`w-full flex items-center gap-4 p-4 rounded-[24px] transition-all group ${
                          isSelected 
                            ? "bg-primary text-white shadow-xl shadow-primary/20" 
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-transform group-hover:scale-105 ${
                          isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                        }`}>
                          {otherName?.charAt(0) ?? "S"}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="font-black text-sm truncate">{otherName ?? "Student"}</p>
                            <span className={`text-[10px] font-bold ${isSelected ? "text-white/60" : "text-slate-400"}`}>
                              {new Date(t.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className={`text-xs truncate font-bold ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                            {t.courseName || "No course assigned"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                  <PaginationControls
                    page={threadPage}
                    pageSize={THREAD_PAGE_SIZE}
                    totalItems={filteredThreads.length}
                    onPageChange={setThreadPage}
                    label="chats"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 bg-white rounded-[32px] border-2 border-slate-100 flex flex-col overflow-hidden shadow-sm">
            {!selectedThread ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="h-24 w-24 rounded-[40px] bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                  <MessageSquare className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Inbox Zero</h3>
                <p className="text-slate-500 font-medium mt-2 max-w-xs">
                  Select a student from the sidebar to view messages or start a new conversation.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md z-10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                      {selectedThread.studentName?.charAt(0) ?? "S"}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg">{selectedThread.studentName}</h3>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {selectedThread.courseName || "General Discussion"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-slate-900">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?.id;
                    const showName = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
                    
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        {showName && !isMe && (
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5 ml-1">
                            {msg.senderName}
                          </span>
                        )}
                        <div className={`
                          max-w-[80%] px-5 py-3.5 rounded-[22px] text-sm font-medium shadow-sm leading-relaxed space-y-3
                          ${isMe 
                            ? "bg-slate-900 text-white rounded-tr-none" 
                            : "bg-white text-slate-800 border-2 border-slate-50 rounded-tl-none"}
                        `}>
                          {msg.attachmentUrl && msg.attachmentType === "image" && (
                            <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                              <img
                                src={msg.attachmentUrl}
                                alt={msg.attachmentName || "Message image"}
                                className="max-h-72 w-full max-w-sm rounded-2xl object-cover"
                              />
                            </a>
                          )}
                          {msg.attachmentUrl && msg.attachmentType === "audio" && (
                            <audio controls src={msg.attachmentUrl} className="w-64 max-w-full" />
                          )}
                          {msg.body && <p>{msg.body}</p>}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-2 mx-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Message Input */}
                <div className="p-8 border-t border-slate-50 bg-white shrink-0">
                  {pendingMedia && (
                    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      {pendingMedia.type === "image" ? (
                        <img src={pendingMedia.previewUrl} alt="Selected image" className="h-16 w-16 rounded-xl object-cover" />
                      ) : (
                        <audio controls src={pendingMedia.previewUrl} className="h-10 max-w-xs" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">{pendingMedia.file.name}</p>
                        <p className="text-xs font-medium text-slate-400">{Math.ceil(pendingMedia.file.size / 1024)} KB</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={clearPendingMedia} className="rounded-xl text-slate-400">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <form onSubmit={sendMessage} className="flex gap-3 items-center">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleImagePick(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={sending || isRecording}
                      className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-500 hover:text-primary"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={sending}
                      className={`h-14 w-14 rounded-2xl ${isRecording ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500 hover:text-primary"}`}
                    >
                      {isRecording ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Type a message to student..."
                        className="h-14 bg-slate-50 border-transparent rounded-2xl px-6 focus:bg-white focus:border-primary/20 transition-all font-medium pr-12"
                        disabled={sending}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={(!body.trim() && !pendingMedia) || sending || isRecording}
                      className="h-14 w-14 rounded-2xl shadow-xl shadow-primary/20 shrink-0"
                    >
                      {sending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
