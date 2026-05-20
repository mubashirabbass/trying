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
  BookOpen,
  Plus
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
}
interface Message { 
  id: number; 
  senderId: number; 
  body: string; 
  senderName?: string; 
  senderRole?: string; 
  createdAt: string; 
  isRead: boolean; 
}

export default function StudentMessages() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const { data: courses } = useListCourses({ status: "live" });
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

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
  useEffect(() => { if (selectedThread) fetchMessages(selectedThread.id); }, [selectedThread]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !selectedThread) return;
    setSending(true);
    const r = await fetch(`${BASE}/api/messages/threads/${selectedThread.id}/messages`, {
      method: "POST", headers, body: JSON.stringify({ senderId: user?.id, body }),
    });
    if (r.ok) { setBody(""); fetchMessages(selectedThread.id); }
    setSending(false);
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
    t.courseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Messages</h1>
            <p className="text-slate-500 font-medium mt-1">Private guidance from your instructors</p>
          </div>
        </div>

        {/* Messaging Layout */}
        <div className="flex flex-1 gap-6 min-h-0">
          {/* Thread list */}
          <div className="w-96 shrink-0 bg-white rounded-[32px] border-2 border-slate-100 flex flex-col overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-50 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <p className="font-black text-slate-800 text-xs tracking-widest uppercase">Chats</p>
                <Button 
                  size="sm" 
                  className="rounded-xl font-bold bg-primary text-white text-xs gap-1"
                  onClick={() => setIsNewChatOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> New Message
                </Button>
              </div>
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
                  <p className="font-bold text-slate-900 text-lg">No chats yet</p>
                  <p className="text-sm font-medium mt-1">Teachers can initiate a private conversation with you.</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredThreads.map((t) => {
                    const otherName = t.teacherName;
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
                          isSelected ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                        }`}>
                          {otherName?.charAt(0) ?? "T"}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="font-black text-sm truncate">{otherName ?? "Instructor"}</p>
                            <span className={`text-[10px] font-bold ${isSelected ? "text-white/60" : "text-slate-400"}`}>
                              {new Date(t.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className={`text-xs truncate font-bold ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                            {t.courseName || "Course Discussion"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
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
                <h3 className="text-2xl font-black text-slate-900">Your Inbox</h3>
                <p className="text-slate-500 font-medium mt-2 max-w-xs">
                  Select a conversation from the sidebar to chat with your instructor.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md z-10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                      {selectedThread.teacherName?.charAt(0) ?? "T"}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg">{selectedThread.teacherName}</h3>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
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
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 ml-1">
                            {msg.senderName}
                          </span>
                        )}
                        <div className={`
                          max-w-[80%] px-5 py-3.5 rounded-[22px] text-sm font-medium shadow-sm leading-relaxed
                          ${isMe 
                            ? "bg-primary text-white rounded-tr-none shadow-md shadow-primary/10" 
                            : "bg-white text-slate-800 border-2 border-slate-50 rounded-tl-none"}
                        `}>
                          {msg.body}
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
                  <form onSubmit={sendMessage} className="flex gap-4 items-center">
                    <div className="flex-1 relative">
                      <Input
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Type a message to instructor..."
                        className="h-14 bg-slate-50 border-transparent rounded-2xl px-6 focus:bg-white focus:border-primary/20 transition-all font-medium pr-12"
                        disabled={sending}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={!body.trim() || sending}
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
