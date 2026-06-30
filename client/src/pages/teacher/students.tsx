import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertCircle,
  Award,
  BookOpen,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  CreditCard,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PaginationControls, getTotalPages, paginateItems } from "@/components/PaginationControls";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type TeacherStudent = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  cnic?: string | null;
  dob?: string | null;
  gender?: string | null;
  branchId?: number | null;
  branchName?: string | null;
  branchCity?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  obtainedMarks?: number | null;
  totalMarks?: number | null;
  educationDocumentUrl?: string | null;
  identityDocumentUrl?: string | null;
  identityVerificationStatus?: string | null;
  identityDocumentType?: string | null;
  identitySubmittedAt?: string | null;
  identityRejectionReason?: string | null;
  isEmailVerified?: boolean;
  isIdentityVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  courseId: number;
  courseName: string;
  progress: number;
  enrollmentStatus?: string;
  enrolledAt: string;
};

type ProgressFilter = "all" | "excellent" | "steady" | "needs-attention";
type ViewMode = "cards" | "table";
const PAGE_SIZE = 50;

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
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudent | null>(null);

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

  const visibleStudents = useMemo(() => paginateItems(filteredStudents, page, PAGE_SIZE), [filteredStudents, page]);
  const totalPages = getTotalPages(filteredStudents.length, PAGE_SIZE);
  const teacherCourseIds = useMemo(() => new Set(students.map((student) => student.courseId)), [students]);
  const selectedStudentEnrollments = useMemo(
    () => (selectedStudent ? students.filter((student) => student.id === selectedStudent.id) : []),
    [selectedStudent, students],
  );

  const { data: selectedPayments = [], isLoading: loadingPayments } = useQuery<any[]>({
    queryKey: ["teacher-student-payments", selectedStudent?.id],
    enabled: !!selectedStudent?.id && !!token,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/payments?userId=${selectedStudent?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return asArray<any>(await res.json()).filter((payment) => teacherCourseIds.has(payment.courseId));
    },
  });

  useEffect(() => {
    setPage(1);
  }, [courseFilter, progressFilter, search, viewMode]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const exportCsv = () => {
    const rows = [
      ["Student", "Email", "Phone", "CNIC", "Branch", "Gender", "DOB", "Education Marks", "Education Document", "Course", "Enrollment Status", "Progress", "Standing", "Email Verified", "Identity Verified", "Enrolled At"],
      ...filteredStudents.map((student) => [
        student.name,
        student.email,
        student.phone || "",
        student.cnic || "",
        student.branchName || "",
        student.gender || "",
        student.dob ? new Date(student.dob).toLocaleDateString() : "",
        student.obtainedMarks != null && student.totalMarks != null ? `${student.obtainedMarks}/${student.totalMarks}` : "",
        student.educationDocumentUrl || "",
        student.courseName,
        student.enrollmentStatus || "",
        `${Number(student.progress || 0)}%`,
        getProgressLabel(Number(student.progress || 0)).label,
        student.isEmailVerified ? "Yes" : "No",
        student.isIdentityVerified ? "Yes" : "No",
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
              View enrolled student details, contact information, verification status, course progress, and learners who need follow-up.
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
          <StudentTable students={visibleStudents} startIndex={(page - 1) * PAGE_SIZE} onViewProfile={setSelectedStudent} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleStudents.map((student) => (
              <StudentCard key={`${student.id}-${student.courseId}`} student={student} onViewProfile={setSelectedStudent} />
            ))}
          </div>
        )}
        <PaginationControls
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={filteredStudents.length}
          onPageChange={setPage}
          label="students"
        />

        <StudentProfileDialog
          student={selectedStudent}
          enrollments={selectedStudentEnrollments}
          payments={selectedPayments}
          loadingPayments={loadingPayments}
          onOpenChange={(open) => !open && setSelectedStudent(null)}
        />
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

function StudentTable({
  students,
  startIndex,
  onViewProfile,
}: {
  students: TeacherStudent[];
  startIndex: number;
  onViewProfile: (student: TeacherStudent) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-lg border-slate-200 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Student Sheet</p>
          <p className="text-[11px] text-slate-400">Showing {students.length} records on this page</p>
        </div>
        <Badge variant="outline" className="bg-white text-[10px] font-bold">
          Excel view
        </Badge>
      </div>
      <div className="max-h-[620px] overflow-auto">
        <table className="w-full min-w-[1580px] table-fixed border-collapse bg-white text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-[inset_0_-1px_0_#e2e8f0]">
            <tr>
              <th className="w-10 border-r border-slate-200 px-2 py-2 text-center">#</th>
              <th className="w-40 border-r border-slate-200 px-2 py-2">Student</th>
              <th className="w-56 border-r border-slate-200 px-2 py-2">Contact</th>
              <th className="w-44 border-r border-slate-200 px-2 py-2">Profile</th>
              <th className="w-44 border-r border-slate-200 px-2 py-2">Branch</th>
              <th className="w-36 border-r border-slate-200 px-2 py-2">Education</th>
              <th className="w-56 border-r border-slate-200 px-2 py-2">Course</th>
              <th className="w-36 border-r border-slate-200 px-2 py-2">Progress</th>
              <th className="w-32 border-r border-slate-200 px-2 py-2">Standing</th>
              <th className="w-36 border-r border-slate-200 px-2 py-2">Verification</th>
              <th className="w-24 px-2 py-2">Joined</th>
              <th className="w-32 px-2 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student, index) => {
              const progress = Number(student.progress || 0);
              const label = getProgressLabel(progress);
              return (
                <tr key={`${student.id}-${student.courseId}`} className="h-10 transition hover:bg-blue-50/40">
                  <td className="border-r border-slate-100 px-2 py-2 text-center font-mono text-[11px] text-slate-400">
                    {startIndex + index + 1}
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2">
                    <div className="truncate font-bold text-slate-950">{student.name}</div>
                    <div className="text-[11px] text-slate-400">ID: {student.id}</div>
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2">
                    <div className="truncate font-semibold text-slate-600">{student.email}</div>
                    <div className="mt-0.5 truncate text-[11px] text-slate-400">{student.phone || "No phone"}</div>
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2">
                    <div className="truncate font-semibold text-slate-600">CNIC: {student.cnic || "Not added"}</div>
                    <div className="mt-0.5 truncate text-[11px] text-slate-400">
                      {[student.gender, student.dob ? new Date(student.dob).toLocaleDateString() : ""].filter(Boolean).join(" / ") || "Profile details pending"}
                    </div>
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2">
                    <div className="truncate font-bold text-slate-700">{student.branchName || "No branch"}</div>
                    <div className="mt-0.5 truncate text-[11px] text-slate-400">{student.branchCity || ""}</div>
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2">
                    <div className="truncate font-semibold text-slate-600">
                      {student.obtainedMarks != null && student.totalMarks != null ? `${student.obtainedMarks}/${student.totalMarks}` : "Marks pending"}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-slate-400">
                      {student.educationDocumentUrl ? "Document uploaded" : "No document"}
                    </div>
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2">
                    <div className="truncate font-bold text-slate-800">{student.courseName}</div>
                    <div className="mt-0.5 truncate text-[11px] font-semibold capitalize text-slate-400">{student.enrollmentStatus || "active"}</div>
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2">
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="w-10 text-right font-mono font-black text-primary">{progress}%</span>
                    </div>
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2">
                    <Badge className={`border px-2 py-0 text-[10px] font-black uppercase hover:bg-inherit ${label.className}`}>
                      {label.label}
                    </Badge>
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {student.identityDocumentUrl ? (
                        <a href={student.identityDocumentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-black text-[10px] transition-colors shadow-sm" title="View CNIC / Identity Document">
                          <FileText className="h-3 w-3" /> CNIC
                        </a>
                      ) : (
                        <Badge className={`border px-1.5 py-0.5 text-[9px] font-black uppercase hover:bg-inherit ${student.isIdentityVerified ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
                          ID
                        </Badge>
                      )}
                      {student.educationDocumentUrl ? (
                        <a href={student.educationDocumentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-black text-[10px] transition-colors shadow-sm" title="View Education Document">
                          <FileText className="h-3 w-3" /> Result
                        </a>
                      ) : (
                        <Badge className="bg-slate-50 text-slate-400 border border-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase hover:bg-inherit">Edu</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 font-mono text-[11px] font-bold text-slate-500">
                    {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : "Unknown"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-[11px] font-bold" onClick={() => onViewProfile(student)}>
                      <UserRound className="mr-1.5 h-3.5 w-3.5" />
                      View Profile
                    </Button>
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

function StudentCard({ student, onViewProfile }: { student: TeacherStudent; onViewProfile: (student: TeacherStudent) => void }) {
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
          <p className="mt-1 text-[11px] font-semibold capitalize text-slate-500">{student.enrollmentStatus || "active"} enrollment</p>
        </div>

        <div className="grid gap-2 text-xs md:grid-cols-2">
          <DetailTile label="Phone" value={student.phone || "Not added"} />
          <DetailTile label="CNIC" value={student.cnic || "Not added"} />
          <DetailTile label="Branch" value={[student.branchName, student.branchCity].filter(Boolean).join(", ") || "No branch"} />
          <DetailTile label="DOB / Gender" value={[student.dob ? new Date(student.dob).toLocaleDateString() : "", student.gender].filter(Boolean).join(" / ") || "Not added"} />
          <DetailTile
            label="Education Marks"
            value={student.obtainedMarks != null && student.totalMarks != null ? `${student.obtainedMarks}/${student.totalMarks}` : "Not added"}
          />
          <DetailTile label="Education Document" value={student.educationDocumentUrl ? "Uploaded" : "Not uploaded"} />
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
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <Badge className={`border text-[10px] font-black uppercase hover:bg-inherit ${student.isEmailVerified ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"}`}>
            Email {student.isEmailVerified ? "Verified" : "Pending"}
          </Badge>
          <Badge className={`border text-[10px] font-black uppercase hover:bg-inherit ${student.isIdentityVerified ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
            ID {student.isIdentityVerified ? "Verified" : "Pending"}
          </Badge>
        </div>
        <Button className="h-10 w-full rounded-lg font-bold" onClick={() => onViewProfile(student)}>
          <UserRound className="mr-2 h-4 w-4" />
          View Profile
        </Button>
      </CardContent>
    </Card>
  );
}

function StudentProfileDialog({
  student,
  enrollments,
  payments,
  loadingPayments,
  onOpenChange,
}: {
  student: TeacherStudent | null;
  enrollments: TeacherStudent[];
  payments: any[];
  loadingPayments: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const progress = Number(student?.progress || 0);
  const label = getProgressLabel(progress);
  const hasEducationMarks = student?.obtainedMarks != null && student?.totalMarks != null;
  const marksPercent = hasEducationMarks && student?.totalMarks ? Math.round((Number(student.obtainedMarks) / Number(student.totalMarks)) * 100) : null;
  const identityStatus = student?.identityVerificationStatus || (student?.isIdentityVerified ? "verified" : "unverified");

  return (
    <Dialog open={!!student} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto rounded-lg">
        {student && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-4 text-2xl font-black text-slate-950">
                <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-2xl font-black text-primary">
                  {safeText(student.name).charAt(0).toUpperCase() || "S"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{student.name}</span>
                  <span className="block truncate text-sm font-semibold text-slate-500">
                    Student ID: #STU-{student.id} | Joined {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "Unknown"}
                  </span>
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-4">
                <ProfileInfoCard title="Contact Information">
                  <InfoRow icon={Mail} label="Email Address" value={student.email} />
                  <InfoRow icon={Phone} label="Phone Number" value={student.phone || "Not provided"} />
                  <InfoRow icon={MapPin} label="Campus Branch" value={[student.branchName, student.branchCity].filter(Boolean).join(", ") || "Global / Online"} />
                </ProfileInfoCard>

                <ProfileInfoCard title="Academic & Qualification">
                  <InfoRow icon={Award} label="Degree / Qualification" value={student.qualification || "Not provided"} />
                  <InfoRow icon={BookOpen} label="Specialization / Stream" value={student.specialization || "Not provided"} />
                  {hasEducationMarks && (
                    <InfoRow
                      icon={FileText}
                      label="Obtained Marks"
                      value={`${student.obtainedMarks} / ${student.totalMarks}${marksPercent != null ? ` (${marksPercent}%)` : ""}`}
                    />
                  )}
                  {student.educationDocumentUrl && (
                    <DocumentLink href={student.educationDocumentUrl} label="Education Certificate" />
                  )}
                </ProfileInfoCard>

                <div className="rounded-lg bg-slate-900 p-5 text-white shadow-sm">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Identity & Verification</p>
                  <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <ShieldCheck className={`h-6 w-6 shrink-0 ${student.isIdentityVerified ? "text-emerald-400" : "text-amber-400"}`} />
                    <div>
                      <p className="text-sm font-bold">{student.isIdentityVerified ? "Identity Verified" : "Verification Pending"}</p>
                      <p className="text-xs text-slate-400">Status: {identityStatus}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CNIC / B-Form Number</p>
                    <p className="font-mono text-sm font-bold tracking-wider">{student.cnic || "Not provided"}</p>
                  </div>
                  {student.identityDocumentUrl && (
                    <a
                      href={student.identityDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-between rounded-lg bg-white/10 p-3 text-white transition-colors hover:bg-white/15"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold">
                        <FileText className="h-4 w-4 text-slate-300" />
                        {student.identityDocumentType || "CNIC / B-Form Document"}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
                    </a>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                <Tabs defaultValue="enrollments" className="space-y-4">
                  <TabsList className="h-auto w-full justify-start rounded-lg bg-slate-100 p-1">
                    <TabsTrigger value="enrollments" className="rounded-lg px-4 py-2 text-xs font-bold">
                      <BookOpen className="mr-2 h-4 w-4" /> Enrollments
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="rounded-lg px-4 py-2 text-xs font-bold">
                      <CreditCard className="mr-2 h-4 w-4" /> Payments
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="rounded-lg px-4 py-2 text-xs font-bold">
                      <FileText className="mr-2 h-4 w-4" /> Documents
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-lg px-4 py-2 text-xs font-bold">
                      <Clock className="mr-2 h-4 w-4" /> Activity
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="enrollments">
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <ProfileTableHeader columns={["Course", "Enrolled Date", "Progress", "Status"]} />
                      {enrollments.length === 0 ? (
                        <EmptyProfileState label="No courses enrolled for this teacher." />
                      ) : (
                        enrollments.map((enrollment) => (
                          <div key={`${enrollment.id}-${enrollment.courseId}`} className="grid grid-cols-4 items-center gap-3 border-t border-slate-100 px-4 py-4 text-sm">
                            <p className="font-bold text-slate-900">{enrollment.courseName}</p>
                            <p className="font-semibold text-slate-500">{enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : "Unknown"}</p>
                            <div className="flex items-center gap-3">
                              <Progress value={Number(enrollment.progress || 0)} className="h-2 flex-1" />
                              <span className="w-10 text-right text-xs font-black text-primary">{Number(enrollment.progress || 0)}%</span>
                            </div>
                            <Badge className="w-fit bg-slate-50 text-slate-700 hover:bg-slate-50">{enrollment.enrollmentStatus || "active"}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="payments">
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <ProfileTableHeader columns={["Payment ID", "Course", "Amount", "Method", "Status"]} />
                      {loadingPayments ? (
                        <div className="flex h-32 items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : payments.length === 0 ? (
                        <EmptyProfileState label="No payment history found for this teacher's courses." />
                      ) : (
                        payments.map((payment) => (
                          <div key={payment.id} className="grid grid-cols-5 items-center gap-3 border-t border-slate-100 px-4 py-4 text-sm">
                            <p className="font-mono text-xs font-bold text-slate-500">#PAY-{payment.id}</p>
                            <p className="font-bold text-slate-900">{payment.courseName || `Course #${payment.courseId}`}</p>
                            <p className="font-black text-slate-900">Rs. {Number(payment.amount || 0).toLocaleString()}</p>
                            <Badge variant="outline" className="w-fit capitalize">{safeText(payment.method).replace("_", " ") || "Unknown"}</Badge>
                            <Badge className={`w-fit ${payment.status === "verified" ? "bg-emerald-50 text-emerald-700" : payment.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"} hover:bg-inherit`}>
                              {payment.status || "unknown"}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="documents">
                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                      <h3 className="text-lg font-black text-slate-950">Uploaded Documents</h3>
                      <p className="mt-1 text-sm font-medium text-slate-500">Documents submitted by the student for verification and enrollment.</p>
                      <div className="mt-5 space-y-3">
                        {student.educationDocumentUrl && (
                          <DocumentPanel
                            title="Education Certificate"
                            subtitle={student.qualification || "Academic qualification document"}
                            href={student.educationDocumentUrl}
                            tone="blue"
                          />
                        )}
                        {student.identityDocumentUrl && (
                          <DocumentPanel
                            title={student.identityDocumentType || "Identity Document"}
                            subtitle={student.cnic || "CNIC / B-Form verification document"}
                            href={student.identityDocumentUrl}
                            status={identityStatus}
                            submittedAt={student.identitySubmittedAt}
                            rejectionReason={student.identityRejectionReason}
                            tone="purple"
                          />
                        )}
                        {!student.educationDocumentUrl && !student.identityDocumentUrl && (
                          <div className="py-12 text-center">
                            <FileText className="mx-auto mb-3 h-12 w-12 text-slate-200" />
                            <p className="font-bold text-slate-700">No documents uploaded</p>
                            <p className="text-sm text-slate-500">This student has not uploaded documents yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity">
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-400">
                      <Clock className="mx-auto mb-3 h-10 w-10 opacity-30" />
                      <p className="font-bold text-slate-600">Coming Soon</p>
                      <p className="text-sm">Detailed student activity logs will be available here.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProfileInfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</p>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
        <p className="truncate font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function DocumentLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-slate-700 transition-colors hover:bg-slate-100">
      <span className="flex items-center gap-2 text-xs font-bold">
        <FileText className="h-4 w-4 text-slate-400" />
        {label}
      </span>
      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
    </a>
  );
}

function ProfileTableHeader({ columns }: { columns: string[] }) {
  return (
    <div className={`grid gap-3 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 ${columns.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}>
      {columns.map((column) => <span key={column}>{column}</span>)}
    </div>
  );
}

function EmptyProfileState({ label }: { label: string }) {
  return <div className="border-t border-slate-100 px-4 py-12 text-center text-sm font-semibold text-slate-500">{label}</div>;
}

function DocumentPanel({
  title,
  subtitle,
  href,
  status,
  submittedAt,
  rejectionReason,
  tone,
}: {
  title: string;
  subtitle: string;
  href: string;
  status?: string;
  submittedAt?: string | null;
  rejectionReason?: string | null;
  tone: "blue" | "purple";
}) {
  const toneClass = tone === "blue" ? "from-blue-50 to-indigo-50 border-blue-100 text-blue-600 bg-blue-100" : "from-purple-50 to-pink-50 border-purple-100 text-purple-600 bg-purple-100";
  return (
    <div className={`flex items-center justify-between rounded-lg border bg-gradient-to-r p-4 ${toneClass}`}>
      <div className="flex min-w-0 items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          <FileText className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h4 className="truncate font-bold text-slate-900">{title}</h4>
          <p className="truncate text-xs font-medium text-slate-500">{subtitle}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {status && <Badge className="bg-white/80 text-slate-700 hover:bg-white/80">{status}</Badge>}
            {submittedAt && <span className="text-xs text-slate-400">Submitted {new Date(submittedAt).toLocaleDateString()}</span>}
          </div>
          {rejectionReason && <p className="mt-1 text-xs font-medium text-rose-600">Reason: {rejectionReason}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a href={href} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary transition-colors hover:bg-slate-100" title="View Document">
          <Eye className="h-4 w-4" />
        </a>
        <a href={href} download className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary transition-colors hover:bg-slate-100" title="Download Document">
          <Download className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-white px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 truncate font-bold text-slate-700">{value}</p>
    </div>
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
