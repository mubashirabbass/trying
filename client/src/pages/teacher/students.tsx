import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  GraduationCap,
  Loader2,
  Mail,
  Search,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type TeacherStudent = {
  id: number;
  name: string;
  email: string;
  courseId: number;
  courseName: string;
  progress: number;
  enrolledAt: string;
};

type ProgressFilter = "all" | "excellent" | "steady" | "needs-attention";
type ViewMode = "cards" | "table";

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);
const safeText = (value: unknown) => String(value ?? "");
const csvCell = (value: unknown) => `"${safeText(value).replace(/"/g, '""')}"`;

const getProgressBand = (progress: number): ProgressFilter => {
  if (progress >= 80) return "excellent";
  if (progress <= 30) return "needs-attention";
  return "steady";
};

const getProgressLabel = (progress: number) => {
  const band = getProgressBand(progress);
  if (band === "excellent") return { label: "Excellent", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
  if (band === "needs-attention") return { label: "Needs Attention", className: "bg-amber-50 text-amber-700 border-amber-100" };
  return { label: "Steady", className: "bg-blue-50 text-blue-700 border-blue-100" };
};

const downloadFile = (fileName: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export default function TeacherStudents() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const {
    data: students = [],
    isLoading,
    isError,
    error,
  } = useQuery<TeacherStudent[]>({
    queryKey: ["teacher-students", user?.id],
    enabled: !!user?.id && !!token,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/dashboard/teacher/students?userId=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch students");
      }
      return asArray<TeacherStudent>(await res.json());
    },
  });

  const courses = useMemo(() => {
    const map = new Map<number, string>();
    students.forEach((student) => {
      if (student.courseId) map.set(student.courseId, student.courseName);
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const progress = Number(student.progress || 0);
      const matchesSearch =
        !query ||
        safeText(student.name).toLowerCase().includes(query) ||
        safeText(student.email).toLowerCase().includes(query) ||
        safeText(student.courseName).toLowerCase().includes(query);
      const matchesCourse = courseFilter === "all" || String(student.courseId) === courseFilter;
      const matchesProgress = progressFilter === "all" || getProgressBand(progress) === progressFilter;
      return matchesSearch && matchesCourse && matchesProgress;
    });
  }, [courseFilter, progressFilter, search, students]);

  const stats = useMemo(() => {
    const uniqueStudents = new Set(students.map((student) => student.id)).size;
    const avgProgress = students.length
      ? Math.round(students.reduce((sum, student) => sum + Number(student.progress || 0), 0) / students.length)
      : 0;
    const excellent = students.filter((student) => Number(student.progress || 0) >= 80).length;
    const needsAttention = students.filter((student) => Number(student.progress || 0) <= 30).length;

    return {
      uniqueStudents,
      enrollments: students.length,
      courses: courses.length,
      avgProgress,
      excellent,
      needsAttention,
    };
  }, [courses.length, students]);

  const exportCsv = () => {
    const rows = [
      ["Student", "Email", "Course", "Progress", "Standing", "Enrolled At"],
      ...filteredStudents.map((student) => [
        student.name,
        student.email,
        student.courseName,
        `${Number(student.progress || 0)}%`,
        getProgressLabel(Number(student.progress || 0)).label,
        student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : "",
      ]),
    ];
    downloadFile("teacher-students.csv", rows.map((row) => row.map(csvCell).join(",")).join("\n"));
  };

  const copyEmails = async () => {
    const emails = filteredStudents.map((student) => student.email).filter(Boolean).join(", ");
    try {
      await navigator.clipboard.writeText(emails || "No emails available");
      toast({ title: "Student emails copied" });
    } catch {
      toast({ title: "Could not copy emails", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Badge variant="outline" className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
              Teacher Portal
            </Badge>
            <h1 className="mt-2 flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950">
              Students
              <Users className="h-7 w-7 text-primary" />
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Monitor enrolled students, course progress, and learners who need follow-up.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-10 rounded-lg" onClick={copyEmails} disabled={!filteredStudents.length}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Emails
            </Button>
            <Button variant="outline" className="h-10 rounded-lg" onClick={exportCsv} disabled={!filteredStudents.length}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              className="h-10 rounded-lg"
              onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
            >
              {viewMode === "table" ? "Card View" : "Table View"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard title="Students" value={stats.uniqueStudents} icon={Users} />
          <MetricCard title="Enrollments" value={stats.enrollments} icon={GraduationCap} />
          <MetricCard title="Courses" value={stats.courses} icon={BookOpen} />
          <MetricCard title="Avg Progress" value={`${stats.avgProgress}%`} icon={TrendingUp} />
          <MetricCard title="Excellent" value={stats.excellent} icon={Award} />
          <MetricCard title="Needs Attention" value={stats.needsAttention} icon={AlertCircle} accent="text-amber-500" />
        </div>

        <Card className="rounded-lg border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by student, email, or course"
                  className="h-11 rounded-lg border-slate-200 pl-10"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <select
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={String(course.id)}>
                    {course.title}
                  </option>
                ))}
              </select>

              <select
                value={progressFilter}
                onChange={(event) => setProgressFilter(event.target.value as ProgressFilter)}
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All progress</option>
                <option value="excellent">Excellent</option>
                <option value="steady">Steady</option>
                <option value="needs-attention">Needs attention</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <Card className="rounded-lg border-red-100 bg-red-50 shadow-sm">
            <CardContent className="flex min-h-56 flex-col items-center justify-center text-center text-red-700">
              <AlertCircle className="mb-3 h-10 w-10" />
              <p className="font-black">Students could not be loaded.</p>
              <p className="mt-1 text-sm">{(error as Error).message}</p>
            </CardContent>
          </Card>
        ) : filteredStudents.length === 0 ? (
          <Card className="rounded-lg border-slate-200 shadow-sm">
            <CardContent className="flex min-h-72 flex-col items-center justify-center text-center text-slate-500">
              <Users className="mb-4 h-14 w-14 text-slate-200" />
              <p className="text-lg font-black text-slate-500">No students found</p>
              <p className="mt-1 text-sm">Try clearing filters or wait for students to enroll in your courses.</p>
            </CardContent>
          </Card>
        ) : viewMode === "table" ? (
          <StudentTable students={filteredStudents} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStudents.map((student) => (
              <StudentCard key={`${student.id}-${student.courseId}`} student={student} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  accent = "text-slate-300",
}: {
  title: string;
  value: string | number;
  icon: typeof Users;
  accent?: string;
}) {
  return (
    <Card className="rounded-lg border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${accent}`} />
      </CardContent>
    </Card>
  );
}

function StudentTable({ students }: { students: TeacherStudent[] }) {
  return (
    <Card className="overflow-hidden rounded-lg border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse bg-white">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200 text-left">
              <th className="p-3 text-xs font-black uppercase tracking-wide text-slate-500">Student</th>
              <th className="p-3 text-xs font-black uppercase tracking-wide text-slate-500">Course</th>
              <th className="p-3 text-xs font-black uppercase tracking-wide text-slate-500">Progress</th>
              <th className="p-3 text-xs font-black uppercase tracking-wide text-slate-500">Standing</th>
              <th className="p-3 text-xs font-black uppercase tracking-wide text-slate-500">Joined</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const progress = Number(student.progress || 0);
              const label = getProgressLabel(progress);
              return (
                <tr key={`${student.id}-${student.courseId}`} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                  <td className="p-3">
                    <StudentIdentity student={student} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      {student.courseName}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="max-w-56 space-y-2">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="text-slate-400">Course Progress</span>
                        <span className="text-primary">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={`border text-[10px] font-black uppercase hover:bg-inherit ${label.className}`}>
                      {label.label}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs font-bold text-slate-500">
                    {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : "Unknown"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function StudentCard({ student }: { student: TeacherStudent }) {
  const progress = Number(student.progress || 0);
  const label = getProgressLabel(progress);

  return (
    <Card className="overflow-hidden rounded-lg border-slate-200 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <CardHeader className="p-5 pb-0">
        <StudentIdentity student={student} />
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Enrolled Course</p>
          <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <BookOpen className="h-4 w-4 text-blue-500" />
            {student.courseName}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-400">Course Progress</span>
            <span className="text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            Joined {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : "Unknown"}
          </div>
          <Badge className={`border text-[10px] font-black uppercase hover:bg-inherit ${label.className}`}>
            {label.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentIdentity({ student }: { student: TeacherStudent }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white">
        {safeText(student.name).charAt(0).toUpperCase() || <UserRound className="h-5 w-5" />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-900">{student.name}</p>
        <p className="flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-slate-500">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{student.email}</span>
        </p>
      </div>
    </div>
  );
}
