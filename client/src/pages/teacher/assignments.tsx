import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useListAssignments, useListCourses, useCreateAssignment, useUpdateAssignment, useDeleteAssignment, getListAssignmentsQueryKey, getListCoursesQueryKey } from "@workspace/api-client-react";
import {
  Loader2, ClipboardList, Calendar, Plus, Pencil, Trash2,
  FileText, Upload, BookOpen, Clock, Target
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "wouter";
import { PaginationControls, getTotalPages, paginateItems } from "@/components/PaginationControls";

const MAX_ASSIGNMENT_PDF_BYTES = 5 * 1024 * 1024;
const MAX_ASSIGNMENT_PDF_MB = Math.floor(MAX_ASSIGNMENT_PDF_BYTES / 1024 / 1024);
const PAGE_SIZE = 8;

export default function TeacherAssignments() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [courseFilter, setCourseFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", dueDate: "", totalMarks: "100",
    courseId: "", fileUrl: ""
  });
  const [page, setPage] = useState(1);

  const { data: allCourses = [], isLoading: coursesLoading } = useListCourses(
    { teacherId: user?.id ?? undefined, limit: 100 } as any,
    { query: { queryKey: getListCoursesQueryKey({ teacherId: user?.id ?? undefined } as any), enabled: !!user?.id } }
  );
  // Only show teacher's own courses
  const courses = allCourses.filter((c: any) => c.teacherId === user?.id || c.teacherName === user?.name);

  const { data: assignments = [], isLoading: assignmentsLoading } = useListAssignments({
    courseId: courseFilter === "all" ? undefined : Number(courseFilter)
  });

  // Filter to only assignments belonging to teacher's courses
  const teacherCourseIds = courses.map((c: any) => c.id);
  const myAssignments = (assignments as any[]).filter((a: any) =>
    courseFilter !== "all" || teacherCourseIds.includes(a.courseId)
  );
  const visibleAssignments = paginateItems(myAssignments, page, PAGE_SIZE);
  const totalPages = getTotalPages(myAssignments.length, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [courseFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const resetForm = () => setForm({ title: "", description: "", dueDate: "", totalMarks: "100", courseId: "", fileUrl: "" });

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    if (courseFilter !== "all") setForm(prev => ({ ...prev, courseId: courseFilter }));
    setIsDialogOpen(true);
  };

  const openEdit = (a: any) => {
    setEditingId(a.id);
    setForm({
      title: a.title || "",
      description: a.description || "",
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : "",
      totalMarks: String(a.totalMarks ?? 100),
      courseId: String(a.courseId),
      fileUrl: a.fileUrl || ""
    });
    setIsDialogOpen(true);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Only PDF files are allowed", variant: "destructive" });
      return;
    }
    if (file.size > MAX_ASSIGNMENT_PDF_BYTES) {
      toast({ title: `PDF must be ${MAX_ASSIGNMENT_PDF_MB}MB or smaller. Please compress it first.`, variant: "destructive" });
      return;
    }
    const fd = new FormData();
    fd.append("pdf", file);
    setIsUploadingPdf(true);
    try {
      const res = await fetch("/api/upload-pdf", { method: "POST", body: fd, headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm(prev => ({ ...prev, fileUrl: data.url }));
      toast({ title: "Assignment PDF uploaded!" });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally { setIsUploadingPdf(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.courseId) {
      toast({ title: "Title and course are required", variant: "destructive" }); return;
    }
    if (!form.fileUrl) {
      toast({ title: "Upload the assignment PDF before saving", variant: "destructive" }); return;
    }
    const payload: any = {
      title: form.title,
      description: form.description || undefined,
      dueDate: form.dueDate || undefined,
      totalMarks: Number(form.totalMarks) || 100,
      courseId: Number(form.courseId),
      fileUrl: form.fileUrl || undefined,
    };
    try {
      if (editingId) {
        await updateAssignment.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Assignment updated!" });
      } else {
        await createAssignment.mutateAsync({ data: payload });
        toast({ title: "Assignment created! Students will see it immediately." });
      }
      queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey({ courseId: courseFilter === "all" ? undefined : Number(courseFilter) }) });
      queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey({}) });
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || "Failed to save", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this assignment? All student submissions will also be removed.")) return;
    try {
      await deleteAssignment.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey({}) });
      toast({ title: "Assignment deleted." });
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const isLoading = coursesLoading || assignmentsLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" /> Assignments
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Create and manage assignments for your courses</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-52 bg-white border-slate-200 text-sm">
              <BookOpen className="h-3.5 w-3.5 mr-2 text-slate-400" />
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All My Courses</SelectItem>
              {courses.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Assignment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="border border-slate-100 shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-black text-slate-900">{myAssignments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</p>
              <p className="text-2xl font-black text-slate-900">
                {myAssignments.filter((a: any) => !a.dueDate || new Date(a.dueDate) > new Date()).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Courses</p>
              <p className="text-2xl font-black text-slate-900">{courses.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Cards */}
      {myAssignments.length === 0 ? (
        <div className="py-24 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800">No assignments yet</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Create an assignment to evaluate your students. They'll be able to upload their submissions directly.
          </p>
          <Button className="mt-6 gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create First Assignment
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleAssignments.map((assignment: any) => {
            const course = courses.find((c: any) => c.id === assignment.courseId);
            const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
            return (
              <Card key={assignment.id} className="border border-slate-100 shadow-sm rounded-xl bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  {/* Top */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="h-11 w-11 rounded-xl bg-primary/8 flex items-center justify-center text-primary shrink-0">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700" onClick={() => openEdit(assignment)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(assignment.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-tight mb-1">{assignment.title}</h3>
                  <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-3">
                    {course?.title ?? `Course #${assignment.courseId}`}
                  </p>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                    {assignment.description || "No description provided."}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {assignment.dueDate
                        ? <span className={isOverdue ? "text-rose-500" : "text-slate-500"}>
                            {isOverdue ? "Overdue · " : ""}{new Date(assignment.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        : "No deadline"}
                    </div>
                    <Badge variant="secondary" className="font-bold text-[10px]">{assignment.totalMarks} Marks</Badge>
                  </div>

                  {/* File attachment */}
                  {assignment.fileUrl && (
                    <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-lg border border-primary/10 transition-colors">
                      <FileText className="h-3.5 w-3.5" /> View Assignment Sheet
                    </a>
                  )}

                  {/* Grade button */}
                  <Link href="/teacher/grading">
                    <Button variant="outline" size="sm" className="w-full mt-3 text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-900 hover:text-white transition-colors">
                      View Submissions & Grade
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <PaginationControls
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={myAssignments.length}
        onPageChange={setPage}
        label="assignments"
      />

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black text-slate-900">
              <ClipboardList className="h-5 w-5 text-primary" />
              {editingId ? "Edit Assignment" : "Create New Assignment"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingId ? "Update the assignment details below." : "Fill in the details. Students will see this in their Assignments section."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            {/* Course */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Course <span className="text-red-500">*</span></Label>
              <Select value={form.courseId} onValueChange={v => setForm(prev => ({ ...prev, courseId: v }))}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Select a course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Assignment Title <span className="text-red-500">*</span></Label>
              <Input required value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Week 3 — React Hooks Practice" className="rounded-xl border-slate-200" />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Instructions / Description</Label>
              <Textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what students need to do, submission format, requirements..." rows={3} className="rounded-xl border-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Due Date */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Due Date & Time</Label>
                <Input type="datetime-local" value={form.dueDate} onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))} className="rounded-xl border-slate-200" />
              </div>
              {/* Total Marks */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Total Marks</Label>
                <Input type="number" min="1" value={form.totalMarks} onChange={e => setForm(prev => ({ ...prev, totalMarks: e.target.value }))} className="rounded-xl border-slate-200" />
              </div>
            </div>

            {/* PDF Upload */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Assignment Sheet (PDF)</Label>
              <div className="flex gap-2">
                <Input value={form.fileUrl} readOnly
                  placeholder="Upload a PDF from your computer" className="rounded-xl border-slate-200 flex-1 text-xs bg-slate-50" />
                <div className="relative shrink-0">
                  <Input type="file" accept=".pdf" onChange={handlePdfUpload} disabled={isUploadingPdf}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  <Button type="button" variant="outline" className="rounded-xl text-xs h-10 px-3" disabled={isUploadingPdf}>
                    {isUploadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                    Upload
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">PDF only, max {MAX_ASSIGNMENT_PDF_MB}MB. Compress larger files before uploading.</p>
              {form.fileUrl && (
                <div className="space-y-2 mt-2">
                  <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Open uploaded PDF
                  </a>
                  <iframe src={form.fileUrl} className="w-full h-40 rounded-lg border border-slate-200" title="Assignment PDF Preview" />
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 gap-2">
              <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="rounded-xl text-xs font-bold" disabled={createAssignment.isPending || updateAssignment.isPending || isUploadingPdf}>
                {(createAssignment.isPending || updateAssignment.isPending) ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                {editingId ? "Save Changes" : "Create Assignment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
