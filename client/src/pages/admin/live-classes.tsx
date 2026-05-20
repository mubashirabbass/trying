import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useListCourses, getListCoursesQueryKey, useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Loader2, Plus, Calendar, Link2, Target, CheckCircle, Trash2, Video, Clock, Users, BookOpen, ExternalLink, Copy } from "lucide-react";
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
  if (/^(https?:\/\/|mailto:|tel:|sms:|zoom:|teams:)/i.test(url)) {
    return url;
  }
  return `https://${url}`;
};

export default function AdminLiveClasses() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [targetType, setTargetType] = useState<"all" | "course" | "student">("all");
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Dynamic selector data
  const { data: courses } = useListCourses({}, { query: { queryKey: getListCoursesQueryKey({}) } });
  const { data: students } = useListUsers(
    { role: "student" },
    { query: { queryKey: getListUsersQueryKey({ role: "student" }) } }
  );

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/live-classes", { headers });
      if (r.ok) {
        const data = await r.json();
        setClasses(data);
      }
    } catch (err) {
      toast({ title: "Failed to fetch live classes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !meetingLink || !targetType || !scheduledAt) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const r = await fetch("/api/live-classes", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title,
          meetingLink,
          targetType,
          courseId: targetType === "course" ? courseId : null,
          studentId: targetType === "student" ? studentId : null,
          scheduledAt,
          description,
        }),
      });

      if (r.ok) {
        toast({ title: "Live Class Scheduled successfully! 🎉", description: "Target students have been notified." });
        setIsCreateOpen(false);
        // Reset form
        setTitle("");
        setMeetingLink("");
        setTargetType("all");
        setCourseId("");
        setStudentId("");
        setScheduledAt("");
        setDescription("");
        fetchLiveClasses();
      } else {
        const errData = await r.json();
        toast({ title: errData.error || "Failed to schedule live class", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Connection error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (id: number, currentCompleted: boolean) => {
    try {
      const r = await fetch(`/api/live-classes/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isCompleted: !currentCompleted }),
      });
      if (r.ok) {
        toast({ title: `Class marked as ${!currentCompleted ? "Completed" : "Active"}` });
        fetchLiveClasses();
      }
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this scheduled class?")) return;
    try {
      const r = await fetch(`/api/live-classes/${id}`, {
        method: "DELETE",
        headers,
      });
      if (r.ok) {
        toast({ title: "Live Class schedule deleted" });
        fetchLiveClasses();
      }
    } catch {
      toast({ title: "Failed to delete schedule", variant: "destructive" });
    }
  };

  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: "Link Copied to Clipboard! 📋", description: "Share it with students." });
  };

  // Helper stats
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => !c.isCompleted).length;
  const completedClasses = classes.filter(c => c.isCompleted).length;

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-7 w-7 text-primary animate-pulse" /> Live Classes Studio
          </h1>
          <p className="text-gray-500">Design, schedule, and broadcast real-time learning streams for students</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Schedule Live Session
        </Button>
      </div>

      {/* ── STATS CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Scheduled sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">Broadcast records logged</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active & Upcoming Sessions</CardTitle>
            <Clock className="h-4 w-4 text-emerald-500 animate-spin-slow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending student broadcasts</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Conducted & Saved Classes</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">Added as history lessons</p>
          </CardContent>
        </Card>
      </div>

      {/* ── MAIN LOG TABULAR CARD ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Session Registry</CardTitle>
          <CardDescription>Track all virtual lectures, meeting channels, and compliance timelines</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Live Classes scheduled yet</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mt-1">
                Design custom schedule targets with Zoom or Meet invites to establish real-time emergency virtual boards.
              </p>
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
                    <TableHead>Target Scope</TableHead>
                    <TableHead>Schedule Date</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((c) => {
                    const scheduledDate = new Date(c.scheduledAt);
                    const isUpcoming = scheduledDate > new Date() && !c.isCompleted;

                    return (
                      <TableRow key={c.id} className="hover:bg-accent/30 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-gray-900">{c.title}</div>
                          {c.description && (
                            <p className="text-xs text-gray-500 line-clamp-1 max-w-[240px] mt-0.5">{c.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            {c.targetType === "all" && (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1 w-max">
                                <Users className="h-3 w-3" /> All Students
                              </Badge>
                            )}
                            {c.targetType === "course" && (
                              <>
                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 gap-1 w-max">
                                  <BookOpen className="h-3 w-3" /> Course Students
                                </Badge>
                                <span className="text-xs text-gray-500 truncate max-w-[150px]">{c.courseTitle || "Select Course"}</span>
                              </>
                            )}
                            {c.targetType === "student" && (
                              <>
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1 w-max">
                                  <Target className="h-3 w-3" /> Single Student
                                </Badge>
                                <span className="text-xs text-gray-500 truncate max-w-[150px]">{c.studentName || "Select Student"}</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-800">
                            {scheduledDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {scheduledDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button
                              onClick={() => copyToClipboard(c.meetingLink)}
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs gap-1 border-dashed hover:border-solid"
                            >
                              <Copy className="h-3 w-3" /> Copy Link
                            </Button>
                            <a href={ensureAbsoluteUrl(c.meetingLink)} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          {c.isCompleted ? (
                            <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Conducted</Badge>
                          ) : isUpcoming ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 animate-pulse gap-1">
                              ● Upcoming
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Overdue / Joinable</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              onClick={() => handleStatusToggle(c.id, c.isCompleted)}
                              variant={c.isCompleted ? "outline" : "default"}
                              size="sm"
                              className={`h-8 text-xs gap-1 ${!c.isCompleted ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              {c.isCompleted ? "Re-open" : "Mark Conducted"}
                            </Button>
                            <Button
                              onClick={() => handleDelete(c.id)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
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

      {/* ── SCHEDULER DIALOG (DESIGN FORM) ─────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" /> Schedule New Live Stream
            </DialogTitle>
            <DialogDescription>
              Assign the target group, paste your stream URL (Zoom, Teams, Google Meet), and send instant alert notifications.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClass} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="title">Class Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. Masterclass on AI Integration & Ethics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="meetingLink">Zoom or Meeting Invitation Link <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="meetingLink"
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  className="pl-9"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="scheduledAt">Schedule Date & Time <span className="text-red-500">*</span></Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="targetType">Target Audience Scope <span className="text-red-500">*</span></Label>
                <Select value={targetType} onValueChange={(val: any) => setTargetType(val)}>
                  <SelectTrigger id="targetType">
                    <SelectValue placeholder="Select Scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Registered Students</SelectItem>
                    <SelectItem value="course">Specific Course Students</SelectItem>
                    <SelectItem value="student">Specific Individual Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* DYNAMIC SCOPE TARGET SELECTORS */}
            {targetType === "course" && (
              <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                <Label htmlFor="courseTarget">Select Targeted Course <span className="text-red-500">*</span></Label>
                <Select value={courseId} onValueChange={setCourseId} required>
                  <SelectTrigger id="courseTarget">
                    <SelectValue placeholder="Select a Course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.title} ({c.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {targetType === "student" && (
              <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                <Label htmlFor="studentTarget">Select Individual Student <span className="text-red-500">*</span></Label>
                <Select value={studentId} onValueChange={setStudentId} required>
                  <SelectTrigger id="studentTarget">
                    <SelectValue placeholder="Select Student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name} ({s.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="description">Session Summary / Agenda</Label>
              <Textarea
                id="description"
                placeholder="List topics, setup prerequisites, or emergency announcements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-white gap-1">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Schedule & Broadcast
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
