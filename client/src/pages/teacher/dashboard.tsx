import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useGetTeacherDashboard, getGetTeacherDashboardQueryKey, useListCourses, getListCoursesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, BookOpen, Clock, Bell, FileText, MessageSquare,
  Award, User, LogOut, Users, Star, CheckCircle2, ArrowUpRight,
  Calendar, ChevronRight, Target, TrendingUp, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

export default function TeacherDashboard() {
  const { user, logout, token } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const { data: dashboard, isLoading: isDashboardLoading } = useGetTeacherDashboard(
    { userId: user?.id || 0 },
    { query: { enabled: !!user?.id, queryKey: getGetTeacherDashboardQueryKey({ userId: user?.id || 0 }) } }
  );

  const { data: courses = [], isLoading: isCoursesLoading } = useListCourses(
    { teacherId: user?.id ?? undefined, limit: 20 } as any,
    { query: { queryKey: getListCoursesQueryKey({ teacherId: user?.id ?? undefined } as any), enabled: !!user?.id } }
  );
  const teacherCourses = courses.filter((c: any) => c.teacherId === user?.id || c.teacherName === user?.name);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const res = await fetch(`${window.location.origin}/api/notifications?userId=${user.id}`, { headers });
      if (res.ok) setNotifications(await res.json());
    } catch {}
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      await fetch(`${window.location.origin}/api/notifications/read-all?userId=${user.id}`, { method: "PATCH", headers });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const isLoading = isDashboardLoading || isCoursesLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </DashboardLayout>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Teacher";
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("assignment") || t.includes("grade") || t.includes("submit")) return <FileText className="h-5 w-5 text-blue-600" />;
    if (t.includes("message") || t.includes("chat") || t.includes("reply")) return <MessageSquare className="h-5 w-5 text-blue-600" />;
    if (t.includes("student") || t.includes("enroll")) return <GraduationCap className="h-5 w-5 text-blue-600" />;
    return <Bell className="h-5 w-5 text-blue-600" />;
  };

  const formatTimeAgo = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return { sub: `${diffMins || 1} minutes ago` };
    if (diffHours < 24) return { sub: `${diffHours} hours ago` };
    return { sub: `${diffDays} days ago` };
  };

  const getNotificationLink = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("assignment") || t.includes("grade") || t.includes("submit")) return "/teacher/grading";
    if (t.includes("message")) return "/teacher/messages";
    if (t.includes("student") || t.includes("enroll")) return "/teacher/students";
    if (t.includes("quiz")) return "/teacher/quizzes";
    return "/teacher/dashboard";
  };

  const stats = [
    { label: "Active Courses", value: dashboard?.totalCourses ?? teacherCourses.length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50", href: "/teacher/courses" },
    { label: "Total Students", value: dashboard?.totalStudents ?? 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", href: "/teacher/students" },
    { label: "Pending Grades", value: dashboard?.pendingAssignments ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", href: "/teacher/grading" },
    { label: "Avg. Rating", value: (dashboard?.averageRating || 0).toFixed(1), icon: Star, color: "text-emerald-600", bg: "bg-emerald-50", href: "/teacher/courses" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 bg-[#f8fafc] min-h-screen">

        {/* Welcome Header */}
        <div className="flex justify-between items-center mb-8 relative">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Welcome back, {firstName}!
          </h1>
          <div className="flex items-center gap-4 relative z-50">

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); fetchNotifications(); }}
                className="relative p-2 text-slate-500 hover:bg-slate-50 bg-white rounded-full border border-slate-200/80 shadow-sm transition-colors cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2.5 z-40 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden py-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800">Notifications</span>
                      {unreadCount > 0 ? (
                        <button onClick={markAllRead} className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">Mark all read</button>
                      ) : (
                        <span className="text-[10px] bg-slate-50 text-slate-500 font-bold px-2 py-0.5 rounded-full">All Read</span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length > 0 ? notifications.map((n, i) => {
                        const timeInfo = formatTimeAgo(n.createdAt);
                        return (
                          <Link href={getNotificationLink(n.title)} key={n.id || i}>
                            <div onClick={async () => {
                              setNotificationsOpen(false);
                              if (!n.isRead) {
                                try { await fetch(`${window.location.origin}/api/notifications/${n.id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }); fetchNotifications(); } catch {}
                              }
                            }} className={`p-3.5 flex gap-3 cursor-pointer group ${!n.isRead ? "bg-blue-50/20 hover:bg-blue-50/40" : "hover:bg-slate-50"}`}>
                              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5 relative">
                                {getNotificationIcon(n.title)}
                                {!n.isRead && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-600 border border-white" />}
                              </div>
                              <div className="space-y-0.5">
                                <p className={`text-xs leading-snug ${!n.isRead ? "font-bold text-slate-800" : "font-semibold text-slate-600"}`}>{n.title}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{n.message}</p>
                                <p className="text-[9px] text-slate-400">{timeInfo.sub}</p>
                              </div>
                            </div>
                          </Link>
                        );
                      }) : (
                        <div className="py-8 text-center text-slate-400">
                          <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
                          <p className="text-xs font-bold">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}
                className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-slate-200 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer block"
              >
                <img src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=80&h=80&fit=crop" alt={user?.name} className="h-full w-full object-cover" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2.5 z-40 w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden p-4 animate-in fade-in slide-in-from-top-1 duration-200 space-y-4">
                    <div className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <div className="h-12 w-12 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-slate-200 shrink-0">
                        <img src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=80&h=80&fit=crop" alt={user?.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{user?.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">ID: GC-T100{user?.id}</p>
                        <span className="inline-block text-[9px] bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 px-1.5 rounded">Instructor</span>
                      </div>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="space-y-1.5">
                      <Link href="/teacher/profile">
                        <button onClick={() => setProfileOpen(false)} className="w-full text-left font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer">
                          <User className="h-3.5 w-3.5 text-slate-400" /> View Full Profile
                        </button>
                      </Link>
                      <button onClick={() => { setProfileOpen(false); logout(); }} className="w-full text-left font-bold text-red-600 hover:bg-red-50/50 px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer">
                        <LogOut className="h-3.5 w-3.5 text-red-400" /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Link href={stat.href} key={i}>
              <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* LEFT & CENTER COLUMNS */}
          <div className="lg:col-span-2 space-y-8">

            {/* PROFILE CARD */}
            <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white overflow-hidden">
              <CardContent className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="h-20 w-20 rounded-full overflow-hidden border border-slate-100 shadow-md bg-slate-200 shrink-0">
                    <img src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop" alt={user?.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-bold text-slate-800 leading-tight">{user?.name || "Instructor"}</h2>
                    <p className="text-sm font-semibold text-slate-400">Teacher ID: GC-T100{user?.id}</p>
                    <Badge className="bg-emerald-50 hover:bg-emerald-50 text-emerald-600 border border-emerald-100/60 rounded-full font-bold px-3 py-0.5 text-xs shadow-none">
                      Instructor · {(user as any)?.branchName || "Global"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col md:items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-500">Status: Active Instructor</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-400">
                    Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'May 2026'}
                  </div>
                  <Link href="/teacher/courses">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100/50 transition-colors">
                      <BookOpen className="h-3 w-3" /> {dashboard?.totalCourses ?? teacherCourses.length} Active Courses
                    </span>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* MY COURSES */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">My Courses</h3>
                <Link href="/teacher/courses" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                  Manage all courses
                </Link>
              </div>
              {teacherCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teacherCourses.slice(0, 4).map((course: any, idx: number) => (
                    <Card key={course.id} className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                      <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-3">
                            <h4 className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2">{course.title}</h4>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-bold shrink-0">Active</Badge>
                          </div>
                          <p className="text-xs font-bold text-slate-400">{course.category || "General"}</p>
                        </div>
                        <div className="space-y-3 mt-auto">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.enrollmentCount || 0} students</span>
                            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400" /> {course.rating ? course.rating.toFixed(1) : "—"}</span>
                          </div>
                          <Link href={`/teacher/courses`}>
                            <Button className={`w-full h-11 rounded-lg font-bold text-xs shadow-none transition-all ${idx === 0 ? 'bg-slate-700 hover:bg-slate-800 text-white' : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>
                              Manage Course <ChevronRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white border border-slate-100 rounded-[1.25rem] text-slate-400">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No courses assigned yet</p>
                </div>
              )}
            </section>

            {/* SUBMISSION PIPELINE */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Pending Submissions</h3>
                <Link href="/teacher/grading" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1">
                  Open Grading Hub <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white overflow-hidden">
                {dashboard?.recentSubmissions && dashboard.recentSubmissions.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {dashboard.recentSubmissions.slice(0, 5).map((sub: any) => (
                      <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm shrink-0">
                            {sub.userName?.charAt(0) || "S"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{sub.userName || `Student #${sub.userId}`}</p>
                            <p className="text-xs text-slate-400 font-medium">{sub.assignmentTitle || `Assignment #${sub.assignmentId}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">Needs Review</Badge>
                          <Link href="/teacher/grading">
                            <Button variant="outline" size="sm" className="rounded-xl font-bold h-8 border-slate-200 text-xs">Grade</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center flex flex-col items-center gap-3 text-slate-400">
                    <CheckCircle2 className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-bold">All submissions graded!</p>
                  </div>
                )}
              </Card>
            </section>

            {/* PERFORMANCE INSIGHTS */}
            <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-slate-900 text-white overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-400" /> Performance Insights
                  </h3>
                  <Badge className="bg-white/10 text-white border-white/20 text-[10px] font-bold">Live</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">Course Engagement</span>
                    <span className="font-black text-white">84%</span>
                  </div>
                  <Progress value={84} className="h-2 bg-white/10" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Growth</p>
                    <p className="text-lg font-black text-emerald-400">+12%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Completion</p>
                    <p className="text-lg font-black text-blue-400">72%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Rating</p>
                    <p className="text-lg font-black text-amber-400">{(dashboard?.averageRating || 0).toFixed(1)}★</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs font-bold text-slate-300 leading-relaxed italic">
                    "Your students are most active between 8 PM and 11 PM. Consider posting updates during these hours."
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">

            {/* QUICK ACTIONS */}
            <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white overflow-hidden">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-base font-bold text-slate-800">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: "Grade Submissions", icon: FileText, href: "/teacher/grading", color: "text-amber-600 bg-amber-50" },
                    { label: "Manage Courses", icon: BookOpen, href: "/teacher/courses", color: "text-blue-600 bg-blue-50" },
                    { label: "View Students", icon: Users, href: "/teacher/students", color: "text-indigo-600 bg-indigo-50" },
                    { label: "Live Classes", icon: TrendingUp, href: "/teacher/live-classes", color: "text-emerald-600 bg-emerald-50" },
                    { label: "Messages", icon: MessageSquare, href: "/teacher/messages", color: "text-purple-600 bg-purple-50" },
                    { label: "Quizzes", icon: Award, href: "/teacher/quizzes", color: "text-rose-600 bg-rose-50" },
                  ].map((action) => (
                    <Link href={action.href} key={action.label}>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className={`h-8 w-8 rounded-lg ${action.color} flex items-center justify-center shrink-0`}>
                          <action.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{action.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto group-hover:text-slate-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* RECENT NOTIFICATIONS */}
            <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800">Recent Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((n, i) => {
                      const timeInfo = formatTimeAgo(n.createdAt);
                      return (
                        <Link href={getNotificationLink(n.title)} key={n.id || i}>
                          <div className={`flex gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-slate-50"}`}>
                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 relative">
                              {getNotificationIcon(n.title)}
                              {!n.isRead && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-600 border border-white" />}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className={`text-xs leading-snug truncate ${!n.isRead ? "font-bold text-slate-800" : "font-semibold text-slate-600"}`}>{n.title}</p>
                              <p className="text-[10px] text-slate-400">{timeInfo.sub}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">No notifications yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* UPCOMING SCHEDULE */}
            <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-800">Upcoming Schedule</h3>
                <div className="py-8 text-center text-slate-400 flex flex-col items-center">
                  <Calendar className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-xs font-semibold text-slate-700">No upcoming classes</p>
                  <Link href="/teacher/live-classes">
                    <Button variant="outline" size="sm" className="mt-3 rounded-xl text-xs font-bold h-8">
                      Schedule a Class
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
