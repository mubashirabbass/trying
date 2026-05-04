import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Send, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Thread { id: number; studentId: number; teacherId: number; studentName?: string; teacherName?: string; courseName?: string; lastMessageAt: string; }
interface Message { id: number; senderId: number; body: string; senderName?: string; senderRole?: string; createdAt: string; isRead: boolean; }

export default function StudentMessages() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { fetchThreads(); }, []);
  useEffect(() => { if (selectedThread) fetchMessages(selectedThread.id); }, [selectedThread]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !selectedThread) return;
    setSending(true);
    const r = await fetch(`${BASE}/api/messages/threads/${selectedThread.id}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ senderId: user?.id, body }),
    });
    if (r.ok) {
      setBody("");
      fetchMessages(selectedThread.id);
    } else {
      toast({ title: "Failed to send message", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500 mt-1">Private conversations with your teachers</p>
      </div>

      <div className="flex h-[calc(100vh-220px)] gap-4 min-h-[400px]">
        {/* Thread list */}
        <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col">
          <div className="p-4 border-b font-semibold text-sm text-gray-700">Conversations</div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No conversations yet.<br />Your teacher can start one with you.</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {threads.map((t) => {
                const otherName = user?.id === t.studentId ? t.teacherName : t.studentName;
                const isSelected = selectedThread?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedThread(t)}
                    className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${isSelected ? "bg-primary/5 border-l-4 border-l-primary" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {otherName?.charAt(0) ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{otherName ?? "Teacher"}</p>
                        {t.courseName && <p className="text-xs text-gray-400 truncate">{t.courseName}</p>}
                        <p className="text-xs text-gray-400">{new Date(t.lastMessageAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Message area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {(user?.id === selectedThread.studentId ? selectedThread.teacherName : selectedThread.studentName)?.charAt(0) ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {user?.id === selectedThread.studentId ? selectedThread.teacherName : selectedThread.studentName}
                  </p>
                  {selectedThread.courseName && <p className="text-xs text-gray-400">{selectedThread.courseName}</p>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${isMe ? "bg-primary text-white" : "bg-gray-100 text-gray-900"} rounded-2xl px-4 py-2 text-sm`}>
                        {!isMe && <p className="text-xs font-semibold mb-1 text-primary">{msg.senderName}</p>}
                        <p>{msg.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-white/70" : "text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t flex gap-3">
                <Input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" disabled={!body.trim() || sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
