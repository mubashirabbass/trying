import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  useListSubmissions, useGradeAssignment, getListSubmissionsQueryKey,
  useListCourses, useListAssignments
} from "@workspace/api-client-react";
import {
  Loader2, CheckCircle2, Clock, Eye, ExternalLink, Search,
  GraduationCap, Download, FileText, Star, AlertCircle, Filter, BookOpen, ClipboardList
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";

export default function TeacherGrading() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCourse, setSelectedCourse] = useState<string>("none");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: allCourses = [] } = useListCourses();
  const courses = allCourses.filter((c: any) => c.teacherId === user?.id || c.teacherName === user?.name);

  const courseId = selectedCourse !== "none" ? Number(selectedCourse) : undefined;

  const { data: submissions = [], isLoading: submissionsLoading } = useListSubmissions({
    courseId: courseId
  });

  const { data: assignments = [] } = useListAssignments({
    courseId: courseId
  });

  const gradeMutation = useGradeAssignment();
  
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [gradeData, setGradeData] = useState({ marks: 0, feedback: "" });
  const [isGradeOpen, setIsGradeOpen] = useState(false);

  // Filter to teacher's courses only
  const teacherCourseIds = courses.map((c: any) => c.id);
  const teacherAssignmentIds = (assignments as any[])
    .filter((a: any) => teacherCourseIds.includes(a.courseId))
    .map((a: any) => a.id);

  const filteredSubmissions = (submissions as any[])
    .filter((s: any) => !courseId || teacherAssignmentIds.includes(s.assignmentId))
    .filter((s: any) => statusFilter === "all" || s.status === statusFilter)
    .filter((s: any) => !search || s.userName?.toLowerCase().includes(search.toLowerCase()) || s.assignmentTitle?.toLowerCase().includes(search.toLowerCase()));

  const pendingCount = filteredSubmissions.filter((s: any) => s.status === "submitted").length;
  const gradedCount = filteredSubmissions.filter((s: any) => s.status === "graded").length;

  const isLoading = submissionsLoading;

  const handleGrade = async () => {
    if (!selectedSub) return;
    try {
      await gradeMutation.mutateAsync({
        id: selectedSub.assignmentId,
        data: { submissionId: selectedSub.id, marks: Number(gradeData.marks), feedback: gradeData.feedback }
      });
      toast({ title: "✅ Assignment graded successfully!" });
      queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey({ courseId }) });
      setIsGradeOpen(false);
      setSelectedSub(null);
    } catch { toast({ title: "Grading failed", variant: "destructive" }); }
  };

  const handleExportCSV = () => {
    if (!filteredSubmissions.length) return;
    
    const headers = ["Student", "Assignment", "Submitted At", "Status", "Marks", "Feedback"];
    const rows = filteredSubmissions.map((s: any) => [
      s.userName, 
      s.assignmentTitle,
      new Date(s.submittedAt).toLocaleString(), 
      s.status, 
      s.marks || "0", 
      `"${s.feedback || ""}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `grading_assignments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (selectedCourse === "none") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="max-w-md text-center space-y-6">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Select a Course to Start Grading</h2>
              <p className="text-slate-500 text-sm">Choose one of your courses below to view and grade student submissions</p>
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 text-base">
                <BookOpen className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Select a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.length === 0 ? (
                  <SelectItem value="none" disabled>No courses assigned</SelectItem>
                ) : (
                  courses.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedCourseData = courses.find((c: any) => c.id === Number(selectedCourse));

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Grading Hub
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Review and grade student work for <span className="font-bold text-primary">{selectedCourseData?.title}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-52 bg-white border-slate-200 text-sm rounded-xl">
              <BookOpen className="h-3.5 w-3.5 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 font-bold text-xs rounded-xl" onClick={handleExportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border border-slate-100 shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-black text-slate-900">{filteredSubmissions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-amber-100 shadow-sm rounded-xl bg-amber-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-emerald-100 shadow-sm rounded-xl bg-emerald-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Graded</p>
              <p className="text-2xl font-black text-emerald-700">{gradedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input placeholder="Search student or assignment..." className="pl-9 rounded-xl border-slate-200 text-xs h-9"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 rounded-xl border-slate-200 text-xs h-9">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Status</SelectItem>
            <SelectItem value="submitted" className="text-xs">Pending Review</SelectItem>
            <SelectItem value="graded" className="text-xs">Graded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignment Submissions - Row-wise Cards */}
      <div className="space-y-4">
        {filteredSubmissions.map((sub: any) => {
          const isLate = sub.dueDate && new Date(sub.submittedAt) > new Date(sub.dueDate);
          const isGraded = sub.status === "graded";
          
          return (
            <Card key={sub.id} className="border border-slate-200 hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-5">
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary text-lg shrink-0 border-2 border-primary/20">
                      {sub.userName?.charAt(0) || "S"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{sub.userName}</p>
                      <p className="text-xs text-slate-500">Student</p>
                    </div>
                  </div>

                  {/* Assignment Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-base truncate">{sub.assignmentTitle}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Submitted: {new Date(sub.submittedAt).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {isLate && (
                            <Badge variant="destructive" className="text-[10px] py-0 h-5 font-bold">
                              <Clock className="h-2.5 w-2.5 mr-1" /> LATE SUBMISSION
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <Badge className={isGraded
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-3 py-1"
                        : "bg-amber-50 text-amber-700 border-amber-200 text-xs font-bold px-3 py-1"}>
                        {isGraded ? "✓ Graded" : "⏳ Pending Review"}
                      </Badge>
                    </div>

                    {/* Submission File & Notes */}
                    <div className="flex items-center gap-3 mt-3">
                      {sub.fileUrl ? (
                        <a 
                          href={sub.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View Submission File
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No file submitted</span>
                      )}
                      
                      {sub.notes && (
                        <span className="text-xs text-slate-500 italic truncate max-w-[300px]">
                          Note: "{sub.notes}"
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score & Action */}
                  <div className="flex items-center gap-4 md:ml-auto">
                    {/* Score Display */}
                    <div className="text-center min-w-[80px]">
                      {isGraded ? (
                        <>
                          <div className="text-2xl font-black text-emerald-600">{sub.marks}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marks</div>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-black text-slate-300">—</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Not Graded</div>
                        </>
                      )}
                    </div>

                    {/* Grade Button */}
                    <Button 
                      variant={isGraded ? "outline" : "default"}
                      size="lg"
                      className="rounded-xl font-bold shadow-sm hover:shadow-md transition-all"
                      onClick={() => {
                        setSelectedSub(sub);
                        setGradeData({ marks: sub.marks || 0, feedback: sub.feedback || "" });
                        setIsGradeOpen(true);
                      }}
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      {isGraded ? "Edit Grade" : "Grade Now"}
                    </Button>
                  </div>
                </div>

                {/* Feedback Preview (if graded) */}
                {isGraded && sub.feedback && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Your Feedback</p>
                      <p className="text-xs text-emerald-800 italic line-clamp-2">"{sub.feedback}"</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Empty State */}
        {filteredSubmissions.length === 0 && (
          <Card className="border-2 border-dashed border-slate-200 rounded-2xl">
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center gap-4 opacity-40">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <ClipboardList className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No Assignment Submissions</h3>
                  <p className="text-sm text-slate-500 max-w-md">
                    Submissions will appear here once students submit their assignments for this course.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Grade Dialog */}
      <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" /> Grade Assignment
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left: Submission Info */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</span>
                  <Badge variant="outline" className="bg-white font-bold text-xs">{selectedSub?.userName}</Badge>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{selectedSub?.assignmentTitle}</h3>
                {selectedSub?.notes && (
                  <>
                    <div className="h-px bg-slate-200" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Notes</span>
                      <p className="text-sm text-slate-600 italic mt-1">"{selectedSub.notes}"</p>
                    </div>
                  </>
                )}
              </div>

              {/* Submission file */}
              {selectedSub?.fileUrl ? (
                <div className="p-4 border-2 border-primary/10 rounded-xl bg-primary/[0.02] space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Eye className="h-4 w-4" /> Submitted File
                  </div>
                  <a href={selectedSub.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg group hover:border-primary transition-colors">
                    <span className="text-xs text-slate-600 font-medium truncate max-w-[180px]">{selectedSub.fileUrl}</span>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-primary shrink-0 ml-2" />
                  </a>
                  {/* PDF preview if it's a PDF */}
                  {selectedSub.fileUrl?.toLowerCase().includes(".pdf") && (
                    <iframe src={selectedSub.fileUrl} className="w-full h-48 rounded-lg border border-slate-200" title="Submission Preview" />
                  )}
                </div>
              ) : (
                <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                  <AlertCircle className="h-6 w-6 mx-auto mb-1 opacity-40" />
                  <p className="text-xs font-medium">No file submitted</p>
                </div>
              )}
            </div>

            {/* Right: Grading Form */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Marks Awarded</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input type="number" min="0" className="pl-10 h-11 border-slate-200 rounded-xl"
                    placeholder="e.g. 85"
                    value={gradeData.marks}
                    onChange={e => setGradeData(prev => ({ ...prev, marks: Number(e.target.value) }))} />
                </div>
                <p className="text-[10px] text-slate-400">Enter marks out of the total assigned for this assignment.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Feedback for Student</Label>
                <Textarea className="min-h-[140px] border-slate-200 rounded-xl"
                  placeholder="Great work! Consider improving... / Well done on..."
                  value={gradeData.feedback}
                  onChange={e => setGradeData(prev => ({ ...prev, feedback: e.target.value }))} />
              </div>

              {selectedSub?.status === "graded" && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-semibold">
                  Previously graded: {selectedSub.marks} marks
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl flex gap-3">
            <Button variant="ghost" onClick={() => setIsGradeOpen(false)} className="flex-1 font-bold text-slate-600 rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleGrade} disabled={gradeMutation.isPending} className="flex-1 font-bold h-11 rounded-xl shadow-lg shadow-primary/20">
              {gradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {selectedSub?.status === "graded" ? "Update Grade" : "Submit Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
