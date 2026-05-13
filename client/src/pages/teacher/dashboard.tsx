import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useGetTeacherDashboard, getGetTeacherDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  Users, 
  BookOpen, 
  FileText, 
  Star, 
  ChevronRight, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: dashboard, isLoading } = useGetTeacherDashboard(
    { userId: user?.id || 0 },
    { query: { enabled: !!user?.id, queryKey: getGetTeacherDashboardQueryKey({ userId: user?.id || 0 }) } }
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teacher Console</h1>
            <p className="text-slate-500 font-medium mt-1">Operational overview and student performance metrics</p>
          </div>
          <div className="flex gap-3">
            <Link href="/teacher/grading">
              <Button className="rounded-2xl font-bold shadow-lg shadow-primary/10">
                Go to Grading Hub <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Active Courses", value: dashboard?.totalCourses, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Total Students", value: dashboard?.totalStudents, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Pending Grades", value: dashboard?.pendingAssignments, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Instructor Rating", value: (dashboard?.averageRating || 0).toFixed(1), icon: Star, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-2 border-slate-100 hover:border-primary/20 transition-all hover:shadow-xl hover:shadow-primary/5 rounded-[28px] bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="bg-slate-50 text-[10px] font-black uppercase tracking-tighter">Live</Badge>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <div className="text-3xl font-black text-slate-900 mt-1">{stat.value || 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-2 border-slate-100 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black text-slate-900">Submission Pipeline</CardTitle>
                <Link href="/teacher/grading">
                  <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/5">
                    View Full Queue <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {dashboard?.recentSubmissions && dashboard.recentSubmissions.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {dashboard.recentSubmissions.map((sub) => (
                    <div key={sub.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                          {sub.userName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{sub.userName || `Student #${sub.userId}`}</p>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                            {sub.assignmentTitle || `Assignment #${sub.assignmentId}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] uppercase font-black">
                          Needs Review
                        </Badge>
                        <Button variant="outline" size="sm" className="rounded-xl font-bold h-9 border-slate-200" onClick={() => setLocation('/teacher/grading')}>
                          Grade
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <p className="text-slate-400 font-bold">All submissions have been graded!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-100 rounded-[32px] overflow-hidden bg-slate-900 text-white shadow-2xl shadow-slate-200">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Engagement</p>
                  <span className="text-2xl font-black">84%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[84%] rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Growth</p>
                  <p className="text-lg font-black text-emerald-400">+12%</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Completion</p>
                  <p className="text-lg font-black text-blue-400">72%</p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 mt-4">
                <p className="text-xs font-bold text-slate-300 leading-relaxed italic">
                  "Your students are most active between 8 PM and 11 PM. Consider posting updates during these hours."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
