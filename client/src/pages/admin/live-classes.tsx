import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useListCourses, getListCoursesQueryKey, useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Loader2, Plus, Calendar, Link2, Target, CheckCircle, Trash2, Video, Clock, Users, BookOpen, ExternalLink, Copy, History, XCircle, BarChart3, RefreshCw, Layers, ChevronDown, ChevronUp } from "lucide-react";
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

const MIN_DATETIME = () => new Date(Date.now() + 60000).toISOString().slice(0, 16);

interface ClassSlot {
  id: string;
  title: string;
  meetingLink: string;
  targetType: "all" | "course" | "student";
  courseId: string;
  studentId: string;
  scheduledAt: string;
  description: string;
}

let _slotCounter = 0;
const emptySlot = (): ClassSlot => ({
  id: `slot-${Date.now()}-${++_slotCounter}`,
  title: "",
  meetingLink: "",
  targetType: "all",
  courseId: "",
  studentId: "",
  scheduledAt: "",
  description: "",
});

export default function AdminLiveClasses() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [isBulkMode, setIsBulkMode] = useState(false);

  // History state (renamed to avoid collision with global history)
  const [classHistory, setClassHistory] = useState<{ total: number; conducted: number; cancelled: number; upcoming: number; log: any[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Single-schedule form states
  const [title, setTitle] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [targetType, setTargetType] = useState<"all" | "course" | "student">("all");
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bulk-schedule states
  const [slots, setSlots] = useState<ClassSlot[]>([emptySlot()]);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  // Global target scope for bulk scheduling
  const [bulkTargetType, setBulkTargetType] = useState<"all" | "course" | "student">("all");
  const [bulkCourseId, setBulkCourseId] = useState("");
  const [bulkStudentId, setBulkStudentId] = useState("");

  const { data: courses } = useListCourses({}, {
    query: {
      queryKey: getListCoursesQueryKey({}),
      enabled: isCreateOpen && (targetType === "course" || bulkTargetType === "course"),
    }
  });
  const { data: students } = useListUsers(
    { role: "student" },
    {
      query: {
        queryKey: getListUsersQueryKey({ role: "student" }),
        enabled: isCreateOpen && (targetType === "student" || bulkTargetType === "student"),
      }
    }
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
    } catch { toast({ title: "Failed to fetch history", variant: "destructive" }); }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => { fetchLiveClasses(); }, []);
  useEffect(() => { if (activeTab === "history") fetchHistory(); }, [activeTab]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !meetingLink || !targetType || !scheduledAt) {
      toast({ title: "Please fill in all required fields", variant: "destructive" }); return;
    }
    if (new Date(scheduledAt) <= new Date()) {
      toast({ title: "Invalid Schedule Time", description: "Class time cannot be in the past.", variant: "destructive" }); return;
    }
    try {
      setSubmitting(true);
      const r = await fetch("/api/live-classes", {
        method: "POST", headers,
        body: JSON.stringify({ title, meetingLink, targetType, courseId: targetType === "course" ? courseId : null, studentId: targetType === "student" ? studentId : null, scheduledAt, description }),
      });
      if (r.ok) {
        toast({ title: "Live Class Scheduled! 🎉", description: "Students have been notified." });
        setIsCreateOpen(false);
        resetSingleForm();
        fetchLiveClasses();
      } else {
        const err = await r.json();
        toast({ title: err.error || "Failed to schedule", variant: "destructive" });
      }
    } catch { toast({ title: "Connection error", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const resetSingleForm = () => {
    setTitle(""); setMeetingLink(""); setTargetType("all"); setCourseId(""); setStudentId(""); setScheduledAt(""); setDescription("");
  };

  const updateSlot = (id: string, field: keyof ClassSlot, value: string) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSlot = () => {
    const newSlot = emptySlot();
    setSlots(prev => [...prev, newSlot]);
    setExpandedSlots(prev => new Set([...prev, newSlot.id]));
  };

  const removeSlot = (id: string) => {
    if (slots.length === 1) { toast({ title: "At least one class slot required", variant: "destructive" }); return; }
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const toggleSlotExpanded = (id: string) => {
    setExpandedSlots(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const slot of slots) {
      if (!slot.title || !slot.meetingLink || !slot.scheduledAt) {
        toast({ title: "Incomplete slot", description: `Please fill all required fields for "${slot.title || "Untitled class"}"`, variant: "destructive" });
        return;
      }
      if (new Date(slot.scheduledAt) <= new Date()) {
        toast({ title: "Past schedule time", description: `"${slot.title}" — class time cannot be in the past.`, variant: "destructive" });
        return;
      }
    }

    setBulkSubmitting(true);
    setBulkProgress({ done: 0, total: slots.length });
    let successCount = 0;
    let failCount = 0;

    await Promise.all(slots.map(async (slot) => {
      try {
        const r = await fetch("/api/live-classes", {
          method: "POST", headers,
          body: JSON.stringify({
            title: slot.title,
            meetingLink: slot.meetingLink,
            targetType: bulkTargetType,
            courseId: bulkTargetType === "course" ? bulkCourseId : null,
            studentId: bulkTargetType === "student" ? bulkStudentId : null,
            scheduledAt: slot.scheduledAt,
            description: slot.description || null,
          }),
        });
        if (r.ok) successCount++; else failCount++;
      } catch { failCount++; }
      finally {
        setBulkProgress(prev => prev ? { ...prev, done: prev.done + 1 } : null);
      }
    }));

    setBulkSubmitting(false);
    setBulkProgress(null);

    if (successCount > 0) {
      toast({ title: `✅ ${successCount} class${successCount > 1 ? "es" : ""} scheduled!`, description: failCount > 0 ? `${failCount} failed. Check details.` : "Students notified." });
    }
    if (failCount > 0 && successCount === 0) {
      toast({ title: "All submissions failed", variant: "destructive" });
    }

    if (successCount > 0) {
      setIsCreateOpen(false);
      setSlots([emptySlot()]);
      setBulkTargetType("all"); setBulkCourseId(""); setBulkStudentId("");
      fetchLiveClasses();
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsBulkMode(false);
      resetSingleForm();
      setSlots([emptySlot()]);
      setBulkTargetType("all"); setBulkCourseId(""); setBulkStudentId("");
    }
    setIsCreateOpen(open);
  };

  const handleStatusToggle = async (id: number, currentCompleted: boolean) => {
    try {
      const r = await fetch(`/api/live-classes/${id}`, { method: "PATCH", headers, body: JSON.stringify({ isCompleted: !currentCompleted }) });
      if (r.ok) {
        toast({ title: `Class marked as ${!currentCompleted ? "Completed" : "Active"}` });
        fetchLiveClasses();
        if (activeTab === "history") fetchHistory();
      }
    } catch { toast({ title: "Failed to update status", variant: "destructive" }); }
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (c: any) => { setClassToDelete(c); setDeleteConfirmOpen(true); };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    try {
      setDeleting(true);
      const r = await fetch(`/api/live-classes/${classToDelete.id}`, { method: "DELETE", headers });
      if (r.ok) {
        toast({ title: "Live Class cancelled", description: "Moved to history." });
        setDeleteConfirmOpen(false); setClassToDelete(null);
        fetchLiveClasses(); if (activeTab === "history") fetchHistory();
      }
    } catch { toast({ title: "Failed to cancel class", variant: "destructive" }); }
    finally { setDeleting(false); }
  };

  const copyToClipboard = (link: string) => { navigator.clipboard.writeText(link); toast({ title: "Link Copied! 📋" }); };

  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => !c.isCompleted).length;
  const completedClasses = classes.filter(c => c.isCompleted).length;

  const getHistoryBadge = (c: any) => {
    if (c.isCancelled) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1"><XCircle className="h-3 w-3" />Cancelled</Badge>;
    if (c.isCompleted) return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 gap-1"><CheckCircle className="h-3 w-3" />Conducted</Badge>;
    const isUpcoming = new Date(c.scheduledAt) > new Date();
    if (isUpcoming) return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 animate-pulse gap-1">● Upcoming</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Overdue</Badge>;
  };

  const getTargetBadge = (c: any) => {
    if (c.targetType === "all") return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1 w-max"><Users className="h-3 w-3" />All Students</Badge>;
    if (c.targetType === "course") return (
      <div className="flex flex-col gap-0.5">
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 gap-1 w-max"><BookOpen className="h-3 w-3" />Course</Badge>
        <span className="text-xs text-gray-500 truncate max-w-[150px]">{c.courseTitle || "—"}</span>
      </div>
    );
    return (
      <div className="flex flex-col gap-0.5">
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1 w-max"><Target className="h-3 w-3" />Individual</Badge>
        <span className="text-xs text-gray-500 truncate max-w-[150px]">{c.studentName || "—"}</span>
      </div>
    );
  };

  // Only show active sessions (not completed/conducted) in the Active Sessions tab
  const activeSessions = classes.filter(c => !c.isCompleted);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-7 w-7 text-primary animate-pulse" /> Live Classes Studio
          </h1>
          <p className="text-gray-500">Design, schedule, and broadcast real-time learning streams for students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setIsBulkMode(true); setIsCreateOpen(true); }} className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50">
            <Layers className="h-4 w-4" /> Bulk Schedule
          </Button>
          <Button onClick={() => { setIsBulkMode(false); setIsCreateOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Schedule Session
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Scheduled sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">Active broadcast records</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active &amp; Upcoming Sessions</CardTitle>
            <Clock className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending student broadcasts</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Conducted &amp; Saved Classes</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">Added as history lessons</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        <button onClick={() => setActiveTab("active")} className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === "active" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          <Video className="h-4 w-4" /> Active Sessions
        </button>
        <button onClick={() => setActiveTab("history")} className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === "history" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          <History className="h-4 w-4" /> Class History Log
        </button>
      </div>

      {/* Active Sessions Tab */}
      {activeTab === "active" && (
        <Card>
          <CardHeader>
            <CardTitle>Session Registry</CardTitle>
            <CardDescription>Track all virtual lectures, meeting channels, and compliance timelines</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : activeSessions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Live Classes scheduled yet</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mt-1">Schedule a session or use Bulk Schedule to plan multiple classes at once.</p>
                <div className="flex justify-center gap-2 mt-4">
                  <Button onClick={() => { setIsBulkMode(false); setIsCreateOpen(true); }} variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Schedule Session</Button>
                  <Button onClick={() => { setIsBulkMode(true); setIsCreateOpen(true); }} variant="outline" className="gap-2 border-indigo-300 text-indigo-700"><Layers className="h-4 w-4" /> Bulk Schedule</Button>
                </div>
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
                    {activeSessions.map((c) => {
                      const scheduledDate = new Date(c.scheduledAt);
                      const isUpcoming = scheduledDate > new Date() && !c.isCompleted;
                      return (
                        <TableRow key={c.id} className="hover:bg-accent/30 transition-colors">
                          <TableCell>
                            <div className="font-semibold text-gray-900">{c.title}</div>
                            {c.description && <p className="text-xs text-gray-500 line-clamp-1 max-w-[240px] mt-0.5">{c.description}</p>}
                          </TableCell>
                          <TableCell>{getTargetBadge(c)}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-gray-800">{scheduledDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                            <div className="text-xs text-gray-500">{scheduledDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Button onClick={() => copyToClipboard(c.meetingLink)} variant="outline" size="sm" className="h-8 px-2 text-xs gap-1 border-dashed hover:border-solid"><Copy className="h-3 w-3" /> Copy Link</Button>
                              <a href={ensureAbsoluteUrl(c.meetingLink)} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5"><ExternalLink className="h-4 w-4" /></Button>
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            {c.isCompleted ? <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Conducted</Badge>
                              : isUpcoming ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 animate-pulse gap-1">● Upcoming</Badge>
                              : <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Overdue / Joinable</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button onClick={() => handleStatusToggle(c.id, c.isCompleted)} variant={c.isCompleted ? "outline" : "default"} size="sm" className={`h-8 text-xs gap-1 ${!c.isCompleted ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}>
                                <CheckCircle className="h-3.5 w-3.5" />{c.isCompleted ? "Re-open" : "Mark Conducted"}
                              </Button>
                              <Button onClick={() => handleDeleteClick(c)} variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700" title="Cancel class (kept in history)">
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
          </CardContent>
        </Card>
      )}

      {/* History Log Tab */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {historyLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : classHistory ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500"><CardContent className="p-5"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Classes</p><p className="text-3xl font-black text-blue-600">{classHistory.total}</p><p className="text-xs text-gray-400 mt-1">All-time records</p></CardContent></Card>
                <Card className="border-l-4 border-l-emerald-500"><CardContent className="p-5"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Conducted</p><p className="text-3xl font-black text-emerald-600">{classHistory.conducted}</p><p className="text-xs text-gray-400 mt-1">Successfully held</p></CardContent></Card>
                <Card className="border-l-4 border-l-red-500"><CardContent className="p-5"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Cancelled</p><p className="text-3xl font-black text-red-600">{classHistory.cancelled}</p><p className="text-xs text-gray-400 mt-1">Removed / cancelled</p></CardContent></Card>
                <Card className="border-l-4 border-l-amber-400"><CardContent className="p-5"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Upcoming</p><p className="text-3xl font-black text-amber-500">{classHistory.upcoming}</p><p className="text-xs text-gray-400 mt-1">Yet to be conducted</p></CardContent></Card>
              </div>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Complete Class History Log</CardTitle>
                    <CardDescription>All classes ever scheduled — conducted, cancelled, and upcoming</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchHistory} disabled={historyLoading} className="gap-1.5">
                    <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`} /> Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {classHistory.log.length === 0 ? (
                    <div className="text-center py-10 text-gray-400"><BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No class records found</p></div>
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
                                  <span className="text-xs text-red-500 font-medium">{new Date(c.cancelledAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} {new Date(c.cancelledAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                                ) : <span className="text-xs text-gray-300">—</span>}
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

      {/* Scheduler Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={handleDialogClose}>
        <DialogContent className={`${isBulkMode ? "max-w-3xl" : "max-w-xl"} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                {isBulkMode ? <><Layers className="h-5 w-5 text-indigo-600" /> Bulk Schedule Live Classes</> : <><Video className="h-5 w-5 text-primary" /> Schedule New Live Stream</>}
              </DialogTitle>
              <button type="button" onClick={() => setIsBulkMode(v => !v)} className="text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors">
                {isBulkMode ? "Switch to Single" : "Switch to Bulk"}
              </button>
            </div>
            <DialogDescription>
              {isBulkMode
                ? `Set a common target audience, then define ${slots.length} class slot${slots.length > 1 ? "s" : ""} — each with its own title, link, and date/time. All will be submitted at once.`
                : "Assign the target group, paste your stream URL, and send instant alert notifications."}
            </DialogDescription>
          </DialogHeader>

          {/* Single Mode Form */}
          {!isBulkMode && (
            <form onSubmit={handleCreateClass} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="title">Class Title <span className="text-red-500">*</span></Label>
                <Input id="title" placeholder="e.g. Masterclass on AI Integration & Ethics" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="meetingLink">Zoom or Meeting Link <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="meetingLink" placeholder="https://zoom.us/j/... or https://meet.google.com/..." className="pl-9" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="scheduledAt">Schedule Date &amp; Time <span className="text-red-500">*</span></Label>
                  <Input id="scheduledAt" type="datetime-local" value={scheduledAt} min={MIN_DATETIME()} onChange={(e) => setScheduledAt(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="targetType">Target Audience <span className="text-red-500">*</span></Label>
                  <Select value={targetType} onValueChange={(val: any) => setTargetType(val)}>
                    <SelectTrigger id="targetType"><SelectValue placeholder="Select Scope" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Registered Students</SelectItem>
                      <SelectItem value="course">Specific Course Students</SelectItem>
                      <SelectItem value="student">Specific Individual Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {targetType === "course" && (
                <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                  <Label>Select Course <span className="text-red-500">*</span></Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger><SelectValue placeholder="Select a Course" /></SelectTrigger>
                    <SelectContent>{courses?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {targetType === "student" && (
                <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                  <Label>Select Student <span className="text-red-500">*</span></Label>
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                    <SelectContent>{students?.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.email})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="description">Session Summary / Agenda</Label>
                <Textarea id="description" placeholder="List topics, setup prerequisites..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={submitting}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-primary text-white gap-1">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Schedule &amp; Broadcast
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* Bulk Mode Form */}
          {isBulkMode && (
            <form onSubmit={handleBulkSubmit} className="space-y-4 pt-2">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-black text-indigo-700 uppercase tracking-widest">Shared Target Audience (applies to ALL slots)</p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label>Target Audience Scope <span className="text-red-500">*</span></Label>
                    <Select value={bulkTargetType} onValueChange={(val: any) => { setBulkTargetType(val); setBulkCourseId(""); setBulkStudentId(""); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Registered Students</SelectItem>
                        <SelectItem value="course">Specific Course Students</SelectItem>
                        <SelectItem value="student">Specific Individual Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {bulkTargetType === "course" && (
                    <div className="space-y-1">
                      <Label>Select Course <span className="text-red-500">*</span></Label>
                      <Select value={bulkCourseId} onValueChange={setBulkCourseId}>
                        <SelectTrigger><SelectValue placeholder="Select a Course" /></SelectTrigger>
                        <SelectContent>{courses?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  {bulkTargetType === "student" && (
                    <div className="space-y-1">
                      <Label>Select Student <span className="text-red-500">*</span></Label>
                      <Select value={bulkStudentId} onValueChange={setBulkStudentId}>
                        <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                        <SelectContent>{students?.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.email})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-700">Class Slots <span className="ml-1.5 bg-indigo-100 text-indigo-700 text-xs font-black px-2 py-0.5 rounded-full">{slots.length}</span></p>
                  <Button type="button" variant="outline" size="sm" onClick={addSlot} className="gap-1.5 text-xs border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                    <Plus className="h-3.5 w-3.5" /> Add Another Class
                  </Button>
                </div>

                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {slots.map((slot, idx) => {
                    const isExpanded = expandedSlots.has(slot.id);
                    const isValid = slot.title && slot.meetingLink && slot.scheduledAt;
                    return (
                      <div key={slot.id} className={`border rounded-xl overflow-hidden transition-all ${isValid ? "border-emerald-300 bg-emerald-50/30" : "border-gray-200 bg-gray-50/50"}`}>
                        <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => toggleSlotExpanded(slot.id)}>
                          <span className="text-xs font-black text-gray-400 w-5 text-center">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{slot.title || <span className="text-gray-400 font-normal">Untitled Class</span>}</p>
                            {slot.scheduledAt && <p className="text-xs text-gray-400">{new Date(slot.scheduledAt).toLocaleString()}</p>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isValid && <span className="h-2 w-2 rounded-full bg-emerald-500" title="Slot complete" />}
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeSlot(slot.id); }} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
                            <div className="space-y-1">
                              <Label className="text-xs">Class Title <span className="text-red-500">*</span></Label>
                              <Input placeholder="e.g. Chapter 3 – React Hooks" value={slot.title} onChange={e => updateSlot(slot.id, "title", e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Meeting Link <span className="text-red-500">*</span></Label>
                              <div className="relative">
                                <Link2 className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input placeholder="https://zoom.us/j/..." value={slot.meetingLink} onChange={e => updateSlot(slot.id, "meetingLink", e.target.value)} className="pl-8 h-8 text-sm" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Date &amp; Time <span className="text-red-500">*</span></Label>
                              <Input type="datetime-local" value={slot.scheduledAt} min={MIN_DATETIME()} onChange={e => updateSlot(slot.id, "scheduledAt", e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Description / Agenda</Label>
                              <Textarea placeholder="Topics, notes..." value={slot.description} onChange={e => updateSlot(slot.id, "description", e.target.value)} rows={2} className="text-sm resize-none" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {bulkProgress && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>Scheduling classes…</span>
                    <span>{bulkProgress.done}/{bulkProgress.total}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-50 rounded-full transition-all duration-300" style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                  </div>
                </div>
              )}

              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={bulkSubmitting}>Cancel</Button>
                <Button type="submit" disabled={bulkSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                  {bulkSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Scheduling {slots.length} classes…</> : <><Layers className="h-4 w-4" /> Schedule All {slots.length} Classes</>}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-600"><XCircle className="h-5 w-5 text-red-600" /> Cancel Live Session</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-gray-500">
              Are you sure you want to cancel <span className="font-semibold text-gray-900">"{classToDelete?.title}"</span>?
              <br /><span className="text-blue-600 font-medium">The record will be preserved in the History Log</span> — it won't be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>Keep Session</Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete} disabled={deleting} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling…</> : "Yes, Cancel Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
