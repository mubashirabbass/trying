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
  useUpdateCourse,
  getGetCourseQueryKey,
  getListSectionsQueryKey,
  getListLessonsQueryKey,
  getListAssignmentsQueryKey
} from "@workspace/api-client-react";
import { 
  Loader2, 
  Plus, 
  GripVertical, 
  Pencil, 
  Trash2, 
  Video, 
  FileText, 
  Save, 
  X,
  ChevronDown,
  ChevronUp,
  Layout,
  ClipboardList,
  Calendar,
  Clock,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function TeacherCourseBuilder() {
  const { id } = useParams();
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
  
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [lessonData, setLessonData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    pdfUrl: "",
    sectionId: 0,
    completionThreshold: "80",
    notes: "",
    resources: ""
  });
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  
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
    totalMarks: 100
  });

  const { data: quizzes, isLoading: quizzesLoading } = useListQuizzes({ courseId });
  const createQuiz = useCreateQuiz();
  
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [quizData, setQuizData] = useState({
    title: "",
    timeLimit: 30,
    questions: [
      { question: "", options: ["", "", "", ""], correctOption: 0, marks: 1 }
    ]
  });

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

  const handleSaveLesson = async () => {
    if (!lessonData.title.trim() || !activeSectionId) return;
    
    try {
      const payload: any = {
        title: lessonData.title,
        description: lessonData.description || undefined,
        videoUrl: lessonData.videoUrl || undefined,
        pdfUrl: lessonData.pdfUrl || undefined,
        completionThreshold: Number(lessonData.completionThreshold) || 80,
        notes: lessonData.notes || undefined,
        resources: lessonData.resources || undefined,
      };

      if (editingLessonId) {
        await updateLesson.mutateAsync({
          id: editingLessonId,
          data: { ...payload, courseId, sectionId: activeSectionId } as any
        });
        toast({ title: "Lesson updated" });
      } else {
        await createLesson.mutateAsync({
          data: { ...payload, courseId, sectionId: activeSectionId, orderIndex: 0 } as any
        });
        toast({ title: "Lesson created" });
      }
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey({ courseId }) });
      setLessonData({ title: "", description: "", videoUrl: "", pdfUrl: "", sectionId: 0, completionThreshold: "80", notes: "", resources: "" });
      setEditingLessonId(null);
      setIsLessonDialogOpen(false);
    } catch (error) {
      toast({ title: "Error saving lesson", variant: "destructive" });
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

  const handleDeleteLesson = async (lid: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteLesson.mutateAsync({ id: lid });
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey({ courseId }) });
      toast({ title: "Lesson deleted" });
    } catch (error) {
      toast({ title: "Error deleting lesson", variant: "destructive" });
    }
  };

  const handleSaveAssignment = async () => {
    if (!assignmentData.title.trim()) return;
    try {
      if (editingAssignmentId) {
        await updateAssignment.mutateAsync({
          id: editingAssignmentId,
          data: { ...assignmentData, courseId }
        });
        toast({ title: "Assignment updated" });
      } else {
        await createAssignment.mutateAsync({
          data: { ...assignmentData, courseId }
        });
        toast({ title: "Assignment created" });
      }
      queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey({ courseId }) });
      setIsAssignmentDialogOpen(false);
      setEditingAssignmentId(null);
      setAssignmentData({ title: "", description: "", dueDate: "", totalMarks: 100 });
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
      await createQuiz.mutateAsync({
        data: { ...quizData, courseId, totalMarks }
      });
      toast({ title: "Quiz created" });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setIsQuizDialogOpen(false);
      setQuizData({
        title: "",
        timeLimit: 30,
        questions: [{ question: "", options: ["", "", "", ""], correctOption: 0, marks: 1 }]
      });
    } catch (error) {
      toast({ title: "Error creating quiz", variant: "destructive" });
    }
  };

  const updateCourse = useUpdateCourse();

  const handleSubmitForReview = async () => {
    if (!confirm("Are you sure you want to submit this course for review? You won't be able to edit it until it's reviewed.")) return;
    try {
      await updateCourse.mutateAsync({
        id: courseId,
        data: { ...course, status: "pending" }
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
            {getStatusBadge(course?.status)}
          </div>
          <p className="text-muted-foreground mt-1">Course Builder & Curriculum Management</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {course?.status === "draft" && (
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
            setAssignmentData({ title: "", description: "", dueDate: "", totalMarks: 100 });
            setIsAssignmentDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
          <Button onClick={() => {
            setQuizData({
              title: "",
              timeLimit: 30,
              questions: [{ question: "", options: ["", "", "", ""], correctOption: 0, marks: 1 }]
            });
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
            <Accordion type="multiple" className="space-y-4">
              {sections?.map((section) => (
                <AccordionItem key={section.id} value={`section-${section.id}`} className="border rounded-xl bg-card overflow-hidden">
                  <div className="flex items-center px-4 py-2 bg-muted/30 group">
                    <GripVertical className="h-4 w-4 text-muted-foreground mr-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                    <AccordionTrigger className="flex-1 hover:no-underline py-2">
                      <span className="text-lg font-semibold">{section.title}</span>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                        e.stopPropagation();
                        setSectionTitle(section.title);
                        setEditingSectionId(section.id);
                        setIsSectionDialogOpen(true);
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSection(section.id);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="p-4 pt-0">
                    <div className="space-y-2 mt-4">
                      {lessons?.filter(l => (l as any).sectionId === section.id).map(lesson => (
                        <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:shadow-sm transition-shadow">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {lesson.videoUrl ? <Video className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-blue-500" />}
                              <span className="font-medium">{lesson.title}</span>
                            </div>
                            {lesson.description && <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5">{lesson.description}</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setLessonData({
                                title: lesson.title,
                                description: lesson.description ?? "",
                                videoUrl: lesson.videoUrl ?? "",
                                pdfUrl: lesson.pdfUrl ?? "",
                                sectionId: section.id,
                                completionThreshold: ((lesson as any).completionThreshold ?? 80).toString(),
                                notes: (lesson as any).notes ?? "",
                                resources: (lesson as any).resources ?? ""
                              } as any);
                              setEditingLessonId(lesson.id);
                              setActiveSectionId(section.id);
                              setIsLessonDialogOpen(true);
                            }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteLesson(lesson.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="ghost" className="w-full border-dashed border h-10 mt-2 text-muted-foreground hover:text-primary" onClick={() => {
                        setActiveSectionId(section.id);
                        setEditingLessonId(null);
                        setLessonData({ title: "", description: "", videoUrl: "", pdfUrl: "", sectionId: section.id, completionThreshold: "80", notes: "", resources: "" });
                        setIsLessonDialogOpen(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments?.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setEditingAssignmentId(assignment.id);
                          setAssignmentData({
                            title: assignment.title,
                            description: assignment.description || "",
                            dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : "",
                            totalMarks: assignment.totalMarks
                          });
                          setIsAssignmentDialogOpen(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAssignment(assignment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{assignment.description}</p>
                    <div className="flex items-center justify-between text-xs font-medium border-t pt-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No limit'}
                      </div>
                      <Badge variant="outline" className="bg-slate-50">{assignment.totalMarks} Marks</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes?.map((quiz) => (
                <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <HelpCircle className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{quiz.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline">{quiz.questions.length} Questions</Badge>
                      <Badge variant="outline">{quiz.timeLimit} Minutes</Badge>
                      <Badge variant="secondary">{quiz.totalMarks} Marks</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLessonId ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-4 col-span-full">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Lesson Title *</Label>
                <Input 
                  id="lesson-title" 
                  value={lessonData.title} 
                  onChange={(e) => setLessonData({...lessonData, title: e.target.value})} 
                  placeholder="e.g. Setting up the environment"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-desc">Description</Label>
                <Textarea 
                  id="lesson-desc" 
                  value={lessonData.description} 
                  onChange={(e) => setLessonData({...lessonData, description: e.target.value})} 
                  placeholder="What will students learn in this lesson?"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-video">Video URL (YouTube/Vimeo)</Label>
                <div className="relative">
                  <Video className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="lesson-video" 
                    className="pl-9"
                    value={lessonData.videoUrl} 
                    onChange={(e) => setLessonData({...lessonData, videoUrl: e.target.value})} 
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-pdf">PDF Document URL</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="lesson-pdf" 
                    className="pl-9"
                    value={lessonData.pdfUrl} 
                    onChange={(e) => setLessonData({...lessonData, pdfUrl: e.target.value})} 
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4 col-span-full">
              <div className="space-y-2">
                <Label htmlFor="lesson-threshold">Video Progress Completion Threshold (%)</Label>
                <Input 
                  id="lesson-threshold" 
                  type="number"
                  min="1"
                  max="100"
                  value={(lessonData as any).completionThreshold} 
                  onChange={(e) => setLessonData({...lessonData, completionThreshold: e.target.value})} 
                  placeholder="e.g. 70"
                />
                <p className="text-[11px] text-muted-foreground">The percentage of the video the student must watch to mark complete.</p>
              </div>
            </div>
            <div className="space-y-4 col-span-full">
              <div className="space-y-2">
                <Label htmlFor="lesson-notes">Lecture Notes / Written Materials</Label>
                <Textarea 
                  id="lesson-notes" 
                  value={(lessonData as any).notes} 
                  onChange={(e) => setLessonData({...lessonData, notes: e.target.value})} 
                  placeholder="Write summary notes or materials for students..."
                  rows={4}
                />
              </div>
            </div>
            <div className="space-y-4 col-span-full">
              <div className="space-y-2">
                <Label htmlFor="lesson-resources">Supplementary Resources & Links</Label>
                <Textarea 
                  id="lesson-resources" 
                  value={(lessonData as any).resources} 
                  onChange={(e) => setLessonData({...lessonData, resources: e.target.value})} 
                  placeholder="Paste resource links or additional references..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLesson}>Save Lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input 
                  type="date"
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
            <Button onClick={handleSaveAssignment}>Save Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
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
            <Button onClick={handleSaveQuiz}>Create Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
