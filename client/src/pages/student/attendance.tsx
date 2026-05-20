import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Eye, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function StudentAttendance() {
  const { token } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/attendance/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    }
  });

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const summary = data?.summary || [];
  const records = data?.records || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <div className="flex flex-col items-center text-green-600"><CheckCircle2 className="h-6 w-6" /><span className="text-[10px] mt-1">Present</span></div>;
      case 'absent': return <div className="flex flex-col items-center text-red-600"><XCircle className="h-6 w-6" /><span className="text-[10px] mt-1">Absent</span></div>;
      case 'late': return <div className="flex flex-col items-center text-orange-500"><Clock className="h-6 w-6" /><span className="text-[10px] mt-1">Late</span></div>;
      case 'leave': return <div className="flex flex-col items-center text-blue-500"><AlertCircle className="h-6 w-6" /><span className="text-[10px] mt-1">Leave</span></div>;
      default: return null;
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-600";
    if (percentage >= 60) return "bg-orange-500";
    return "bg-red-600";
  };

  const selectedCourseRecords = records.filter((r: any) => r.courseId === selectedCourseId);
  const selectedCourseSummary = summary.find((s: any) => s.courseId === selectedCourseId);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-gray-500">Track your attendance across all enrolled courses</p>
      </div>

      <div className="space-y-4">
        {summary.map((courseSummary: any, index: number) => (
          <Card key={courseSummary.courseId}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 w-6">{index + 1}</span>
                  <span className="font-semibold text-gray-800">{courseSummary.courseName}</span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <span className="text-xs text-gray-500 block">Total Classes</span>
                    <span className="font-semibold">{courseSummary.total}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-gray-500 block">Attended</span>
                    <span className="font-semibold">{courseSummary.present}</span>
                  </div>
                  <div className="text-center w-16">
                    <span className="text-xs text-gray-500 block">Absent</span>
                    <span className="font-semibold text-red-500">{courseSummary.total - courseSummary.present}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white rounded-md" onClick={() => setSelectedCourseId(courseSummary.courseId)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="bg-gray-100 h-8 flex items-center relative rounded-b-lg overflow-hidden">
                <div 
                  className={`h-full flex items-center justify-center text-xs font-bold text-white ${getPercentageColor(courseSummary.percentage)}`}
                  style={{ width: `${Math.max(courseSummary.percentage, 5)}%` }}
                >
                  {courseSummary.percentage}%
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {summary.length === 0 && (
          <div className="text-center p-8 text-gray-500">No attendance records found.</div>
        )}
      </div>

      <Dialog open={!!selectedCourseId} onOpenChange={(open) => !open && setSelectedCourseId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl border-b pb-4 text-center bg-[#e5dfb1] text-[#6b622b] p-4 rounded uppercase">
              Attendance Detail: {selectedCourseSummary?.courseName}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-0 border">
            {selectedCourseRecords.map((record: any, idx: number) => (
              <div key={record.id} className="border p-4 flex flex-col items-center justify-center min-h-[120px]">
                <div className="text-xs text-gray-500 absolute self-start -mt-8 -ml-2">{idx + 1}</div>
                {getStatusIcon(record.status)}
                <div className="text-xs font-semibold mt-2">{new Date(record.date).toLocaleDateString()}</div>
                <div className="text-[10px] text-gray-400">Class</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
