import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  CalendarDays, 
  Award, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface AttendanceRecord {
  id: number;
  courseId: number;
  courseName: string;
  date: string;
  status: "present" | "absent" | "late" | "leave";
}

interface CourseSummary {
  courseId: number;
  courseName: string;
  present: number;
  total: number;
  percentage: number;
}

interface StudentAttendanceResponse {
  records: AttendanceRecord[];
  summary: CourseSummary[];
}

export default function StudentAttendance() {
  const { token, user } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  
  const { data, isLoading } = useQuery<StudentAttendanceResponse>({
    queryKey: ['my-attendance'],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/attendance/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Retrieving academic attendance records...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const summary = data?.summary || [];
  const records = data?.records || [];

  // Compute Overall Stats
  const totalClasses = summary.reduce((acc, curr) => acc + curr.total, 0);
  const totalPresent = summary.reduce((acc, curr) => acc + curr.present, 0);
  const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
  const minimumThreshold = 75;
  const isOverallAtRisk = totalClasses > 0 && overallPercentage < minimumThreshold;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': 
        return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
      case 'absent': 
        return <XCircle className="h-5 w-5 text-rose-500 shrink-0" />;
      case 'late': 
        return <Clock className="h-5 w-5 text-amber-500 shrink-0" />;
      case 'leave': 
        return <AlertCircle className="h-5 w-5 text-sky-500 shrink-0" />;
      default: 
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">P (Present)</span>;
      case 'absent': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 dark:text-rose-450 font-bold">A (Absent)</span>;
      case 'late': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-450">L (Late)</span>;
      case 'leave': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-sky-500/10 text-sky-600 dark:text-sky-400">Lv (Leave)</span>;
      default: 
        return null;
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= minimumThreshold) return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
    if (percentage >= 60) return "text-amber-600 dark:text-amber-400 bg-amber-500/10";
    return "text-rose-600 dark:text-rose-400 bg-rose-500/10";
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= minimumThreshold) return "bg-emerald-500";
    if (percentage >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  const selectedCourseRecords = records.filter((r) => r.courseId === selectedCourseId);
  const selectedCourseSummary = summary.find((s) => s.courseId === selectedCourseId);

  // Group records by Month for the selected course to show Month-by-Month calendar view!
  const recordsByMonth = selectedCourseRecords.reduce((acc, curr) => {
    if (!curr.date) return acc;
    const monthKey = curr.date.substring(0, 7); // "YYYY-MM"
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(curr);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  // Sort monthly keys descending
  const sortedMonthKeys = Object.keys(recordsByMonth).sort((a, b) => b.localeCompare(a));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Premium Gradient Banner */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-md bg-white/5 px-2.5 py-1 text-xs font-black text-slate-300 ring-1 ring-white/10 uppercase tracking-widest">
                Student Portal
              </span>
              {isOverallAtRisk ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2.5 py-1 text-xs font-black text-rose-300 ring-1 ring-rose-500/30 uppercase tracking-wider animate-pulse">
                  <AlertTriangle className="h-3 w-3" /> Action Required
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-black text-emerald-300 ring-1 ring-emerald-500/30 uppercase tracking-wider">
                  <CheckCircle2 className="h-3 w-3" /> Standing: Safe
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                Attendance Registry Hub
              </h1>
              <p className="mt-1 text-sm text-slate-350 font-medium">
                Welcome back, <span className="font-extrabold text-indigo-300">{user?.name}</span>. Check your marked classes and overall course averages below.
              </p>
            </div>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Overall Average</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{overallPercentage}%</p>
              </div>
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${getPercentageColor(overallPercentage)}`}>
                <TrendingUp className="h-5 w-5 text-current" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Classes Attended</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{totalPresent}</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Total Classes Held</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{totalClasses}</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <CalendarDays className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Passing Min Goal</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{minimumThreshold}%</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-500" /> Course-wise Attendance Report
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {summary.map((courseSummary, index) => {
              const isAtRisk = courseSummary.percentage < minimumThreshold;
              return (
                <Card 
                  key={courseSummary.courseId} 
                  className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 hover:shadow-md transition-all duration-300 group overflow-hidden"
                >
                  <CardContent className="p-6 space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold tracking-widest text-indigo-550 dark:text-indigo-400 uppercase leading-none">
                          Course {index + 1}
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                          {courseSummary.courseName}
                        </h3>
                      </div>
                      <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-black ${getPercentageColor(courseSummary.percentage)}`}>
                        {courseSummary.percentage}%
                      </span>
                    </div>

                    {/* Stats micro counters */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-50 dark:border-slate-900/60 text-xs">
                      <div>
                        <span className="text-[9px] font-semibold text-slate-400 block uppercase">Total Classes</span>
                        <span className="font-black text-slate-800 dark:text-slate-205">{courseSummary.total} sessions</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold text-slate-400 block uppercase">Present</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">{courseSummary.present} days</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold text-slate-400 block uppercase">Absent</span>
                        <span className="font-black text-rose-600 dark:text-rose-450">{courseSummary.total - courseSummary.present} days</span>
                      </div>
                    </div>

                    {/* Progress slider bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-extrabold uppercase">
                        <span className="text-slate-400">Attendance Meter</span>
                        <span className={isAtRisk ? "text-rose-500" : "text-emerald-500"}>
                          {isAtRisk ? "At Risk" : "Good Standing"}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                        <div 
                          className={`h-full rounded-full transition-all duration-550 ${getProgressBarColor(courseSummary.percentage)}`} 
                          style={{ width: `${Math.max(5, Math.min(100, courseSummary.percentage))}%` }} 
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      className="w-full h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-55 dark:hover:bg-slate-800/50 hover:text-indigo-650 dark:hover:text-indigo-400 font-extrabold text-slate-700 dark:text-slate-300 text-xs transition-colors flex items-center justify-center gap-2"
                      onClick={() => setSelectedCourseId(courseSummary.courseId)}
                    >
                      <Eye className="h-4 w-4 shrink-0" />
                      View Class-by-Class Calendar
                      <ChevronRight className="h-3.5 w-3.5 ml-auto text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {summary.length === 0 && (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center p-6 bg-slate-50/20 dark:bg-slate-950/20">
              <CalendarDays className="h-10 w-10 text-slate-300 mb-3" />
              <p className="font-black text-slate-650">No Enrolled Courses Found</p>
              <p className="text-xs text-slate-450 mt-1">Once you are enrolled in academic courses and your teachers start marking classes, the attendance report will load here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Class-by-Class Interactive Dialog */}
      <Dialog open={!!selectedCourseId} onOpenChange={(open) => !open && setSelectedCourseId(null)}>
        <DialogContent className="max-w-4xl rounded-[28px] border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/50">
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-500" /> 
              Class-by-Class Attendance: {selectedCourseSummary?.courseName}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Detailed list of marked days and your standing for each lecture session.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {selectedCourseRecords.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center text-slate-400">
                <FileText className="h-10 w-10 text-slate-200 mb-2" />
                <p className="font-bold text-sm">No lecture sessions recorded for this course.</p>
              </div>
            ) : (
              sortedMonthKeys.map((monthKey) => {
                const monthRecords = recordsByMonth[monthKey];
                
                // Format monthly key (e.g. "2026-06" -> "June 2026")
                let formattedMonth = monthKey;
                try {
                  const [year, month] = monthKey.split("-");
                  const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
                  formattedMonth = dateObj.toLocaleDateString(undefined, { month: "long", year: "numeric" });
                } catch (e) {}

                return (
                  <div key={monthKey} className="space-y-3">
                    <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest border-b border-slate-100 dark:border-slate-900/50 pb-1.5">
                      {formattedMonth}
                    </h4>

                    {/* Timeline List of Classes in this Month */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {monthRecords.map((record) => {
                        const dateObj = new Date(record.date);
                        const formattedDay = dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
                        
                        return (
                          <div 
                            key={record.id} 
                            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-900/80 bg-white dark:bg-slate-950 hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                                <CalendarDays className="h-4.5 w-4.5 text-indigo-500" />
                              </div>
                              <div>
                                <span className="text-xs font-black text-slate-900 dark:text-white leading-none block">
                                  {formattedDay}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  Academic Session
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {getStatusBadge(record.status)}
                              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 shrink-0">
                                {getStatusIcon(record.status)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
