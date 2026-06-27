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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

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

        // Find today's record
        const today = new Date().toISOString().split('T')[0];
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

  useEffect(() => {
    if (token) {
      fetchAttendance();
    }
  }, [selectedMonth, selectedYear, token]); // Only run when these values change

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
      <div className="max-w-7xl mx-auto px-4 py-6 bg-[#f8fafc] min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">My Attendance</h1>
          <p className="text-sm text-slate-500">Track your attendance and working hours</p>
        </div>

        {/* Today's Attendance Status */}
        <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white overflow-hidden mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-1">Today's Attendance</h3>
                <p className="text-sm text-slate-500 mb-3">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {todayRecord ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(todayRecord.status)}
                      {getStatusBadge(todayRecord.status)}
                    </div>
                    {todayRecord.checkInTime && (
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold">Check-in:</span> {todayRecord.checkInTime}
                      </p>
                    )}
                    {todayRecord.checkOutTime && (
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold">Check-out:</span> {todayRecord.checkOutTime}
                      </p>
                    )}
                    {todayRecord.workingHours && (
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold">Working Hours:</span> {todayRecord.workingHours}
                      </p>
                    )}
                    {todayRecord.recordedByName && (
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold">Marked by:</span> {todayRecord.recordedByName}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">Not marked yet. Contact admin or use face recognition.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <Card className="border border-slate-100 shadow-sm rounded-xl bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Days</p>
                <p className="text-2xl font-black text-slate-900">{summary.totalDays}</p>
              </CardContent>
            </Card>
            <Card className="border border-emerald-100 shadow-sm rounded-xl bg-emerald-50">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Present</p>
                <p className="text-2xl font-black text-emerald-700">{summary.present}</p>
              </CardContent>
            </Card>
            <Card className="border border-red-100 shadow-sm rounded-xl bg-red-50">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-bold text-red-600 uppercase mb-1">Absent</p>
                <p className="text-2xl font-black text-red-700">{summary.absent}</p>
              </CardContent>
            </Card>
            <Card className="border border-amber-100 shadow-sm rounded-xl bg-amber-50">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-bold text-amber-600 uppercase mb-1">Late</p>
                <p className="text-2xl font-black text-amber-700">{summary.late}</p>
              </CardContent>
            </Card>
            <Card className="border border-blue-100 shadow-sm rounded-xl bg-blue-50">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Half Day</p>
                <p className="text-2xl font-black text-blue-700">{summary.halfDay}</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-100 shadow-sm rounded-xl bg-slate-900">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <p className="text-xs font-bold text-slate-300 uppercase">Percentage</p>
                </div>
                <p className="text-2xl font-black text-white">{summary.percentage}%</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Month/Year Selector */}
        <div className="flex items-center gap-3 mb-6">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <Button
            onClick={fetchAttendance}
            variant="outline"
            size="sm"
            className="ml-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Attendance Records */}
        <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Attendance History</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Check In</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Check Out</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Working Hours</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-semibold text-slate-700">
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            {getStatusBadge(record.status)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {record.checkInTime || "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {record.checkOutTime || "—"}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-slate-700">
                          {record.workingHours || "—"}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {record.notes || "—"}
                          {record.recordedByName && (
                            <span className="block text-[10px] text-slate-400 mt-1">
                              Marked by: {record.recordedByName}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No attendance records for this month</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
