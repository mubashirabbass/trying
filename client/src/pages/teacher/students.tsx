import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  Users, 
  Search, 
  Mail, 
  BookOpen, 
  TrendingUp,
  Clock,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function TeacherStudents() {
  const { user, token } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) return;
      try {
        const r = await fetch(`${BASE}/api/dashboard/teacher/students?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          const data = await r.json();
          setStudents(data);
        }
      } catch (error) {
        console.error("Failed to fetch students", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [user?.id, token]);

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.courseName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Student Management <Users className="h-8 w-8 text-primary" />
          </h1>
          <p className="text-slate-500 font-medium mt-1">Track progress and performance of students enrolled in your courses</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search students or courses..." 
              className="pl-10 h-11 rounded-xl border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Badge variant="outline" className="h-11 px-4 rounded-xl font-bold bg-white border-slate-200 flex gap-2 cursor-pointer hover:bg-slate-50">
              <Filter className="h-4 w-4" /> All Courses
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-[32px]">
            <CardContent className="py-24 text-center">
              <Users className="h-16 w-16 text-slate-100 mx-auto mb-4" />
              <p className="font-bold text-slate-400 text-lg">No students found</p>
              <p className="text-slate-400 text-sm mt-1">Students will appear here once they enroll in your courses.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((student, i) => (
              <Card key={i} className="border-none shadow-sm ring-1 ring-slate-100 hover:ring-primary/20 transition-all hover:shadow-xl hover:shadow-primary/5 rounded-[28px] overflow-hidden group">
                <CardHeader className="p-6 pb-0">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-[18px] bg-primary/10 text-primary flex items-center justify-center font-black text-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{student.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                        <Mail className="h-3 w-3" /> {student.email}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enrolled In</p>
                    <p className="font-bold text-slate-700 text-sm leading-tight flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" /> {student.courseName}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Course Progress</span>
                      <span className="text-primary">{student.progress}%</span>
                    </div>
                    <Progress value={student.progress} className="h-2 rounded-full" />
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400">Joined {new Date(student.enrolledAt).toLocaleDateString()}</span>
                    </div>
                    {student.progress >= 80 ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-black uppercase">Top Performer</Badge>
                    ) : student.progress <= 20 ? (
                      <Badge className="bg-amber-50 text-amber-700 border-none text-[9px] font-black uppercase">Needs Push</Badge>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
