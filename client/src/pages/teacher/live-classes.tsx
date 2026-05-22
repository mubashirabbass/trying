import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useListCourses, getListCoursesQueryKey, useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import {
  Loader2, Plus, Calendar, Link2, Target, CheckCircle, Trash2,
  Video, Clock, Users, BookOpen, ExternalLink, Copy, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";

const ensureAbsoluteUrl = (url: string) => {
  if (!url) return "";
  if (/^(https?:\/\/|mailto:|tel:|sms:|zoom:|teams:)/i.test(url)) return url;
  return `https://${url}`;
};

export default function TeacherLiveClasses() {
  const { toast } = useToast();
  const { token, user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [targetType, setTargetType] = useState<"all" | "course" | "student">("all");
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: courses } = useListCourses({}, { query: { queryKey: getListCoursesQueryKey({}) } });
  const { data: students } = useListUsers({ role: "student" }, { query: { queryKey: getListUsersQueryKey({ role: "student" }) } });

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/live-classes", { headers });
      if (r.ok) setClasses(await r.json());
    } catch { toast({ title: "Failed to fetch live classes", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLiveClasses(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !meetingLink || !scheduledAt) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const r = await fetch("/api/live-classes", {
        method: "POST", headers,
        body: JSON.stringify({ title, meetingLink, targetType, courseId: targetType === "course" ? courseId : null, studentId: targetType === "student" ? studentId : null, scheduledAt, description }),
      });
      if (r.ok) {
        toast({ title: "✅ Live class scheduled!", description: "Students have been notified." });
        setIsCreateOpen(false);
        setTitle(""); setMeetingLink(""); setTargetType("all"); setCourseId(""); setStudentId(""); setScheduledAt(""); setDescription("");
        fetchLiveClasses();
      } else {
        const err = await r.json();
        toast({ title: err.error || "Failed to schedule", variant: "destructive" });
      }
    } catch { toast({ title: "Connection error", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const handleStatusToggle = async (id: number, current: boolean) => {
    try {
      const r = await fetch(`/api/live-classes/${id}`, { method: "PATCH", headers, body: JSON.stringify({ isCompleted: !current }) });
      if (r.ok) { toast({ title: `Class marked as ${!current ? "Completed" : "Active"}` }); fetchLiveClasses(); }
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this scheduled class?")) return;
    try {
      const r = await fetch(`/api/live-classes/${id}`, { method: "DELETE", headers });
      if (r.ok) { toast({ title: "Live class deleted" }); fetchLiveClasses(); }
      else { const err = await r.json(); toast({ title: err.error || "Failed to delete", variant: "destructive" }); }
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const copyLink = (link: string) => { navigator.clipboard.writeText(link); toast({ title: "Link copied!" }); };

  // Only show classes created by this teacher (or all for admin)
  const myClasses = classes.filter(c => c.createdBy === user?.id || !c.createdBy);
  const activeClasses = myClasses.filter(c => !c.isCompleted).length;
  const expiredClasses = myClasses.filter(c => c.isCompleted).length;

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-7 w-7 text-primary animate-pulse" /> Live Classes
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Schedule and manage live sessions for your students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchLiveClasses} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Schedule Live Session
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">My Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{myClasses.length}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active & Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{activeClasses}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-slate-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Expired / Conducted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-slate-500">{expiredClasses}</div></CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Scheduled Sessions</CardTitle>
          <CardDescription>Classes you have created. Expired sessions are auto-marked as completed.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : myClasses.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No sessions scheduled yet</h3>
              <p className="text-gray-500 text-sm mt-1">Click "Schedule Live Session" to get started.</p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> Schedule First Class
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Info</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myClasses.map((c) => {
                    const scheduledDate = new Date(c.scheduledAt);
                    const isPast = scheduledDate < new Date();
                    const isExpired = c.isCompleted || isPast;
                    return (
                      <TableRow key={c.id} className={`hover:bg-accent/30 transition-colors ${isExpired ? "opacity-60" : ""}`}>
                        <TableCell>
                          <div className="font-semibold text-gray-900">{c.title}</div>
                          {c.description && <p className="text-xs text-gray-500 line-clamp-1 max-w-[220px] mt-0.5">{c.description}</p>}
                        </TableCell>
                        <TableCell>
                          {c.targetType === "all" && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1 w-max"><Users className="h-3 w-3" /> All Students</Badge>}
                          {c.targetType === "course" && (
                            <div className="flex flex-col gap-0.5">
                              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 gap-1 w-max"><BookOpen className="h-3 w-3" /> Course</Badge>
                              <span className="text-xs text-gray-500 truncate max-w-[140px]">{c.courseTitle || `#${c.courseId}`}</span>
                            </div>
                          )}
                          {c.targetType === "student" && (
                            <div className="flex flex-col gap-0.5">
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1 w-max"><Target className="h-3 w-3" /> Individual</Badge>
                              <span className="text-xs text-gray-500 truncate max-w-[140px]">{c.studentName || `#${c.studentId}`}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{scheduledDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                          <div className="text-xs text-gray-500">{scheduledDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
                          {isPast && !c.isCompleted && <span className="text-[10px] text-rose-500 font-bold">Expired</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button onClick={() => copyLink(c.meetingLink)} variant="outline" size="sm" className="h-8 px-2 text-xs gap-1 border-dashed hover:border-solid">
                              <Copy className="h-3 w-3" /> Copy
                            </Button>
                            <a href={ensureAbsoluteUrl(c.meetingLink)} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          {c.isCompleted || isPast ? (
                            <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100">Expired</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 animate-pulse gap-1">● Upcoming</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {!c.isCompleted && !isPast && (
                              <Button onClick={() => handleStatusToggle(c.id, c.isCompleted)} size="sm" className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <CheckCircle className="h-3.5 w-3.5" /> Mark Done
                              </Button>
                            )}
                            <Button onClick={() => handleDelete(c.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" /> Schedule New Live Session
            </DialogTitle>
            <DialogDescription>
              Paste your Zoom, Google Meet, or Teams link and set the schedule. Students will be notified automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Class Title <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. Introduction to React Hooks" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Meeting Link <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="https://zoom.us/j/... or https://meet.google.com/..." className="pl-9" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Date & Time <span className="text-red-500">*</span></Label>
                <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Target Audience <span className="text-red-500">*</span></Label>
                <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="course">Specific Course</SelectItem>
                    <SelectItem value="student">Specific Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {targetType === "course" && (
              <div className="space-y-1">
                <Label>Select Course <span className="text-red-500">*</span></Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger><SelectValue placeholder="Choose a course" /></SelectTrigger>
                  <SelectContent>
                    {courses?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {targetType === "student" && (
              <div className="space-y-1">
                <Label>Select Student <span className="text-red-500">*</span></Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger><SelectValue placeholder="Choose a student" /></SelectTrigger>
                  <SelectContent>
                    {students?.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.email})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label>Description / Agenda</Label>
              <Textarea placeholder="Topics to cover, prerequisites, notes..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="gap-1">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Schedule & Notify Students
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
