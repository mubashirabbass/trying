import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function AttendanceManager() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Fetch courses the teacher teaches (or all for admin)
  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses', user?.role, user?.id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/courses${user?.role === 'teacher' ? `?teacherId=${user.id}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    }
  });

  // Fetch students for the selected course
  const { data: students, isLoading: loadingStudents, isError: isStudentsError, error: studentsError } = useQuery({
    queryKey: ['course-students', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const res = await fetch(`${BASE}/api/attendance/course/${selectedCourse}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch students (Status: ${res.status})`);
      }
      return res.json();
    },
    enabled: !!selectedCourse
  });

  // Fetch existing attendance records for the selected course and date
  const { data: existingRecords, isLoading: loadingRecords, isError: isRecordsError, error: recordsError } = useQuery({
    queryKey: ['attendance', selectedCourse, selectedDate],
    queryFn: async () => {
      if (!selectedCourse || !selectedDate) return [];
      const res = await fetch(`${BASE}/api/attendance/course/${selectedCourse}?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch attendance records (Status: ${res.status})`);
      }
      return res.json();
    },
    enabled: !!selectedCourse && !!selectedDate
  });

  const [attendanceState, setAttendanceState] = useState<Record<number, string>>({});

  // Sync existing records to state when they load
  useEffect(() => {
    if (existingRecords && students) {
      const newState: Record<number, string> = {};
      students.forEach((s: any) => {
        const record = existingRecords.find((r: any) => r.userId === s.userId);
        newState[s.userId] = record ? record.status : "present"; // Default to present
      });
      setAttendanceState(newState);
    }
  }, [existingRecords, students]);

  const saveMutation = useMutation({
    mutationFn: async (records: any[]) => {
      const res = await fetch(`${BASE}/api/attendance/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: Number(selectedCourse),
          date: selectedDate,
          records
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save attendance");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Attendance saved successfully" });
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedCourse, selectedDate] });
    },
    onError: (error: any) => {
      toast({ title: "Error saving attendance", description: error.message, variant: "destructive" });
    }
  });

  const handleSave = () => {
    if (!selectedCourse || !selectedDate) return;
    
    const recordsToSave = Object.entries(attendanceState).map(([userId, status]) => ({
      userId: Number(userId),
      status
    }));

    saveMutation.mutate(recordsToSave);
  };

  const setStatusAll = (status: string) => {
    if (!students) return;
    const newState: Record<number, string> = {};
    students.forEach((s: any) => {
      newState[s.userId] = status;
    });
    setAttendanceState(newState);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-gray-500">Record and monitor student attendance</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Select Course</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Date</label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCourse && selectedDate && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Attendance Sheet</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStatusAll('present')}>
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Mark All Present
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Attendance
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStudents || loadingRecords ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : isStudentsError ? (
              <div className="text-center p-8 text-red-500 flex flex-col items-center">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>Failed to load students.</p>
                <p className="text-sm opacity-80 mt-1">{studentsError?.message}</p>
              </div>
            ) : isRecordsError ? (
              <div className="text-center p-8 text-red-500 flex flex-col items-center">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>Failed to load attendance records.</p>
                <p className="text-sm opacity-80 mt-1">{recordsError?.message}</p>
              </div>
            ) : !students || students.length === 0 ? (
              <div className="text-center p-8 text-gray-500">No active students enrolled in this course.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-3 font-semibold text-gray-600">Student Name</th>
                      <th className="p-3 font-semibold text-gray-600">Email</th>
                      <th className="p-3 font-semibold text-gray-600 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students?.map((student: any) => (
                      <tr key={student.userId} className="border-b hover:bg-gray-50/50">
                        <td className="p-3">{student.name}</td>
                        <td className="p-3 text-gray-500 text-sm">{student.email}</td>
                        <td className="p-3 flex justify-center gap-2">
                          <Button 
                            variant={attendanceState[student.userId] === 'present' ? 'default' : 'outline'}
                            className={attendanceState[student.userId] === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                            size="sm"
                            onClick={() => setAttendanceState(prev => ({...prev, [student.userId]: 'present'}))}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Present
                          </Button>
                          <Button 
                            variant={attendanceState[student.userId] === 'absent' ? 'default' : 'outline'}
                            className={attendanceState[student.userId] === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                            size="sm"
                            onClick={() => setAttendanceState(prev => ({...prev, [student.userId]: 'absent'}))}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Absent
                          </Button>
                          <Button 
                            variant={attendanceState[student.userId] === 'late' ? 'default' : 'outline'}
                            className={attendanceState[student.userId] === 'late' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                            size="sm"
                            onClick={() => setAttendanceState(prev => ({...prev, [student.userId]: 'late'}))}
                          >
                            <Clock className="h-4 w-4 mr-1" /> Late
                          </Button>
                          <Button 
                            variant={attendanceState[student.userId] === 'leave' ? 'default' : 'outline'}
                            className={attendanceState[student.userId] === 'leave' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                            size="sm"
                            onClick={() => setAttendanceState(prev => ({...prev, [student.userId]: 'leave'}))}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" /> Leave
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
