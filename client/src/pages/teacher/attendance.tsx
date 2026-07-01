import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle,
  AlertCircle, Coffee, Briefcase, TrendingUp, Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingHours: string | null;
  notes: string | null;
  leaveType: string | null;
  isApproved: boolean;
  recordedByName: string | null;
}

interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  percentage: number;
}

export default function TeacherAttendance() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const res = await fetch(
        `${window.location.origin}/api/teacher-attendance/my?month=${selectedMonth}&year=${selectedYear}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
        setSummary(data.summary);

        // Find today's record (using robust local timezone offset-safe date generation)
        const todayLocal = new Date();
        const yyyy = todayLocal.getFullYear();
        const mm = String(todayLocal.getMonth() + 1).padStart(2, '0');
        const dd = String(todayLocal.getDate()).padStart(2, '0');
        const today = `${yyyy}-${mm}-${dd}`;
        
        const todayRec = data.records.find((r: AttendanceRecord) => r.date === today);
        setTodayRecord(todayRec || null);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch attendance records",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${window.location.origin}/api/teacher-attendance/check-in`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Successfully Checked In! 🕒",
          description: data.message || "Your attendance check-in has been logged.",
        });
        fetchAttendance();
      } else {
        toast({
          title: "Check-In Failed",
          description: data.error || "Could not log check-in",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Check-In Error",
        description: err.message || "Failed to check in",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${window.location.origin}/api/teacher-attendance/check-out`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Successfully Checked Out! 🚪",
          description: data.message || "Your check-out and working hours have been logged.",
        });
        fetchAttendance();
      } else {
        toast({
          title: "Check-Out Failed",
          description: data.error || "Could not log check-out",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Check-Out Error",
        description: err.message || "Failed to check out",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToCSV = () => {
    if (records.length === 0) {
      toast({
        title: "No Data Available",
        description: "There are no attendance records to export.",
        variant: "destructive"
      });
      return;
    }

    const headers = ["Date", "Status", "Check-In Time", "Check-Out Time", "Working Hours", "Notes", "Marked By"];
    const rows = records.map(r => [
      new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
      r.status.toUpperCase(),
      r.checkInTime || "—",
      r.checkOutTime || "—",
      r.workingHours || "—",
      r.notes || "—",
      r.recordedByName || "Self"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Teacher_Attendance_${months[selectedMonth - 1]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Report Exported! 📥",
      description: "CSV report has been downloaded successfully.",
    });
  };

  useEffect(() => {
    if (token) {
      fetchAttendance();
    }
  }, [selectedMonth, selectedYear, token]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "late":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case "half_day":
        return <Coffee className="h-4 w-4 text-blue-600" />;
      case "leave":
        return <Briefcase className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 bg-[#f8fafc] min-h-screen">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <Badge className="w-fit border-indigo-150 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-50/50">
            Attendance Log
          </Badge>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">My Attendance</h1>
            <p className="mt-1 text-sm text-slate-500 font-semibold">
              Log daily check-ins, record working hours, and review monthly attendance history.
            </p>
          </div>
        </div>

        {/* Today's Attendance Status & Quick Actions */}
        <Card className="border border-slate-150 shadow-md rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                  <h3 className="text-base font-black text-slate-900">Today's Shift Status</h3>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                
                {todayRecord ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shift Status</span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {getStatusIcon(todayRecord.status)}
                        <span className="font-extrabold text-slate-800 text-sm">
                          {todayRecord.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {todayRecord.checkInTime && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checked In</span>
                        <p className="font-black text-slate-850 mt-1 text-sm">{todayRecord.checkInTime}</p>
                      </div>
                    )}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checked Out</span>
                      <p className="font-black text-slate-850 mt-1 text-sm">{todayRecord.checkOutTime || "—"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3 w-fit text-xs font-bold mt-2 animate-pulse">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Shift record is not marked for today yet. Use self check-in below.</span>
                  </div>
                )}
              </div>

              {/* Attendance Marking Buttons */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                {!todayRecord ? (
                  <Button
                    disabled={isSubmitting}
                    onClick={handleCheckIn}
                    className="h-11 px-6 font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/10 gap-1.5 transition-all duration-200 hover:scale-[1.02]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        Check In Now
                      </>
                    )}
                  </Button>
                ) : !todayRecord.checkOutTime ? (
                  <Button
                    disabled={isSubmitting}
                    onClick={handleCheckOut}
                    className="h-11 px-6 font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-600/10 gap-1.5 transition-all duration-200 hover:scale-[1.02]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Briefcase className="h-4 w-4" />
                        Check Out Shift
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-4 py-3 rounded-xl flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Completed shift check-in & check-out for today!</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="border-none shadow-md ring-1 ring-slate-100 rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:shadow-lg">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Days</p>
                <p className="text-2xl font-black text-slate-900">{summary.totalDays}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md ring-1 ring-slate-100 rounded-2xl bg-emerald-500 text-white overflow-hidden transition-all duration-200 hover:shadow-lg">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-1">Present</p>
                <p className="text-2xl font-black text-white">{summary.present}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md ring-1 ring-slate-100 rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:shadow-lg">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Absent</p>
                <p className="text-2xl font-black text-red-650">{summary.absent}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md ring-1 ring-slate-100 rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:shadow-lg">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Late</p>
                <p className="text-2xl font-black text-amber-600">{summary.late}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md ring-1 ring-slate-100 rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:shadow-lg">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Half Day</p>
                <p className="text-2xl font-black text-blue-650">{summary.halfDay}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md ring-1 ring-slate-100 rounded-2xl bg-slate-900 text-white overflow-hidden transition-all duration-200 hover:shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400 animate-pulse" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Attendance %</p>
                </div>
                <p className="text-2xl font-black text-white">{summary.percentage}%</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search Log */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-150 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="h-10 px-4 border border-slate-250 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-10 px-4 border border-slate-250 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="h-10 px-4 font-bold border-slate-205 hover:bg-slate-50 text-xs rounded-xl flex items-center shadow-sm"
          >
            <Download className="h-3.5 w-3.5 mr-2 text-indigo-600" />
            Export Monthly CSV
          </Button>
        </div>

        {/* Attendance Records */}
        <Card className="border border-slate-150 shadow-md rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-base font-black text-slate-900 mb-4">Historical Records</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-20 opacity-40">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-50 text-slate-500">
                      <th className="text-left py-3 px-4 font-bold uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 font-bold uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 font-bold uppercase tracking-wider">Check In</th>
                      <th className="text-left py-3 px-4 font-bold uppercase tracking-wider">Check Out</th>
                      <th className="text-left py-3 px-4 font-bold uppercase tracking-wider">Working Hours</th>
                      <th className="text-left py-3 px-4 font-bold uppercase tracking-wider">Notes / Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(record.status)}
                            {getStatusBadge(record.status)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-650">
                          {record.checkInTime || "—"}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-650">
                          {record.checkOutTime || "—"}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-800">
                          {record.workingHours || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium max-w-[200px] truncate">
                          <span>{record.notes || "—"}</span>
                          {record.recordedByName && (
                            <span className="block text-[9px] text-slate-400 mt-0.5">
                              By: {record.recordedByName}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No shift records</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
