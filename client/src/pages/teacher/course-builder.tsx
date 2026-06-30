import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { 
  useGetCourse, 
  useListSections, 
  useListLessons,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useListAssignments,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  useListQuizzes,
  useCreateQuiz,
  useUpdateQuiz,
  useDeleteQuiz,
  useUpdateCourse,
  getGetCourseQueryKey,
  getListSectionsQueryKey,
  getListLessonsQueryKey,
  getListAssignmentsQueryKey,
  getListQuizzesQueryKey
} from "@workspace/api-client-react";
import { 
  Loader2, Plus, GripVertical, Pencil, Trash2, Video, FileText, Save, X,
  Layout, ClipboardList, Calendar, Clock, HelpCircle, Youtube, Edit, Eye, EyeOff,
  ExternalLink, Link2, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit3, Settings } from "lucide-react";

const MAX_ASSIGNMENT_PDF_BYTES = 5 * 1024 * 1024;
const MAX_ASSIGNMENT_PDF_MB = Math.floor(MAX_ASSIGNMENT_PDF_BYTES / 1024 / 1024);
const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;

export default function TeacherCourseBuilder() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const courseId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: course, isLoading: courseLoading } = useGetCourse(courseId);
  const { data: sections, isLoading: sectionsLoading } = useListSections({ courseId });
  const { data: lessons, isLoading: lessonsLoading } = useListLessons({ courseId });
  
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  // Course Details Form States
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseCategory, setCourseCategory] = useState("MS Office");
  const [courseDuration, setCourseDuration] = useState("3 Months");
  const [courseFee, setCourseFee] = useState("5000");
  const [courseIsFree, setCourseIsFree] = useState(false);
  const [courseThumbnail, setCourseThumbnail] = useState("");
  const [courseSyllabus, setCourseSyllabus] = useState("");
  const [courseMinAttendance, setCourseMinAttendance] = useState("75");

  useEffect(() => {
    if (course) {
      setCourseTitle(course.title || "");
      setCourseDescription(course.description || "");
      setCourseCategory(course.category || "MS Office");
      setCourseDuration(course.duration || "3 Months");
      setCourseFee((course.fee ?? 0).toString());
      setCourseIsFree(!!course.isFree);
      setCourseThumbnail(course.thumbnail || "");
      setCourseSyllabus(course.syllabus || "");
      setCourseMinAttendance(((course as any).minAttendancePercentage ?? 75).toString());
    }
  }, [course]);

  const handleUpdateCourseDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim() || !courseDescription.trim() || !courseCategory.trim() || !courseDuration.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      await updateCourse.mutateAsync({
        id: courseId,
        data: {
          title: courseTitle,
          description: courseDescription,
          category: courseCategory,
          duration: courseDuration,
          fee: courseIsFree ? 0 : Number(courseFee),
          isFree: courseIsFree,
          thumbnail: courseThumbnail || null,
          syllabus: courseSyllabus || null,
          minAttendancePercentage: Number(courseMinAttendance),
        } as any
      });
      toast({ title: "Course details updated successfully!" });
      queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) });
    } catch (error) {
      toast({ title: "Error updating course details", variant: "destructive" });
    }
  };
  
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);

  // Admin-style lesson form state
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false);
  const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: "", description: "", videoUrl: "", pdfUrl: "",
    duration: "", completionThreshold: "80", notes: "", resources: "",
    isVisible: true
  });

  const resetLessonForm = () => setLessonForm({
    title: "", description: "", videoUrl: "", pdfUrl: "",
    duration: "", completionThreshold: "80", notes: "", resources: "",
    isVisible: true
  });

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Only PDF files are allowed", variant: "destructive" }); return;
    }
    const uploadData = new FormData();
    uploadData.append("pdf", file);
    setIsUploadingPdf(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/lessons/upload-pdf", {
        method: "POST", body: uploadData,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      setLessonForm(prev => ({ ...prev, pdfUrl: data.url }));
      toast({ title: "PDF uploaded successfully!" });
    } catch (err: any) {
      toast({ title: err.message || "Failed to upload", variant: "destructive" });
    } finally { setIsUploadingPdf(false); }
  };

  const [isUploadingAssignmentPdf, setIsUploadingAssignmentPdf] = useState(false);
  const handleAssignmentPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Only PDF files are allowed", variant: "destructive" }); return;
    }
    if (file.size > MAX_ASSIGNMENT_PDF_BYTES) {
      toast({ title: `PDF must be ${MAX_ASSIGNMENT_PDF_MB}MB or smaller. Please compress it first.`, variant: "destructive" }); return;
    }
    const uploadData = new FormData();
    uploadData.append("pdf", file);
    setIsUploadingAssignmentPdf(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/upload-pdf", {
        method: "POST", body: uploadData,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      setAssignmentData(prev => ({ ...prev, fileUrl: data.url }));
      toast({ title: "Assignment PDF uploaded successfully!" });
    } catch (err: any) {
      toast({ title: err.message || "Failed to upload", variant: "destructive" });
    } finally { setIsUploadingAssignmentPdf(false); }
  };

  const openAddLesson = (sectionId: number) => {
    setActiveSectionId(sectionId);
    resetLessonForm();
    setIsAddLessonOpen(true);
  };

  const openEditLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    setLessonForm({
      title: lesson.title || "", description: lesson.description || "",
      videoUrl: lesson.videoUrl || "", pdfUrl: lesson.pdfUrl || "",
      duration: lesson.duration?.toString() || "",
      completionThreshold: (lesson.completionThreshold ?? 80).toString(),
      notes: lesson.notes || "", resources: lesson.resources || "",
      isVisible: lesson.isVisible !== false
    });
    setIsEditLessonOpen(true);
  };
  
  const { data: assignments, isLoading: assignmentsLoading } = useListAssignments({ courseId });
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [assignmentData, setAssignmentData] = useState({
    title: "",
    description: "",
    dueDate: "",
    totalMarks: 100,
    fileUrl: ""
  });

  const { data: quizzes, isLoading: quizzesLoading } = useListQuizzes({ courseId });
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const deleteQuiz = useDeleteQuiz();
  
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [quizData, setQuizData] = useState({
    title: "",
    timeLimit: 30,
    questions: [
      { question: "", options: ["", "", "", ""], correctOption: 0, marks: 1 }
    ]
  });

  const resetQuizForm = () => {
    setEditingQuizId(null);
    setQuizData({
      title: "",
      timeLimit: 30,
      questions: [{ question: "", options: ["", "", "", ""], correctOption: 0, marks: 1 }]
    });
  };

  const handleSaveSection = async () => {
    if (!sectionTitle.trim()) return;
    
    try {
      if (editingSectionId) {
        await updateSection.mutateAsync({
          id: editingSectionId,
          data: { courseId, title: sectionTitle, order: 0 }
        });
        toast({ title: "Section updated" });
      } else {
        await createSection.mutateAsync({
          data: { courseId, title: sectionTitle, order: sections?.length ?? 0 }
        });
        toast({ title: "Section created" });
      }
      queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey({ courseId }) });
      setSectionTitle("");
      setEditingSectionId(null);
      setIsSectionDialogOpen(false);
    } catch (error) {
      toast({ title: "Error saving section", variant: "destructive" });
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.title || !activeSectionId) {
      toast({ title: "Title is required", variant: "destructive" }); return;
    }
    if (!lessonForm.videoUrl.trim()) {
      toast({ title: "YouTube lecture link is required", variant: "destructive" }); return;
    }
    try {
      await createLesson.mutateAsync({
        data: {
          courseId, sectionId: activeSectionId, title: lessonForm.title,
          description: lessonForm.description || undefined,
          videoUrl: lessonForm.videoUrl.trim(),
          pdfUrl: lessonForm.pdfUrl || undefined,
          duration: lessonForm.duration ? Number(lessonForm.duration) : undefined,
          orderIndex: lessons?.filter((l: any) => l.sectionId === activeSectionId).length ?? 0,
          completionThreshold: Number(lessonForm.completionThreshold) || 80,
          notes: lessonForm.notes || undefined,
          resources: lessonForm.resources || undefined,
          isVisible: lessonForm.isVisible
        } as any,
      });
      toast({ title: "Lecture added successfully!" });
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey({ courseId }) });
      setIsAddLessonOpen(false);
      resetLessonForm();
    } catch (error: any) {
      toast({
        title: error?.response?.data?.error || error?.response?.data?.message || error?.message || "Failed to add lecture",
        variant: "destructive"
      });
    }
  };

  const handleEditLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson || !lessonForm.title) {
      toast({ title: "Title is required", variant: "destructive" }); return;
    }
    if (!lessonForm.videoUrl.trim()) {
      toast({ title: "YouTube lecture link is required", variant: "destructive" }); return;
    }
    try {
      await updateLesson.mutateAsync({
        id: selectedLesson.id,
        data: {
          courseId, title: lessonForm.title,
          description: lessonForm.description || undefined,
          videoUrl: lessonForm.videoUrl.trim(),
          pdfUrl: lessonForm.pdfUrl || undefined,
          duration: lessonForm.duration ? Number(lessonForm.duration) : undefined,
          orderIndex: selectedLesson.orderIndex || 0,
          completionThreshold: Number(lessonForm.completionThreshold) || 80,
          notes: lessonForm.notes || undefined,
          resources: lessonForm.resources || undefined,
          isVisible: lessonForm.isVisible
        } as any,
      });
      toast({ title: "Lecture updated successfully!" });
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey({ courseId }) });
      setIsEditLessonOpen(false);
      setSelectedLesson(null);
      resetLessonForm();
    } catch (error: any) {
      toast({
        title: error?.response?.data?.error || error?.response?.data?.message || error?.message || "Failed to update lecture",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSection = async (sid: number) => {
    if (!confirm("Are you sure? This will delete all lessons in this section.")) return;
    try {
      await deleteSection.mutateAsync({ id: sid });
      queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey({ courseId }) });
      toast({ title: "Section deleted" });
    } catch (error) {
      toast({ title: "Error deleting section", variant: "destructive" });
    }
  };

  const handleDeleteLessonConfirm = async () => {
    if (!selectedLesson) return;
    try {
      await deleteLesson.mutateAsync({ id: selectedLesson.id });
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey({ courseId }) });
      toast({ title: "Lecture deleted successfully!" });
      setDeleteLessonDialogOpen(false);
      setSelectedLesson(null);
    } catch (error: any) {
      toast({ title: getErrorMessage(error, "Error deleting lesson"), variant: "destructive" });
    }
  };

  const handleSaveAssignment = async () => {
    if (!assignmentData.title.trim()) return;
    if (!assignmentData.fileUrl) {
      toast({ title: "Upload the assignment PDF before saving", variant: "destructive" });
      return;
    }
    try {
      if (editingAssignmentId) {
        await updateAssignment.mutateAsync({
          id: editingAssignmentId,
          data: { ...assignmentData, courseId } as any
        });
        toast({ title: "Assignment updated" });
      } else {
        await createAssignment.mutateAsync({
          data: { ...assignmentData, courseId } as any
        });
        toast({ title: "Assignment created" });
      }
      queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey({ courseId }) });
      setIsAssignmentDialogOpen(false);
      setEditingAssignmentId(null);
      setAssignmentData({ title: "", description: "", dueDate: "", totalMarks: 100, fileUrl: "" });
    } catch (error) {
      toast({ title: "Error saving assignment", variant: "destructive" });
    }
  };

  const handleDeleteAssignment = async (aid: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteAssignment.mutateAsync({ id: aid });
      queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey({ courseId }) });
      toast({ title: "Assignment deleted" });
    } catch (error) {
      toast({ title: "Error deleting assignment", variant: "destructive" });
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizData.title.trim()) return;
    try {
      const totalMarks = quizData.questions.reduce((sum, q) => sum + q.marks, 0);
      
      if (editingQuizId) {
        await updateQuiz.mutateAsync({
          id: editingQuizId,
          data: { ...quizData, courseId, totalMarks }
        });
        toast({ title: "Quiz updated successfully!" });
      } else {
        await createQuiz.mutateAsync({
          data: { ...quizData, courseId, totalMarks }
        });
        toast({ title: "Quiz created successfully!" });
      }
      
      queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey({ courseId }) });
      setIsQuizDialogOpen(false);
      resetQuizForm();
    } catch (error) {
      toast({ title: editingQuizId ? "Error updating quiz" : "Error creating quiz", variant: "destructive" });
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) return;
    try {
      await deleteQuiz.mutateAsync({ id: quizId });
      queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey({ courseId }) });
      toast({ title: "Quiz deleted successfully!" });
    } catch (error) {
      toast({ title: "Error deleting quiz", variant: "destructive" });
    }
  };

  const updateCourse = useUpdateCourse();

  const handleSubmitForReview = async () => {
    if (!confirm("Are you sure you want to submit this course for review? You won't be able to edit it until it's reviewed.")) return;
    try {
      await updateCourse.mutateAsync({
        id: courseId,
        data: { ...course, status: "pending" } as any
      });
      toast({ title: "Course submitted for review" });
      queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) });
    } catch (error) {
      toast({ title: "Error submitting course", variant: "destructive" });
    }
  };

  if (courseLoading || sectionsLoading || lessonsLoading || assignmentsLoading || quizzesLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "live": return <Badge className="bg-green-500 hover:bg-green-600">Live</Badge>;
      case "pending": return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Pending Review</Badge>;
      case "rejected": return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      default: return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{course?.title}</h1>
            {getStatusBadge((course as any)?.status)}
          </div>
          <p className="text-muted-foreground mt-1">Course Builder & Curriculum Management</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setLocation("/teacher/courses")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          {((course as any)?.status === "draft" || (course as any)?.status === "rejected") && (
            <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSubmitForReview}>
              <Save className="h-4 w-4 mr-2" />
              Submit for Review
            </Button>
          )}
          <Button variant="outline" onClick={() => {
            setSectionTitle("");
            setEditingSectionId(null);
            setIsSectionDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
          <Button variant="outline" onClick={() => {
            setEditingAssignmentId(null);
            setAssignmentData({ title: "", description: "", dueDate: "", totalMarks: 100, fileUrl: "" });
            setIsAssignmentDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
          <Button variant="outline" onClick={() => {
            resetQuizForm();
            setIsQuizDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
        </div>
      </div>

      <Tabs defaultValue="curriculum" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="curriculum" className="flex items-center gap-2 px-6">
            <Layout className="h-4 w-4" /> Curriculum
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2 px-6">
            <ClipboardList className="h-4 w-4" /> Assignments
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="flex items-center gap-2 px-6">
            <HelpCircle className="h-4 w-4" /> Quizzes
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2 px-6">
            <Settings className="h-4 w-4" /> Course Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum">
          {sections?.length === 0 ? (
            <Card className="border-dashed py-12 flex flex-col items-center justify-center text-center">
              <Layout className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No sections yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-6">
                Start by adding your first section to organize your course content.
              </p>
              <Button onClick={() => setIsSectionDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Section
              </Button>
            </Card>
          ) : (
            <div className="space-y-5">
              {sections?.map((section) => {
                const sectionLessons = lessons?.filter((l: any) => l.sectionId === section.id) || [];
                return (
                  <Card key={section.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400">
                          <GripVertical className="h-4 w-4 cursor-grab" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-base font-black text-slate-900">{section.title}</h3>
                            <Badge variant="outline" className="h-6 rounded-md bg-white text-[10px] font-bold text-slate-500">
                              {sectionLessons.length} lectures
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs font-medium text-slate-500">Add YouTube lecture links, notes, and resources for this section.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9 gap-2 rounded-md text-xs font-bold" onClick={() => openAddLesson(section.id)}>
                          <Plus className="h-3.5 w-3.5" /> Add Lecture
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          setSectionTitle(section.title);
                          setEditingSectionId(section.id);
                          setIsSectionDialogOpen(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteSection(section.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-0">
                      {sectionLessons.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <Video className="h-6 w-6" />
                          </div>
                          <h4 className="text-sm font-black text-slate-900">No lecture links yet</h4>
                          <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">Create a lecture row with a title, YouTube URL, duration, and optional PDF notes.</p>
                          <Button className="mt-5 gap-2 rounded-md text-xs font-bold" size="sm" onClick={() => openAddLesson(section.id)}>
                            <Plus className="h-4 w-4" /> Add First Lecture
                          </Button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table className="min-w-[920px]">
                            <TableHeader className="bg-white">
                              <TableRow className="hover:bg-white">
                                <TableHead className="w-12 text-center text-[10px] font-black uppercase text-slate-400">#</TableHead>
                                <TableHead className="min-w-[240px] text-[10px] font-black uppercase text-slate-400">Lecture</TableHead>
                                <TableHead className="min-w-[280px] text-[10px] font-black uppercase text-slate-400">Video Link</TableHead>
                                <TableHead className="w-28 text-[10px] font-black uppercase text-slate-400">PDF</TableHead>
                                <TableHead className="w-28 text-[10px] font-black uppercase text-slate-400">Duration</TableHead>
                                <TableHead className="w-28 text-[10px] font-black uppercase text-slate-400">Status</TableHead>
                                <TableHead className="w-28 text-right text-[10px] font-black uppercase text-slate-400">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sectionLessons.map((lesson: any, index: number) => (
                                <TableRow key={lesson.id} className={`h-14 hover:bg-slate-50/80 ${lesson.isVisible === false ? "bg-amber-50/30" : ""}`}>
                                  <TableCell className="text-center">
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-xs font-black text-blue-600">
                                      {index + 1}
                                    </span>
                                  </TableCell>
                                  <TableCell className="max-w-[280px]">
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-black text-slate-900">{lesson.title}</div>
                                      {lesson.description && (
                                        <div className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{lesson.description}</div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-[320px]">
                                    {lesson.videoUrl ? (
                                      <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-2 rounded-md border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100">
                                        <Youtube className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{lesson.videoUrl}</span>
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                        <Link2 className="h-3.5 w-3.5" /> No video link
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {lesson.pdfUrl ? (
                                      <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                        <FileText className="h-3.5 w-3.5" /> PDF
                                      </a>
                                    ) : (
                                      <span className="text-xs font-medium text-slate-400">None</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs font-semibold text-slate-600">
                                    {lesson.duration ? `${lesson.duration} min` : "Not set"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={`h-6 rounded-md text-[10px] font-black ${lesson.isVisible === false ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                                      {lesson.isVisible === false ? "Hidden" : "Visible"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        title={lesson.isVisible === false ? "Unhide Lecture" : "Hide Lecture"}
                                        onClick={async () => {
                                          try {
                                            const nextIsVisible = lesson.isVisible === false;
                                            await updateLesson.mutateAsync({
                                              id: lesson.id,
                                              data: {
                                                courseId,
                                                title: lesson.title,
                                                description: lesson.description || undefined,
                                                videoUrl: lesson.videoUrl || undefined,
                                                pdfUrl: lesson.pdfUrl || undefined,
                                                duration: lesson.duration ? Number(lesson.duration) : undefined,
                                                orderIndex: lesson.orderIndex ?? index,
                                                sectionId: lesson.sectionId ?? section.id,
                                                completionThreshold: lesson.completionThreshold ?? 80,
                                                notes: lesson.notes || undefined,
                                                resources: lesson.resources || undefined,
                                                isVisible: nextIsVisible
                                              } as any
                                            });
                                            toast({ title: nextIsVisible ? "Lecture is now visible" : "Lecture is now hidden" });
                                            queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey({ courseId }) });
                                          } catch (err: any) {
                                            toast({ title: getErrorMessage(err, "Failed to toggle visibility"), variant: "destructive" });
                                          }
                                        }}
                                      >
                                        {lesson.isVisible === false ? (
                                          <EyeOff className="h-4 w-4 text-amber-500" />
                                        ) : (
                                          <Eye className="h-4 w-4 text-slate-500" />
                                        )}
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditLesson(lesson)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => {
                                        setSelectedLesson(lesson);
                                        setDeleteLessonDialogOpen(true);
                                      }}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments">
          {assignments?.length === 0 ? (
            <Card className="border-dashed py-12 flex flex-col items-center justify-center text-center bg-transparent">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No assignments created</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-6">
                Add assignments to evaluate student learning progress.
              </p>
              <Button onClick={() => setIsAssignmentDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Assignment
              </Button>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <Table className="min-w-[860px]">
                  <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-slate-50">
                      <TableHead className="w-12 text-center text-[10px] font-black uppercase text-slate-400">#</TableHead>
                      <TableHead className="min-w-[220px] text-[10px] font-black uppercase text-slate-400">Assignment</TableHead>
                      <TableHead className="min-w-[280px] text-[10px] font-black uppercase text-slate-400">Instructions</TableHead>
                      <TableHead className="w-44 text-[10px] font-black uppercase text-slate-400">Due Date</TableHead>
                      <TableHead className="w-28 text-[10px] font-black uppercase text-slate-400">Marks</TableHead>
                      <TableHead className="w-24 text-[10px] font-black uppercase text-slate-400">Sheet</TableHead>
                      <TableHead className="w-24 text-right text-[10px] font-black uppercase text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments?.map((assignment, index) => {
                      const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
                      return (
                        <TableRow key={assignment.id} className="h-12 hover:bg-slate-50/80">
                          <TableCell className="text-center text-xs font-semibold text-slate-400">{index + 1}</TableCell>
                          <TableCell className="max-w-[260px]">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <ClipboardList className="h-3.5 w-3.5" />
                              </div>
                              <span className="truncate text-sm font-bold text-slate-900">{assignment.title}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[320px] truncate text-xs text-slate-500">
                            {assignment.description || "No instructions added"}
                          </TableCell>
                          <TableCell className={`text-xs font-semibold ${isOverdue ? "text-rose-600" : "text-slate-600"}`}>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : "No limit"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="h-6 rounded-md bg-white text-[10px] font-bold">
                              {assignment.totalMarks} Marks
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(assignment as any).fileUrl ? (
                              <a href={(assignment as any).fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 text-xs font-bold text-primary hover:bg-primary/10">
                                <FileText className="h-3.5 w-3.5" /> PDF
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                setEditingAssignmentId(assignment.id);
                                setAssignmentData({
                                  title: assignment.title,
                                  description: assignment.description || "",
                                  dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : "",
                                  totalMarks: assignment.totalMarks,
                                  fileUrl: (assignment as any).fileUrl || ""
                                });
                                setIsAssignmentDialogOpen(true);
                              }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteAssignment(assignment.id)}>
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
            </div>
          )}
        </TabsContent>

        <TabsContent value="quizzes">
          {quizzes?.length === 0 ? (
            <Card className="border-dashed py-12 flex flex-col items-center justify-center text-center bg-transparent">
              <HelpCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No quizzes created</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-6">
                Create interactive quizzes to test student knowledge.
              </p>
              <Button onClick={() => setIsQuizDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Quiz
              </Button>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <Table className="min-w-[720px]">
                  <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-slate-50">
                      <TableHead className="w-12 text-center text-[10px] font-black uppercase text-slate-400">#</TableHead>
                      <TableHead className="min-w-[280px] text-[10px] font-black uppercase text-slate-400">Quiz</TableHead>
                      <TableHead className="w-32 text-[10px] font-black uppercase text-slate-400">Questions</TableHead>
                      <TableHead className="w-32 text-[10px] font-black uppercase text-slate-400">Time</TableHead>
                      <TableHead className="w-28 text-[10px] font-black uppercase text-slate-400">Marks</TableHead>
                      <TableHead className="w-24 text-right text-[10px] font-black uppercase text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizzes?.map((quiz, index) => (
                      <TableRow key={quiz.id} className="h-12 hover:bg-slate-50/80">
                        <TableCell className="text-center text-xs font-semibold text-slate-400">{index + 1}</TableCell>
                        <TableCell className="max-w-[340px]">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                              <HelpCircle className="h-3.5 w-3.5" />
                            </div>
                            <span className="truncate text-sm font-bold text-slate-900">{quiz.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="h-6 rounded-md bg-white text-[10px] font-bold">
                            {(quiz.questions as any)?.length || 0} Questions
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {quiz.timeLimit ?? 30} min
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="h-6 rounded-md text-[10px] font-bold">
                            {quiz.totalMarks} Marks
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingQuizId(quiz.id);
                                setQuizData({
                                  title: quiz.title,
                                  timeLimit: quiz.timeLimit ?? 30,
                                  questions: ((quiz.questions as any[]) || [{ question: "", options: ["", "", "", ""], correctOption: 0, marks: 1 }]).map((question) => ({
                                    question: question.question || "",
                                    options: question.options || ["", "", "", ""],
                                    correctOption: question.correctOption ?? 0,
                                    marks: question.marks ?? 1,
                                  }))
                                });
                                setIsQuizDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              disabled={deleteQuiz.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="details">
          <Card className="border border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-500" />
                Course Settings & Syllabus Design
              </CardTitle>
              <p className="text-slate-500 text-xs mt-1">Configure your course details, duration metrics, pricing plans, and course outline</p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateCourseDetails} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="detail-title" className="font-bold text-slate-700">Course Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="detail-title"
                    placeholder="e.g. Masterclass in Advanced Frontend & React Architecture"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="detail-category" className="font-bold text-slate-700">Category <span className="text-red-500">*</span></Label>
                    <Select value={courseCategory} onValueChange={setCourseCategory}>
                      <SelectTrigger id="detail-category">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MS Office">MS Office</SelectItem>
                        <SelectItem value="Graphics">Graphic Design</SelectItem>
                        <SelectItem value="Freelancing">Freelancing Mastery</SelectItem>
                        <SelectItem value="AI">Artificial Intelligence (AI)</SelectItem>
                        <SelectItem value="Web">Web Development</SelectItem>
                        <SelectItem value="Computer Basic">Computer Basic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detail-duration" className="font-bold text-slate-700">Syllabus Duration <span className="text-red-500">*</span></Label>
                    <Input
                      id="detail-duration"
                      placeholder="e.g. 12 Weeks (48 Hours)"
                      value={courseDuration}
                      onChange={(e) => setCourseDuration(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="detail-fee" className="font-bold text-slate-700">Course Fee (PKR)</Label>
                    <Input
                      id="detail-fee"
                      type="number"
                      placeholder="e.g. 6000"
                      value={courseFee}
                      onChange={(e) => setCourseFee(e.target.value)}
                      disabled={courseIsFree}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detail-minAttendance" className="font-bold text-slate-700">Min Attendance Requirement (%)</Label>
                    <Input
                      id="detail-minAttendance"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 75"
                      value={courseMinAttendance}
                      onChange={(e) => setCourseMinAttendance(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-6 items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={courseIsFree}
                      onChange={(e) => {
                        setCourseIsFree(e.target.checked);
                        if (e.target.checked) setCourseFee("0");
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    This is a Free Course
                  </label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detail-thumbnail" className="font-bold text-slate-700">Cover Thumbnail Image URL</Label>
                  <Input
                    id="detail-thumbnail"
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    value={courseThumbnail}
                    onChange={(e) => setCourseThumbnail(e.target.value)}
                  />
                  {courseThumbnail && (
                    <div className="mt-2 h-36 w-64 rounded-lg overflow-hidden border">
                      <img src={courseThumbnail} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detail-description" className="font-bold text-slate-700">Short Description / Objectives <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="detail-description"
                    placeholder="Describe the course summary, target audience, and key goals..."
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detail-syllabus" className="font-bold text-slate-700">Detailed Syllabus & Learning Plan</Label>
                  <Textarea
                    id="detail-syllabus"
                    placeholder="Provide a comprehensive weekly or modular course outline here..."
                    value={courseSyllabus}
                    onChange={(e) => setCourseSyllabus(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" className="bg-primary hover:bg-primary/95 text-white gap-2 font-semibold">
                    <Save className="h-4 w-4" /> Save Course Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Section Dialog */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSectionId ? "Edit Section" : "Add New Section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="section-title">Section Title</Label>
              <Input 
                id="section-title" 
                value={sectionTitle} 
                onChange={(e) => setSectionTitle(e.target.value)} 
                placeholder="e.g. Introduction to React"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSectionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSection}>Save Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lecture Dialog */}
      <Dialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Lecture</DialogTitle>
            <DialogDescription>
              Add video lectures with YouTube embed links and PDF notes for students.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddLesson} className="pt-2">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-black uppercase text-slate-500">
                    Lecture Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Introduction to MS Word"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="h-11 rounded-lg border-slate-200 font-semibold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl" className="text-xs font-black uppercase text-slate-500">
                    YouTube Lecture Link
                  </Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                    <Input
                      id="videoUrl"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                      className="h-11 rounded-lg border-slate-200 pl-10 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-black uppercase text-slate-500">Short Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of what students will learn..."
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="min-h-[96px] rounded-lg border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs font-black uppercase text-slate-500">Lecture Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Write lesson summaries, key takeaways, or written material..."
                    value={lessonForm.notes}
                    onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
                    className="min-h-[132px] rounded-lg border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <div className="space-y-2">
                  <Label htmlFor="pdfUrl" className="text-xs font-black uppercase text-slate-500">PDF Notes</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pdfUrl"
                      placeholder="https://example.com/notes.pdf"
                      value={lessonForm.pdfUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, pdfUrl: e.target.value })}
                      className="h-10 flex-1 rounded-lg border-slate-200 bg-white text-xs"
                    />
                    <div className="relative shrink-0">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        disabled={isUploadingPdf}
                      />
                      <Button type="button" variant="outline" className="h-10 rounded-lg bg-white text-xs font-bold" disabled={isUploadingPdf}>
                        {isUploadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-xs font-black uppercase text-slate-500">Minutes</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="45"
                      value={lessonForm.duration}
                      onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                      className="h-10 rounded-lg border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="completionThreshold" className="text-xs font-black uppercase text-slate-500">Complete %</Label>
                    <Input
                      id="completionThreshold"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="80"
                      value={lessonForm.completionThreshold}
                      onChange={(e) => setLessonForm({ ...lessonForm, completionThreshold: e.target.value })}
                      className="h-10 rounded-lg border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resources" className="text-xs font-black uppercase text-slate-500">Resources</Label>
                  <Textarea
                    id="resources"
                    placeholder="Add useful links or references..."
                    value={lessonForm.resources}
                    onChange={(e) => setLessonForm({ ...lessonForm, resources: e.target.value })}
                    className="min-h-[104px] rounded-lg border-slate-200 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility" className="text-xs font-black uppercase text-slate-500">Visibility</Label>
                  <Select
                    value={lessonForm.isVisible ? "true" : "false"}
                    onValueChange={(val) => setLessonForm({ ...lessonForm, isVisible: val === "true" })}
                  >
                    <SelectTrigger id="visibility" className="h-10 rounded-lg border-slate-200 bg-white">
                      <SelectValue placeholder="Select visibility status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Visible to Students</SelectItem>
                      <SelectItem value="false">Hidden (Draft)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => {
                  setIsAddLessonOpen(false);
                  resetLessonForm();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-lg bg-primary text-white"
                disabled={createLesson.isPending}
              >
                {createLesson.isPending ? (
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
      <Dialog open={isEditLessonOpen} onOpenChange={setIsEditLessonOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Lecture</DialogTitle>
            <DialogDescription>
              Update lecture details, video links, and PDF notes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditLessonSubmit} className="pt-2">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="text-xs font-black uppercase text-slate-500">
                    Lecture Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g. Introduction to MS Word"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="h-11 rounded-lg border-slate-200 font-semibold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-videoUrl" className="text-xs font-black uppercase text-slate-500">
                    YouTube Lecture Link
                  </Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                    <Input
                      id="edit-videoUrl"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                      className="h-11 rounded-lg border-slate-200 pl-10 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="text-xs font-black uppercase text-slate-500">Short Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Brief description of what students will learn..."
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="min-h-[96px] rounded-lg border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes" className="text-xs font-black uppercase text-slate-500">Lecture Notes</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder="Write lesson summaries, key takeaways, or written material..."
                    value={lessonForm.notes}
                    onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
                    className="min-h-[132px] rounded-lg border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-pdfUrl" className="text-xs font-black uppercase text-slate-500">PDF Notes</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-pdfUrl"
                      placeholder="https://example.com/notes.pdf"
                      value={lessonForm.pdfUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, pdfUrl: e.target.value })}
                      className="h-10 flex-1 rounded-lg border-slate-200 bg-white text-xs"
                    />
                    <div className="relative shrink-0">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        disabled={isUploadingPdf}
                      />
                      <Button type="button" variant="outline" className="h-10 rounded-lg bg-white text-xs font-bold" disabled={isUploadingPdf}>
                        {isUploadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-duration" className="text-xs font-black uppercase text-slate-500">Minutes</Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      placeholder="45"
                      value={lessonForm.duration}
                      onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                      className="h-10 rounded-lg border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-completionThreshold" className="text-xs font-black uppercase text-slate-500">Complete %</Label>
                    <Input
                      id="edit-completionThreshold"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="80"
                      value={lessonForm.completionThreshold}
                      onChange={(e) => setLessonForm({ ...lessonForm, completionThreshold: e.target.value })}
                      className="h-10 rounded-lg border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-resources" className="text-xs font-black uppercase text-slate-500">Resources</Label>
                  <Textarea
                    id="edit-resources"
                    placeholder="Add useful links or references..."
                    value={lessonForm.resources}
                    onChange={(e) => setLessonForm({ ...lessonForm, resources: e.target.value })}
                    className="min-h-[104px] rounded-lg border-slate-200 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-visibility" className="text-xs font-black uppercase text-slate-500">Visibility</Label>
                  <Select
                    value={lessonForm.isVisible ? "true" : "false"}
                    onValueChange={(val) => setLessonForm({ ...lessonForm, isVisible: val === "true" })}
                  >
                    <SelectTrigger id="edit-visibility" className="h-10 rounded-lg border-slate-200 bg-white">
                      <SelectValue placeholder="Select visibility status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Visible to Students</SelectItem>
                      <SelectItem value="false">Hidden (Draft)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={() => {
                  setIsEditLessonOpen(false);
                  setSelectedLesson(null);
                  resetLessonForm();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-lg bg-primary text-white"
                disabled={updateLesson.isPending}
              >
                {updateLesson.isPending ? (
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
      <AlertDialog open={deleteLessonDialogOpen} onOpenChange={setDeleteLessonDialogOpen}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lecture?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedLesson?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLessonConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLesson.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAssignmentId ? "Edit Assignment" : "New Assignment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Assignment Title *</Label>
              <Input 
                value={assignmentData.title} 
                onChange={(e) => setAssignmentData({...assignmentData, title: e.target.value})} 
                placeholder="e.g. Final Project: Build a React App"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={assignmentData.description} 
                onChange={(e) => setAssignmentData({...assignmentData, description: e.target.value})} 
                placeholder="Instructions for students..."
              />
            </div>
            <div className="space-y-2">
              <Label>Assignment PDF Sheet</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Upload a PDF from your computer"
                  value={assignmentData.fileUrl}
                  readOnly
                  className="flex-1 bg-slate-50"
                />
                <div className="relative flex-shrink-0">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleAssignmentPdfUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploadingAssignmentPdf}
                  />
                  <Button type="button" variant="outline" disabled={isUploadingAssignmentPdf}>
                    {isUploadingAssignmentPdf ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                    Upload PDF
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                PDF only, max {MAX_ASSIGNMENT_PDF_MB}MB. Compress larger files before uploading.
              </p>
              {assignmentData.fileUrl && (
                <div className="space-y-2">
                  <a href={assignmentData.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Open uploaded PDF
                  </a>
                  <iframe src={assignmentData.fileUrl} className="w-full h-40 rounded-lg border border-slate-200" title="Assignment PDF Preview" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input 
                  type="datetime-local"
                  value={assignmentData.dueDate} 
                  onChange={(e) => setAssignmentData({...assignmentData, dueDate: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input 
                  type="number"
                  value={assignmentData.totalMarks} 
                  onChange={(e) => setAssignmentData({...assignmentData, totalMarks: Number(e.target.value)})} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAssignment} disabled={isUploadingAssignmentPdf}>Save Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog
        open={isQuizDialogOpen}
        onOpenChange={(open) => {
          setIsQuizDialogOpen(open);
          if (!open) resetQuizForm();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuizId ? "Edit Quiz" : "Create New Quiz"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quiz Title *</Label>
                <Input 
                  value={quizData.title} 
                  onChange={(e) => setQuizData({...quizData, title: e.target.value})} 
                  placeholder="e.g. Midterm Assessment"
                />
              </div>
              <div className="space-y-2">
                <Label>Time Limit (minutes)</Label>
                <Input 
                  type="number"
                  value={quizData.timeLimit} 
                  onChange={(e) => setQuizData({...quizData, timeLimit: Number(e.target.value)})} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-bold">Questions</Label>
                <Button variant="outline" size="sm" onClick={() => {
                  setQuizData({
                    ...quizData,
                    questions: [...quizData.questions, { question: "", options: ["", "", "", ""], correctOption: 0, marks: 1 }]
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Question
                </Button>
              </div>

              {quizData.questions.map((q, qIndex) => (
                <Card key={qIndex} className="p-4 bg-slate-50/50">
                  <div className="flex justify-between mb-4">
                    <span className="font-bold text-sm text-slate-500">Question {qIndex + 1}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => {
                      const newQuestions = [...quizData.questions];
                      newQuestions.splice(qIndex, 1);
                      setQuizData({ ...quizData, questions: newQuestions });
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <Input 
                      placeholder="Enter question text..."
                      value={q.question}
                      onChange={(e) => {
                        const newQuestions = [...quizData.questions];
                        newQuestions[qIndex].question = e.target.value;
                        setQuizData({ ...quizData, questions: newQuestions });
                      }}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex gap-2">
                          <input 
                            type="radio" 
                            name={`correct-${qIndex}`} 
                            checked={q.correctOption === oIndex}
                            onChange={() => {
                              const newQuestions = [...quizData.questions];
                              newQuestions[qIndex].correctOption = oIndex;
                              setQuizData({ ...quizData, questions: newQuestions });
                            }}
                          />
                          <Input 
                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                            value={opt}
                            onChange={(e) => {
                              const newQuestions = [...quizData.questions];
                              newQuestions[qIndex].options[oIndex] = e.target.value;
                              setQuizData({ ...quizData, questions: newQuestions });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuizDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQuiz} disabled={createQuiz.isPending || updateQuiz.isPending}>
              {(createQuiz.isPending || updateQuiz.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingQuizId ? "Update Quiz" : "Create Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
