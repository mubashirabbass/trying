import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { 
  useListAssignments, 
  getListAssignmentsQueryKey, 
  useSubmitAssignment,
  useListMySubmissions,
  getListMySubmissionsQueryKey,
  useListEnrollments
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Loader2, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Calendar,
  Award,
  BookOpen,
  Download,
  Eye,
  Send,
  FileCheck,
  AlertTriangle,
  Target,
  Zap,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Timer,
  Paperclip,
  MessageSquare,
  GraduationCap,
  Search,
  FileDown,
  ArrowUpDown,
  Filter,
  TableProperties,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const MAX_ASSIGNMENT_PDF_BYTES = 5 * 1024 * 1024;
const MAX_ASSIGNMENT_PDF_MB = Math.floor(MAX_ASSIGNMENT_PDF_BYTES / 1024 / 1024);

export default function StudentAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: assignments, isLoading: assignmentsLoading } = useListAssignments();
  const { data: submissions, isLoading: submissionsLoading } = useListMySubmissions();
  const { data: enrollments = [] } = useListEnrollments(
    { userId: user?.id },
    { query: { enabled: !!user?.id } }
  );
  // Only show courses the student is actively enrolled in
  const enrolledCourses = (enrollments as any[]).filter(
    (e) => e.status === "active" || e.status === "completed"
  );
  // Set of courseIds the student is enrolled in — used for total abstraction
  const enrolledCourseIds = new Set(enrolledCourses.map((e: any) => e.courseId));

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Excel View Filters & Interactive States
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"excel" | "card">("excel");
  const [sortField, setSortField] = useState<string>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const submitMutation = useSubmitAssignment();
  const [isUploadingSubmissionPdf, setIsUploadingSubmissionPdf] = useState(false);

  const handleStudentSubmissionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ 
        title: "Invalid File Type", 
        description: "Only PDF files are allowed for assignment submissions",
        variant: "destructive" 
      }); 
      return;
    }
    
    if (file.size > MAX_ASSIGNMENT_PDF_BYTES) {
      toast({ 
        title: "File Too Large", 
        description: `PDF must be ${MAX_ASSIGNMENT_PDF_MB}MB or smaller. Please compress it first.`,
        variant: "destructive" 
      }); 
      return;
    }

    const uploadData = new FormData();
    uploadData.append("pdf", file);
    setIsUploadingSubmissionPdf(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const response = await fetch("/api/upload-pdf", {
        method: "POST", 
        body: uploadData,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      
      setFileUrl(data.url);
      toast({ 
        title: "Upload Successful!", 
        description: "Your assignment file has been uploaded successfully"
      });
    } catch (err: any) {
      toast({ 
        title: "Upload Failed", 
        description: err.message || "Failed to upload your assignment file",
        variant: "destructive" 
      });
    } finally { 
      setIsUploadingSubmissionPdf(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId) return;
    if (!fileUrl) {
      toast({ 
        title: "Missing File", 
        description: "Please upload your solved assignment PDF before submitting",
        variant: "destructive" 
      });
      return;
    }

    try {
      await submitMutation.mutateAsync({
        id: selectedAssignmentId,
        data: { fileUrl, notes }
      });
      toast({ 
        title: "Assignment Submitted!", 
        description: "Your assignment has been successfully submitted for review"
      });
      setIsDialogOpen(false);
      setFileUrl("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: getListMySubmissionsQueryKey() });
    } catch (error: any) {
      toast({ 
        title: "Submission Failed", 
        description: error?.message || "Failed to submit assignment. Please try again.",
        variant: "destructive" 
      });
    }
  };

  const getSubmission = (assignmentId: number) => {
    return submissions?.find(s => s.assignmentId === assignmentId);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getAssignmentStatus = (assignment: any, submission: any) => {
    if (submission) {
      if (submission.status === 'graded') return "graded";
      return "submitted";
    }
    if (assignment.dueDate) {
      const daysLeft = getDaysUntilDue(assignment.dueDate);
      if (daysLeft < 0) return "overdue";
      if (daysLeft <= 2) return "due_soon";
    }
    return "pending";
  };

  const getStatusInfo = (assignment: any, submission: any) => {
    const status = getAssignmentStatus(assignment, submission);
    switch (status) {
      case "overdue":
        return { 
          color: "bg-rose-500", 
          textColor: "text-rose-700", 
          bgColor: "bg-rose-50", 
          borderColor: "border-rose-200",
          badgeColor: "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-200",
          label: "Overdue",
          icon: XCircle
        };
      case "due_soon":
        return { 
          color: "bg-amber-500", 
          textColor: "text-amber-700", 
          bgColor: "bg-amber-50", 
          borderColor: "border-amber-200",
          badgeColor: "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200",
          label: "Due Soon",
          icon: Timer
        };
      case "pending":
        return { 
          color: "bg-blue-500", 
          textColor: "text-blue-700", 
          bgColor: "bg-blue-50", 
          borderColor: "border-blue-200",
          badgeColor: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200",
          label: "Pending",
          icon: Clock
        };
      case "submitted":
        return { 
          color: "bg-indigo-500", 
          textColor: "text-indigo-700", 
          bgColor: "bg-indigo-50", 
          borderColor: "border-indigo-200",
          badgeColor: "bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 border-indigo-200",
          label: "Under Review",
          icon: Eye
        };
      case "graded":
        return { 
          color: "bg-emerald-500", 
          textColor: "text-emerald-700", 
          bgColor: "bg-emerald-50", 
          borderColor: "border-emerald-200",
          badgeColor: "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200",
          label: "Graded",
          icon: CheckCircle
        };
      default:
        return { 
          color: "bg-slate-500", 
          textColor: "text-slate-700", 
          bgColor: "bg-slate-50", 
          borderColor: "border-slate-200",
          badgeColor: "bg-slate-500/10 text-slate-700 hover:bg-slate-500/20 border-slate-200",
          label: "Unknown",
          icon: AlertCircle
        };
    }
  };

  const getCourseName = (courseId: number) => {
    const enrolled = enrolledCourses.find(e => e.courseId === courseId);
    return enrolled?.courseName || `Course #${courseId}`;
  };

  // Sort Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Export to CSV Functionality
  const exportToCSV = () => {
    if (!assignments || assignments.length === 0) {
      toast({
        title: "No Data Available",
        description: "There are no assignments available to export.",
        variant: "destructive"
      });
      return;
    }

    const headers = ["ID", "Assignment Title", "Course", "Deadline Date", "Status", "Obtained Marks", "Total Marks", "Submitted At"];
    
    const rows = filteredAndSortedAssignments.map((a, index) => {
      const sub = getSubmission(a.id);
      const status = getAssignmentStatus(a, sub);
      const statusLabel = 
        status === "graded" ? "Graded" : 
        status === "submitted" ? "Under Review" :
        status === "overdue" ? "Overdue" :
        status === "due_soon" ? "Due Soon" : "Pending";
      
      const courseName = getCourseName(a.courseId);
      const dueDateStr = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "No Deadline";
      const obtained = sub?.marks !== undefined && sub?.marks !== null ? sub.marks : "—";
      const submittedDateStr = sub?.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "—";
      
      return [
        index + 1,
        `"${a.title.replace(/"/g, '""')}"`,
        `"${courseName.replace(/"/g, '""')}"`,
        `"${dueDateStr}"`,
        `"${statusLabel}"`,
        `"${obtained}"`,
        `"${a.totalMarks}"`,
        `"${submittedDateStr}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GC_LMS_Assignments_${user?.name.replace(/\s+/g, '_') || 'Report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Completed",
      description: `Successfully exported ${filteredAndSortedAssignments.length} assignment rows to CSV.`
    });
  };

  // Filter & Search Logic — ONLY assignments from courses the student is enrolled in
  const filteredAndSortedAssignments = (assignments || [])
    .filter(assignment => {
      // Total abstraction: hide assignments from non-enrolled courses
      if (!enrolledCourseIds.has(assignment.courseId)) return false;

      const submission = getSubmission(assignment.id);
      const status = getAssignmentStatus(assignment, submission);
      const courseName = getCourseName(assignment.courseId);
      
      const matchesSearch = 
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assignment.description && assignment.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        courseName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCourse = courseFilter === "all" || assignment.courseId === Number(courseFilter);
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesCourse && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: any = a[sortField as keyof typeof a];
      let bVal: any = b[sortField as keyof typeof b];

      if (sortField === "course") {
        aVal = getCourseName(a.courseId);
        bVal = getCourseName(b.courseId);
      } else if (sortField === "status") {
        const subA = getSubmission(a.id);
        const subB = getSubmission(b.id);
        aVal = getAssignmentStatus(a, subA);
        bVal = getAssignmentStatus(b, subB);
      } else if (sortField === "obtainedMarks") {
        const subA = getSubmission(a.id);
        const subB = getSubmission(b.id);
        aVal = subA?.marks ?? -1;
        bVal = subB?.marks ?? -1;
      }

      if (aVal === null || aVal === undefined) return sortDirection === "asc" ? 1 : -1;
      if (bVal === null || bVal === undefined) return sortDirection === "asc" ? -1 : 1;

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Calculate Statistics based only on enrolled-course assignments
  const enrolledAssignments = (assignments || []).filter(a => enrolledCourseIds.has(a.courseId));
  const totalCount = enrolledAssignments.length;
  const submissionsCount = submissions?.length || 0;
  const gradedCount = submissions?.filter(s => {
    const a = enrolledAssignments.find(a => a.id === s.assignmentId);
    return s.status === 'graded' && !!a;
  }).length || 0;
  const completionRate = totalCount > 0 ? Math.round((gradedCount / totalCount) * 100) : 0;
  
  const pendingCount = enrolledAssignments.filter(a => {
    const sub = getSubmission(a.id);
    const status = getAssignmentStatus(a, sub);
    return status === "pending" || status === "due_soon";
  }).length;

  const overdueCount = enrolledAssignments.filter(a => {
    const sub = getSubmission(a.id);
    return getAssignmentStatus(a, sub) === "overdue";
  }).length;

  const averageScore = gradedCount > 0 
    ? Math.round(
        (submissions?.filter(s => s.status === 'graded').reduce((sum, s) => {
          const matchingAss = assignments?.find(a => a.id === s.assignmentId);
          const total = matchingAss?.totalMarks || 100;
          return sum + ((s.marks || 0) / total) * 100;
        }, 0) || 0) / gradedCount
      )
    : 0;


  const renderColumnHeader = (field: string, label: string, alignment: "left" | "center" | "right" = "left") => {
    const isSorted = sortField === field;
    return (
      <th 
        onClick={() => handleSort(field)} 
        className={`px-3 py-3.5 text-[10px] font-black text-slate-555 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800 transition-colors ${
          alignment === "center" ? "text-center" : alignment === "right" ? "text-right" : "text-left"
        }`}
      >
        <div className={`flex items-center gap-1 ${alignment === "center" ? "justify-center" : alignment === "right" ? "justify-end" : "justify-start"}`}>
          {label}
          {isSorted ? (
            sortDirection === "asc" ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
          ) : (
            <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-40 hover:opacity-100" />
          )}
        </div>
      </th>
    );
  };

  const renderCardView = (assignment: any) => {
    const submission = getSubmission(assignment.id);
    const statusInfo = getStatusInfo(assignment, submission);
    const StatusIcon = statusInfo.icon;
    const daysLeft = assignment.dueDate ? getDaysUntilDue(assignment.dueDate) : null;
    const isLate = !!(assignment.dueDate && submission?.submittedAt && new Date(submission.submittedAt) > new Date(assignment.dueDate));

    return (
      <Card 
        key={assignment.id} 
        className={`overflow-hidden border-2 transition-all hover:shadow-lg hover:scale-[1.01] cursor-pointer ${statusInfo.borderColor}`}
        onClick={() => {
          setSelectedAssignmentId(assignment.id);
          setIsDialogOpen(true);
        }}
      >
        <div className={`h-2.5 ${statusInfo.color}`}></div>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-10 w-10 rounded-xl ${statusInfo.bgColor} flex items-center justify-center`}>
                  <StatusIcon className={`h-5 w-5 ${statusInfo.textColor}`} />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 leading-tight">{assignment.title}</CardTitle>
                  <Badge variant="outline" className={`${statusInfo.badgeColor} mt-1 font-bold`}>{statusInfo.label}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-650">
                <span className="flex items-center gap-1.5 font-bold">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                  {getCourseName(assignment.courseId)}
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-primary">
                  <Award className="h-3.5 w-3.5 text-primary/70" />
                  {assignment.totalMarks} Marks
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-6">
          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100/80 mb-4">
            <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">{assignment.description || 'No description provided'}</p>
          </div>
          
          {submission ? (
            <div className="bg-white rounded-xl border border-slate-150 p-3 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="font-bold text-slate-800">Submitted Solution</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {submission.status === 'graded' ? (
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-600">{submission.marks}</span>
                  <span className="text-[10px] text-slate-400">/{assignment.totalMarks}</span>
                </div>
              ) : (
                <Badge variant="secondary" className="font-bold text-[10px] bg-slate-100 text-slate-650">Awaiting Grade</Badge>
              )}
            </div>
          ) : (
            <Button 
              className="w-full font-bold h-10 text-xs shadow-sm hover:shadow transition-all" 
              disabled={daysLeft !== null && daysLeft < 0}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              {daysLeft !== null && daysLeft < 0 ? "Deadline Closed" : "Submit Solution"}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const selectedAssignment = assignments?.find(a => a.id === selectedAssignmentId);
  const selectedSubmission = selectedAssignment ? getSubmission(selectedAssignment.id) : null;
  const selectedStatusInfo = selectedAssignment ? getStatusInfo(selectedAssignment, selectedSubmission) : null;
  const isOverdue = selectedAssignment?.dueDate ? new Date() > new Date(selectedAssignment.dueDate) : false;

  return (
    <DashboardLayout>
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white shadow-md">
                <TableProperties className="h-6 w-6" />
              </div>
              Assignments Hub
            </h1>
            <p className="text-slate-500 mt-2 font-semibold text-lg">
              Manage coursework, view instructor feedback, and submit solutions in a professional ledger environment
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button 
              onClick={exportToCSV}
              variant="outline"
              className="h-11 px-5 border-2 border-emerald-500/30 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-500 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <FileDown className="h-4 w-4 text-emerald-600" />
              Export to Excel/CSV
            </Button>
          </div>
        </div>

        {/* Stats Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Grading Progress</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{completionRate}%</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold">{gradedCount} of {totalCount} graded</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
                <Target className="h-6 w-6" />
              </div>
            </CardContent>
            <div className="px-5 pb-4">
              <Progress value={completionRate} className="h-1.5 bg-slate-100" />
            </div>
          </Card>

          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Average Grade</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{averageScore}%</h3>
                <p className="text-[10px] text-emerald-600 mt-0.5 font-bold flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" /> Premium Score
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Solutions</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{pendingCount}</h3>
                <p className="text-[10px] text-amber-600 mt-0.5 font-bold flex items-center gap-0.5">
                  <Timer className="h-3 w-3 text-amber-500" /> Incomplete work
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Overdue Items</p>
                <h3 className={`text-3xl font-black mt-1 ${overdueCount > 0 ? "text-rose-600 animate-pulse" : "text-slate-800"}`}>
                  {overdueCount}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold">Requires attention</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${overdueCount > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"}`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Spreadsheet Control bar */}
      <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assignments or courses..."
              className="pl-10 h-10 border-slate-200 rounded-xl text-sm font-semibold focus-visible:ring-primary/20 bg-slate-50/50"
            />
          </div>

          {/* Filter Course — only enrolled courses */}
          <div className="w-full sm:w-48">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-250 bg-white text-xs font-black text-slate-650 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
            >
              <option value="all">📚 All Courses</option>
              {enrolledCourses.map((e: any) => (
                <option key={e.courseId} value={e.courseId}>
                  {e.courseName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-250 bg-white text-xs font-black text-slate-650 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
            >
              <option value="all">🏷 All Statuses</option>
              <option value="pending">⏳ Pending</option>
              <option value="due_soon">⚠️ Due Soon</option>
              <option value="submitted">👁 Under Review</option>
              <option value="graded">✅ Graded</option>
              <option value="overdue">❌ Overdue</option>
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-150 shrink-0">
          <Button
            size="sm"
            variant={viewMode === "excel" ? "secondary" : "ghost"}
            onClick={() => setViewMode("excel")}
            className="h-8 px-3.5 rounded-lg font-bold text-xs"
          >
            <TableProperties className="h-3.5 w-3.5 mr-1" />
            Excel Grid
          </Button>
          <Button
            size="sm"
            variant={viewMode === "card" ? "secondary" : "ghost"}
            onClick={() => setViewMode("card")}
            className="h-8 px-3.5 rounded-lg font-bold text-xs"
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1" />
            Card View
          </Button>
        </div>
      </div>

      {/* Main View Render */}
      {viewMode === "excel" ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200">
                  {renderColumnHeader("index", "#", "center")}
                  {renderColumnHeader("title", "Title")}
                  {renderColumnHeader("course", "Course")}
                  {renderColumnHeader("dueDate", "Deadline")}
                  {renderColumnHeader("status", "Status")}
                  {renderColumnHeader("obtainedMarks", "Score", "center")}
                  {renderColumnHeader("submittedAt", "Submitted", "center")}
                  <th className="px-3 py-3.5 text-center text-xs font-black text-slate-555 uppercase tracking-widest select-none">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAndSortedAssignments.map((assignment, index) => {
                  const submission = getSubmission(assignment.id);
                  const status = getAssignmentStatus(assignment, submission);
                  const statusInfo = getStatusInfo(assignment, submission);
                  const StatusIcon = statusInfo.icon;
                  const courseName = getCourseName(assignment.courseId);
                  
                  const isLate = !!(assignment.dueDate && submission?.submittedAt && new Date(submission.submittedAt) > new Date(assignment.dueDate));
                  const daysLeft = assignment.dueDate ? getDaysUntilDue(assignment.dueDate) : null;
                  
                  return (
                    <tr 
                      key={assignment.id} 
                      onClick={() => {
                        setSelectedAssignmentId(assignment.id);
                        setIsDialogOpen(true);
                      }}
                      className={`hover:bg-slate-50/50 transition-all cursor-pointer group ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/20"
                      }`}
                    >
                      {/* Row index */}
                      <td className="px-3 py-3.5 text-center text-slate-400 font-bold">
                        {index + 1}
                      </td>

                      {/* Title & description excerpt */}
                      <td className="px-3 py-3.5 max-w-[185px] truncate" title={assignment.title}>
                        <div className="font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug truncate">
                          {assignment.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 max-w-[180px]">
                          {assignment.description || "No task details provided."}
                        </div>
                      </td>

                      {/* Course */}
                      <td className="px-3 py-3.5 font-bold text-slate-650 max-w-[150px] truncate" title={courseName}>
                        {courseName}
                      </td>

                      {/* Due Date */}
                      <td className="px-3 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">
                            {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No Deadline"}
                          </span>
                          {assignment.dueDate && !submission && (
                            <span className={`text-[10px] font-bold ${
                              status === "overdue" ? "text-rose-500" : status === "due_soon" ? "text-amber-500" : "text-slate-400"
                            }`}>
                              {status === "overdue" 
                                ? "Overdue" 
                                : daysLeft !== null 
                                  ? `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`
                                  : ""
                              }
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="px-3 py-3.5">
                        <Badge 
                          variant="outline" 
                          className={`font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5 w-fit border shadow-none ${statusInfo.badgeColor}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                          {statusInfo.label}
                        </Badge>
                      </td>

                      {/* Score */}
                      <td className="px-3 py-3.5 text-center">
                        {submission && submission.status === "graded" ? (
                          <div className="flex flex-col items-center">
                            <span className="font-black text-emerald-600 text-sm">
                              {submission.marks} <span className="text-[10px] text-slate-400">/ {assignment.totalMarks}</span>
                            </span>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.25 rounded border border-emerald-100">
                              {Math.round(((submission.marks || 0) / assignment.totalMarks) * 100)}%
                            </span>
                          </div>
                        ) : submission ? (
                          <span className="text-xs text-slate-500 font-bold bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-full">Awaiting Grade</span>
                        ) : (
                          <span className="text-slate-450 font-bold text-xs">— / {assignment.totalMarks}</span>
                        )}
                      </td>

                      {/* Submitted On Date */}
                      <td className="px-3 py-3.5 text-center text-xs font-bold text-slate-650">
                        {submission ? (
                          <div className="flex flex-col items-center">
                            <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                            {isLate && (
                              <span className="text-[9px] text-rose-500 font-bold bg-rose-50 border border-rose-100 px-1 py-0.25 rounded mt-0.5">Late submission</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-350 font-medium">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          {assignment.fileUrl && (
                            <a
                              href={assignment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                              title="Download Assignment Sheet"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            className="font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
                            onClick={() => {
                              setSelectedAssignmentId(assignment.id);
                              setIsDialogOpen(true);
                            }}
                          >
                            {!submission ? (
                              <>
                                <Upload className="h-3.5 w-3.5 text-primary" />
                                Submit
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5 text-slate-500" />
                                Details
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAndSortedAssignments.length === 0 && (
            <div className="py-24 text-center bg-slate-50/50">
              <div className="h-20 w-20 rounded-[30px] bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Assignments Match Filters</h3>
              <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto px-6">
                Adjust your search queries or course filters to locate missing assignments.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedAssignments.map(renderCardView)}
          {filteredAndSortedAssignments.length === 0 && (
            <div className="col-span-full py-24 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="h-20 w-20 rounded-[30px] bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Assignments Found</h3>
              <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto px-6">
                Adjust your search queries or course filters to locate missing assignments.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State - No Assignments at All in Entire LMS */}
      {assignments?.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="bg-white h-20 w-20 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-300">
            <FileText className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">No Assignments Available</h3>
          <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">
            There are currently no assignments assigned to your profile. Check back later!
          </p>
        </div>
      )}

      {/* Interactive premium detail/submission sheet dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedAssignmentId(null);
            setFileUrl("");
            setNotes("");
            setUploadProgress(0);
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px] overflow-hidden rounded-2xl border-none p-0 bg-white shadow-2xl">
          {selectedAssignment && selectedStatusInfo && (
            <>
              {/* Premium Gradient Banner Header */}
              <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 px-6 py-7 text-white relative">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                      {getCourseName(selectedAssignment.courseId)}
                    </span>
                    <h2 className="text-2xl font-black mt-2 text-white leading-tight">{selectedAssignment.title}</h2>
                    
                    <div className="flex items-center gap-4 mt-4 text-xs font-bold text-slate-350">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        Deadline: {selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toLocaleString() : "No deadline"}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Award className="h-4 w-4 text-emerald-400" />
                        {selectedAssignment.totalMarks} Max Marks
                      </span>
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className={`font-black text-[10px] uppercase px-3 py-1 rounded-full border-none shadow-none text-white ${selectedStatusInfo.color}`}
                  >
                    {selectedStatusInfo.label}
                  </Badge>
                </div>
              </div>

              {/* Task Details & Submission Panel */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Task Instructions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Assignment Instructions</h4>
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedAssignment.description || "No specific instructions provided by instructor."}
                    </p>
                    {selectedAssignment.fileUrl && (
                      <a
                        href={selectedAssignment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 text-xs font-black text-primary hover:underline bg-white px-3.5 py-2 border border-slate-200 rounded-lg shadow-sm"
                      >
                        <Download className="h-4 w-4 text-primary" />
                        Download Assignment Sheet PDF
                      </a>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Submissions Section */}
                {selectedSubmission ? (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Submission</h4>
                    <div className="bg-white rounded-xl border-2 border-slate-200 p-5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-center shrink-0">
                            <FileCheck className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">Solved Solution PDF</p>
                            <p className="text-[10px] text-slate-500">
                              Submitted {new Date(selectedSubmission.submittedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {selectedSubmission.fileUrl && (
                          <a 
                            href={selectedSubmission.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/10 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View Solution File
                          </a>
                        )}
                      </div>

                      {selectedSubmission.notes && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-150 text-xs">
                          <span className="font-bold text-slate-500 block mb-1">Your Submission Notes:</span>
                          <p className="text-slate-700 leading-relaxed italic">"{selectedSubmission.notes}"</p>
                        </div>
                      )}

                      {/* Instructor Grading block */}
                      {selectedSubmission.status === 'graded' ? (
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-2 border-emerald-250 rounded-xl p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                              <Star className="h-4 w-4 text-emerald-600 fill-emerald-500" />
                              Official Grading Sheet
                            </span>
                            <div className="text-right">
                              <span className="text-3xl font-black text-emerald-950">{selectedSubmission.marks}</span>
                              <span className="text-sm font-bold text-emerald-800"> / {selectedAssignment.totalMarks}</span>
                            </div>
                          </div>

                          {selectedSubmission.feedback && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3.5 border border-emerald-200">
                              <p className="text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Instructor Feedback
                              </p>
                              <p className="text-xs text-emerald-950 leading-relaxed italic">
                                "{selectedSubmission.feedback}"
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-4 flex items-center gap-3.5 text-blue-800">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                            <Eye className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">Grading Under Review</p>
                            <p className="text-xs text-blue-600">Your instructor has received your PDF solution and will grade it soon.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Submission Form</h4>
                    
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                        Upload Solved PDF File *
                      </Label>
                      
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input 
                            required 
                            value={fileUrl} 
                            readOnly
                            placeholder="Select solved assignment PDF file to begin..."
                            className="h-11 border-2 border-slate-200 flex-1 bg-slate-50 font-semibold text-xs text-slate-650"
                          />
                          <div className="relative flex-shrink-0">
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={handleStudentSubmissionUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={isUploadingSubmissionPdf || isOverdue}
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="h-11 px-5 font-bold border-2 rounded-xl" 
                              disabled={isUploadingSubmissionPdf || isOverdue}
                            >
                              {isUploadingSubmissionPdf ? (
                                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-1.5" />
                                  Browse
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex items-center justify-between text-[10px] font-black text-slate-500">
                              <span>Uploading to secure portal...</span>
                              <span>{Math.round(uploadProgress)}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-1.5" />
                          </div>
                        )}

                        {uploadProgress === 100 && (
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            PDF file uploaded and verified successfully!
                          </div>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <Info className="h-3 w-3 text-slate-400" />
                        Only PDF submissions are allowed. Limit file sizes to {MAX_ASSIGNMENT_PDF_MB}MB.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                        Submission Comments (Optional)
                      </Label>
                      <Textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        placeholder="Add details for grading instructors (e.g. issues faced, code urls, references etc.)"
                        className="min-h-[100px] border-2 border-slate-200 rounded-xl resize-none text-xs"
                        disabled={isOverdue}
                      />
                    </div>

                    <DialogFooter className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full h-11 text-sm font-black shadow-md hover:shadow-lg transition-all rounded-xl" 
                        disabled={submitMutation.isPending || isUploadingSubmissionPdf || !fileUrl || isOverdue}
                      >
                        {submitMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            Sending Solution...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1.5" />
                            Submit Completed Coursework
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
