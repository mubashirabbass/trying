import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  useListSubmissions, 
  useGradeAssignment, 
  getListSubmissionsQueryKey,
  useListCourses 
} from "@workspace/api-client-react";
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Eye, 
  ExternalLink, 
  Search, 
  Filter,
  GraduationCap,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function TeacherGrading() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [courseFilter, setCourseFilter] = useState<string>("all");
  
  const { data: courses } = useListCourses();
  const { data: submissions, isLoading } = useListSubmissions({ 
    courseId: courseFilter === "all" ? undefined : Number(courseFilter) 
  });
  
  const gradeMutation = useGradeAssignment();

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [gradeData, setGradeData] = useState({ marks: 0, feedback: "" });
  const [isGradeOpen, setIsGradeOpen] = useState(false);

  const handleGrade = async () => {
    if (!selectedSubmission) return;
    try {
      await gradeMutation.mutateAsync({
        id: selectedSubmission.assignmentId,
        data: {
          submissionId: selectedSubmission.id,
          marks: Number(gradeData.marks),
          feedback: gradeData.feedback
        }
      });
      toast({ title: "Submission graded successfully" });
      queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey({ courseId: courseFilter === "all" ? undefined : Number(courseFilter) }) });
      setIsGradeOpen(false);
      setSelectedSubmission(null);
    } catch (error) {
      toast({ title: "Grading failed", variant: "destructive" });
    }
  };
  
  const handleExportCSV = () => {
    if (!submissions || submissions.length === 0) return;
    
    const headers = ["Student", "Assignment", "Submitted At", "Status", "Marks", "Feedback"];
    const rows = submissions.map(sub => [
      sub.userName,
      sub.assignmentTitle,
      new Date(sub.submittedAt).toLocaleString(),
      sub.status,
      sub.marks || "0",
      `"${sub.feedback || ""}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `submissions_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignment Grading</h1>
          <p className="text-muted-foreground mt-1">Review and grade student submissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Filter Course:</Label>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-64 bg-white border-slate-200">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses?.map(course => (
                <SelectItem key={course.id} value={course.id.toString()}>{course.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2 font-bold" onClick={handleExportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Student</TableHead>
                <TableHead className="font-bold text-slate-700">Assignment</TableHead>
                <TableHead className="font-bold text-slate-700">Submitted At</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Marks</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions?.map((sub) => (
                <TableRow key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                  <TableCell className="py-4">
                    <span className="font-semibold text-slate-900">{sub.userName}</span>
                  </TableCell>
                  <TableCell className="py-4 text-slate-600 font-medium">{sub.assignmentTitle}</TableCell>
                  <TableCell className="py-4 text-sm text-slate-500">
                    <div className="flex flex-col">
                      <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                      {sub.dueDate && new Date(sub.submittedAt) > new Date(sub.dueDate) && (
                        <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5 mt-0.5">
                          <Clock className="h-2.5 w-2.5" /> LATE
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant={sub.status === 'graded' ? 'secondary' : 'default'} className={sub.status === 'graded' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}>
                      {sub.status === 'graded' ? 'Graded' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    {sub.status === 'graded' ? (
                      <span className="font-bold text-emerald-600">{sub.marks}</span>
                    ) : (
                      <span className="text-slate-300 font-medium">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedSubmission(sub);
                      setGradeData({ marks: sub.marks || 0, feedback: sub.feedback || "" });
                      setIsGradeOpen(true);
                    }} className="font-bold text-xs uppercase tracking-tight">
                      {sub.status === 'graded' ? 'Edit Grade' : 'Grade Now'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {submissions?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <GraduationCap className="h-12 w-12" />
                      <p className="text-lg font-bold">No submissions found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Grade Submission</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Info</span>
                  <Badge variant="outline" className="bg-white">{selectedSubmission?.userName}</Badge>
                </div>
                <h3 className="font-bold text-slate-800">{selectedSubmission?.assignmentTitle}</h3>
                <div className="h-px bg-slate-200" />
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Notes</span>
                  <p className="text-sm text-slate-600 italic">"{selectedSubmission?.notes || 'No notes provided'}"</p>
                </div>
              </div>

              <div className="p-5 border-2 border-primary/10 rounded-xl bg-primary/[0.02] space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Eye className="h-4 w-4" /> Submission Link
                </div>
                <a 
                  href={selectedSubmission?.fileUrl} 
                  target="_blank" 
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg group hover:border-primary transition-colors"
                >
                  <span className="text-sm text-slate-600 font-medium truncate max-w-[200px]">{selectedSubmission?.fileUrl}</span>
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Assign Marks</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input 
                    type="number" 
                    className="pl-10 h-11 border-slate-200"
                    placeholder="Score (e.g. 85)"
                    value={gradeData.marks}
                    onChange={(e) => setGradeData({ ...gradeData, marks: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Teacher Feedback</Label>
                <Textarea 
                  className="min-h-[140px] border-slate-200"
                  placeholder="Well done! Keep working on..."
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 flex gap-3">
            <Button variant="ghost" onClick={() => setIsGradeOpen(false)} className="flex-1 font-bold text-slate-600">
              Cancel
            </Button>
            <Button onClick={handleGrade} disabled={gradeMutation.isPending} className="flex-1 font-bold h-11 shadow-lg shadow-primary/20">
              {gradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
