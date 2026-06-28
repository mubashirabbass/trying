import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone, Send, Users, BookOpen, GraduationCap, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Announcement { id: number; title: string; message: string; targetType: string; sentAt: string; sentBy: string; }

const TARGET_OPTIONS = [
  { value: "ALL", label: "All Users", icon: Users, color: "bg-blue-100 text-blue-700" },
  { value: "STUDENTS", label: "Students Only", icon: GraduationCap, color: "bg-emerald-100 text-emerald-700" },
  { value: "TEACHERS", label: "Teachers Only", icon: BookOpen, color: "bg-purple-100 text-purple-700" },
];

export default function AdminAnnouncements() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("ALL");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchAnnouncements = async () => {
    const r = await fetch(`${BASE}/api/announcements`, { headers });
    if (r.ok) setAnnouncements(await r.json());
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    const r = await fetch(`${BASE}/api/announcements`, {
      method: "POST",
      headers,
      body: JSON.stringify({ sentBy: user?.name || "Admin", targetType, title, message }),
    });
    if (r.ok) {
      toast({ title: "Announcement sent!", description: `Notification delivered to ${targetType === "ALL" ? "all users" : targetType.toLowerCase()}.` });
      setTitle(""); setMessage("");
      fetchAnnouncements();
    } else {
      toast({ title: "Failed to send", variant: "destructive" });
    }
    setSending(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    const r = await fetch(`${BASE}/api/announcements/${id}`, {
      method: "DELETE",
      headers,
    });
    if (r.ok) {
      toast({ title: "Announcement deleted", description: "The announcement has been deleted successfully." });
      fetchAnnouncements();
    } else {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-sm text-gray-500 mt-1">Broadcast messages to students, teachers, or everyone</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-5 w-5 text-primary" /> Compose Announcement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <Label>Send To *</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {TARGET_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <button type="button" key={opt.value}
                          onClick={() => setTargetType(opt.value)}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${targetType === opt.value ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${opt.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{opt.label}</span>
                          {targetType === opt.value && <div className="ml-auto h-2 w-2 rounded-full bg-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label>Title *</Label>
                  <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title..." className="mt-1" />
                </div>
                <div>
                  <Label>Message *</Label>
                  <Textarea required rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your announcement..." className="mt-1" />
                </div>
                <Button type="submit" disabled={sending || !title || !message} className="w-full">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Announcement
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div className="lg:col-span-3">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Announcement History</h2>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : announcements.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
              <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No announcements sent yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(a => {
                const opt = TARGET_OPTIONS.find(o => o.value === a.targetType) ?? TARGET_OPTIONS[0];
                return (
                  <Card key={a.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{a.title}</h3>
                          <Badge className={`${opt.color} text-xs mt-1.5`}>{opt.label}</Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 shrink-0"
                          onClick={() => handleDelete(a.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">{a.message}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>By {a.sentBy}</span>
                        <span>·</span>
                        <span>{new Date(a.sentAt).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
