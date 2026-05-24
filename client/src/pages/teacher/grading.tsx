import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  useListSubmissions,
  useGradeAssignment,
  getListSubmissionsQueryKey,
  useListCourses,
  useListAssignments,
  getListCoursesQueryKey,
} from "@workspace/api-client-react";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  ExternalLink,
  Search,
  GraduationCap,
  Download,
  FileText,
  Star,
  AlertCircle,
  BookOpen,
  ClipboardList,
  Percent,
  ArrowUpDown,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { PaginationControls, getTotalPages, paginateItems } from "@/components/PaginationControls";

const PAGE_SIZE = 50;
const QUICK_FEEDBACK = [
  "Strong submission. Keep using specific examples to support your answers.",
  "Good effort. Review the marked areas and tighten the explanation next time.",
  "Meets the core requirements, but needs more detail and clearer structure.",
  "Please revisit the assignment brief and resubmit stronger supporting work in future tasks.",
];

type SortMode = "newest" | "oldest" | "score-desc" | "score-asc" | "student";

function getScorePercent(marks?: number | null, totalMarks?: number | null) {
  if (marks == null || !totalMarks) return null;
  return Math.round((Number(marks) / Number(totalMarks)) * 100);
}

function getLetterGrade(percent: number | null) {
  if (percent == null) return "-";
  if (percent >= 90) return "A+";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B";
  if (percent >= 60) return "C";
  if (percent >= 50) return "D";
  return "F";
}

function getPerformanceLabel(percent: number | null) {
  if (percent == null) return "Not graded";
  if (percent >= 80) return "Excellent";
  if (percent >= 60) return "On track";
  if (percent >= 50) return "Needs support";
  return "At risk";
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function TeacherGrading() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCourse, setSelectedCourse] = useState<string>("none");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: allCourses = [] } = useListCourses(
    { teacherId: user?.id ?? undefined, limit: 100 } as any,
    { query: { queryKey: getListCoursesQueryKey({ teacherId: user?.id ?? undefined } as any), enabled: !!user?.id } }
  );
  const courses = allCourses as any[];

  const courseId = selectedCourse !== "none" ? Number(selectedCourse) : undefined;

  const { data: submissions = [], isLoading: submissionsLoading } = useListSubmissions(
    { courseId },
    { query: { queryKey: getListSubmissionsQueryKey({ courseId }), enabled: !!courseId } }
  );

  const { data: assignments = [] } = useListAssignments(
    { courseId },
    { query: { enabled: !!courseId } as any }
  );

  const gradeMutation = useGradeAssignment();

  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [gradeData, setGradeData] = useState({ marks: 0, feedback: "" });
  const [isGradeOpen, setIsGradeOpen] = useState(false);

  const assignmentById = useMemo(() => {
    return new Map((assignments as any[]).map((assignment: any) => [assignment.id, assignment]));
  }, [assignments]);

  const teacherCourseIds = courses.map((c: any) => c.id);
  const teacherAssignmentIds = (assignments as any[])
    .filter((a: any) => teacherCourseIds.includes(a.courseId))
    .map((a: any) => a.id);

  const enrichedSubmissions = (submissions as any[]).map((submission: any) => {
    const assignment = assignmentById.get(submission.assignmentId);
    const totalMarks = assignment?.totalMarks ?? 100;
    const dueDate = submission.dueDate ?? assignment?.dueDate ?? null;
    const scorePercent = getScorePercent(submission.marks, totalMarks);
    const isLate = dueDate && submission.submittedAt && new Date(submission.submittedAt) > new Date(dueDate);

    return {
      ...submission,
      totalMarks,
      dueDate,
      scorePercent,
      letterGrade: getLetterGrade(scorePercent),
      performanceLabel: getPerformanceLabel(scorePercent),
      isLate,
    };
  });

  const filteredSubmissions = enrichedSubmissions
    .filter((s: any) => !courseId || teacherAssignmentIds.includes(s.assignmentId))
    .filter((s: any) => statusFilter === "all" || s.status === statusFilter)
    .filter((s: any) => assignmentFilter === "all" || s.assignmentId === Number(assignmentFilter))
    .filter((s: any) => {
      if (!search) return true;
      const term = search.toLowerCase();
      return s.userName?.toLowerCase().includes(term) || s.assignmentTitle?.toLowerCase().includes(term);
    })
    .sort((a: any, b: any) => {
      if (sortBy === "oldest") return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      if (sortBy === "score-desc") return (b.scorePercent ?? -1) - (a.scorePercent ?? -1);
      if (sortBy === "score-asc") return (a.scorePercent ?? 101) - (b.scorePercent ?? 101);
      if (sortBy === "student") return String(a.userName ?? "").localeCompare(String(b.userName ?? ""));
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

  const visibleSubmissions = paginateItems(filteredSubmissions, page, PAGE_SIZE);
  const totalPages = getTotalPages(filteredSubmissions.length, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [selectedCourse, statusFilter, assignmentFilter, search, sortBy]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const gradedSubmissions = filteredSubmissions.filter((s: any) => s.status === "graded");
  const pendingCount = filteredSubmissions.filter((s: any) => s.status === "submitted").length;
  const gradedCount = gradedSubmissions.length;
  const lateCount = filteredSubmissions.filter((s: any) => s.isLate).length;
  const averagePercent = gradedSubmissions.length
    ? Math.round(gradedSubmissions.reduce((sum: number, s: any) => sum + (s.scorePercent ?? 0), 0) / gradedSubmissions.length)
    : 0;
  const completionRate = filteredSubmissions.length ? Math.round((gradedCount / filteredSubmissions.length) * 100) : 0;
  const needsSupportCount = gradedSubmissions.filter((s: any) => (s.scorePercent ?? 0) < 60).length;

  const selectedCourseData = courses.find((c: any) => c.id === Number(selectedCourse));
  const selectedTotalMarks = selectedSub?.totalMarks ?? assignmentById.get(selectedSub?.assignmentId)?.totalMarks ?? 100;
  const activePercent = getScorePercent(gradeData.marks, selectedTotalMarks);

  const handleGrade = async () => {
    if (!selectedSub) return;
    const marks = Number(gradeData.marks);

    if (Number.isNaN(marks) || marks < 0 || marks > selectedTotalMarks) {
      toast({
        title: "Check the marks",
        description: `Marks must be between 0 and ${selectedTotalMarks}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await gradeMutation.mutateAsync({
        id: selectedSub.assignmentId,
        data: { submissionId: selectedSub.id, marks, feedback: gradeData.feedback.trim() },
      });
      toast({ title: "Assignment graded successfully" });
      queryClient.invalidateQueries({ queryKey: getListSubmissionsQueryKey({ courseId }) });
      setIsGradeOpen(false);
      setSelectedSub(null);
    } catch {
      toast({ title: "Grading failed", variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    if (!filteredSubmissions.length) return;

    const headers = [
      "Student",
      "Assignment",
      "Submitted At",
      "Due Date",
      "Late",
      "Status",
      "Marks",
      "Total Marks",
      "Percent",
      "Letter Grade",
      "Feedback",
    ];
    const rows = filteredSubmissions.map((s: any) => [
      s.userName,
      s.assignmentTitle,
      s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "",
      s.dueDate ? new Date(s.dueDate).toLocaleString() : "",
      s.isLate ? "Yes" : "No",
      s.status,
      s.marks ?? "",
      s.totalMarks,
      s.scorePercent == null ? "" : `${s.scorePercent}%`,
      s.letterGrade,
      s.feedback ?? "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `gradebook_${selectedCourseData?.title?.replace(/\W+/g, "_") || "course"}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleBackToSubjects = () => {
    setSelectedCourse("none");
    setAssignmentFilter("all");
    setStatusFilter("all");
    setSearch("");
    setPage(1);
  };

  if (selectedCourse === "none") {
    return (
      <DashboardLayout>
        <div className="min-h-[calc(100vh-180px)] py-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-black text-slate-950">Grading Hub</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Select a course to open its gradebook, review submissions, record marks, and export class results.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {courses.length === 0 ? (
                <Card className="border-2 border-dashed border-slate-200">
                  <CardContent className="p-8 text-center">
                    <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No courses assigned</p>
                    <p className="mt-1 text-xs text-slate-400">Courses will appear here after an admin assigns them to you.</p>
                  </CardContent>
                </Card>
              ) : (
                courses.map((course: any) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedCourse(course.id.toString())}
                    className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="bg-white text-[10px] font-bold uppercase">
                        Open gradebook
                      </Badge>
                    </div>
                    <h2 className="line-clamp-2 text-base font-black text-slate-950">{course.title}</h2>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-500">{course.category || "Course"}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (submissionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-950">
            <GraduationCap className="h-6 w-6 text-primary" /> Grading Hub
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gradebook for <span className="font-bold text-primary">{selectedCourseData?.title}</span>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {courses.length > 1 && (
            <Button variant="outline" className="h-10 gap-2 rounded-lg text-xs font-bold" onClick={handleBackToSubjects}>
              <ArrowLeft className="h-4 w-4" /> Back to Subjects
            </Button>
          )}
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="h-10 w-full rounded-lg border-slate-200 bg-white text-sm sm:w-56">
              <BookOpen className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course: any) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10 gap-2 rounded-lg text-xs font-bold" onClick={handleExportCSV}>
            <Download className="h-4 w-4" /> Export Gradebook
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ClipboardList className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-slate-400">{completionRate}% complete</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submissions</p>
            <p className="text-3xl font-black text-slate-950">{filteredSubmissions.length}</p>
            <Progress value={completionRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="rounded-lg border-amber-100 bg-amber-50/40 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Review</p>
            <p className="text-3xl font-black text-amber-800">{pendingCount}</p>
            <p className="mt-2 text-xs text-amber-700">Items still waiting for a teacher grade.</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-emerald-100 bg-emerald-50/40 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Percent className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Class Average</p>
            <p className="text-3xl font-black text-emerald-800">{averagePercent}%</p>
            <p className="mt-2 text-xs text-emerald-700">Based on graded submissions only.</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-rose-100 bg-rose-50/40 shadow-sm">
          <CardContent className="p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Needs Attention</p>
            <p className="text-3xl font-black text-rose-800">{needsSupportCount + lateCount}</p>
            <p className="mt-2 text-xs text-rose-700">{needsSupportCount} low score, {lateCount} late.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-5 rounded-lg border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_190px_170px_160px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by student or assignment"
                className="h-10 rounded-lg border-slate-200 pl-10 text-sm"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                <FileText className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignments</SelectItem>
                {(assignments as any[]).map((assignment: any) => (
                  <SelectItem key={assignment.id} value={assignment.id.toString()}>
                    {assignment.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                <CheckCircle2 className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="submitted">Pending</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortMode)}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                <ArrowUpDown className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="student">Student A-Z</SelectItem>
                <SelectItem value="score-desc">Highest score</SelectItem>
                <SelectItem value="score-asc">Lowest score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Submission Sheet</p>
            <p className="text-[11px] text-slate-400">
              Showing {visibleSubmissions.length} of {filteredSubmissions.length} records
            </p>
          </div>
          <Badge variant="outline" className="bg-white text-[10px] font-bold">
            Excel view
          </Badge>
        </div>

        <div className="max-h-[620px] overflow-auto">
          <table className="w-full min-w-[1080px] table-fixed border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-[inset_0_-1px_0_#e2e8f0]">
              <tr>
                <th className="w-10 border-r border-slate-200 px-2 py-2 text-center">#</th>
                <th className="w-20 border-r border-slate-200 px-2 py-2 text-center">Action</th>
                <th className="w-36 border-r border-slate-200 px-2 py-2">Student</th>
                <th className="w-44 border-r border-slate-200 px-2 py-2">Assignment</th>
                <th className="w-36 border-r border-slate-200 px-2 py-2">Submitted</th>
                <th className="w-28 border-r border-slate-200 px-2 py-2">Due</th>
                <th className="w-24 border-r border-slate-200 px-2 py-2">Status</th>
                <th className="w-20 border-r border-slate-200 px-2 py-2 text-right">Marks</th>
                <th className="w-20 border-r border-slate-200 px-2 py-2 text-right">Percent</th>
                <th className="w-16 border-r border-slate-200 px-2 py-2 text-center">Grade</th>
                <th className="w-16 border-r border-slate-200 px-2 py-2 text-center">File</th>
                <th className="w-40 border-r border-slate-200 px-2 py-2">Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
          {visibleSubmissions.map((sub: any, index: number) => {
            const isGraded = sub.status === "graded";
            const statusClass = isGraded
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700";
            const rowNumber = (page - 1) * PAGE_SIZE + index + 1;

            return (
              <tr key={sub.id} className="h-11 transition hover:bg-blue-50/40">
                <td className="border-r border-slate-100 px-2 py-2 text-center font-mono text-[11px] text-slate-400">
                  {rowNumber}
                </td>
                <td className="border-r border-slate-100 px-2 py-2 text-center">
                  <Button
                    variant={isGraded ? "outline" : "default"}
                    size="sm"
                    className="h-7 rounded-md px-3 text-xs font-bold"
                    onClick={() => {
                      setSelectedSub(sub);
                      setGradeData({ marks: sub.marks ?? 0, feedback: sub.feedback ?? "" });
                      setIsGradeOpen(true);
                    }}
                  >
                    {isGraded ? "Edit" : "Grade"}
                  </Button>
                </td>
                <td className="border-r border-slate-100 px-2 py-2">
                  <div className="truncate font-bold text-slate-950">{sub.userName}</div>
                  <div className="text-[11px] text-slate-400">ID: {sub.userId}</div>
                </td>
                <td className="border-r border-slate-100 px-2 py-2">
                  <div className="truncate font-bold text-slate-800">{sub.assignmentTitle}</div>
                  {sub.notes && <div className="truncate text-[11px] italic text-slate-400">Note: {sub.notes}</div>}
                </td>
                <td className="border-r border-slate-100 px-2 py-2 text-slate-600">
                  {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "-"}
                </td>
                <td className="border-r border-slate-100 px-2 py-2">
                  <div className="text-slate-600">{sub.dueDate ? new Date(sub.dueDate).toLocaleDateString() : "-"}</div>
                  <div className={`text-[11px] font-bold ${sub.isLate ? "text-rose-600" : "text-emerald-600"}`}>
                    {sub.isLate ? "Late" : "On time"}
                  </div>
                </td>
                <td className="border-r border-slate-100 px-2 py-2">
                  <Badge className={`border px-2 py-0 text-[10px] font-bold ${statusClass}`}>
                    {isGraded ? "Graded" : "Pending"}
                  </Badge>
                </td>
                <td className="border-r border-slate-100 px-2 py-2 text-right font-mono font-black text-slate-950">
                  {isGraded ? `${sub.marks}/${sub.totalMarks}` : "-"}
                </td>
                <td className="border-r border-slate-100 px-2 py-2 text-right font-mono font-bold text-slate-700">
                  {isGraded ? `${sub.scorePercent}%` : "-"}
                </td>
                <td className="border-r border-slate-100 px-2 py-2 text-center">
                  <span className={`inline-flex h-7 min-w-8 items-center justify-center rounded-md px-2 text-xs font-black ${isGraded ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {sub.letterGrade}
                  </span>
                </td>
                <td className="border-r border-slate-100 px-2 py-2 text-center">
                  {sub.fileUrl ? (
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 items-center justify-center rounded-md border border-primary/20 bg-primary/5 px-2 text-[11px] font-bold text-primary transition hover:bg-primary/10"
                    >
                      File
                    </a>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="border-r border-slate-100 px-2 py-2">
                  <div className="truncate text-slate-600">
                    {sub.feedback || <span className="text-slate-300">No feedback</span>}
                  </div>
                </td>
              </tr>
            );
          })}
            </tbody>
          </table>

          {filteredSubmissions.length === 0 && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100">
                <ClipboardList className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No submissions found</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Try a different filter, or wait until students submit assignments for this course.
              </p>
            </div>
          )}
        </div>
      </div>

      <PaginationControls
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={filteredSubmissions.length}
        onPageChange={setPage}
        label="submissions"
      />

      <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
        <DialogContent className="max-h-[90vh] w-[min(980px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto overflow-x-hidden rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              <Star className="h-5 w-5 text-amber-500" /> Grade Submission
            </DialogTitle>
            <DialogDescription>
              Review the submitted file, enter marks, and send feedback that the student can see in their portal.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-w-0 gap-6 py-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
            <div className="min-w-0 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline" className="bg-white font-bold">
                    {selectedSub?.userName}
                  </Badge>
                  <Badge className={selectedSub?.status === "graded" ? "bg-emerald-600" : "bg-amber-600"}>
                    {selectedSub?.status === "graded" ? "Graded" : "Pending review"}
                  </Badge>
                </div>
                <h3 className="text-base font-black text-slate-950">{selectedSub?.assignmentTitle}</h3>
                <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <span>Submitted: {selectedSub?.submittedAt ? new Date(selectedSub.submittedAt).toLocaleString() : "unknown"}</span>
                  <span>Due: {selectedSub?.dueDate ? new Date(selectedSub.dueDate).toLocaleString() : "not set"}</span>
                  <span>Total marks: {selectedTotalMarks}</span>
                  <span>Grade scale: A+ to F</span>
                </div>
                {selectedSub?.notes && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Student note</p>
                    <p className="mt-1 text-sm italic text-slate-700">"{selectedSub.notes}"</p>
                  </div>
                )}
              </div>

              {selectedSub?.fileUrl ? (
                <div className="rounded-lg border border-primary/15 bg-primary/[0.02] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-black text-primary">
                    <Eye className="h-4 w-4" /> Submitted File
                  </div>
                  <a
                    href={selectedSub.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition hover:border-primary"
                  >
                    <span className="truncate text-xs font-medium text-slate-600">{selectedSub.fileUrl}</span>
                    <ExternalLink className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                  </a>
                  {selectedSub.fileUrl?.toLowerCase().includes(".pdf") && (
                    <iframe src={selectedSub.fileUrl} className="mt-3 h-72 w-full rounded-lg border border-slate-200" title="Submission Preview" />
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-slate-400">
                  <AlertCircle className="mx-auto mb-2 h-7 w-7 opacity-50" />
                  <p className="text-sm font-bold">No file submitted</p>
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-5">
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Calculated Result</p>
                    <p className="text-sm font-bold text-slate-700">{getPerformanceLabel(activePercent)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-base font-black text-white">
                      {getLetterGrade(activePercent)}
                    </span>
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-950">{activePercent ?? 0}%</p>
                      <p className="text-[11px] text-slate-400">percentage</p>
                    </div>
                  </div>
                </div>
                <Progress value={activePercent ?? 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Marks Awarded</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    min="0"
                    max={selectedTotalMarks}
                    className="h-11 rounded-lg border-slate-200 pl-10"
                    placeholder={`0 to ${selectedTotalMarks}`}
                    value={gradeData.marks}
                    onChange={(event) => setGradeData((prev) => ({ ...prev, marks: Number(event.target.value) }))}
                  />
                </div>
                <p className="text-[11px] text-slate-400">Enter marks out of {selectedTotalMarks}. The percentage and letter grade update automatically.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Feedback for Student</Label>
                <Textarea
                  className="min-h-[150px] rounded-lg border-slate-200"
                  placeholder="Write clear, actionable feedback for the student."
                  value={gradeData.feedback}
                  onChange={(event) => setGradeData((prev) => ({ ...prev, feedback: event.target.value }))}
                />
                <div className="grid gap-2">
                  {QUICK_FEEDBACK.map((feedback) => (
                    <button
                      key={feedback}
                      type="button"
                      onClick={() => setGradeData((prev) => ({ ...prev, feedback }))}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:border-primary/30 hover:bg-primary/5"
                    >
                      {feedback}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSub?.status === "graded" && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                  Previously graded: {selectedSub.marks}/{selectedSub.totalMarks} ({selectedSub.scorePercent}%)
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="-mx-6 -mb-6 flex gap-3 rounded-b-lg bg-slate-50 px-6 py-4">
            <Button variant="ghost" onClick={() => setIsGradeOpen(false)} className="flex-1 rounded-lg font-bold text-slate-600">
              Cancel
            </Button>
            <Button onClick={handleGrade} disabled={gradeMutation.isPending} className="flex-1 rounded-lg font-bold shadow-lg shadow-primary/20">
              {gradeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {selectedSub?.status === "graded" ? "Update Grade" : "Submit Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
