import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useListCourses, getListCoursesQueryKey } from "@workspace/api-client-react";
import {
  Loader2, Plus, Calendar, Link2, Target, CheckCircle, Trash2,
  Video, Clock, Users, BookOpen, ExternalLink, Copy, RefreshCw, History, XCircle, BarChart3
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
import { PaginationControls, getTotalPages, paginateItems } from "@/components/PaginationControls";

const PAGE_SIZE = 10;

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
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  // History state (renamed to classHistory to avoid shadowing window.history)
  const [classHistory, setClassHistory] = useState<{ total: number; conducted: number; cancelled: number; upcoming: number; log: any[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [targetType, setTargetType] = useState<"all" | "course" | "student">("all");
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [students, setStudents] = useState<any[]>([]);

  const { data: courses } = useListCourses(
    { teacherId: user?.id ?? undefined, limit: 100 } as any,
    { query: { queryKey: getListCoursesQueryKey({ teacherId: user?.id ?? undefined } as any), enabled: !!user?.id } }
  );

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/live-classes", { headers });
      if (r.ok) setClasses(await r.json());
    } catch { toast({ title: "Failed to fetch live classes", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const r = await fetch("/api/live-classes/history", { headers });
      if (r.ok) setClassHistory(await r.json());
    } catch {
      toast({ title: "Failed to fetch history", variant: "destructive" });
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { fetchLiveClasses(); }, []);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab]);

  useEffect(() => {
    if (!user?.id || !token) return;
    fetch(`/api/dashboard/teacher/students?userId=${user.id}`, { headers })
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !meetingLink || !scheduledAt) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (new Date(scheduledAt) <= new Date()) {
      toast({
        title: "Invalid Schedule Time",
        description: "The class time cannot be in the past. Please select a future date and time.",
        variant: "destructive",
      });
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
      if (r.ok) {
        toast({ title: `Class marked as ${!current ? "Completed" : "Active"}` });
        fetchLiveClasses();
        if (activeTab === "history") fetchHistory();
      }
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (c: any) => {
    setClassToDelete(c);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    try {
      setDeleting(true);
      const r = await fetch(`/api/live-classes/${classToDelete.id}`, { method: "DELETE", headers });
      if (r.ok) {
        toast({ title: "Live class cancelled", description: "Successfully updated and preserved in history." });
        setDeleteConfirmOpen(false);
        setClassToDelete(null);
        fetchLiveClasses();
        if (activeTab === "history") fetchHistory();
      } else {
        const err = await r.json();
        toast({ title: err.error || "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const copyLink = (link: string) => { navigator.clipboard.writeText(link); toast({ title: "Link copied!" }); };

  // Only show classes created by this teacher
  const myClasses = classes.filter(c => c.createdBy === user?.id || !c.createdBy);
  const activeMyClasses = myClasses.filter(c => !c.isCompleted);
  const visibleClasses = paginateItems(activeMyClasses, page, PAGE_SIZE);
  const totalPages = getTotalPages(activeMyClasses.length, PAGE_SIZE);
  const activeClassesCount = myClasses.filter(c => !c.isCompleted).length;
  const expiredClassesCount = myClasses.filter(c => c.isCompleted).length;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages || 1);
  }, [page, totalPages]);

  const getHistoryBadge = (c: any) => {
    if (c.isCancelled) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1"><XCircle className="h-3 w-3" />Cancelled</Badge>;
    if (c.isCompleted) return <Badge className="bg-gray-100 text-gray-650 hover:bg-gray-100 gap-1"><CheckCircle className="h-3 w-3" />Conducted</Badge>;
    const isUpcoming = new Date(c.scheduledAt) > new Date();
    if (isUpcoming) return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 animate-pulse gap-1">● Upcoming</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Overdue</Badge>;
  };

  const getTargetBadge = (c: any) => {
    if (c.targetType === "all") return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1 w-max"><Users className="h-3 w-3" />All Students</Badge>;
    if (c.targetType === "course") return (
      <div className="flex flex-col gap-0.5">
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 gap-1 w-max"><BookOpen className="h-3 w-3" />Course</Badge>
        <span className="text-xs text-gray-500 truncate max-w-[140px]">{c.courseTitle || `#${c.courseId}`}</span>
      </div>
    );
    return (
      <div className="flex flex-col gap-0.5">
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1 w-max"><Target className="h-3 w-3" />Individual</Badge>
        <span className="text-xs text-gray-500 truncate max-w-[140px]">{c.studentName || `#${c.studentId}`}</span>
      </div>
    );
  };

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
            <CardTitle className="text-sm font-medium">Active &amp; Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{activeClassesCount}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-slate-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Conducted Sessions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-slate-500">{expiredClassesCount}</div></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "active" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Video className="h-4 w-4" /> Active Sessions
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "history" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <History className="h-4 w-4" /> History log
        </button>
      </div>

      {/* ACTIVE SESSIONS TAB */}
      {activeTab === "active" && (
        <Card>
          <CardHeader>
            <CardTitle>My Scheduled Sessions</CardTitle>
            <CardDescription>Classes you have created. Expired sessions are auto-marked as completed.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : activeMyClasses.length === 0 ? (
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
                    {visibleClasses.map((c) => {
                      const scheduledDate = new Date(c.scheduledAt);
                      const isPast = scheduledDate < new Date();
                      const isExpired = c.isCompleted || isPast;
                      return (
                        <TableRow key={c.id} className={`hover:bg-accent/30 transition-colors ${isExpired ? "opacity-60" : ""}`}>
                          <TableCell>
                            <div className="font-semibold text-gray-900">{c.title}</div>
                            {c.description && <p className="text-xs text-gray-500 line-clamp-1 max-w-[220px] mt-0.5">{c.description}</p>}
                          </TableCell>
                          <TableCell>{getTargetBadge(c)}</TableCell>
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
                              <Button
                                onClick={() => handleDeleteClick(c)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-650 hover:bg-red-50 hover:text-red-700"
                                title="Cancel class"
                              >
                                <XCircle className="h-4 w-4" />
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
            <PaginationControls
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={activeMyClasses.length}
              onPageChange={setPage}
              label="sessions"
            />
          </CardContent>
        </Card>
      )}

      {/* HISTORY LOG TAB */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {historyLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : classHistory ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-5">
                    <p className="text-xs font-bold text-gray-405 uppercase tracking-widest mb-1">Total Classes</p>
                    <p className="text-3xl font-black text-blue-600">{classHistory.total}</p>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Created by me</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500">
                  <CardContent className="p-5">
                    <p className="text-xs font-bold text-gray-405 uppercase tracking-widest mb-1">Conducted</p>
                    <p className="text-3xl font-black text-emerald-600">{classHistory.conducted}</p>
                    <p className="text-xs text-gray-400 mt-1 font-medium font-semibold">Held successfully</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-5">
                    <p className="text-xs font-bold text-gray-405 uppercase tracking-widest mb-1">Cancelled</p>
                    <p className="text-3xl font-black text-red-650">{classHistory.cancelled}</p>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Soft deleted</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-400">
                  <CardContent className="p-5">
                    <p className="text-xs font-bold text-gray-405 uppercase tracking-widest mb-1">Upcoming</p>
                    <p className="text-3xl font-black text-amber-500">{classHistory.upcoming}</p>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Future sessions</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> My Class History Log</CardTitle>
                    <CardDescription>Log of all classes created by you (conducted, cancelled, overdue)</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchHistory} disabled={historyLoading} className="gap-1.5">
                    <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`} /> Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {classHistory.log.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No records found</p>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Class Title</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Scheduled On</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Cancelled On</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classHistory.log.map((c, idx) => (
                            <TableRow key={c.id} className={`hover:bg-accent/20 transition-colors ${c.isCancelled ? "opacity-60" : ""}`}>
                              <TableCell className="text-xs text-gray-400 font-bold">{idx + 1}</TableCell>
                              <TableCell>
                                <div className="font-semibold text-sm text-gray-900 max-w-[200px] line-clamp-1">{c.title}</div>
                                {c.description && <p className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{c.description}</p>}
                              </TableCell>
                              <TableCell>{getTargetBadge(c)}</TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">{new Date(c.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                                <div className="text-xs text-gray-400">{new Date(c.scheduledAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
                              </TableCell>
                              <TableCell>{getHistoryBadge(c)}</TableCell>
                              <TableCell>
                                {c.cancelledAt ? (
                                  <span className="text-xs text-red-500 font-medium">
                                    {new Date(c.cancelledAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}{" "}
                                    {new Date(c.cancelledAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-300">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

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
                <Label>Date &amp; Time <span className="text-red-500">*</span></Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  onChange={e => setScheduledAt(e.target.value)}
                  required
                />
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
                Schedule &amp; Notify Students
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-650">
              <XCircle className="h-5 w-5 text-red-650" /> Cancel Live Session
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-gray-500">
              Are you sure you want to cancel <span className="font-semibold text-gray-900">"{classToDelete?.title}"</span>?
              <br />
              <span className="text-blue-600 font-medium">The session will be preserved in your History log</span> — it won't be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Keep Session
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling...</>
              ) : (
                "Yes, Cancel Session"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
