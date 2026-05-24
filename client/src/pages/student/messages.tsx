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
  MoreVertical,
  Plus,
  Image as ImageIcon,
  Mic,
  Square,
  X,
  Check,
  CheckCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useListCourses } from "@workspace/api-client-react";
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

interface PendingMedia {
  file: File;
  type: "image" | "audio";
  previewUrl: string;
}

export default function StudentMessages() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const { data: courses } = useListCourses({ status: "live" } as any);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const authHeaders = { Authorization: `Bearer ${token}` };
  const headers = { ...authHeaders, "Content-Type": "application/json" };

  const fetchThreads = async () => {
    try {
      const r = await fetch(`${BASE}/api/messages/threads?userId=${user?.id}`, { headers });
      if (r.ok) setThreads(await r.json());
      else setThreads([]);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId: number) => {
    const r = await fetch(`${BASE}/api/messages/threads/${threadId}?viewerId=${user?.id}`, { headers });
    if (r.ok) setMessages(await r.json());
  };

  const markThreadRead = async (threadId: number) => {
    if (!user?.id) return;
    await fetch(`${BASE}/api/messages/threads/${threadId}/read`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ userId: user.id }),
    }).catch(() => {});
  };

  useEffect(() => { fetchThreads(); }, []);
  useEffect(() => {
    if (!selectedThread && threads.length > 0) setSelectedThread(threads[0]);
    if (selectedThread) {
      const updated = threads.find((thread) => thread.id === selectedThread.id);
      if (updated && (updated.teacherOnline !== selectedThread.teacherOnline || updated.lastMessageAt !== selectedThread.lastMessageAt)) {
        setSelectedThread(updated);
      }
    }
  }, [selectedThread, threads]);
  useEffect(() => {
    if (!selectedThread) return;
    markThreadRead(selectedThread.id).finally(() => fetchMessages(selectedThread.id));
  }, [selectedThread?.id, user?.id]);
  useEffect(() => {
    if (!selectedThread || !user?.id || !token) return;
    const interval = window.setInterval(() => {
      fetchMessages(selectedThread.id);
      fetchThreads();
    }, 8000);
    return () => window.clearInterval(interval);
  }, [selectedThread?.id, user?.id, token]);
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

  const handleCourseSelect = (val: string) => {
    setSelectedCourseId(val);
  };

  const handleCreateThread = async () => {
    if (!selectedCourseId || !courses) return;
    const course = courses.find((c: any) => c.id.toString() === selectedCourseId);
    if (!course || !course.teacherId) return;

    setCreatingThread(true);
    try {
      const r = await fetch(`${BASE}/api/messages/threads`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          studentId: user?.id,
          teacherId: course.teacherId,
          courseId: course.id
        })
      });
      if (r.ok) {
        const newThread = await r.json();
        const formattedThread = {
          ...newThread,
          teacherName: course.teacherName,
          courseName: course.title,
          lastMessageAt: new Date().toISOString()
        };
        setThreads(prev => {
          if (prev.some(t => t.id === formattedThread.id)) return prev;
          return [formattedThread, ...prev];
        });
        setSelectedThread(formattedThread);
        setIsNewChatOpen(false);
        setSelectedCourseId("");
        toast({ title: "Conversation started", description: `You can now chat with ${course.teacherName}.` });
      } else {
        toast({ title: "Failed to start conversation", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error starting chat", variant: "destructive" });
    } finally {
      setCreatingThread(false);
    }
  };

  const filteredThreads = threads.filter(t => 
    t.teacherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase())
  );
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
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Messages</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Private guidance from your instructors</p>
          </div>
        </div>

        {/* Messaging Layout */}
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Thread list */}
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
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-bold uppercase tracking-widest text-[10px]">Syncing chats...</p>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-30">
                  <MessageCircle className="h-12 w-12 mb-4" />
                  <p className="font-bold text-slate-900 text-lg">No chats yet</p>
                  <p className="text-sm font-medium mt-1">Teachers can initiate a private conversation with you.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredThreads.map((t) => {
                    const otherName = t.teacherName;
                    const isSelected = selectedThread?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedThread(t)}
                        className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-all ${
                          isSelected 
                            ? "bg-emerald-50" 
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-black transition-transform group-hover:scale-105 ${
                            isSelected ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {otherName?.charAt(0) ?? "T"}
                          </div>
                          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${t.teacherOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="truncate text-sm font-black text-slate-900">{otherName ?? "Instructor"}</p>
                            <span className="ml-2 shrink-0 text-[10px] font-bold text-slate-400">
                              {new Date(t.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="truncate text-xs font-semibold text-slate-500">
                            {t.lastMessagePreview || t.courseName || "No messages yet"}
                          </p>
                        </div>
                        {!!t.messageCount && (
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">{t.messageCount}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#efeae2]">
            {!selectedThread ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="h-24 w-24 rounded-[40px] bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                  <MessageSquare className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Your Inbox</h3>
                <p className="text-slate-500 font-medium mt-2 max-w-xs">
                  Select a conversation from the sidebar to chat with your instructor.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-[#f0f2f5] px-5 py-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white">
                      {selectedThread.teacherName?.charAt(0) ?? "T"}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{selectedThread.teacherName}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${selectedThread.teacherOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {selectedThread.teacherOnline ? "Online" : "Offline"} · {selectedThread.courseName || "General Discussion"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-slate-900">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>

                {/* Messages List */}
                <div className="flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] bg-[length:22px_22px] p-6 custom-scrollbar">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?.id;
                    const showName = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
                    const currentDay = new Date(msg.createdAt).toDateString();
                    const previousDay = idx > 0 ? new Date(messages[idx - 1].createdAt).toDateString() : "";
                    const showDay = idx === 0 || currentDay !== previousDay;
                    
                    return (
                      <div key={msg.id}>
                        {showDay && (
                          <div className="my-4 flex justify-center">
                            <span className="rounded-md bg-white/80 px-3 py-1 text-[11px] font-bold text-slate-500 shadow-sm">
                              {new Date(msg.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        )}
                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          {showName && !isMe && (
                            <span className="mb-1 ml-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                              {msg.senderName}
                            </span>
                          )}
                          <div className={`
                            max-w-[78%] rounded-lg px-3 py-2 text-sm font-medium leading-relaxed shadow-sm
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
                            {msg.body && <p className="whitespace-pre-wrap break-words">{msg.body}</p>}
                            <div className="mt-1 flex items-center justify-end gap-1.5 pl-8 text-[10px] font-bold text-slate-500">
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              {isMe && <MessageStatusIcon msg={msg} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Message Input */}
                <div className="shrink-0 border-t border-slate-200 bg-[#f0f2f5] p-4">
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
                  <form onSubmit={sendMessage} className="flex items-center gap-2">
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
                      className="h-11 w-11 rounded-full bg-transparent text-slate-500 hover:bg-white hover:text-emerald-600"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={sending}
                      className={`h-11 w-11 rounded-full ${isRecording ? "bg-rose-50 text-rose-600" : "bg-transparent text-slate-500 hover:bg-white hover:text-emerald-600"}`}
                    >
                      {isRecording ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Type a message to instructor..."
                        className="h-11 rounded-full border-transparent bg-white px-5 pr-12 font-medium shadow-sm transition-all focus:border-emerald-200 focus:bg-white"
                        disabled={sending}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={(!body.trim() && !pendingMedia) || sending || isRecording}
                      className="h-11 w-11 shrink-0 rounded-full bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
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

      {/* New Message Dialog */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Message Instructor</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Start a private conversation with a course instructor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Select Course / Instructor</Label>
              <Select value={selectedCourseId} onValueChange={handleCourseSelect}>
                <SelectTrigger className="w-full h-12 border-slate-200 rounded-2xl">
                  <SelectValue placeholder="Choose a course..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {courses
                    ?.filter((c: any) => c.teacherId && c.teacherName)
                    .map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title} (by {course.teacherName})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCourseId && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                  {courses?.find((c: any) => c.id.toString() === selectedCourseId)?.teacherName?.charAt(0) ?? "T"}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Assigned Teacher</p>
                  <p className="font-bold text-slate-800 text-sm">
                    {courses?.find((c: any) => c.id.toString() === selectedCourseId)?.teacherName}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 flex gap-3">
            <Button variant="ghost" onClick={() => setIsNewChatOpen(false)} className="flex-1 font-bold text-slate-600 rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateThread} 
              disabled={!selectedCourseId || creatingThread} 
              className="flex-1 bg-primary text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20"
            >
              {creatingThread ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Start Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
