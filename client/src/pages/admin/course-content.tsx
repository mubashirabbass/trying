import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, Link } from "wouter";
import {
  useGetCourse,
  useListLessons,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  getListLessonsQueryKey,
  useListAssignments,
  useDeleteAssignment,
  getListAssignmentsQueryKey
} from "@workspace/api-client-react";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Video,
  FileText,
  Edit,
  Trash2,
  GripVertical,
  Youtube,
  Save,
  X,
  Calendar,
  ExternalLink,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminCourseContent() {
  const { id } = useParams();
  const courseId = id ? Number(id) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading } = useGetCourse(courseId, {
    query: {
      staleTime: 60000,
      refetchOnWindowFocus: false,
    }
  } as any);
  const { data: lessons = [], isLoading: lessonsLoading } = useListLessons(
    { courseId },
    {
      query: {
        staleTime: 60000,
        refetchOnWindowFocus: false,
      }
    } as any
  );
  const { data: assignments = [], isLoading: assignmentsLoading } = useListAssignments(
    { courseId },
    {
      query: {
        staleTime: 60000,
        refetchOnWindowFocus: false,
      }
    } as any
  );

  const createLessonMutation = useCreateLesson();
  const updateLessonMutation = useUpdateLesson();
  const deleteLessonMutation = useDeleteLesson();
  const deleteAssignmentMutation = useDeleteAssignment();

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  const [assignmentDeleteDialogOpen, setAssignmentDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    pdfUrl: "",
    duration: "",
    orderIndex: 0,
    completionThreshold: "80",
    notes: "",
    resources: "",
  });

  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      videoUrl: "",
      pdfUrl: "",
      duration: "",
      orderIndex: 0,
      completionThreshold: "80",
      notes: "",
      resources: "",
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Only PDF files are allowed", variant: "destructive" });
      return;
    }

    const uploadData = new FormData();
    uploadData.append("pdf", file);

    setIsUploadingPdf(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/lessons/upload-pdf", {
        method: "POST",
        body: uploadData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload PDF");
      
      setFormData(prev => ({ ...prev, pdfUrl: data.url }));
      toast({ title: "PDF uploaded successfully!" });
    } catch (err: any) {
      toast({ title: err.message || "Failed to upload", variant: "destructive" });
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!formData.videoUrl.trim()) {
      toast({ title: "YouTube video URL is required", variant: "destructive" });
      return;
    }

    try {
      await createLessonMutation.mutateAsync({
        data: {
          courseId,
          title: formData.title,
          description: formData.description || undefined,
          videoUrl: formData.videoUrl.trim(),
          pdfUrl: formData.pdfUrl || undefined,
          duration: formData.duration ? Number(formData.duration) : undefined,
          orderIndex: lessons.length,
          completionThreshold: Number(formData.completionThreshold) || 80,
          notes: formData.notes || undefined,
          resources: formData.resources || undefined,
        } as any,
      });
      toast({ title: "Lecture added successfully!" });
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey({ courseId }) });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: error?.response?.data?.message || "Failed to add lecture",
        variant: "destructive",
      });
    }
  };

  const handleEditLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson || !formData.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!formData.videoUrl.trim()) {
      toast({ title: "YouTube video URL is required", variant: "destructive" });
      return;
    }

    try {
      await updateLessonMutation.mutateAsync({
        id: selectedLesson.id,
        data: {
          courseId: Number(courseId),
          title: formData.title,
          description: formData.description || undefined,
          videoUrl: formData.videoUrl.trim(),
          pdfUrl: formData.pdfUrl || undefined,
          duration: formData.duration ? Number(formData.duration) : undefined,
          orderIndex: formData.orderIndex,
          completionThreshold: Number(formData.completionThreshold) || 80,
          notes: formData.notes || undefined,
          resources: formData.resources || undefined,
        } as any,
      });
      toast({ title: "Lecture updated successfully!" });
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey({ courseId }) });
      setIsEditDialogOpen(false);
      setSelectedLesson(null);
      resetForm();
    } catch (error: any) {
      toast({
        title: error?.response?.data?.message || "Failed to update lecture",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLesson = async () => {
    if (!selectedLesson) return;

    try {
      await deleteLessonMutation.mutateAsync({ id: selectedLesson.id });
      toast({ title: "Lecture deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey({ courseId }) });
      setDeleteDialogOpen(false);
      setSelectedLesson(null);
    } catch (error: any) {
      toast({
        title: error?.response?.data?.message || "Failed to delete lecture",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      await deleteAssignmentMutation.mutateAsync({ id: selectedAssignment.id });
      toast({ title: "Assignment deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey({ courseId }) });
      setAssignmentDeleteDialogOpen(false);
      setSelectedAssignment(null);
    } catch (error: any) {
      toast({
        title: error?.response?.data?.message || "Failed to delete assignment",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (lesson: any) => {
    setSelectedLesson(lesson);
    setFormData({
      title: lesson.title || "",
      description: lesson.description || "",
      videoUrl: lesson.videoUrl || "",
      pdfUrl: lesson.pdfUrl || "",
      duration: lesson.duration?.toString() || "",
      orderIndex: lesson.orderIndex || 0,
      completionThreshold: (lesson.completionThreshold ?? 80).toString(),
      notes: lesson.notes || "",
      resources: lesson.resources || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (lesson: any) => {
    setSelectedLesson(lesson);
    setDeleteDialogOpen(true);
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (courseLoading || lessonsLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Course not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link href="/admin/courses">
          <Button variant="ghost" className="mb-4 text-gray-500 hover:text-gray-900 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Course Content Manager
            </h1>
            <p className="text-gray-500 font-medium mt-1">{course.title}</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            className="bg-primary text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lecture
          </Button>
        </div>
      </div>

      {/* Course Info Card */}
      <Card className="mb-6 border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Category
              </p>
              <Badge variant="outline">{course.category}</Badge>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Duration
              </p>
              <p className="font-bold text-gray-900">{course.duration}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Total Lectures
              </p>
              <p className="font-bold text-gray-900">{lessons.length}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Status
              </p>
              <Badge
                className={
                  course.status === "live"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }
              >
                {course.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lectures" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <TabsTrigger value="lectures" className="rounded-lg font-bold text-xs">
            <Video className="h-4 w-4 mr-2" /> Video Lectures ({lessons.length})
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-lg font-bold text-xs">
            <FileText className="h-4 w-4 mr-2" /> Course Assignments ({assignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lectures">
          {/* Lectures List */}
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" /> Video Lectures & Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium mb-4">
                    No lectures added yet. Start by adding your first lecture.
                  </p>
                  <Button
                    onClick={() => {
                      resetForm();
                      setIsAddDialogOpen(true);
                    }}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Lecture
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessons.map((lesson: any, index: number) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors bg-white"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical className="h-5 w-5 text-gray-300" />
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{lesson.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            {lesson.videoUrl && (
                              <Badge variant="outline" className="text-xs">
                                <Youtube className="h-3 w-3 mr-1" />
                                Video
                              </Badge>
                            )}
                            {lesson.pdfUrl && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                PDF Notes
                              </Badge>
                            )}
                            {lesson.duration && (
                              <span className="text-xs text-gray-500">
                                {lesson.duration} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(lesson)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(lesson)}
                          className="text-red-655 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          {/* Assignments List */}
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Course Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No assignments posted for this course yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors bg-white"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{assignment.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" /> Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" /> Marks: {assignment.totalMarks ?? 100}
                            </span>
                          </div>
                          {assignment.description && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                              {assignment.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {assignment.fileUrl && (
                          <a
                            href={assignment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-xl font-semibold text-xs border border-gray-100 hover:bg-slate-50 transition-all px-3.5 h-9"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> PDF Document
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setAssignmentDeleteDialogOpen(true);
                          }}
                          className="h-9 w-9 text-red-500 hover:text-red-650 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Lecture Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Lecture</DialogTitle>
            <DialogDescription>
              Add video lectures with YouTube embed links and PDF notes for students.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddLesson} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="title">
                Lecture Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Introduction to MS Word"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what students will learn..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">
                YouTube Video URL <span className="text-gray-400">(Embed Link)</span>
              </Label>
              <Input
                id="videoUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Paste the full YouTube URL. It will be encrypted for security.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdfUrl">PDF Notes</Label>
              <div className="flex gap-2">
                <Input
                  id="pdfUrl"
                  placeholder="https://example.com/notes.pdf"
                  value={formData.pdfUrl}
                  onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                  className="flex-1"
                />
                <div className="relative flex-shrink-0">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploadingPdf}
                  />
                  <Button type="button" variant="outline" disabled={isUploadingPdf}>
                    {isUploadingPdf ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                    Upload PDF
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Paste a public URL or upload a PDF directly.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="e.g. 45"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completionThreshold">Video Progress Completion Threshold (%)</Label>
              <Input
                id="completionThreshold"
                type="number"
                min="1"
                max="100"
                placeholder="e.g. 70"
                value={formData.completionThreshold}
                onChange={(e) => setFormData({ ...formData, completionThreshold: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                The percentage of the video the student must watch to mark this lecture as complete (between 1 and 100).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Lecture Notes / Written Materials</Label>
              <Textarea
                id="notes"
                placeholder="Write lesson summaries, key takeaways, code blocks, or custom notes for this lecture..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resources">Supplementary Resources & External Links</Label>
              <Textarea
                id="resources"
                placeholder="Add repository links, useful documents, external resources, or references for this lecture..."
                value={formData.resources}
                onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-white"
                disabled={createLessonMutation.isPending}
              >
                {createLessonMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Add Lecture
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lecture Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Lecture</DialogTitle>
            <DialogDescription>
              Update lecture details, video links, and PDF notes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditLesson} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Lecture Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                placeholder="e.g. Introduction to MS Word"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Brief description of what students will learn..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-videoUrl">
                YouTube Video URL <span className="text-gray-400">(Embed Link)</span>
              </Label>
              <Input
                id="edit-videoUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-pdfUrl">PDF Notes</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-pdfUrl"
                  placeholder="https://example.com/notes.pdf"
                  value={formData.pdfUrl}
                  onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                  className="flex-1"
                />
                <div className="relative flex-shrink-0">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploadingPdf}
                  />
                  <Button type="button" variant="outline" disabled={isUploadingPdf}>
                    {isUploadingPdf ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                    Upload PDF
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Paste a public URL or upload a new PDF directly.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration (minutes)</Label>
              <Input
                id="edit-duration"
                type="number"
                placeholder="e.g. 45"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-completionThreshold">Video Progress Completion Threshold (%)</Label>
              <Input
                id="edit-completionThreshold"
                type="number"
                min="1"
                max="100"
                placeholder="e.g. 70"
                value={formData.completionThreshold}
                onChange={(e) => setFormData({ ...formData, completionThreshold: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                The percentage of the video the student must watch to mark this lecture as complete (between 1 and 100).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Lecture Notes / Written Materials</Label>
              <Textarea
                id="edit-notes"
                placeholder="Write lesson summaries, key takeaways, code blocks, or custom notes for this lecture..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-resources">Supplementary Resources & External Links</Label>
              <Textarea
                id="edit-resources"
                placeholder="Add repository links, useful documents, external resources, or references for this lecture..."
                value={formData.resources}
                onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedLesson(null);
                  resetForm();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-white"
                disabled={updateLessonMutation.isPending}
              >
                {updateLessonMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lecture?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedLesson?.title}". This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLessonMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assignment Delete Confirmation Dialog */}
      <AlertDialog open={assignmentDeleteDialogOpen} onOpenChange={setAssignmentDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{selectedAssignment?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignment}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteAssignmentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
