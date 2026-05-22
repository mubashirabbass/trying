import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Loader2,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type AttendanceStatus = "present" | "absent" | "late" | "leave";

type Course = {
  id: number;
  title: string;
  category?: string;
  minAttendancePercentage?: number;
};

type Student = {
  userId: number;
  name: string;
  email: string;
};

type AttendanceRecord = {
  userId: number;
  date?: string;
  status: AttendanceStatus;
  notes?: string | null;
};

const statusOptions: Array<{
  value: AttendanceStatus;
  label: string;
  icon: typeof CheckCircle2;
  activeClass: string;
  softClass: string;
}> = [
  {
    value: "present",
    label: "Present",
    icon: CheckCircle2,
    activeClass: "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600",
    softClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "absent",
    label: "Absent",
    icon: XCircle,
    activeClass: "bg-red-600 hover:bg-red-700 text-white border-red-600",
    softClass: "bg-red-50 text-red-700 border-red-200",
  },
  {
    value: "late",
    label: "Late",
    icon: Clock,
    activeClass: "bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
    softClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "leave",
    label: "Leave",
    icon: AlertCircle,
    activeClass: "bg-sky-600 hover:bg-sky-700 text-white border-sky-600",
    softClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
];

const todayString = () => new Date().toISOString().split("T")[0];

const shiftDate = (value: string, days: number) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const downloadFile = (fileName: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export default function AttendanceManager() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "all">("all");
  const [attendanceState, setAttendanceState] = useState<Record<number, AttendanceStatus>>({});
  const [notesState, setNotesState] = useState<Record<number, string>>({});

  const { data: courses = [], isLoading: loadingCourses, isError: coursesFailed } = useQuery<Course[]>({
    queryKey: ["courses", user?.role, user?.id],
    enabled: !!token && !!user,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/courses${user?.role === "teacher" ? `?teacherId=${user.id}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch courses");
      return asArray<Course>(await res.json());
    },
  });

  useEffect(() => {
    if (!selectedCourse && courses.length > 0) {
      setSelectedCourse(String(courses[0].id));
    }
  }, [courses, selectedCourse]);

  const selectedCourseInfo = courses.find((course) => String(course.id) === selectedCourse);

  const {
    data: students = [],
    isLoading: loadingStudents,
    isError: studentsFailed,
    error: studentsError,
  } = useQuery<Student[]>({
    queryKey: ["course-students", selectedCourse],
    enabled: !!selectedCourse && !!token,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/attendance/course/${selectedCourse}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch students (${res.status})`);
      }
      return asArray<Student>(await res.json());
    },
  });

  const {
    data: existingRecords = [],
    isLoading: loadingRecords,
    isError: recordsFailed,
    error: recordsError,
  } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", selectedCourse, selectedDate],
    enabled: !!selectedCourse && !!selectedDate && !!token,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/attendance/course/${selectedCourse}?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch attendance (${res.status})`);
      }
      return asArray<AttendanceRecord>(await res.json());
    },
  });

  const { data: courseRecords = [], isLoading: loadingHistory } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance-history", selectedCourse],
    enabled: !!selectedCourse && !!token,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/attendance/course/${selectedCourse}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return asArray<AttendanceRecord>(await res.json());
    },
  });

  useEffect(() => {
    if (!students.length) {
      setAttendanceState({});
      setNotesState({});
      return;
    }

    const nextAttendance: Record<number, AttendanceStatus> = {};
    const nextNotes: Record<number, string> = {};

    students.forEach((student) => {
      const record = existingRecords.find((item) => item.userId === student.userId);
      nextAttendance[student.userId] = record?.status || "present";
      nextNotes[student.userId] = record?.notes || "";
    });

    setAttendanceState(nextAttendance);
    setNotesState(nextNotes);
  }, [existingRecords, students]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return students.filter((student) => {
      const status = attendanceState[student.userId] || "present";
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !query ||
        student.name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [attendanceState, searchQuery, statusFilter, students]);

  const summary = useMemo(() => {
    const counts = statusOptions.reduce(
      (acc, option) => ({ ...acc, [option.value]: 0 }),
      {} as Record<AttendanceStatus, number>,
    );

    students.forEach((student) => {
      const status = attendanceState[student.userId] || "present";
      counts[status] += 1;
    });

    const total = students.length;
    const countedAsPresent = counts.present + counts.late;
    const percentage = total > 0 ? Math.round((countedAsPresent / total) * 100) : 0;

    return { ...counts, total, countedAsPresent, percentage };
  }, [attendanceState, students]);

  const courseMinimum = selectedCourseInfo?.minAttendancePercentage ?? 75;
  const recordedClassDays = useMemo(() => new Set(courseRecords.map((record) => record.date).filter(Boolean)).size, [courseRecords]);

  const studentStats = useMemo(() => {
    const stats: Record<number, { present: number; total: number; percentage: number; absent: number }> = {};

    students.forEach((student) => {
      stats[student.userId] = { present: 0, total: 0, percentage: 0, absent: 0 };
    });

    courseRecords.forEach((record) => {
      if (!stats[record.userId]) return;
      stats[record.userId].total += 1;
      if (record.status === "present" || record.status === "late") {
        stats[record.userId].present += 1;
      }
      if (record.status === "absent") {
        stats[record.userId].absent += 1;
      }
    });

    Object.values(stats).forEach((item) => {
      item.percentage = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
    });

    return stats;
  }, [courseRecords, students]);

  const atRiskCount = useMemo(
    () => students.filter((student) => {
      const stats = studentStats[student.userId];
      return stats?.total > 0 && stats.percentage < courseMinimum;
    }).length,
    [courseMinimum, studentStats, students],
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!students.length) return false;
    if (!loadingRecords && existingRecords.length === 0) return true;

    return students.some((student) => {
      const record = existingRecords.find((item) => item.userId === student.userId);
      const savedStatus = record?.status || "present";
      const savedNotes = record?.notes || "";
      return (attendanceState[student.userId] || "present") !== savedStatus || (notesState[student.userId] || "") !== savedNotes;
    });
  }, [attendanceState, existingRecords, loadingRecords, notesState, students]);

  const saveMutation = useMutation({
    mutationFn: async (records: Array<{ userId: number; status: AttendanceStatus; notes: string | null }>) => {
      const res = await fetch(`${BASE}/api/attendance/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: Number(selectedCourse),
          date: selectedDate,
          records,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save attendance");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Attendance saved", description: `${summary.total} student records updated.` });
      queryClient.invalidateQueries({ queryKey: ["attendance", selectedCourse, selectedDate] });
    },
    onError: (error: any) => {
      toast({ title: "Error saving attendance", description: error.message, variant: "destructive" });
    },
  });

  const setStatus = (userId: number, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({ ...prev, [userId]: status }));
  };

  const setVisibleStatus = (status: AttendanceStatus) => {
    if (!filteredStudents.length) return;

    setAttendanceState((prev) => {
      const next = { ...prev };
      filteredStudents.forEach((student) => {
        next[student.userId] = status;
      });
      return next;
    });
  };

  const resetToSaved = () => {
    const nextAttendance: Record<number, AttendanceStatus> = {};
    const nextNotes: Record<number, string> = {};

    students.forEach((student) => {
      const record = existingRecords.find((item) => item.userId === student.userId);
      nextAttendance[student.userId] = record?.status || "present";
      nextNotes[student.userId] = record?.notes || "";
    });

    setAttendanceState(nextAttendance);
    setNotesState(nextNotes);
  };

  const copyAbsentees = async () => {
    const absentStudents = students.filter((student) => attendanceState[student.userId] === "absent");
    const text = absentStudents.length
      ? absentStudents.map((student, index) => `${index + 1}. ${student.name} (${student.email})`).join("\n")
      : "No absent students marked.";

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Absentee list copied" });
    } catch {
      toast({ title: "Could not copy absentee list", variant: "destructive" });
    }
  };

  const exportCsv = () => {
    if (!students.length) return;

    const rows = [
      ["Course", "Date", "Student", "Email", "Today Status", "Course Attendance %", "Present Count", "Total Classes", "Notes"],
      ...students.map((student) => {
        const stats = studentStats[student.userId] || { present: 0, total: 0, percentage: 0 };
        return [
          selectedCourseInfo?.title || selectedCourse,
          selectedDate,
          student.name,
          student.email,
          attendanceState[student.userId] || "present",
          `${stats.percentage}%`,
          stats.present,
          stats.total,
          notesState[student.userId] || "",
        ];
      }),
    ];

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const cleanCourseName = (selectedCourseInfo?.title || "attendance").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
    downloadFile(`${cleanCourseName}-${selectedDate}-attendance.csv`, csv);
  };

  const handleSave = () => {
    if (!selectedCourse || !selectedDate || !students.length) return;

    const recordsToSave = students.map((student) => ({
      userId: student.userId,
      status: attendanceState[student.userId] || "present",
      notes: notesState[student.userId]?.trim() || null,
    }));

    saveMutation.mutate(recordsToSave);
  };

  const isLoadingSheet = loadingStudents || loadingRecords;
  const sheetError = studentsFailed ? studentsError : recordsFailed ? recordsError : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-md border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
                {user?.role === "admin" ? "Admin View" : "Teacher Portal"}
              </Badge>
              {hasUnsavedChanges && (
                <Badge className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100">
                  Unsaved changes
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-950">Attendance</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Mark attendance, add quick notes, and review daily class participation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-10 rounded-lg" onClick={resetToSaved} disabled={!students.length || saveMutation.isPending}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button variant="outline" className="h-10 rounded-lg" onClick={copyAbsentees} disabled={!students.length}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Absentees
            </Button>
            <Button variant="outline" className="h-10 rounded-lg" onClick={exportCsv} disabled={!students.length}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" className="h-10 rounded-lg" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" className="h-10 rounded-lg" onClick={() => setSelectedDate(todayString())}>
              Today
            </Button>
            <Button variant="outline" className="h-10 rounded-lg" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button className="h-10 rounded-lg font-bold" onClick={handleSave} disabled={!students.length || saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {existingRecords.length > 0 ? "Update Attendance" : "Save Attendance"}
            </Button>
          </div>
        </div>

        <Card className="rounded-lg border-slate-200 shadow-sm">
          <CardContent className="p-4 md:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_220px]">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wide text-slate-500">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(event) => setSelectedCourse(event.target.value)}
                  disabled={loadingCourses || coursesFailed}
                  className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{loadingCourses ? "Loading courses..." : "Select a course"}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={String(course.id)}>
                      {course.title}
                    </option>
                  ))}
                </select>
                {coursesFailed && (
                  <p className="text-xs font-semibold text-red-600">Courses could not be loaded. Please refresh after the server is ready.</p>
                )}
                {selectedCourseInfo?.category && (
                  <p className="text-xs font-semibold text-slate-500">{selectedCourseInfo.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wide text-slate-500">Class Date</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="h-11 rounded-lg border-slate-200 pl-10 font-semibold"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Card className="rounded-lg border-slate-200 shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Students</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{summary.total}</p>
              </div>
              <Users className="h-8 w-8 text-slate-300" />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-slate-200 shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Attendance</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{summary.percentage}%</p>
                <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">Min {courseMinimum}%</p>
              </div>
              <UserCheck className="h-8 w-8 text-emerald-500" />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-slate-200 shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">At Risk</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{atRiskCount}</p>
                <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">{recordedClassDays} class days</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </CardContent>
          </Card>

          {statusOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.value} className="rounded-lg border-slate-200 shadow-sm">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">{option.label}</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{summary[option.value]}</p>
                  </div>
                  <Icon className="h-8 w-8 text-slate-300" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="rounded-lg border-slate-200 shadow-sm">
          <CardHeader className="gap-4 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-black text-slate-950">Class Roster</CardTitle>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {filteredStudents.length} visible of {students.length} enrolled students
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setVisibleStatus(option.value)}
                  disabled={!filteredStudents.length}
                >
                  Mark {option.label}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search students by name or email"
                  className="h-10 rounded-lg border-slate-200 pl-10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as AttendanceStatus | "all")}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {isLoadingSheet ? (
              <div className="flex min-h-72 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sheetError ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center text-red-600">
                <AlertCircle className="mb-3 h-9 w-9" />
                <p className="font-bold">Attendance data could not be loaded.</p>
                <p className="mt-1 max-w-md text-sm text-red-500">{(sheetError as Error).message}</p>
              </div>
            ) : !students.length ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center text-slate-500">
                <Users className="mb-3 h-9 w-9 text-slate-300" />
                <p className="font-bold">No students are enrolled in this course yet.</p>
                <p className="mt-1 text-sm">Once enrollments are active, the roster will appear here.</p>
              </div>
            ) : !filteredStudents.length ? (
              <div className="flex min-h-56 flex-col items-center justify-center text-center text-slate-500">
                <Search className="mb-3 h-8 w-8 text-slate-300" />
                <p className="font-bold">No students match the current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[1180px] border-collapse bg-white">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-left">
                      <th className="w-[28%] p-3 text-xs font-black uppercase tracking-wide text-slate-500">Student</th>
                      <th className="w-[16%] p-3 text-xs font-black uppercase tracking-wide text-slate-500">Course Standing</th>
                      <th className="w-[32%] p-3 text-xs font-black uppercase tracking-wide text-slate-500">Today Status</th>
                      <th className="p-3 text-xs font-black uppercase tracking-wide text-slate-500">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => {
                      const activeStatus = attendanceState[student.userId] || "present";
                      const stats = studentStats[student.userId] || { present: 0, total: 0, percentage: 0, absent: 0 };
                      const isAtRisk = stats.total > 0 && stats.percentage < courseMinimum;

                      return (
                        <tr key={student.userId} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                          <td className="p-3 align-top">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white">
                                {student.name?.charAt(0)?.toUpperCase() || "S"}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-900">{student.name}</p>
                                <p className="truncate text-xs font-medium text-slate-500">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 align-top">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-black ${isAtRisk ? "text-red-700" : "text-slate-900"}`}>
                                  {stats.total > 0 ? `${stats.percentage}%` : "No history"}
                                </span>
                                {isAtRisk && (
                                  <Badge className="rounded-md bg-red-100 text-[10px] font-black text-red-700 hover:bg-red-100">
                                    At Risk
                                  </Badge>
                                )}
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full ${isAtRisk ? "bg-red-500" : "bg-emerald-500"}`}
                                  style={{ width: `${Math.min(100, stats.percentage)}%` }}
                                />
                              </div>
                              <p className="text-[10px] font-semibold text-slate-500">
                                {stats.present}/{stats.total} counted present
                              </p>
                            </div>
                          </td>
                          <td className="p-3 align-top">
                            <div className="grid grid-cols-4 gap-2">
                              {statusOptions.map((option) => {
                                const Icon = option.icon;
                                const isActive = activeStatus === option.value;

                                return (
                                  <Button
                                    key={option.value}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={`h-9 rounded-lg border text-xs font-bold ${isActive ? option.activeClass : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                                    onClick={() => setStatus(student.userId, option.value)}
                                  >
                                    <Icon className="mr-1 h-3.5 w-3.5" />
                                    {option.label}
                                  </Button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-3 align-top">
                            <Input
                              value={notesState[student.userId] || ""}
                              onChange={(event) => setNotesState((prev) => ({ ...prev, [student.userId]: event.target.value }))}
                              placeholder="Optional note"
                              className="h-9 rounded-lg border-slate-200 text-sm"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
