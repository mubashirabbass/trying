import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { 
  useListAssignments, 
  getListAssignmentsQueryKey, 
  useSubmitAssignment,
  useListMySubmissions,
  getListMySubmissionsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, FileText, Upload, CheckCircle2, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

const MAX_ASSIGNMENT_PDF_BYTES = 5 * 1024 * 1024;
const MAX_ASSIGNMENT_PDF_MB = Math.floor(MAX_ASSIGNMENT_PDF_BYTES / 1024 / 1024);

export default function StudentAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: assignments, isLoading: assignmentsLoading } = useListAssignments();
  const { data: submissions, isLoading: submissionsLoading } = useListMySubmissions();

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const submitMutation = useSubmitAssignment();
  const [isUploadingSubmissionPdf, setIsUploadingSubmissionPdf] = useState(false);
  const handleStudentSubmissionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setIsUploadingSubmissionPdf(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/upload-pdf", {
        method: "POST", body: uploadData,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      setFileUrl(data.url);
      toast({ title: "Submission PDF uploaded successfully!" });
    } catch (err: any) {
      toast({ title: err.message || "Failed to upload", variant: "destructive" });
    } finally { setIsUploadingSubmissionPdf(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId) return;
    if (!fileUrl) {
      toast({ title: "Upload your solved assignment PDF before submitting", variant: "destructive" });
      return;
    }

    try {
      await submitMutation.mutateAsync({
        id: selectedAssignmentId,
        data: { fileUrl, notes }
      });
      toast({ title: "Assignment submitted successfully" });
      setIsDialogOpen(false);
      setFileUrl("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: getListMySubmissionsQueryKey() });
    } catch (error: any) {
      toast({ title: error?.message || "Failed to submit assignment", variant: "destructive" });
    }
  };

  const getSubmission = (assignmentId: number) => {
    return submissions?.find(s => s.assignmentId === assignmentId);
  };

  if (assignmentsLoading || submissionsLoading) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-1 font-medium">Manage your evaluations and submissions</p>
      </div>

      <div className="space-y-4">
        {assignments?.map((assignment) => {
          const submission = getSubmission(assignment.id);
          const isSubmitted = !!submission;
          const isClosed = !!(assignment.dueDate && new Date() > new Date(assignment.dueDate));
          const isLate = !!(assignment.dueDate && submission?.submittedAt && new Date(submission.submittedAt) > new Date(assignment.dueDate));
          
          return (
            <Card key={assignment.id} className={`overflow-hidden border-2 transition-all ${isSubmitted ? 'border-slate-100 bg-slate-50/50' : 'border-primary/10 hover:border-primary/30'}`}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">{assignment.title}</CardTitle>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No limit'}
                      </span>
                      <span className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="font-bold">{assignment.totalMarks} Marks</Badge>
                      {isClosed && !isSubmitted && (
                        <Badge variant="destructive" className="font-bold">Closed</Badge>
                      )}
                      </span>
                    </div>
                  </div>
                  {isSubmitted && (
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={submission.status === 'graded' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600'}>
                        {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                      </Badge>
                      {isLate && (
                        <Badge variant="destructive" className="text-[10px] py-0 h-4 font-black uppercase tracking-tighter">Late</Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pb-6">
                 <div className="flex items-center gap-4 mb-6">
                   <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 flex-1">
                     {assignment.description}
                   </p>
                   {(assignment as any).fileUrl && (
                     <a
                       href={(assignment as any).fileUrl}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center text-xs text-primary hover:underline gap-1 bg-primary/5 px-3 py-2 rounded-lg border border-primary/20 shrink-0 font-semibold"
                     >
                       <FileText className="h-4 w-4" /> Download Sheet
                     </a>
                   )}
                 </div>
                
                {isSubmitted ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        Your Submission
                      </div>
                      <a href={submission.fileUrl} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1 font-bold">
                        View File <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    
                    {submission.status === 'graded' ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Score</span>
                          <span className="text-lg font-black text-emerald-900">{submission.marks} / {assignment.totalMarks}</span>
                        </div>
                        {submission.feedback && (
                          <div className="text-sm text-emerald-800 bg-white/50 p-2 rounded border border-emerald-100/50 italic">
                            "{submission.feedback}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex flex-col gap-2">
                        <div className="flex items-center gap-3 text-blue-700">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span className="text-xs font-semibold">Waiting for instructor review</span>
                        </div>
                        {isLate && submission.submittedAt && (
                          <div className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" /> Submitted late on {new Date(submission.submittedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-primary/5 rounded-xl border border-dashed border-primary/20 p-6 flex flex-col items-center text-center">
                    <AlertCircle className="h-8 w-8 text-primary/40 mb-3" />
                    <p className="text-sm font-medium text-slate-600 mb-4">
                      {isClosed ? "Deadline passed. Ask your teacher to extend it before submitting." : "No submission yet. Evaluation is pending."}
                    </p>
                    <Dialog open={isDialogOpen && selectedAssignmentId === assignment.id} onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (open) setSelectedAssignmentId(assignment.id);
                      else {
                        setSelectedAssignmentId(null);
                        setFileUrl("");
                        setNotes("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button className="w-full shadow-lg shadow-primary/20" disabled={isClosed}>
                          <Upload className="h-4 w-4 mr-2" />
                          {isClosed ? "Submission Closed" : "Start Submission"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold">Submit Assignment</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 py-4">
                          <div className="space-y-3">
                            <Label className="text-sm font-bold text-slate-700">Upload PDF Submission *</Label>
                            <div className="flex gap-2">
                              <Input 
                                required 
                                value={fileUrl} 
                                readOnly
                                placeholder="Upload your solved PDF from your computer"
                                className="h-11 border-slate-200 flex-1 bg-slate-50"
                              />
                              <div className="relative flex-shrink-0">
                                <Input
                                  type="file"
                                  accept=".pdf"
                                  onChange={handleStudentSubmissionUpload}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  disabled={isUploadingSubmissionPdf}
                                />
                                <Button type="button" variant="outline" className="h-11 text-xs" disabled={isUploadingSubmissionPdf}>
                                  {isUploadingSubmissionPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                  Upload PDF
                                </Button>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">PDF only, max {MAX_ASSIGNMENT_PDF_MB}MB. Compress larger files before uploading.</p>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-sm font-bold text-slate-700">Submission Notes</Label>
                            <Textarea 
                              value={notes} 
                              onChange={(e) => setNotes(e.target.value)} 
                              placeholder="Explain your approach or provide login details if needed..."
                              className="min-h-[120px] border-slate-200"
                            />
                          </div>
                          <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={submitMutation.isPending || isUploadingSubmissionPdf || !fileUrl}>
                            {submitMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Complete Submission"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {assignments?.length === 0 && (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="bg-white h-16 w-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-300">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">No active assignments</h3>
            <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">There are no pending assignments in your enrolled courses right now. Good job staying on top of things!</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
