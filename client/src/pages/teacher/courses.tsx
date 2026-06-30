import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  useListCourses, 
  getListCoursesQueryKey,
  useDeleteCourse
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Loader2, Plus, BookOpen, Clock, Users, Edit, GraduationCap, Sparkles, BookOpenCheck, Trash2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { FileUploadButton } from "@/components/FileUploadButton";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { PaginationControls, getTotalPages, paginateItems } from "@/components/PaginationControls";

const PAGE_SIZE = 6;

export default function TeacherCourses() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: courses, isLoading } = useListCourses(
    { teacherId: user?.id ?? undefined, limit: 100 } as any,
    { 
      query: { 
        queryKey: getListCoursesQueryKey({ teacherId: user?.id ?? undefined } as any),
        enabled: !!user?.id
      } 
    }
  );

  const deleteCourse = useDeleteCourse();

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null); // null means create mode
  const [courseToDelete, setCourseToDelete] = useState<any>(null);

  const { data: dbCategories = [] } = useQuery<any[]>({
    queryKey: ["course-categories"],
    queryFn: async () => {
      const res = await fetch("/api/course-categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    }
  });

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (dbCategories.length > 0 && !category) {
      setCategory(dbCategories[0].name);
    }
  }, [dbCategories, category]);
  const [duration, setDuration] = useState("3 Months");
  const [fee, setFee] = useState("5000");
  const [isFree, setIsFree] = useState(false);
  const [thumbnail, setThumbnail] = useState("");
  const [outlinePdfUrl, setOutlinePdfUrl] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [minAttendancePercentage, setMinAttendancePercentage] = useState("75");
  const [savingCourse, setSavingCourse] = useState(false);
  const [page, setPage] = useState(1);

  const visibleCourses = paginateItems(courses ?? [], page, PAGE_SIZE);
  const totalPages = getTotalPages(courses?.length ?? 0, PAGE_SIZE);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openCreateDialog = () => {
    setEditingCourse(null);
    setTitle("");
    setDescription("");
    setCategory(dbCategories.length > 0 ? dbCategories[0].name : "");
    setDuration("3 Months");
    setFee("5000");
    setIsFree(false);
    setThumbnail("");
    setOutlinePdfUrl("");
    setSyllabus("");
    setMinAttendancePercentage("75");
    setIsDialogOpen(true);
  };

  const openEditDialog = (course: any) => {
    setEditingCourse(course);
    setTitle(course.title || "");
    setDescription(course.description || "");
    setCategory(course.category || (dbCategories.length > 0 ? dbCategories[0].name : ""));
    setDuration(course.duration || "3 Months");
    setFee((course.fee ?? 0).toString());
    setIsFree(!!course.isFree);
    setThumbnail(course.thumbnail || "");
    setOutlinePdfUrl((course as any).outlinePdfUrl || "");
    setSyllabus(course.syllabus || "");
    setMinAttendancePercentage((course.minAttendancePercentage ?? 75).toString());
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category || !duration.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const coursePayload = {
      title: title.trim(),
      description: description.trim(),
      category,
      duration: duration.trim(),
      fee: isFree ? 0 : Number(fee) || 0,
      isFree,
      thumbnail: thumbnail.trim() || undefined,
      syllabus: syllabus.trim() || undefined,
      outlinePdfUrl: outlinePdfUrl.trim() || undefined,
      minAttendancePercentage: Number(minAttendancePercentage) || 75,
    };

    setSavingCourse(true);
    try {
      if (editingCourse) {
        // Edit mode
        const response = await fetch(`/api/courses/${editingCourse.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            ...coursePayload,
            thumbnail: coursePayload.thumbnail ?? null,
            syllabus: coursePayload.syllabus ?? null,
          }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || "Failed to update course");
        }
        toast({ title: "Course details updated successfully!" });
      } else {
        // Create mode
        const response = await fetch("/api/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(coursePayload),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || "Failed to create course");
        }
        toast({ title: "Course created & submitted for review!" });
      }
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({ teacherId: user?.id ?? undefined }) });
      setIsDialogOpen(false);
    } catch (error: any) {
      const message = error?.data?.error || error?.message || "Failed to save course details";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      await deleteCourse.mutateAsync({ id: courseToDelete.id });
      toast({ title: "Course deleted successfully" });
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({ teacherId: user?.id ?? undefined }) });
      setCourseToDelete(null);
    } catch (error: any) {
      const message = error?.data?.error || error?.message || "Failed to delete course";
      toast({ title: message, variant: "destructive" });
    }
  };

  const handleSubmitForApproval = async (courseId: number) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "pending" }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit for approval");
      }
      toast({
        title: "🚀 Submitted for Approval!",
        description: "Your course has been sent to the Admin team for review and publishing.",
      });
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({ teacherId: user?.id ?? undefined }) });
    } catch (error: any) {
      toast({ title: error?.message || "Failed to submit for approval", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">Live</Badge>;
      case "pending": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200">Pending Review</Badge>;
      case "rejected": return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border border-rose-200">Rejected</Badge>;
      case "draft": return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border border-slate-200">Draft</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" /> My Courses Studio
          </h1>
          <p className="text-gray-500 text-sm">Design curriculum, edit metadata, and publish courses</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-primary hover:bg-primary/95 text-white">
          <Plus className="h-4 w-4" />
          Create Course Studio
        </Button>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleCourses.map((course) => (
          <Card key={course.id} className="flex flex-col hover:shadow-lg transition-all duration-300 border-slate-200/80">
            <CardHeader className="relative pb-4">
              {course.thumbnail ? (
                <div className="h-40 w-full rounded-t-lg overflow-hidden mb-3 border">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 w-full rounded-t-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center mb-3">
                  <BookOpen className="h-12 w-12 text-indigo-400 opacity-60" />
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {course.category}
                </span>
                {getStatusBadge((course as any).status)}
              </div>
              <CardTitle className="text-lg font-bold line-clamp-1 mt-1 text-slate-800">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <p className="text-slate-500 line-clamp-2 mb-4 text-xs leading-relaxed">{course.description}</p>
              
              <div className="grid grid-cols-3 gap-2 border-t pt-4 text-[11px] font-semibold text-slate-500">
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Users className="h-4 w-4 text-indigo-500 mb-1" />
                  <span>{course.enrollmentCount} Enrolled</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <BookOpenCheck className="h-4 w-4 text-emerald-500 mb-1" />
                  <span>{course.lessonCount} Lectures</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <Clock className="h-4 w-4 text-amber-500 mb-1" />
                  <span className="truncate w-full">{course.duration}</span>
                </div>
              </div>
              
              {(course as any).rejectionNote && (course as any).status === "rejected" && (
                <div className="mt-3 p-2 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-700">
                  <span className="font-bold">Reason for Rejection:</span> {(course as any).rejectionNote}
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-4 border-t grid grid-cols-2 gap-2 bg-slate-50/50 rounded-b-lg">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full min-w-0 gap-1.5 text-xs font-semibold"
                onClick={() => openEditDialog(course)}
              >
                <Edit className="h-3.5 w-3.5" /> Edit Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full min-w-0 gap-1.5 text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => setCourseToDelete(course)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
              <Link href={`/teacher/courses/${course.id}`} className="col-span-2 w-full">
                <Button size="sm" className="w-full min-w-0 gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Sparkles className="h-3.5 w-3.5" /> Curriculum Builder
                </Button>
              </Link>

              {/* Submit for Admin Approval Action Button */}
              {((course as any).status === "draft" || (course as any).status === "rejected") && (
                <Button 
                  size="sm" 
                  className="col-span-2 w-full gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-950/10"
                  onClick={() => handleSubmitForApproval(course.id)}
                >
                  <Send className="h-3.5 w-3.5" /> Submit for Admin Approval
                </Button>
              )}

              {(course as any).status === "pending" && (
                <div className="col-span-2 w-full p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs font-bold text-amber-700 flex items-center justify-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 animate-spin" /> Pending Admin Review
                </div>
              )}

              {(course as any).status === "live" && (
                <div className="col-span-2 w-full p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Live on Portal & Catalog
                </div>
              )}
            </CardFooter>
          </Card>
        ))}

        {courses?.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Start Designing Your Courses</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">
              Create comprehensive structures, outlines, lessons, and quizzes for your students.
            </p>
            <Button onClick={openCreateDialog} className="mt-6 gap-2">
              <Plus className="h-4 w-4" /> Design Your First Course
            </Button>
          </div>
        )}
      </div>
      <PaginationControls
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={courses?.length ?? 0}
        onPageChange={setPage}
        label="courses"
      />

      {/* Udemy-style Course designer dialog (Create & Edit) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
              {editingCourse ? "Update Course Design" : "Design New Course Outline"}
            </DialogTitle>
            <DialogDescription>
              Create or edit course metadata, duration plans, outlines, and detailed syllabus guidelines.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="title">Course Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. Masterclass in Advanced Frontend & React Architecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {dbCategories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="duration">Syllabus Duration <span className="text-red-500">*</span></Label>
                <Input
                  id="duration"
                  placeholder="e.g. 12 Weeks (48 Hours)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="fee">Course Fee (PKR)</Label>
                <Input
                  id="fee"
                  type="number"
                  placeholder="e.g. 6000"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  disabled={isFree}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="minAttendancePercentage">Min Attendance Requirement (%)</Label>
                <Input
                  id="minAttendancePercentage"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 75"
                  value={minAttendancePercentage}
                  onChange={(e) => setMinAttendancePercentage(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-6 items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => {
                    setIsFree(e.target.checked);
                    if (e.target.checked) setFee("0");
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                This is a Free Course
              </label>
            </div>

            <div className="space-y-1">
              <Label>Cover Thumbnail Image</Label>
              <FileUploadButton
                type="image"
                currentUrl={thumbnail || null}
                onUploaded={(url) => setThumbnail(url)}
                onClear={() => setThumbnail("")}
                showDownload={true}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Short Description / Course Objectives <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                placeholder="Describe the course summary, who it's for, and the key target goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="syllabus">Detailed Course Outline &amp; Lesson Plans</Label>
              <Textarea
                id="syllabus"
                placeholder="- Learn React from scratch&#10;- Build real-world projects&#10;---&#10;Week 1: Foundations&#10;Week 2: Components & State"
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-slate-400">Use '---' to separate outcome bullets from the weekly outline.</p>
            </div>

            <div className="space-y-1">
              <Label>Course Outline PDF <span className="text-slate-400 font-normal text-xs">(students can download when enrolled)</span></Label>
              <FileUploadButton
                type="pdf"
                currentUrl={outlinePdfUrl || null}
                onUploaded={(url) => setOutlinePdfUrl(url)}
                onClear={() => setOutlinePdfUrl("")}
                showDownload={true}
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white" disabled={savingCourse}>
                {savingCourse ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingCourse ? "Save Changes" : "Create & Start Building"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Delete Course</DialogTitle>
            <DialogDescription>
              This will remove the course and its related curriculum records. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {courseToDelete?.title}
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setCourseToDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteCourse}
              disabled={deleteCourse.isPending}
            >
              {deleteCourse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
