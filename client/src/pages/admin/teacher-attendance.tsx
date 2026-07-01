import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle,
  AlertCircle, Coffee, Briefcase, Save, Search, Users, TrendingUp, UserCheck,
  ChevronLeft, ChevronRight, Grid3X3, FileDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  exportAllTeachersSummary,
  exportSingleTeacherReport,
  exportMonthlyMatrix,
  exportMonthlySummaryReport,
  exportAllTimeRankings,
  type TeacherSummary,
} from "@/lib/exportAttendance";

interface Teacher {
  id: number;
  name: string;
  email: string;
  branchId: number | null;
}

interface AttendanceRecord {
  teacherId: number;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  leaveType?: string;
}

interface AttendanceHistoryRecord {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingHours: string | null;
  notes: string | null;
  leaveType: string | null;
  isApproved: boolean;
}

// Monthly calendar types
interface CalendarDay {
  day: number;
  dateStr: string;
  isWeekend: boolean;
  isToday: boolean;
}

const STATUS_CYCLE = ["present", "absent", "late", "half_day", "leave"];

const STATUS_STYLES: Record<string, string> = {
  present:  "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200",
  absent:   "bg-red-100    text-red-700    border-red-300    hover:bg-red-200",
  late:     "bg-amber-100  text-amber-700  border-amber-300  hover:bg-amber-200",
  half_day: "bg-blue-100   text-blue-700   border-blue-300   hover:bg-blue-200",
  leave:    "bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200",
  weekend:  "bg-slate-100  text-slate-400  border-slate-200  cursor-not-allowed opacity-60",
};

const STATUS_LABEL: Record<string, string> = {
  present: "P", absent: "A", late: "L", half_day: "H", leave: "Lv", weekend: "OFF",
};

export default function AdminTeacherAttendance() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, AttendanceRecord>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [savedDailyIds, setSavedDailyIds] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyRecords, setHistoryRecords] = useState<AttendanceHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth() + 1);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [historyTeacherId, setHistoryTeacherId] = useState<number | "all">("all");
  const [historyStatus, setHistoryStatus] = useState<string>("all");

  // High-standard History Dash states
  const [historyViewMode, setHistoryViewMode] = useState<"daily" | "monthly_summary" | "all_time">("daily");
  const [historyDateFilterType, setHistoryDateFilterType] = useState<"month" | "custom" | "all_time">("month");
  const [historyStartDate, setHistoryStartDate] = useState<string>("");
  const [historyEndDate, setHistoryEndDate] = useState<string>("");

  // ── Monthly view state ──────────────────────────────────────────────────
  const [monthlyTeacherId, setMonthlyTeacherId] = useState<number | "">("");
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [monthlyYear,  setMonthlyYear]  = useState(new Date().getFullYear());
  const [monthlyDayStatus, setMonthlyDayStatus] = useState<Record<string, string>>({});
  const [isFetchingMonthly, setIsFetchingMonthly] = useState(false);
  const [isSavingMonthly,   setIsSavingMonthly]   = useState(false);

  // Build calendar days array for a given month/year
  const buildCalendar = useCallback((month: number, year: number): (CalendarDay | null)[] => {
    const todayStr = new Date().toISOString().split('T')[0];
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    // Mon=0 … Sun=6 offset
    let offset = firstDay.getDay() - 1;
    if (offset === -1) offset = 6;
    const cells: (CalendarDay | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month - 1, d).getDay();
      const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      cells.push({ day: d, dateStr, isWeekend: dow === 0 || dow === 6, isToday: dateStr === todayStr });
    }
    return cells;
  }, []);

  // Initialise monthlyDayStatus from calendar (weekday=present, weekend=weekend)
  const initMonthlyStatus = useCallback((month: number, year: number) => {
    const map: Record<string, string> = {};
    buildCalendar(month, year).forEach(cell => {
      if (cell) map[cell.dateStr] = cell.isWeekend ? "weekend" : "present";
    });
    return map;
  }, [buildCalendar]);

  // Fetch existing records for the selected teacher+month and overlay them
  const fetchMonthlyData = useCallback(async (teacherId: number, month: number, year: number) => {
    setIsFetchingMonthly(true);
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const res = await fetch(
        `${window.location.origin}/api/teacher-attendance/all?teacherId=${teacherId}&month=${month}&year=${year}`,
        { headers }
      );
      const base = initMonthlyStatus(month, year);
      if (res.ok) {
        const data: { date: string; status: string }[] = await res.json();
        data.forEach(r => { if (base[r.date] !== undefined) base[r.date] = r.status; });
      }
      setMonthlyDayStatus(base);
    } catch { /* silent */ } finally { setIsFetchingMonthly(false); }
  }, [token, initMonthlyStatus]);

  // Re-fetch whenever teacher / month / year changes
  useEffect(() => {
    if (monthlyTeacherId && token) {
      fetchMonthlyData(Number(monthlyTeacherId), monthlyMonth, monthlyYear);
    } else {
      setMonthlyDayStatus(initMonthlyStatus(monthlyMonth, monthlyYear));
    }
  }, [monthlyTeacherId, monthlyMonth, monthlyYear, token, fetchMonthlyData, initMonthlyStatus]);

  const cycleStatus = (current: string) => {
    const idx = STATUS_CYCLE.indexOf(current);
    return idx === -1 ? "present" : STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
  };

  const handleDayClick = (dateStr: string) => {
    setMonthlyDayStatus(prev => {
      if (prev[dateStr] === "weekend") return prev;
      return { ...prev, [dateStr]: cycleStatus(prev[dateStr]) };
    });
  };

  const markAllWeekdays = (status: string) => {
    setMonthlyDayStatus(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(d => { if (next[d] !== "weekend") next[d] = status; });
      return next;
    });
  };

  const saveMonthlyAttendance = async () => {
    if (!monthlyTeacherId) {
      toast({ title: "Select a teacher first", variant: "destructive" }); return;
    }
    setIsSavingMonthly(true);
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const records = Object.entries(monthlyDayStatus).map(([date, status]) => ({ date, status }));
      const res = await fetch(`${window.location.origin}/api/teacher-attendance/monthly-bulk`, {
        method: "POST",
        headers,
        body: JSON.stringify({ teacherId: monthlyTeacherId, month: monthlyMonth, year: monthlyYear, records }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: "Saved!", description: `${data.savedRecords} working-day records saved.` });
        fetchHistory();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Save failed", variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Network error", variant: "destructive" }); }
    finally { setIsSavingMonthly(false); }
  };

  const monthlySummary = Object.values(monthlyDayStatus).reduce(
    (acc, s) => { if (s !== "weekend") acc[s] = (acc[s] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const res = await fetch(`${window.location.origin}/api/teacher-attendance/teachers`, { headers });
      
      console.log("Fetch teachers response status:", res.status);
      console.log("Response headers:", res.headers);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Teachers fetched:", data);
        setTeachers(data);
        
        // Initialize attendance records for all teachers
        const initialRecords: Record<number, AttendanceRecord> = {};
        data.forEach((teacher: Teacher) => {
          initialRecords[teacher.id] = {
            teacherId: teacher.id,
            status: "present",
            checkInTime: "09:00",
            checkOutTime: "",
            notes: "",
            leaveType: ""
          };
        });
        setAttendanceRecords(initialRecords);
      } else {
        const errorText = await res.text();
        console.error("Failed to fetch teachers. Status:", res.status, "Response:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Unknown error" };
        }
        
        toast({
          title: "Error Loading Teachers",
          description: `Status ${res.status}: ${errorData.error || errorText || "Unknown error"}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Exception while fetching teachers:", error);
      toast({
        title: "Network Error",
        description: `Failed to connect to server: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyAttendance = useCallback(async (date: string) => {
    if (!token || teachers.length === 0) return;
    setIsLoadingDaily(true);
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const res = await fetch(
        `${window.location.origin}/api/teacher-attendance/all?startDate=${date}&endDate=${date}`,
        { headers }
      );
      if (res.ok) {
        const data: AttendanceHistoryRecord[] = await res.json();
        const savedIds = new Set<number>();
        const updatedRecords: Record<number, AttendanceRecord> = {};

        teachers.forEach(teacher => {
          const matching = data.find(r => r.teacherId === teacher.id);
          if (matching) {
            updatedRecords[teacher.id] = {
              teacherId: teacher.id,
              status: matching.status,
              checkInTime: matching.checkInTime || "",
              checkOutTime: matching.checkOutTime || "",
              notes: matching.notes || "",
              leaveType: matching.leaveType || ""
            };
            savedIds.add(teacher.id);
          } else {
            updatedRecords[teacher.id] = {
              teacherId: teacher.id,
              status: "present",
              checkInTime: "09:00",
              checkOutTime: "",
              notes: "",
              leaveType: ""
            };
          }
        });

        setAttendanceRecords(updatedRecords);
        setSavedDailyIds(savedIds);
      }
    } catch (error) {
      console.error("Failed to fetch daily attendance:", error);
    } finally {
      setIsLoadingDaily(false);
    }
  }, [token, teachers]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      let url = `${window.location.origin}/api/teacher-attendance/all?`;
      const params: string[] = [];

      if (historyDateFilterType === "month") {
        params.push(`month=${historyMonth}`);
        params.push(`year=${historyYear}`);
      } else if (historyDateFilterType === "custom") {
        if (historyStartDate) params.push(`startDate=${historyStartDate}`);
        if (historyEndDate) params.push(`endDate=${historyEndDate}`);
      }

      if (historyTeacherId !== "all") {
        params.push(`teacherId=${historyTeacherId}`);
      }
      if (historyStatus !== "all") {
        params.push(`status=${historyStatus}`);
      }

      url += params.join("&");
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setHistoryRecords(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTeachers();
    }
  }, [token]); // Only run when token changes

  useEffect(() => {
    if (token && teachers.length > 0) {
      fetchDailyAttendance(selectedDate);
    }
  }, [selectedDate, teachers, token, fetchDailyAttendance]);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [historyMonth, historyYear, historyTeacherId, historyStatus, historyDateFilterType, historyStartDate, historyEndDate, token]); // Refetch on filters change

  const handleStatusChange = (teacherId: number, status: string) => {
    setAttendanceRecords(prev => {
      const record = prev[teacherId] || { teacherId };
      const updated = { ...record, status };
      if (status === "absent" || status === "leave") {
        updated.checkInTime = "";
        updated.checkOutTime = "";
      } else if (status === "present" && !record.checkInTime) {
        updated.checkInTime = "09:00";
      }
      return {
        ...prev,
        [teacherId]: updated
      };
    });
  };

  const handleFieldChange = (teacherId: number, field: keyof AttendanceRecord, value: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], [field]: value }
    }));
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      
      const records = Object.values(attendanceRecords).map(record => ({
        teacherId: record.teacherId,
        status: record.status,
        checkInTime: record.checkInTime || null,
        checkOutTime: record.checkOutTime || null,
        notes: record.notes || null,
        leaveType: record.status === "leave" ? record.leaveType : null
      }));

      const res = await fetch(`${window.location.origin}/api/teacher-attendance/bulk`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          date: selectedDate,
          records
        })
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Teacher attendance saved successfully",
        });
        const savedIds = new Set(Object.keys(attendanceRecords).map(Number));
        setSavedDailyIds(savedIds);
        fetchHistory(); // Refresh history
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save attendance",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Present</Badge>;
      case "absent":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Absent</Badge>;
      case "late":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Late</Badge>;
      case "half_day":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Half Day</Badge>;
      case "leave":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Leave</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const historySummary = historyRecords.reduce(
    (acc, record) => {
      acc.total += 1;
      const statusKey = record.status;
      if (acc[statusKey] !== undefined) {
        acc[statusKey] += 1;
      }
      return acc;
    },
    { total: 0, present: 0, absent: 0, late: 0, half_day: 0, leave: 0 } as Record<string, number>
  );

  const historyAttendanceRate = historySummary.total > 0
    ? Math.round(((historySummary.present + historySummary.late) / historySummary.total) * 100)
    : 0;

  // Calculate summary stats grouped by teacher from current history records
  const teacherSummaries = useMemo(() => {
    const summaryMap: Record<number, {
      teacherName: string;
      teacherEmail: string;
      total: number;
      present: number;
      absent: number;
      late: number;
      half_day: number;
      leave: number;
      totalHours: number;
      checkInMinutes: number[];
      checkOutMinutes: number[];
    }> = {};

    historyRecords.forEach(r => {
      if (!summaryMap[r.teacherId]) {
        summaryMap[r.teacherId] = {
          teacherName: r.teacherName || "Unknown",
          teacherEmail: r.teacherEmail || "",
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          half_day: 0,
          leave: 0,
          totalHours: 0,
          checkInMinutes: [],
          checkOutMinutes: []
        };
      }

      const s = summaryMap[r.teacherId];
      s.total++;
      if (r.status === "present") s.present++;
      else if (r.status === "absent") s.absent++;
      else if (r.status === "late") s.late++;
      else if (r.status === "half_day") s.half_day++;
      else if (r.status === "leave") s.leave++;

      if (r.workingHours) {
        const parts = r.workingHours.split(":");
        if (parts.length >= 2) {
          const hrs = parseFloat(parts[0]) + parseFloat(parts[1]) / 60;
          s.totalHours += hrs;
        } else {
          const hrs = parseFloat(r.workingHours);
          if (!isNaN(hrs)) s.totalHours += hrs;
        }
      }

      if (r.checkInTime && r.checkInTime.includes(":")) {
        const [h, m] = r.checkInTime.split(":").map(Number);
        s.checkInMinutes.push(h * 60 + m);
      }
      if (r.checkOutTime && r.checkOutTime.includes(":")) {
        const [h, m] = r.checkOutTime.split(":").map(Number);
        s.checkOutMinutes.push(h * 60 + m);
      }
    });

    return Object.entries(summaryMap).map(([idStr, s]) => {
      const id = Number(idStr);
      const avgCheckInMin = s.checkInMinutes.length > 0 ? Math.round(s.checkInMinutes.reduce((a,b)=>a+b, 0) / s.checkInMinutes.length) : null;
      const avgCheckOutMin = s.checkOutMinutes.length > 0 ? Math.round(s.checkOutMinutes.reduce((a,b)=>a+b, 0) / s.checkOutMinutes.length) : null;

      const formatMin = (m: number | null) => {
        if (m === null) return "—";
        const hr = Math.floor(m / 60);
        const min = m % 60;
        return `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      };

      const presentRate = s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0;

      return {
        teacherId: id,
        ...s,
        avgCheckIn: formatMin(avgCheckInMin),
        avgCheckOut: formatMin(avgCheckOutMin),
        presentRate,
        formattedHours: s.totalHours.toFixed(1)
      };
    }).sort((a, b) => b.presentRate - a.presentRate); // Sorted by attendance rate
  }, [historyRecords]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 bg-[#f8fafc] min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Teacher Attendance Management</h1>
          <p className="text-sm text-slate-500">Mark and manage teacher attendance records</p>
        </div>

        <Tabs defaultValue="mark" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="mark" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Mark Daily
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              Monthly View
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Mark Attendance Tab */}
          <TabsContent value="mark" className="space-y-6">
            {/* Date Selector */}
            <Card className="border border-slate-100 shadow-sm rounded-xl bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-slate-500" />
                    <label className="text-sm font-semibold text-slate-700">Date:</label>
                  </div>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="max-w-xs"
                  />
                  <div className="ml-auto flex items-center gap-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search teachers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teacher Attendance Table */}
            <Card className="border border-slate-100 shadow-sm rounded-xl bg-white overflow-hidden">
              {/* Table toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <p className="text-sm font-semibold text-slate-700">
                  {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? "s" : ""}
                  {" · "}
                  <span className="text-emerald-600">{Object.values(attendanceRecords).filter(r => r.status === "present").length} P</span>
                  {" · "}
                  <span className="text-red-500">{Object.values(attendanceRecords).filter(r => r.status === "absent").length} A</span>
                  {" · "}
                  <span className="text-amber-500">{Object.values(attendanceRecords).filter(r => r.status === "late").length} L</span>
                  {" · "}
                  <span className="text-blue-500">{Object.values(attendanceRecords).filter(r => r.status === "half_day").length} H</span>
                  {" · "}
                  <span className="text-purple-500">{Object.values(attendanceRecords).filter(r => r.status === "leave").length} Lv</span>
                </p>
                <div className="flex items-center gap-2">
                  {/* Bulk action buttons */}
                  <button
                    onClick={() => {
                      const updated = { ...attendanceRecords };
                      filteredTeachers.forEach(t => {
                        updated[t.id] = { ...updated[t.id], teacherId: t.id, status: "present" };
                      });
                      setAttendanceRecords(updated);
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    ✓ All Present
                  </button>
                  <button
                    onClick={() => {
                      const updated = { ...attendanceRecords };
                      filteredTeachers.forEach(t => {
                        updated[t.id] = { ...updated[t.id], teacherId: t.id, status: "absent" };
                      });
                      setAttendanceRecords(updated);
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                  >
                    ✗ All Absent
                  </button>
                </div>
              </div>

              {isLoading || isLoadingDaily ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Check In</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Check Out</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Saved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 animate-pulse">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          {/* # */}
                          <td className="py-2.5 px-4 text-xs text-slate-300 font-mono">{i + 1}</td>
                          {/* Teacher */}
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
                              <div className="space-y-1.5">
                                <div className="h-3.5 w-28 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
                              </div>
                            </div>
                          </td>
                          {/* Status */}
                          <td className="py-2.5 px-4">
                            <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
                          </td>
                          {/* Check In */}
                          <td className="py-2.5 px-4">
                            <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
                          </td>
                          {/* Check Out */}
                          <td className="py-2.5 px-4">
                            <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
                          </td>
                          {/* Notes */}
                          <td className="py-2.5 px-4">
                            <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
                          </td>
                          {/* Saved status */}
                          <td className="py-2.5 px-4 text-center">
                            <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : filteredTeachers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Check In</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Check Out</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Saved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredTeachers.map((teacher, idx) => {
                        const record = attendanceRecords[teacher.id] || { teacherId: teacher.id, status: "present" };
                        const isSaved = savedDailyIds.has(teacher.id);
                        const isAbsentOrLeave = record.status === "absent" || record.status === "leave";

                        const rowBg =
                          record.status === "present"  ? "hover:bg-emerald-50/30" :
                          record.status === "absent"   ? "hover:bg-red-50/30 bg-red-50/10" :
                          record.status === "late"     ? "hover:bg-amber-50/30 bg-amber-50/10" :
                          record.status === "half_day" ? "hover:bg-blue-50/30 bg-blue-50/10" :
                          record.status === "leave"    ? "hover:bg-purple-50/30 bg-purple-50/10" :
                          "hover:bg-slate-50";

                        const statusColor =
                          record.status === "present"  ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                          record.status === "absent"   ? "bg-red-100 text-red-800 border-red-300" :
                          record.status === "late"     ? "bg-amber-100 text-amber-800 border-amber-300" :
                          record.status === "half_day" ? "bg-blue-100 text-blue-800 border-blue-300" :
                          record.status === "leave"    ? "bg-purple-100 text-purple-800 border-purple-300" :
                          "bg-slate-100 text-slate-700 border-slate-300";

                        return (
                          <tr key={teacher.id} className={`transition-colors ${rowBg}`}>
                            {/* # */}
                            <td className="py-2.5 px-4 text-xs text-slate-400 font-mono">{idx + 1}</td>

                            {/* Teacher info */}
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {teacher.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 truncate">{teacher.name}</p>
                                  <p className="text-[11px] text-slate-400 truncate">{teacher.email}</p>
                                </div>
                              </div>
                            </td>

                            {/* Status dropdown */}
                            <td className="py-2.5 px-4">
                              <select
                                value={record.status || "present"}
                                onChange={(e) => handleStatusChange(teacher.id, e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors cursor-pointer ${statusColor}`}
                              >
                                <option value="present">✓ Present</option>
                                <option value="absent">✗ Absent</option>
                                <option value="late">⏰ Late</option>
                                <option value="half_day">½ Half Day</option>
                                <option value="leave">🏖 Leave</option>
                              </select>
                            </td>

                            {/* Check In */}
                            <td className="py-2.5 px-4">
                              <input
                                type="time"
                                disabled={isAbsentOrLeave}
                                value={isAbsentOrLeave ? "" : (record.checkInTime || "")}
                                onChange={(e) => handleFieldChange(teacher.id, "checkInTime", e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed"
                              />
                            </td>

                            {/* Check Out */}
                            <td className="py-2.5 px-4">
                              <input
                                type="time"
                                disabled={isAbsentOrLeave}
                                value={isAbsentOrLeave ? "" : (record.checkOutTime || "")}
                                onChange={(e) => handleFieldChange(teacher.id, "checkOutTime", e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed"
                              />
                            </td>

                            {/* Notes */}
                            <td className="py-2.5 px-4">
                              {record.status === "leave" ? (
                                <select
                                  value={record.leaveType || ""}
                                  onChange={(e) => handleFieldChange(teacher.id, "leaveType", e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                >
                                  <option value="">Leave type...</option>
                                  <option value="sick">Sick Leave</option>
                                  <option value="casual">Casual Leave</option>
                                  <option value="earned">Earned Leave</option>
                                  <option value="unpaid">Unpaid Leave</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Notes..."
                                  value={record.notes || ""}
                                  onChange={(e) => handleFieldChange(teacher.id, "notes", e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white placeholder:text-slate-300"
                                />
                              )}
                            </td>

                            {/* Saved badge */}
                            <td className="py-2.5 px-4 text-center">
                              {isSaved ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                  <CheckCircle2 className="h-3 w-3" /> Saved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                  <AlertCircle className="h-3 w-3" /> Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No teachers found</p>
                  <p className="text-xs mt-1">
                    {searchQuery ? "Try adjusting your search query" : "No teachers are registered in the system yet"}
                  </p>
                </div>
              )}

              {/* Save footer */}
              {!isLoading && filteredTeachers.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/60">
                  <p className="text-xs text-slate-400">
                    {savedDailyIds.size} of {filteredTeachers.length} teachers already saved for this date
                  </p>
                  <Button
                    onClick={handleSaveAttendance}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Attendance
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            {/* View Mode & Date Range Type Toggles */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl self-stretch lg:self-auto">
                <button
                  onClick={() => setHistoryViewMode("daily")}
                  className={`flex-1 lg:flex-initial text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                    historyViewMode === "daily" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  📋 Daily Logs
                </button>
                <button
                  onClick={() => setHistoryViewMode("monthly_summary")}
                  className={`flex-1 lg:flex-initial text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                    historyViewMode === "monthly_summary" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  📊 Monthly summary
                </button>
                <button
                  onClick={() => setHistoryViewMode("all_time")}
                  className={`flex-1 lg:flex-initial text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                    historyViewMode === "all_time" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  🏆 Performance Rank
                </button>
              </div>

              {/* Date Filter Type Selector */}
              <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Range:</span>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {["month", "custom", "all_time"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setHistoryDateFilterType(t as any)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                        historyDateFilterType === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {t === "month" ? "Selected Month" : t === "custom" ? "Custom Range" : "All Time"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Controls Card */}
            <Card className="border border-slate-100 shadow-sm rounded-xl bg-white">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                  
                  {/* Dynamic Date Inputs */}
                  {historyDateFilterType === "month" && (
                    <div className="flex items-center gap-2">
                      <select
                        value={historyMonth}
                        onChange={(e) => setHistoryMonth(Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
                      >
                        {months.map((month, index) => (
                          <option key={index} value={index + 1}>{month}</option>
                        ))}
                      </select>
                      <select
                        value={historyYear}
                        onChange={(e) => setHistoryYear(Number(e.target.value))}
                        className="w-[100px] px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {historyDateFilterType === "custom" && (
                    <div className="flex items-center gap-2 col-span-1 md:col-span-2 lg:col-span-1">
                      <Input
                        type="date"
                        value={historyStartDate}
                        onChange={(e) => setHistoryStartDate(e.target.value)}
                        className="text-xs h-9 rounded-lg"
                        placeholder="Start Date"
                      />
                      <span className="text-slate-400 text-xs">—</span>
                      <Input
                        type="date"
                        value={historyEndDate}
                        onChange={(e) => setHistoryEndDate(e.target.value)}
                        className="text-xs h-9 rounded-lg"
                        placeholder="End Date"
                      />
                    </div>
                  )}

                  {historyDateFilterType === "all_time" && (
                    <div className="px-3 py-1.5 border border-slate-100 rounded-lg text-xs font-bold text-slate-400 bg-slate-50 flex items-center justify-center h-9">
                      Showing complete record history
                    </div>
                  )}

                  {/* Teacher Filter */}
                  <select
                    value={historyTeacherId}
                    onChange={(e) => setHistoryTeacherId(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 w-full"
                  >
                    <option value="all">All Teachers</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={historyStatus}
                    onChange={(e) => setHistoryStatus(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 w-full"
                  >
                    <option value="all">All Statuses</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half_day">Half Day</option>
                    <option value="leave">Leave</option>
                  </select>

                  {/* Reset Filters / Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHistoryTeacherId("all");
                        setHistoryStatus("all");
                        setHistoryDateFilterType("month");
                        setHistoryStartDate("");
                        setHistoryEndDate("");
                        setHistoryMonth(new Date().getMonth() + 1);
                      }}
                      className="text-xs font-semibold rounded-lg flex-1"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>

                {/* Export row — context-aware per view mode */}
                {historyRecords.length > 0 && (() => {
                  // Build a human-readable period label from current filter state
                  const rangeLabel = (() => {
                    if (historyDateFilterType === "all_time") return `All Time · ${historyYear}`;
                    if (historyDateFilterType === "custom" && historyStartDate && historyEndDate)
                      return `${historyStartDate} – ${historyEndDate}`;
                    return new Date(historyYear, historyMonth - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
                  })();

                  return (
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                        <FileDown className="h-3.5 w-3.5" />
                        Export:
                      </span>

                      {/* ── Daily Logs view: Daily Log + Attendance Register buttons ── */}
                      {historyViewMode === "daily" && (
                        <>
                          <button
                            onClick={() => exportAllTeachersSummary(historyRecords, teachers, historyMonth, historyYear, rangeLabel)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow transition-all"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                            📋 Daily Log Report
                          </button>
                          <button
                            onClick={() => exportMonthlyMatrix(historyRecords, teachers, historyMonth, historyYear)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-sm hover:shadow transition-all"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                            📊 Attendance Register
                          </button>
                          {/* Single teacher in daily mode */}
                          {historyTeacherId !== "all" && (() => {
                            const t = teachers.find(x => x.id === historyTeacherId);
                            return t ? (
                              <button
                                onClick={() => exportSingleTeacherReport(historyRecords, t.name, t.email, historyMonth, historyYear, rangeLabel)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-sm hover:shadow transition-all"
                              >
                                <FileDown className="h-3.5 w-3.5" />
                                👤 {t.name}'s Report
                              </button>
                            ) : null;
                          })()}
                        </>
                      )}

                      {/* ── Monthly Summary view ── */}
                      {historyViewMode === "monthly_summary" && (
                        <button
                          onClick={() => exportMonthlySummaryReport(teacherSummaries as TeacherSummary[], historyMonth, historyYear, rangeLabel)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-sm hover:shadow transition-all"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          📊 Monthly Summary Report
                        </button>
                      )}

                      {/* ── All-Time Rankings view ── */}
                      {historyViewMode === "all_time" && (
                        <button
                          onClick={() => exportAllTimeRankings(teacherSummaries as TeacherSummary[], rangeLabel)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-white hover:from-amber-500 hover:to-yellow-600 shadow-sm hover:shadow transition-all"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          🏆 All-Time Rankings
                        </button>
                      )}

                      <span className="text-xs text-slate-400 ml-auto font-semibold">
                        {historyRecords.length} record{historyRecords.length !== 1 ? "s" : ""} found
                      </span>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Metrics cards for stats */}
            {!isLoadingHistory && historyRecords.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
                <Card className="border border-slate-100 shadow-sm rounded-xl bg-white hover:shadow transition-shadow duration-150">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Days</p>
                    <p className="text-xl font-bold text-slate-700 mt-1">{historySummary.total}</p>
                  </CardContent>
                </Card>
                <Card className="border border-emerald-100 shadow-sm rounded-xl bg-emerald-50/20 hover:shadow transition-shadow duration-150">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Present</p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">{historySummary.present}</p>
                  </CardContent>
                </Card>
                <Card className="border border-red-100 shadow-sm rounded-xl bg-red-50/20 hover:shadow transition-shadow duration-150">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">Absent</p>
                    <p className="text-xl font-bold text-red-700 mt-1">{historySummary.absent}</p>
                  </CardContent>
                </Card>
                <Card className="border border-amber-100 shadow-sm rounded-xl bg-amber-50/20 hover:shadow transition-shadow duration-150">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Late</p>
                    <p className="text-xl font-bold text-amber-700 mt-1">{historySummary.late}</p>
                  </CardContent>
                </Card>
                <Card className="border border-blue-100 shadow-sm rounded-xl bg-blue-50/20 hover:shadow transition-shadow duration-150">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Half Day</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{historySummary.half_day}</p>
                  </CardContent>
                </Card>
                <Card className="border border-purple-100 shadow-sm rounded-xl bg-purple-50/20 hover:shadow transition-shadow duration-150">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">Leave</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">{historySummary.leave}</p>
                  </CardContent>
                </Card>
                <Card className="border border-blue-200 shadow-sm rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 hover:shadow transition-shadow duration-150 text-white">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100">Rate</p>
                    <p className="text-xl font-black mt-1 text-white">{historyAttendanceRate}%</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Table / Content list by View Mode */}
            {isLoadingHistory ? (
              <Card className="border border-slate-100 shadow-sm rounded-xl bg-white p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Teacher</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Check In</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Check Out</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Hours</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 animate-pulse">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td className="py-3 px-4">
                            <div className="h-3.5 w-28 bg-slate-100 dark:bg-slate-800 rounded-full" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-3.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-5 w-12 bg-slate-100 dark:bg-slate-800 rounded-full" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-3.5 w-10 bg-slate-100 dark:bg-slate-800 rounded-full" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-3.5 w-10 bg-slate-100 dark:bg-slate-800 rounded-full" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-3.5 w-10 bg-slate-100 dark:bg-slate-800 rounded-full" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-3.5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : historyRecords.length === 0 ? (
              <Card className="border border-slate-100 shadow-sm rounded-xl bg-white py-16 text-center text-slate-400">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No attendance records found matching filters</p>
              </Card>
            ) : (
              <>
                {/* ── MODE 1: Daily Log list ── */}
                {historyViewMode === "daily" && (
                  <Card className="border border-slate-100 shadow-sm rounded-xl bg-white overflow-hidden">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Check In</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Check Out</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Hours</th>
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
                              <th className="text-center py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Export</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {historyRecords.map((record) => (
                              <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 px-5">
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{record.teacherName}</p>
                                    <p className="text-[11px] text-slate-400">{record.teacherEmail}</p>
                                  </div>
                                </td>
                                <td className="py-3 px-5 text-xs font-semibold text-slate-600">
                                  {new Date(record.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </td>
                                <td className="py-3 px-5">{getStatusBadge(record.status)}</td>
                                <td className="py-3 px-5 text-xs text-slate-500">{record.checkInTime || "—"}</td>
                                <td className="py-3 px-5 text-xs text-slate-500">{record.checkOutTime || "—"}</td>
                                <td className="py-3 px-5 text-xs font-bold text-slate-700">{record.workingHours || "—"}</td>
                                <td className="py-3 px-5 text-xs text-slate-500 italic max-w-[200px] truncate" title={record.notes || ""}>
                                  {record.notes || "—"}
                                </td>
                                <td className="py-3 px-5 text-center">
                                  <button
                                    title={`Download ${record.teacherName}'s report`}
                                    onClick={() => {
                                      const teacherRows = historyRecords.filter(r => r.teacherId === record.teacherId);
                                      exportSingleTeacherReport(teacherRows, record.teacherName, record.teacherEmail, historyMonth, historyYear);
                                    }}
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors"
                                  >
                                    <FileDown className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ── MODE 2: Monthly Summary aggregates ── */}
                {historyViewMode === "monthly_summary" && (
                  <Card className="border border-slate-100 shadow-sm rounded-xl bg-white overflow-hidden">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                              <th className="text-left py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher</th>
                              <th className="text-center py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Rate</th>
                              <th className="text-center py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Days</th>
                              <th className="text-center py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-emerald-600">Present</th>
                              <th className="text-center py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-red-500">Absent</th>
                              <th className="text-center py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-amber-500">Late</th>
                              <th className="text-center py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-purple-500">Leave</th>
                              <th className="text-center py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Check-In</th>
                              <th className="text-center py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Hours Worked</th>
                              <th className="text-center py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Export</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {teacherSummaries.map((s: typeof teacherSummaries[number]) => {
                              let rateColor = "text-red-600 bg-red-50 border-red-200";
                              if (s.presentRate >= 90) rateColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                              else if (s.presentRate >= 75) rateColor = "text-amber-700 bg-amber-50 border-amber-200";

                              return (
                                <tr key={s.teacherId} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-3.5 px-5">
                                    <div>
                                      <p className="text-sm font-bold text-slate-800">{s.teacherName}</p>
                                      <p className="text-[11px] text-slate-400">{s.teacherEmail}</p>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-5 text-center">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black border ${rateColor}`}>
                                      {s.presentRate}%
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5 text-center text-xs font-bold text-slate-600">{s.total}</td>
                                  <td className="py-3.5 px-5 text-center text-xs font-bold text-emerald-600">{s.present}</td>
                                  <td className="py-3.5 px-5 text-center text-xs font-bold text-red-500">{s.absent}</td>
                                  <td className="py-3.5 px-5 text-center text-xs font-bold text-amber-500">{s.late}</td>
                                  <td className="py-3.5 px-5 text-center text-xs font-bold text-purple-600">{s.leave}</td>
                                  <td className="py-3.5 px-5 text-center text-xs font-semibold text-slate-500">{s.avgCheckIn}</td>
                                  <td className="py-3.5 px-5 text-center text-xs font-black text-slate-700">{s.formattedHours} hrs</td>
                                  <td className="py-3.5 px-5 text-center">
                                    <button
                                      title="Export single teacher details"
                                      onClick={() => {
                                        const teacherRows = historyRecords.filter(r => r.teacherId === s.teacherId);
                                        exportSingleTeacherReport(teacherRows, s.teacherName, s.teacherEmail, historyMonth, historyYear);
                                      }}
                                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors"
                                    >
                                      <FileDown className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ── MODE 3: All Time Leaderboard rankings ── */}
                {historyViewMode === "all_time" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {teacherSummaries.map((s: typeof teacherSummaries[number], idx: number) => {
                      let medalColor = "bg-slate-100 text-slate-600";
                      if (idx === 0) medalColor = "bg-amber-100 text-amber-700 border-amber-300 border";
                      else if (idx === 1) medalColor = "bg-slate-200 text-slate-700 border-slate-350 border";
                      else if (idx === 2) medalColor = "bg-orange-100 text-orange-700 border-orange-200 border";

                      return (
                        <Card key={s.teacherId} className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow">
                          <div className="p-5 flex items-center justify-between border-b border-slate-50 bg-slate-50/40">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 ${medalColor}`}>
                                #{idx + 1}
                              </div>
                              <div>
                                <h4 className="font-black text-slate-800 text-sm">{s.teacherName}</h4>
                                <p className="text-[10px] text-slate-400">{s.teacherEmail}</p>
                              </div>
                            </div>

                            <span className="text-xl font-black text-blue-600 shrink-0">
                              {s.presentRate}% <span className="text-[10px] font-bold text-slate-400">rate</span>
                            </span>
                          </div>

                          <div className="p-5 space-y-4">
                            {/* Performance progress bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                <span>Attendance Performance</span>
                                <span>{s.presentRate >= 90 ? "Excellent" : s.presentRate >= 75 ? "Good" : "Needs Improvement"}</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    s.presentRate >= 90 ? "bg-emerald-500" : s.presentRate >= 75 ? "bg-amber-400" : "bg-red-500"
                                  }`}
                                  style={{ width: `${s.presentRate}%` }}
                                />
                              </div>
                            </div>

                            {/* Stat breakdown pills */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 text-center">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Worked</span>
                                <span className="block text-sm font-black text-slate-700 mt-0.5">{s.formattedHours} hrs</span>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 text-center">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Avg In</span>
                                <span className="block text-sm font-black text-slate-700 mt-0.5">{s.avgCheckIn}</span>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 text-center">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Avg Out</span>
                                <span className="block text-sm font-black text-slate-700 mt-0.5">{s.avgCheckOut}</span>
                              </div>
                            </div>

                            {/* Detailed breakdown metrics */}
                            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                              <span>Days Tracked: <span className="font-bold text-slate-700">{s.total}</span></span>
                              <div className="flex gap-2">
                                <span className="text-emerald-600">{s.present}P</span>
                                <span className="text-red-550">{s.absent}A</span>
                                <span className="text-amber-600">{s.late}L</span>
                                <span className="text-purple-600">{s.leave}Lv</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Monthly View Tab ──────────────────────────────────────── */}
          <TabsContent value="monthly" className="space-y-5">

            {/* Controls */}
            <Card className="border border-slate-100 shadow-sm rounded-xl bg-white">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Teacher selector */}
                  <select
                    value={monthlyTeacherId}
                    onChange={e => setMonthlyTeacherId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                  >
                    <option value="">— Select Teacher —</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>

                  {/* Month/Year navigator */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        let m = monthlyMonth - 1, y = monthlyYear;
                        if (m < 1) { m = 12; y -= 1; }
                        setMonthlyMonth(m); setMonthlyYear(y);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    ><ChevronLeft className="h-4 w-4 text-slate-600" /></button>

                    <select value={monthlyMonth} onChange={e => setMonthlyMonth(Number(e.target.value))}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>

                    <select value={monthlyYear} onChange={e => setMonthlyYear(Number(e.target.value))}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <button
                      onClick={() => {
                        let m = monthlyMonth + 1, y = monthlyYear;
                        if (m > 12) { m = 1; y += 1; }
                        setMonthlyMonth(m); setMonthlyYear(y);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    ><ChevronRight className="h-4 w-4 text-slate-600" /></button>
                  </div>

                  {/* Bulk actions */}
                  <div className="flex gap-2 ml-auto flex-wrap">
                    <Button size="sm" variant="outline"
                      onClick={() => markAllWeekdays("present")}
                      className="text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                      ✓ All Present
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={() => markAllWeekdays("absent")}
                      className="text-red-700 border-red-300 hover:bg-red-50">
                      ✗ All Absent
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={() => markAllWeekdays("leave")}
                      className="text-purple-700 border-purple-300 hover:bg-purple-50">
                      All Leave
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Pills */}
            {Object.keys(monthlyDayStatus).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {["present","absent","late","half_day","leave"].map(s => (
                  <span key={s}
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[s]}`}>
                    {STATUS_LABEL[s]}: {monthlySummary[s] || 0}
                  </span>
                ))}
                <span className="px-3 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-500 border-slate-200">
                  Working days: {Object.values(monthlyDayStatus).filter(s => s !== "weekend").length}
                </span>
              </div>
            )}

            {/* Calendar Grid */}
            <Card className="border border-slate-100 shadow-sm rounded-xl bg-white overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-800">
                    {months[monthlyMonth - 1]} {monthlyYear}
                    {monthlyTeacherId ? ` — ${teachers.find(t => t.id === Number(monthlyTeacherId))?.name}` : ""}
                  </h3>
                  <p className="text-xs text-slate-400">Click a day to cycle status</p>
                </div>

                {isFetchingMonthly ? (
                  <div className="animate-pulse">
                    {/* Day-of-week headers placeholder */}
                    <div className="grid grid-cols-7 mb-2">
                      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                        <div key={d} className="text-center text-xs font-bold py-2 text-slate-300">{d}</div>
                      ))}
                    </div>
                    {/* Day cells placeholder */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 31 }).map((_, i) => (
                        <div
                          key={i}
                          className="min-h-[62px] rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center"
                        >
                          <div className="h-2.5 w-4 bg-slate-200 dark:bg-slate-800 rounded-full mb-1.5" />
                          <div className="h-3.5 w-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Day-of-week headers */}
                    <div className="grid grid-cols-7 mb-2">
                      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                        <div key={d} className={`text-center text-xs font-bold py-2 ${
                          d === "Sat" || d === "Sun" ? "text-slate-400" : "text-slate-600"
                        }`}>{d}</div>
                      ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-1">
                      {buildCalendar(monthlyMonth, monthlyYear).map((cell, idx) => {
                        if (!cell) return <div key={`empty-${idx}`} />;
                        const status = monthlyDayStatus[cell.dateStr] || "present";
                        return (
                          <button
                            key={cell.dateStr}
                            onClick={() => handleDayClick(cell.dateStr)}
                            disabled={cell.isWeekend}
                            title={cell.isWeekend ? "Weekend" : `Click to change (${status})`}
                            className={`
                              relative flex flex-col items-center justify-center
                              min-h-[62px] rounded-lg border text-xs font-bold
                              transition-all duration-150
                              ${STATUS_STYLES[status] || "bg-white border-slate-200"}
                              ${cell.isToday ? "ring-2 ring-blue-400 ring-offset-1" : ""}
                            `}
                          >
                            <span className="text-[11px] font-semibold opacity-70 mb-0.5">{cell.day}</span>
                            <span className="text-[13px] font-black tracking-wide">
                              {STATUS_LABEL[status] ?? status}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
                      {Object.entries(STATUS_LABEL).filter(([k]) => k !== "weekend").map(([k, label]) => (
                        <span key={k} className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded border ${STATUS_STYLES[k]}`}>
                          {label} — {k === "half_day" ? "Half Day" : k.charAt(0).toUpperCase() + k.slice(1)}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            {!monthlyTeacherId && (
              <p className="text-center text-sm text-slate-400">
                Select a teacher above to enable saving.
              </p>
            )}
            {monthlyTeacherId && (
              <div className="flex justify-end">
                <Button
                  onClick={saveMonthlyAttendance}
                  disabled={isSavingMonthly}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10"
                >
                  {isSavingMonthly ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Save Month Attendance</>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  );
}
