import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useGetStudentDashboard, getGetStudentDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  BookOpen, 
  Award, 
  FileText, 
  CheckCircle, 
  TrendingUp,
  Clock,
  ChevronRight,
  Sparkles,
  Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const { data: dashboard, isLoading } = useGetStudentDashboard(
    { userId: user?.id || 0 },
    { query: { enabled: !!user?.id, queryKey: getGetStudentDashboardQueryKey({ userId: user?.id || 0 }) } }
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
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-8 lg:p-12 text-white shadow-2xl shadow-slate-200">
          <div className="relative z-10">
            <Badge className="bg-primary/20 text-primary border-primary/20 mb-4 px-4 py-1 rounded-full font-bold uppercase tracking-widest text-[10px]">
              Active Learner
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
              Welcome back, {user?.name.split(" ")[0]}! <Sparkles className="inline-block h-8 w-8 text-amber-400 ml-2" />
            </h1>
            <p className="text-slate-400 font-medium text-lg max-w-xl">
              You've completed {dashboard?.overallProgress || 0}% of your total curriculum. Keep up the momentum!
            </p>
          </div>
          {/* Abstract Background Elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute bottom-0 right-0 mr-20 mb-10 h-32 w-32 rounded-full bg-blue-500/20 blur-[80px]" />
          <Zap className="absolute bottom-10 right-10 h-32 w-32 text-white/5 -rotate-12" />
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Enrolled Courses", value: dashboard?.enrolledCourses, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Overall Progress", value: `${dashboard?.overallProgress || 0}%`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Pending Tasks", value: dashboard?.deadlines?.length || 0, icon: FileText, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "Leaderboard Rank", value: `#${dashboard?.leaderboardRank || "--"}`, icon: Award, color: "text-indigo-500", bg: "bg-indigo-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm ring-1 ring-slate-100 hover:ring-primary/20 transition-all hover:shadow-xl hover:shadow-primary/5 rounded-[24px]">
              <CardContent className="p-6">
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <div className="text-3xl font-black text-slate-900 mt-1">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Learning */}
            {dashboard?.continueLearning && (
              <Card className="border-none shadow-xl shadow-primary/5 ring-1 ring-primary/10 rounded-[32px] overflow-hidden bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="h-16 w-16 rounded-[24px] bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
                        <Zap className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Continue Learning</p>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">{dashboard.continueLearning.lessonTitle}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">{dashboard.continueLearning.courseTitle}</p>
                      </div>
                    </div>
                    <Link href={`/dashboard/lessons/${dashboard.continueLearning.courseId}/${dashboard.continueLearning.lessonId}`}>
                      <Button className="rounded-2xl h-12 px-8 font-black shadow-lg shadow-primary/20 group">
                        Resume Lesson <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Section */}
            <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-[32px] overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-black text-slate-900">Learning Progress</CardTitle>
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-6">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global Completion</p>
                        <span className="text-4xl font-black text-slate-900">{dashboard?.overallProgress || 0}%</span>
                      </div>
                      <Badge variant="secondary" className="mb-2 font-black bg-emerald-50 text-emerald-700">On Track</Badge>
                    </div>
                    <Progress value={dashboard?.overallProgress || 0} className="h-4 bg-slate-100 rounded-full" />
                  </div>
                  
                  <div className="h-px bg-slate-100" />
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Courses</p>
                      <p className="font-bold text-slate-700 leading-tight text-xl">{dashboard?.completedCourses || 0} of {dashboard?.enrolledCourses || 0}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earned Certificates</p>
                      <p className="font-bold text-slate-700 leading-tight text-xl">{dashboard?.certificates || 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {/* Upcoming Deadlines */}
            <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-[32px] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" /> Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                {dashboard?.deadlines && dashboard.deadlines.length > 0 ? (
                  <div className="space-y-4">
                    {dashboard.deadlines.map((deadline, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 group hover:bg-amber-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-slate-900 leading-tight">{deadline.title}</p>
                          <Badge className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase">Due Soon</Badge>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mb-2">{deadline.courseName}</p>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">
                          Due: {new Date(deadline.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center opacity-30">
                    <CheckCircle className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-xs font-bold">All caught up!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Section */}
            <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-[32px] overflow-hidden flex flex-col">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
                  <div className="space-y-6">
                    {dashboard.recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-start gap-4 group">
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0 group-hover:scale-150 transition-transform" />
                        <div>
                          <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors leading-tight">
                            {activity.description}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-30 py-8">
                    <Clock className="h-12 w-12 mb-4" />
                    <p className="text-sm font-bold">No activity yet.</p>
                  </div>
                )}
              </CardContent>
              <div className="p-6 bg-slate-50/50 border-t border-slate-50">
                <Link href="/dashboard/courses">
                  <Button variant="ghost" className="w-full font-bold text-primary hover:bg-white rounded-xl h-12">
                    Manage Enrollments <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

