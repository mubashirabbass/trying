import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Loader2,
  Save,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  XCircle,
  FileDown
} from "lucide-react";
import { exportStudentAttendanceWorkbook, exportSingleStudentWorkbook } from "@/lib/exportStudentAttendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  rollNo?: string | null;
  regNo?: string | null;
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
    activeClass: "bg-emerald-650 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white border-emerald-650 dark:border-emerald-600",
    softClass: "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40",
  },
  {
    value: "absent",
    label: "Absent",
    icon: XCircle,
    activeClass: "bg-rose-600 dark:bg-rose-550 hover:bg-rose-700 dark:hover:bg-rose-500 text-white border-rose-600 dark:border-rose-550",
    softClass: "bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40",
  },
  {
    value: "late",
    label: "Late",
    icon: Clock,
    activeClass: "bg-amber-500 dark:bg-amber-500 hover:bg-amber-600 dark:hover:bg-amber-450 text-white border-amber-500",
    softClass: "bg-amber-50 dark:bg-amber-955/20 text-amber-750 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40",
  },
  {
    value: "leave",
    label: "Leave",
    icon: AlertCircle,
    activeClass: "bg-sky-600 dark:bg-sky-550 hover:bg-sky-700 dark:hover:bg-sky-500 text-white border-sky-655 dark:border-sky-550",
    softClass: "bg-sky-50 dark:bg-sky-955/20 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40",
  },
];

const todayString = () => new Date().toISOString().split("T")[0];

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedMatrixMonth, setSelectedMatrixMonth] = useState<string>("all");

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

  const classDaysMap = useMemo(() => {
    const map: Record<string, { present: number; total: number; percentage: number }> = {};
    courseRecords.forEach((record) => {
      if (!record.date) return;
      if (!map[record.date]) {
        map[record.date] = { present: 0, total: 0, percentage: 0 };
      }
      map[record.date].total += 1;
      if (record.status === "present" || record.status === "late") {
        map[record.date].present += 1;
      }
    });
    Object.keys(map).forEach((date) => {
      const day = map[date];
      day.percentage = day.total > 0 ? Math.round((day.present / day.total) * 100) : 0;
    });
    return map;
  }, [courseRecords]);

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

  const uniqueDates = useMemo(() => {
    const datesSet = new Set<string>();
    courseRecords.forEach((record) => {
      if (record.date) {
        datesSet.add(record.date);
      }
    });
    return Array.from(datesSet).sort((a, b) => b.localeCompare(a));
  }, [courseRecords]);

  const uniqueMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    courseRecords.forEach((record) => {
      if (record.date) {
        const parts = record.date.split("-");
        if (parts.length >= 2) {
          monthsSet.add(`${parts[0]}-${parts[1]}`);
        }
      }
    });
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [courseRecords]);

  useEffect(() => {
    if (uniqueMonths.length > 0 && selectedMatrixMonth === "all") {
      const nowStr = new Date().toISOString().split("T")[0].substring(0, 7);
      if (uniqueMonths.includes(nowStr)) {
        setSelectedMatrixMonth(nowStr);
      } else {
        setSelectedMatrixMonth(uniqueMonths[0]);
      }
    }
  }, [uniqueMonths]);

  const filteredUniqueDates = useMemo(() => {
    return uniqueDates.filter((dateStr) => {
      if (selectedMatrixMonth === "all" || !selectedMatrixMonth) return true;
      return dateStr.startsWith(selectedMatrixMonth);
    });
  }, [uniqueDates, selectedMatrixMonth]);

  const matrixLookup = useMemo(() => {
    const lookup: Record<string, AttendanceStatus> = {};
    courseRecords.forEach((record) => {
      if (record.date) {
        lookup[`${record.userId}_${record.date}`] = record.status;
      }
    });
    return lookup;
  }, [courseRecords]);

  const atRiskCount = useMemo(
    () => students.filter((student) => {
      const stats = studentStats[student.userId];
      return stats?.total > 0 && stats.percentage < courseMinimum;
    }).length,
    [courseMinimum, studentStats, students],
  );

  const allVisiblePresent = filteredStudents.length > 0 && filteredStudents.every((student) => (attendanceState[student.userId] || "present") === "present");

  const atRiskStudents = useMemo(
    () =>
      students
        .map((student) => ({
          ...student,
          stats: studentStats[student.userId] || { present: 0, total: 0, percentage: 0, absent: 0 },
        }))
        .filter((student) => student.stats.total > 0 && student.stats.percentage < courseMinimum)
        .sort((a, b) => a.stats.percentage - b.stats.percentage)
        .slice(0, 5),
    [courseMinimum, studentStats, students],
  );

  const courseAverage = useMemo(() => {
    const trackedStudents = students
      .map((student) => studentStats[student.userId])
      .filter((stats): stats is { present: number; total: number; percentage: number; absent: number } => !!stats && stats.total > 0);

    if (!trackedStudents.length) return 0;
    return Math.round(trackedStudents.reduce((total, stats) => total + stats.percentage, 0) / trackedStudents.length);
  }, [studentStats, students]);

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

  const { calendarDays, monthYearLabel } = useMemo(() => {
    if (!selectedDate) return { calendarDays: [], monthYearLabel: "" };
    try {
      const parts = selectedDate.split("-");
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      
      const dateObj = new Date(year, month, 1);
      const monthYearLabel = dateObj.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      
      const firstDay = new Date(year, month, 1).getDay();
      const totalDays = new Date(year, month + 1, 0).getDate();
      
      const days: { dayNumber: number | null; dateStr: string | null }[] = [];
      
      for (let i = 0; i < firstDay; i++) {
        days.push({ dayNumber: null, dateStr: null });
      }
      
      for (let d = 1; d <= totalDays; d++) {
        const dString = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        days.push({ dayNumber: d, dateStr: dString });
      }
      
      return { calendarDays: days, monthYearLabel };
    } catch (e) {
      return { calendarDays: [], monthYearLabel: "" };
    }
  }, [selectedDate]);

  const handlePrevMonth = () => {
    try {
      const parts = selectedDate.split("-");
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const d = new Date(year, month - 1, 1);
      setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    } catch (e) {}
  };

  const handleNextMonth = () => {
    try {
      const parts = selectedDate.split("-");
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const d = new Date(year, month + 1, 1);
      setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    } catch (e) {}
  };

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
      queryClient.invalidateQueries({ queryKey: ["attendance-history", selectedCourse] });
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
        {/* Futuristic Top Banner */}
        <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-xl border border-slate-800/40">
          {/* Ambient light glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_45%)]" />
          
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-bold text-indigo-300 ring-1 ring-indigo-500/20 uppercase tracking-wider">
                  {user?.role === "admin" ? "Admin Command Center" : "Teacher Command Center"}
                </span>
                <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-1 text-xs font-bold text-slate-300 ring-1 ring-white/10 uppercase tracking-wider">
                  Real-time Sync
                </span>
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center rounded-md bg-amber-500/20 px-2 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-500/30 animate-pulse uppercase tracking-wider">
                    Unsaved changes
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                  Attendance Manager
                </h1>
                <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-300 font-medium">
                  <BookOpen className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="truncate">{selectedCourseInfo?.title || "Select a course below to get started"}</span>
                </p>
              </div>
            </div>

            {/* Premium Animated Segment Control */}
            <div className="inline-flex rounded-2xl bg-white/5 p-1.5 backdrop-blur-md border border-white/10 self-start xl:self-auto shadow-inner">
              <button
                type="button"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeTab === "dashboard"
                    ? "bg-white text-slate-900 shadow-md scale-[1.02]"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setActiveTab("dashboard")}
              >
                <BarChart3 className={`h-4 w-4 ${activeTab === "dashboard" ? "text-indigo-600" : "text-indigo-400"}`} />
                Dashboard
              </button>
              <button
                type="button"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeTab === "manage"
                    ? "bg-white text-slate-900 shadow-md scale-[1.02]"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setActiveTab("manage")}
              >
                <CheckCircle2 className={`h-4 w-4 ${activeTab === "manage" ? "text-emerald-600" : "text-emerald-400"}`} />
                Register Attendance
              </button>
              <button
                type="button"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeTab === "matrix"
                    ? "bg-white text-slate-900 shadow-md scale-[1.02]"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setActiveTab("matrix")}
              >
                <CalendarDays className={`h-4 w-4 ${activeTab === "matrix" ? "text-indigo-605" : "text-indigo-405"}`} />
                Attendance Sheet
              </button>
            </div>
          </div>
        </div>

        {/* Global Parameter Selector Card */}
        <div className="grid gap-6 md:grid-cols-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-[28px] p-6 shadow-md shadow-slate-100/50 dark:shadow-none items-end">
          {/* Course Selector */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Select Academic Course</label>
            <div className="relative group focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-xl transition-all">
              <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-indigo-500 transition-colors group-focus-within:text-indigo-600" />
              <select
                value={selectedCourse}
                onChange={(event) => setSelectedCourse(event.target.value)}
                disabled={loadingCourses || coursesFailed}
                className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 pl-10 text-sm font-semibold text-slate-900 dark:text-slate-100 shadow-sm outline-none focus:border-indigo-500 transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8"
              >
                <option value="">{loadingCourses ? "Loading courses..." : "Select a course"}</option>
                {courses.map((course) => (
                  <option key={course.id} value={String(course.id)}>
                    {course.title}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Class Date Selector */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Class Session Date</label>
            <div className="relative group focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-xl transition-all">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-indigo-500 transition-colors group-focus-within:text-indigo-600" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-11 rounded-xl border-slate-200 dark:border-slate-800 pl-10 font-semibold focus-visible:ring-0 focus-visible:border-indigo-500 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Policy Standing Card */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-550/15 dark:border-indigo-950/40 bg-indigo-50/20 dark:bg-indigo-955/10 p-4 h-11 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <GraduationCap className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">{courseMinimum}% Attendance Threshold</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {selectedCourseInfo?.category || "Core Requirement"}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="dashboard" className="mt-0 space-y-6">
            {/* Redesigned Premium Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Enrolled Students Card */}
              <div className="group relative rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 hover:ring-2 hover:ring-indigo-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Enrolled Students</span>
                    <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                      {summary.total}
                    </h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Session Rate Card */}
              <div className="group relative rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 hover:ring-2 hover:ring-emerald-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Session Rate</span>
                    <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {summary.percentage}%
                    </h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-955/45 text-emerald-500 group-hover:scale-110 transition-transform duration-300">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Course Average Card */}
              <div className="group relative rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 hover:ring-2 hover:ring-purple-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Course Average</span>
                    <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {courseAverage}%
                    </h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* At Risk Card */}
              <div className={`group relative rounded-2xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                atRiskCount > 0
                  ? "bg-rose-50/30 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/60 hover:ring-2 hover:ring-rose-500/20"
                  : "bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 hover:ring-2 hover:ring-rose-500/10"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">At Risk</span>
                    <h3 className={`mt-1 text-2xl font-black ${atRiskCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                      {atRiskCount}
                    </h3>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${
                    atRiskCount > 0
                      ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-400"
                  }`}>
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Class Days Card */}
              <div className="group relative rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 hover:ring-2 hover:ring-blue-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Class Days</span>
                    <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {recordedClassDays}
                    </h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Detailed Grid */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Side: University Lecture Calendar (Span 8) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="rounded-[28px] border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 dark:border-slate-800/60 p-6 flex flex-row items-center justify-between bg-slate-50/20 dark:bg-slate-900/5">
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white">Academic Lecture Calendar</h2>
                      <p className="text-xs text-slate-400 mt-1">Interactive overview of marked lectures and average attendance grades</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevMonth}
                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ChevronLeft className="h-4.5 w-4.5" />
                      </Button>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 px-2 min-w-[100px] text-center">
                        {monthYearLabel}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextMonth}
                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ChevronRight className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 gap-2 mb-3 text-center">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                        <div key={day} className="text-[10px] font-black uppercase text-slate-400 tracking-wider py-1">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((cell, idx) => {
                        if (!cell.dayNumber || !cell.dateStr) {
                          return <div key={`empty-${idx}`} className="aspect-square" />;
                        }

                        const dateStr = cell.dateStr;
                        const dayData = classDaysMap[dateStr];
                        const isSelected = selectedDate === dateStr;
                        
                        let bgClass = "bg-slate-50/50 dark:bg-slate-900/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 text-slate-650 dark:text-slate-400 border border-slate-100 dark:border-slate-800/40 cursor-pointer";
                        let indicator = null;

                        if (dayData) {
                          const isHealthy = dayData.percentage >= courseMinimum;
                          const isWarning = dayData.percentage >= 60 && dayData.percentage < courseMinimum;
                          
                          if (isHealthy) {
                            bgClass = "bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-500/25 hover:bg-emerald-500/15 cursor-pointer shadow-sm";
                            indicator = <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1" />;
                          } else if (isWarning) {
                            bgClass = "bg-amber-500/10 dark:bg-amber-955/20 text-amber-700 dark:text-amber-450 border border-amber-500/25 hover:bg-amber-500/15 cursor-pointer shadow-sm";
                            indicator = <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1" />;
                          } else {
                            bgClass = "bg-rose-500/10 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border border-rose-500/25 hover:bg-rose-500/15 cursor-pointer shadow-sm";
                            indicator = <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1" />;
                          }
                        }

                        return (
                          <div
                            key={dateStr}
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setActiveTab("manage");
                            }}
                            className={`aspect-square flex flex-col items-center justify-center p-1 rounded-xl text-xs font-bold transition-all relative group ${bgClass} ${
                              isSelected ? "ring-2 ring-indigo-550 ring-offset-2 dark:ring-offset-slate-950 scale-95" : ""
                            }`}
                          >
                            <span className="text-sm font-black">{cell.dayNumber}</span>
                            {dayData ? (
                              <span className="text-[9px] font-black opacity-80 mt-0.5">{dayData.percentage}%</span>
                            ) : (
                              <span className="text-[8px] font-semibold opacity-0 group-hover:opacity-100 mt-0.5 text-indigo-505 uppercase tracking-wider transition-opacity">
                                Mark
                              </span>
                            )}
                            {indicator}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex flex-wrap gap-4 items-center justify-center border-t border-slate-100 dark:border-slate-800/60 pt-4 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span>Target Met (&ge;{courseMinimum}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span>Critical (60% - {courseMinimum - 1}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                        <span>High Risk (&lt;60%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <span>No Session Marked</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Active Breakdown & Snapshot Details (Span 4) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Active Session Breakdown Card */}
                <div className="rounded-[28px] border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 dark:border-slate-800/60 p-6 bg-slate-50/20 dark:bg-slate-900/5">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Active Session Distribution</h2>
                    <p className="text-xs text-slate-400 mt-1">Status stats for class session: {selectedDate}</p>
                  </div>

                  <div className="space-y-5 p-6">
                    {statusOptions.map((option) => {
                      const Icon = option.icon;
                      const count = summary[option.value];
                      const width = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
                      const barColor = 
                        option.value === "present" ? "bg-emerald-500" :
                        option.value === "absent" ? "bg-rose-500" :
                        option.value === "late" ? "bg-amber-500" :
                        "bg-sky-500";

                      return (
                        <div key={option.value} className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className={`grid h-8 w-8 place-items-center rounded-lg border ${option.softClass}`}>
                                <Icon className="h-4.5 w-4.5" />
                              </span>
                              <span className="text-sm font-black text-slate-800 dark:text-slate-200">{option.label}</span>
                            </div>
                            <span className="text-sm font-black text-slate-900 dark:text-white">{count} ({width}%)</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Course Summary Details Card */}
                <div className="rounded-[28px] border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 dark:border-slate-800/60 p-6 bg-slate-50/20 dark:bg-slate-900/5">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Academic Summary Details</h2>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-900 pb-3">
                      <span className="font-bold text-slate-400">Total Course Enrollment</span>
                      <span className="font-black text-slate-800 dark:text-slate-200">{summary.total} Students</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-900 pb-3">
                      <span className="font-bold text-slate-400">Overall Course Average</span>
                      <span className="font-black text-slate-800 dark:text-slate-200">{courseAverage}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-900 pb-3">
                      <span className="font-bold text-slate-400">Total Sessions Tracked</span>
                      <span className="font-black text-slate-800 dark:text-slate-200">{recordedClassDays} Sessions</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-400">Target Standing Threshold</span>
                      <span className="font-black text-rose-600 dark:text-rose-450">{courseMinimum}% Limit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logs & At Risk Roster split row */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Session History Card */}
              <div className="rounded-[28px] border border-slate-105 dark:border-slate-800/60 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800/60 p-6 flex flex-row items-center justify-between bg-slate-50/20 dark:bg-slate-900/5">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Class Session Logs</h2>
                    <p className="text-xs text-slate-400 mt-1">Logs of all marked attendance sessions for this course</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {recordedClassDays} Sessions
                  </span>
                </div>

                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-900">
                  {loadingHistory ? (
                    <div className="flex h-48 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-650" />
                    </div>
                  ) : Object.keys(classDaysMap).length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center text-slate-400 text-center p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 mb-3">
                        <CalendarDays className="h-6 w-6 text-slate-300 dark:text-slate-700 animate-pulse" />
                      </div>
                      <p className="text-sm font-bold text-slate-650 dark:text-slate-400">No Recorded Sessions</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">Start marking attendance in the "Manage Roster" tab.</p>
                    </div>
                  ) : (
                    Object.keys(classDaysMap)
                      .sort((a, b) => b.localeCompare(a))
                      .map((dateStr) => {
                        const dayData = classDaysMap[dateStr];
                        const isBelowThreshold = dayData.percentage < courseMinimum;
                        return (
                          <div key={dateStr} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
                                <CalendarDays className="h-5 w-5" />
                              </span>
                              <div>
                                <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                                  {new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                                <p className="text-xs text-slate-400 font-semibold">{dayData.total} Students Marked</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className={`text-sm font-black ${isBelowThreshold ? "text-rose-600 dark:text-rose-450" : "text-emerald-600 dark:text-emerald-450"}`}>
                                  {dayData.percentage}% Present
                                </p>
                                <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  isBelowThreshold 
                                    ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600" 
                                    : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                                }`}>
                                  {isBelowThreshold ? "Below Target" : "Healthy"}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg font-bold text-xs border-slate-200 hover:border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                                onClick={() => {
                                  setSelectedDate(dateStr);
                                  setActiveTab("manage");
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Attendance Watchlist */}
              <div className="rounded-[28px] border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800/60 p-6 flex flex-row items-center justify-between bg-slate-50/20 dark:bg-slate-900/5">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Attendance Watchlist</h2>
                    <p className="text-xs text-slate-400 mt-1">Students below the target threshold ({courseMinimum}%)</p>
                  </div>
                  {atRiskCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-455">
                      {atRiskCount} At Risk
                    </span>
                  )}
                </div>

                <div className="p-6">
                  {loadingHistory ? (
                    <div className="flex min-h-32 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-650" />
                    </div>
                  ) : atRiskStudents.length ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {atRiskStudents.map((student) => (
                        <div key={student.userId} className="group rounded-2xl border border-rose-100 dark:border-rose-900 bg-rose-50/10 dark:bg-rose-950/10 p-4 transition-all duration-300 hover:ring-2 hover:ring-rose-500/20">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex items-center gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-450 font-black text-sm">
                                {student.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">{student.name}</p>
                                <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400 dark:text-slate-500">{student.email}</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center rounded-lg bg-rose-500/15 border border-rose-200 dark:border-rose-900/60 text-xs font-black text-rose-700 dark:text-rose-400 px-2 py-0.5">
                              {student.stats.percentage}%
                            </span>
                          </div>
                          <div className="mt-4">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(100, student.stats.percentage)}%` }} />
                            </div>
                            <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-rose-650 dark:text-rose-450">
                              {student.stats.present} / {student.stats.total} sessions present
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-900/5 text-center p-4">
                      All student attendance records currently meet standard requirements.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="matrix" className="mt-0 space-y-6">
            <div className="rounded-[28px] border border-slate-105 dark:border-slate-800/60 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 dark:border-slate-800/60 p-6 bg-slate-50/20 dark:bg-slate-900/5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Master Attendance Sheet</h2>
                    <p className="text-xs text-slate-400 mt-1">Cross-reference view of student attendance across all recorded dates</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4.5">
                    {/* Month Filter Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Select Month:</span>
                      <select
                        value={selectedMatrixMonth}
                        onChange={(e) => setSelectedMatrixMonth(e.target.value)}
                        className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-sm outline-none focus:border-indigo-500 appearance-none pr-8 relative"
                      >
                        <option value="all">All Months</option>
                        {uniqueMonths.map((m) => {
                          let label = m;
                          try {
                            const [year, month] = m.split("-");
                            const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
                            label = dateObj.toLocaleDateString(undefined, { month: "long", year: "numeric" });
                          } catch (e) {}
                          return (
                            <option key={m} value={m}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="flex items-center gap-3.5 text-xs font-bold text-slate-400">
                      <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present (P)</div>
                      <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent (A)</div>
                      <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late (L)</div>
                      <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Leave (Lv)</div>
                    </div>

                    {/* Excel Export Button */}
                    {students.length > 0 && uniqueDates.length > 0 && selectedCourseInfo && (
                      <button
                        onClick={() => {
                          exportStudentAttendanceWorkbook(
                            selectedCourseInfo,
                            students,
                            courseRecords,
                            uniqueDates
                          );
                        }}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm hover:shadow transition-all duration-150"
                      >
                        <FileDown className="h-4 w-4" />
                        Download Register
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {loadingHistory || loadingStudents ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
                  </div>
                ) : !students.length ? (
                  <div className="flex h-64 flex-col items-center justify-center text-slate-400 text-center">
                    <Users className="h-10 w-10 text-slate-200 mb-3" />
                    <p className="font-black text-slate-650">No Enrolled Students</p>
                  </div>
                ) : uniqueDates.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-slate-400 text-center">
                    <CalendarDays className="h-10 w-10 text-slate-200 mb-3" />
                    <p className="font-black text-slate-650">No Marked Sessions Yet</p>
                    <p className="text-xs text-slate-450 mt-1">Mark attendance in the Register Attendance tab to generate matrix data.</p>
                  </div>
                ) : filteredUniqueDates.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-slate-400 text-center">
                    <CalendarDays className="h-10 w-10 text-slate-200 mb-3" />
                    <p className="font-black text-slate-650">No Sessions Found for Selected Month</p>
                    <p className="text-xs text-slate-450 mt-1">Try selecting a different month or "All Months" to view historical records.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm max-w-full">
                    <table className="w-full border-collapse bg-white dark:bg-slate-950 text-left">
                      <thead className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/50 sticky top-0 z-10">
                        <tr>
                          {/* Student Info column header (sticky left) */}
                          <th className="sticky left-0 bg-slate-50 dark:bg-slate-900 z-20 p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-slate-800/60 min-w-[240px]">
                            Student Info
                          </th>
                          {/* Cumulative average score */}
                          <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center border-r border-slate-100 dark:border-slate-800/60 min-w-[80px]">
                            Avg
                          </th>
                          {/* Date columns */}
                          {filteredUniqueDates.map((dateStr) => {
                            const dateObj = new Date(dateStr);
                            const formattedDate = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                            return (
                              <th
                                key={dateStr}
                                onClick={() => {
                                  setSelectedDate(dateStr);
                                  setActiveTab("manage");
                                }}
                                className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-505 dark:text-slate-450 text-center hover:bg-slate-100/50 dark:hover:bg-slate-800/40 cursor-pointer min-w-[80px] transition-colors group"
                                title="Click to edit session roster"
                              >
                                <div className="flex flex-col items-center">
                                  <span>{formattedDate}</span>
                                  <span className="text-[8px] font-semibold text-indigo-505 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                        {students.map((student) => {
                          const stats = studentStats[student.userId] || { present: 0, total: 0, percentage: 0, absent: 0 };
                          const isAtRisk = stats.total > 0 && stats.percentage < courseMinimum;
                          
                          return (
                            <tr key={student.userId} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/5 transition-colors">
                              {/* Student details (sticky left) */}
                              <td className="sticky left-0 bg-white dark:bg-slate-950 z-20 p-4 border-r border-slate-100 dark:border-slate-800/60 shadow-[3px_0_5px_-3px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                                    {student.name?.charAt(0)?.toUpperCase() || "S"}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-black text-slate-900 dark:text-white leading-none">{student.name}</p>
                                    <p className="truncate text-[9px] font-black tracking-widest text-indigo-505 dark:text-indigo-400 uppercase mt-1">
                                      {student.rollNo ?? `GC-${String(student.userId).padStart(2, "0")}`}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Cumulative average */}
                              <td className="p-4 text-center border-r border-slate-100 dark:border-slate-800/60 font-black text-xs">
                                <span className={isAtRisk ? "text-rose-600 dark:text-rose-450" : "text-emerald-600 dark:text-emerald-450"}>
                                  {stats.total > 0 ? `${stats.percentage}%` : "-"}
                                </span>
                              </td>

                              {/* Date statuses */}
                              {filteredUniqueDates.map((dateStr) => {
                                const status = matrixLookup[`${student.userId}_${dateStr}`];
                                
                                let badgeClass = "bg-slate-50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-700";
                                let label = "-";
                                
                                if (status === "present") {
                                  badgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450";
                                  label = "P";
                                } else if (status === "absent") {
                                  badgeClass = "bg-rose-500/10 text-rose-650 dark:text-rose-400";
                                  label = "A";
                                } else if (status === "late") {
                                  badgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-450";
                                  label = "L";
                                } else if (status === "leave") {
                                  badgeClass = "bg-sky-500/10 text-sky-600 dark:text-sky-400";
                                  label = "Lv";
                                }

                                return (
                                  <td key={dateStr} className="p-2 text-center align-middle">
                                    <span className={`inline-flex w-7.5 h-7.5 items-center justify-center rounded-full text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                                      {label}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="mt-0 space-y-6">
            <div className="rounded-[28px] border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
              {/* Header section with primary save/update action */}
              <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800/60 p-6 sm:flex-row sm:items-center sm:justify-between bg-slate-50/40 dark:bg-slate-900/10">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Register Session Attendance</h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Registering attendance for <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{(selectedCourseInfo?.title) || "the selected course"}</span> on <span className="font-extrabold text-indigo-650 dark:text-indigo-400">{selectedDate}</span>.
                  </p>
                </div>
                <Button 
                  className="h-11 rounded-xl px-6 font-bold shadow-md shadow-indigo-500/15 hover:shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-700 text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:bg-indigo-600/50" 
                  onClick={handleSave} 
                  disabled={!students.length || saveMutation.isPending}
                >
                  {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" /> : <Save className="mr-2 h-4 w-4 text-white" />}
                  <span className="text-white font-extrabold">
                    {existingRecords.length > 0 ? "Update Attendance" : "Save Attendance"}
                  </span>
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Search, Filter & Bulk Actions Bar */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 dark:border-slate-800/60 pb-6">
                  <div className="flex flex-1 flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 group">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search students by name or email..."
                        className="h-10.5 rounded-xl border-slate-200 dark:border-slate-800 pl-10 focus-visible:ring-0 focus-visible:border-indigo-500 font-semibold bg-white dark:bg-slate-900"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as AttendanceStatus | "all")}
                      className="h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100 shadow-sm outline-none focus:border-indigo-500 appearance-none pr-8 relative"
                    >
                      <option value="all">All Statuses</option>
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bulk Operations Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-505 px-2 tracking-wider">Bulk Mark:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg text-xs font-black text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-955/20 px-3 border border-emerald-100/50 dark:border-emerald-900/30"
                      onClick={() => setVisibleStatus("present")}
                      disabled={!filteredStudents.length}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      All Present
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg text-xs font-black text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 px-3 border border-rose-100/50 dark:border-rose-900/30"
                      onClick={() => setVisibleStatus("absent")}
                      disabled={!filteredStudents.length}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      All Absent
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg text-xs font-black text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-955/25 px-3 border border-amber-100/50 dark:border-amber-900/30"
                      onClick={() => setVisibleStatus("late")}
                      disabled={!filteredStudents.length}
                    >
                      <Clock className="mr-1.5 h-3.5 w-3.5" />
                      All Late
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg text-xs font-black text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-955/20 px-3 border border-sky-100/50 dark:border-sky-900/30"
                      onClick={() => setVisibleStatus("leave")}
                      disabled={!filteredStudents.length}
                    >
                      <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                      All Leave
                    </Button>
                  </div>
                </div>

                {isLoadingSheet ? (
                  <div className="flex min-h-72 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
                  </div>
                ) : sheetError ? (
                  <div className="flex min-h-72 flex-col items-center justify-center text-center text-rose-600 p-6">
                    <AlertCircle className="mb-3 h-10 w-10 text-rose-500 animate-bounce" />
                    <p className="font-black text-base">Attendance records could not be loaded.</p>
                    <p className="mt-1 max-w-md text-xs text-slate-400">{(sheetError as Error).message}</p>
                  </div>
                ) : !students.length ? (
                  <div className="flex min-h-72 flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 p-6">
                    <Users className="mb-3 h-12 w-12 text-slate-200 dark:text-slate-800" />
                    <p className="font-black text-slate-700 dark:text-slate-350">No Enrolled Students Found</p>
                    <p className="mt-1 text-xs max-w-sm">No active student enrollments exist for this course yet. Once active, student records will display here.</p>
                  </div>
                ) : !filteredStudents.length ? (
                  <div className="flex min-h-56 flex-col items-center justify-center text-center text-slate-400 dark:text-slate-550">
                    <Search className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-800" />
                    <p className="font-bold text-slate-600 dark:text-slate-400">No matches for current query or filter status.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
                    <table className="w-full min-w-[1100px] border-collapse bg-white dark:bg-slate-950">
                      <thead className="bg-slate-50/50 dark:bg-slate-900/30">
                        <tr className="border-b border-slate-100 dark:border-slate-800/50 text-left">
                          <th className="w-[12%] p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Attendance Check</th>
                          <th className="w-[24%] p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Student Info</th>
                          <th className="w-[18%] p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Overall Attendance</th>
                          <th className="w-[22%] p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Mark Status</th>
                          <th className="w-[18%] p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Session Notes</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center w-20">Export</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                        {filteredStudents.map((student) => {
                          const activeStatus = attendanceState[student.userId] || "present";
                          const stats = studentStats[student.userId] || { present: 0, total: 0, percentage: 0, absent: 0 };
                          const isAtRisk = stats.total > 0 && stats.percentage < courseMinimum;
  
                          return (
                            <tr key={student.userId} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/5 transition-colors">
                              <td className="p-4 align-middle">
                                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-705 dark:text-slate-300 cursor-pointer">
                                  <Checkbox
                                    id={`check-${student.userId}`}
                                    checked={activeStatus === "present"}
                                    onCheckedChange={(checked) => setStatus(student.userId, checked ? "present" : "absent")}
                                    className="h-4.5 w-4.5 rounded-md border-slate-300 text-indigo-650 focus:ring-indigo-500/25"
                                  />
                                  <span className={activeStatus === "present" ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : ""}>
                                    Present
                                  </span>
                                </label>
                              </td>
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black text-sm">
                                    {student.name?.charAt(0)?.toUpperCase() || "S"}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-slate-900 dark:text-white">{student.name}</p>
                                    <p className="truncate text-[10px] font-black tracking-widest text-indigo-500 dark:text-indigo-400 uppercase mt-0.5">
                                      {student.rollNo ?? `GC-${String(student.userId).padStart(2, "0")}`}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <div className="space-y-1.5 max-w-[160px]">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-xs font-black ${isAtRisk ? "text-rose-600 dark:text-rose-450" : "text-slate-805 dark:text-slate-200"}`}>
                                      {stats.total > 0 ? `${stats.percentage}%` : "No history"}
                                    </span>
                                    {stats.total > 0 ? (
                                      isAtRisk ? (
                                        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 border border-rose-250/20">
                                          <span className="h-1 w-1 rounded-full bg-rose-500" />
                                          Restricted
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-450 border border-emerald-200/20">
                                          <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                          Eligible
                                        </span>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border border-slate-200/30 dark:border-slate-800/40">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                      className={`h-full rounded-full transition-all ${isAtRisk ? "bg-rose-500" : "bg-emerald-500"}`}
                                      style={{ width: `${Math.min(100, stats.percentage)}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                    {stats.present}/{stats.total} sessions present
                                  </p>
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <div className="inline-flex rounded-xl bg-slate-50 dark:bg-slate-900/60 p-1 border border-slate-100 dark:border-slate-800/40">
                                  {statusOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isActive = activeStatus === option.value;
                                    
                                    const customActiveBg = 
                                      option.value === "present" ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20" :
                                      option.value === "absent" ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20" :
                                      option.value === "late" ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20" :
                                      "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20";
  
                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        className={`flex items-center justify-center gap-1.5 h-8 rounded-lg px-3 text-[11px] font-black transition-all ${
                                          isActive 
                                            ? `${customActiveBg} scale-[1.02]` 
                                            : "text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-205 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 bg-transparent border-none"
                                        }`}
                                        onClick={() => setStatus(student.userId, option.value)}
                                      >
                                        <Icon className="h-3.5 w-3.5 shrink-0" />
                                        <span className="hidden md:inline">{option.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <Input
                                  value={notesState[student.userId] || ""}
                                  onChange={(event) => setNotesState((prev) => ({ ...prev, [student.userId]: event.target.value }))}
                                  placeholder="Add optional notes..."
                                  className="h-9.5 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold focus-visible:ring-0 focus-visible:border-indigo-500 bg-transparent"
                                />
                              </td>
                              <td className="p-4 align-middle text-center">
                                {selectedCourseInfo && (
                                  <button
                                    title={`Download ${student.name}'s attendance report`}
                                    onClick={() => {
                                      exportSingleStudentWorkbook(
                                        selectedCourseInfo,
                                        student,
                                        courseRecords
                                      );
                                    }}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-650 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                                  >
                                    <FileDown className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
