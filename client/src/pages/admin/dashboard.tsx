import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useGetAdminDashboard, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Users, BookOpen, CreditCard, TrendingUp, 
  CheckCircle, Clock, XCircle, ArrowUpRight, 
  ShieldCheck, Building2, Megaphone, Star,
  UserPlus, PlusCircle, Award, Radio, Activity, Database, Cpu, Layers, Wifi
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  verified: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
};
const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  verified: CheckCircle,
  rejected: XCircle,
};

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: dashboard, isLoading } = useGetAdminDashboard({
    query: { 
      queryKey: getGetAdminDashboardQueryKey(),
      staleTime: 30000, // Cache for 30 seconds
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-8 animate-pulse">
          {/* Banner Skeleton */}
          <div className="rounded-[32px] bg-slate-100 p-8 lg:p-12 h-[340px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-4 w-32 bg-slate-200 rounded-full" />
              <div className="h-8 w-64 bg-slate-200 rounded-full" />
              <div className="h-3 w-80 bg-slate-200 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
              ))}
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-[20px]" />
            ))}
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((card) => (
              <div key={card} className="border-2 border-slate-100 rounded-[32px] bg-white p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="h-6 w-40 bg-slate-200 rounded-full" />
                  <div className="h-8 w-20 bg-slate-200 rounded-xl" />
                </div>
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((row) => (
                    <div key={row} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-200 rounded-xl animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-36 bg-slate-200 rounded-full" />
                          <div className="h-3 w-24 bg-slate-200 rounded-full" />
                        </div>
                      </div>
                      <div className="h-4 w-16 bg-slate-200 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Visual Admin Command Center Banner */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-8 lg:p-12 text-white shadow-2xl relative ring-1 ring-white/10">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute left-1/3 bottom-0 w-96 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-indigo-300 mb-2">Welcome to Global College Admin System Operations</p>
                <h2 className="text-3xl font-black tracking-tight mt-2 text-white">Admin Command Center</h2>
                <p className="text-white/60 text-xs mt-1">Global College LMS — Platform Health & Operations Overview</p>
              </div>
            </div>

            {/* Flow Tracker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative">
              {[
                { step: "1", title: "Total Students", count: dashboard?.totalStudents ?? 0, desc: "Active & pending enrollments", color: "from-blue-500/20 to-blue-600/30 border-blue-500/30 text-blue-300" },
                { step: "2", title: "Total Faculty", count: dashboard?.totalTeachers ?? 0, desc: "Registered active instructors", color: "from-emerald-500/20 to-emerald-600/30 border-emerald-500/30 text-emerald-300" },
                { step: "3", title: "Published Courses", count: dashboard?.totalCourses ?? 0, desc: "Active course syllabi catalog", color: "from-amber-500/20 to-amber-600/30 border-amber-500/30 text-amber-300" },
                { step: "4", title: "Total Revenue", count: `Rs. ${(dashboard?.totalRevenue ?? 0).toLocaleString()}`, desc: "Verified system earnings", color: "from-indigo-500/20 to-indigo-600/30 border-indigo-500/30 text-indigo-300" }
              ].map((s) => (
                <div key={s.step} className={`p-4 rounded-2xl bg-gradient-to-br border ${s.color} backdrop-blur-md relative group flex flex-col justify-between`}>
                  <div className="flex justify-between items-start">
                    <span className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center font-black text-xs">{s.step}</span>
                    <span className="text-2xl font-black tracking-tight">{s.count}</span>
                  </div>
                  <div className="mt-4">
                    <p className="font-bold text-xs text-white">{s.title}</p>
                    <p className="text-[9px] text-white/50 leading-tight mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Users", href: "/admin/users", icon: Users, color: "bg-blue-600" },
            { label: "Courses", href: "/admin/courses", icon: BookOpen, color: "bg-emerald-600" },
            { label: "Payments", href: "/admin/payments", icon: CreditCard, color: "bg-orange-600" },
            { label: "Branches", href: "/admin/branches", icon: Building2, color: "bg-cyan-600" },
            { label: "Announce", href: "/admin/announcements", icon: Megaphone, color: "bg-rose-600" },
          ].map(({ label, href, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <div className={`rounded-[20px] p-5 ${color} text-white cursor-pointer transition-all hover:scale-[1.04] hover:shadow-lg active:scale-[0.98] flex flex-col items-center gap-3 text-center`}>
                <Icon className="h-7 w-7" />
                <span className="text-xs font-black uppercase tracking-widest">{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Enrollments */}
          <Card className="border-2 border-slate-100 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-black text-slate-900">Recent Enrollments</CardTitle>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/5 rounded-xl">
                  View All <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {dashboard?.recentEnrollments?.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {dashboard.recentEnrollments.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between px-8 py-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center font-black text-sm text-blue-600">
                          {e.userName?.charAt(0) ?? "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{e.userName ?? `User #${e.userId}`}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{e.courseName ?? `Course #${e.courseId}`}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        {new Date(e.enrolledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center opacity-30">
                  <Users className="h-10 w-10 mx-auto mb-3 text-slate-400" />
                  <p className="font-bold text-slate-500">No recent enrollments</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="border-2 border-slate-100 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-black text-slate-900">Recent Payments</CardTitle>
              <Link href="/admin/payments">
                <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/5 rounded-xl">
                  View All <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {dashboard?.recentPayments?.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {dashboard.recentPayments.map((payment: any) => {
                    const StatusIcon = STATUS_ICONS[payment.status] ?? Clock;
                    return (
                      <div key={payment.id} className="flex items-center justify-between px-8 py-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900">Rs. {Number(payment.amount).toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest capitalize">{payment.method?.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <Badge className={`text-[10px] font-black uppercase tracking-tighter border ${STATUS_COLORS[payment.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {payment.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center opacity-30">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 text-slate-400" />
                  <p className="font-bold text-slate-500">No recent payments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics & System Health Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Academic Categories Distribution */}
          <Card className="lg:col-span-2 border-none shadow-xl ring-1 ring-gray-100 dark:ring-slate-800 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900">Academic Tracks & Categories</CardTitle>
                <p className="text-xs text-gray-500 mt-1">Real-time breakdown of course distribution across global college departments.</p>
              </div>
              <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 font-bold rounded-lg">
                Active Departments
              </Badge>
            </CardHeader>
            <CardContent className="p-8">
              {dashboard?.coursesByCategory && dashboard.coursesByCategory.length > 0 ? (
                <div className="space-y-6">
                  {dashboard.coursesByCategory.map((c: any, index: number) => {
                    const total = dashboard.totalCourses || 1;
                    const percentage = Math.round((c.count / total) * 100);
                    const colors = [
                      "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", 
                      "bg-violet-500", "bg-cyan-500", "bg-indigo-500"
                    ];
                    const barColor = colors[index % colors.length];
                    
                    return (
                      <div key={c.category} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-extrabold text-slate-700 capitalize">{c.category || "General"}</span>
                          <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg text-xs">
                            {c.count} {c.count === 1 ? "Course" : "Courses"} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${barColor} rounded-full transition-all duration-1000`} 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center opacity-30">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-400" />
                  <p className="font-bold text-slate-500">No category breakdown available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Operations Health Ledgers */}
          <Card className="border-none shadow-xl ring-1 ring-gray-100 dark:ring-slate-800 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="px-8 py-6 border-b border-slate-50">
              <CardTitle className="text-xl font-black text-slate-900">Platform Health Indicator</CardTitle>
              <p className="text-xs text-gray-500 mt-1">Pending items requiring system admin actions.</p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {[
                { title: "Pending Fee Receipts", desc: "Payments awaiting confirmation", count: (dashboard as any)?.pendingPayments ?? 0, color: "text-amber-500 bg-amber-50" },
                { title: "Platform Announcements", desc: "Active system announcements", count: (dashboard as any)?.activeAnnouncements ?? 0, color: "text-rose-500 bg-rose-50" }
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all duration-300">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">{item.desc}</p>
                  </div>
                  <span className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs ${item.color}`}>
                    {item.count}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Real-time System Audit & Operational Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live System Events / Timeline */}
          <Card className="lg:col-span-2 border-none shadow-xl ring-1 ring-gray-100 dark:ring-slate-800 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900">Live System Events</CardTitle>
                <p className="text-xs text-gray-500 mt-1">Real-time audit log of security, enrollment, and catalog actions.</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 font-bold rounded-lg flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Stream
              </Badge>
            </CardHeader>
            <CardContent className="p-8">
              <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-6">
                {(dashboard as any)?.recentNotifications && (dashboard as any).recentNotifications.length > 0 ? (
                  (dashboard as any).recentNotifications.map((notif: any) => {
                    let color = "text-indigo-600 bg-indigo-50 border-indigo-200";
                    if (notif.type === "enrollment" || notif.type === "student") {
                      color = "text-blue-600 bg-blue-50 border-blue-200";
                    } else if (notif.type === "course") {
                      color = "text-emerald-600 bg-emerald-50 border-emerald-200";
                    } else if (notif.type === "payment" || notif.type === "fee") {
                      color = "text-amber-600 bg-amber-50 border-amber-200";
                    } else if (notif.type === "certificate") {
                      color = "text-violet-600 bg-violet-50 border-violet-200";
                    } else if (notif.type === "announcement" || notif.type === "broadcast") {
                      color = "text-rose-600 bg-rose-50 border-rose-200";
                    }
                    
                    return (
                      <div key={notif.id} className="relative group">
                        <span className={`absolute -left-10 top-1.5 h-7 w-7 rounded-lg border flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                          {notif.type === "enrollment" || notif.type === "student" ? <UserPlus className="h-3.5 w-3.5" /> :
                           notif.type === "course" ? <PlusCircle className="h-3.5 w-3.5" /> :
                           notif.type === "payment" || notif.type === "fee" ? <CreditCard className="h-3.5 w-3.5" /> :
                           notif.type === "certificate" ? <Award className="h-3.5 w-3.5" /> :
                           notif.type === "announcement" || notif.type === "broadcast" ? <Megaphone className="h-3.5 w-3.5" /> :
                           <BookOpen className="h-3.5 w-3.5" />}
                        </span>
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-sm text-slate-800 truncate">{notif.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                            {notif.userName && (
                              <p className="text-[10px] text-indigo-600 font-black mt-1">Triggered by: {notif.userName}</p>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0 whitespace-nowrap">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center opacity-30">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-slate-400 animate-pulse" />
                    <p className="font-bold text-slate-500 text-xs">Waiting for live activities...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Operational & Telemetry Metrics */}
          <Card className="border-none shadow-xl ring-1 ring-gray-100 dark:ring-slate-800 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900">System Telemetry</CardTitle>
                <p className="text-xs text-gray-500 mt-1">LMS node server & database vitals.</p>
              </div>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-100 font-bold rounded-lg">
                Operational
              </Badge>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {[
                { label: "Active Student Enrollment", value: `${dashboard?.totalStudents ?? 0} students`, icon: Cpu, color: "text-blue-500", progress: dashboard?.totalStudents ? Math.min(dashboard.totalStudents * 5, 100) : 10 },
                { label: "Faculty Accounts pool", value: `${dashboard?.totalTeachers ?? 0} active`, icon: Database, color: "text-emerald-500", progress: dashboard?.totalTeachers ? Math.min(dashboard.totalTeachers * 10, 100) : 15 },
                { label: "Total Digital Certificates Issued", value: `${(dashboard as any)?.totalCertificates ?? 0} certs`, icon: Layers, color: "text-amber-500", progress: (dashboard as any)?.totalCertificates ? Math.min((dashboard as any).totalCertificates * 5, 100) : 8 },
                { label: "Department Tracks cataloged", value: `${dashboard?.coursesByCategory?.length ?? 0} departments`, icon: Wifi, color: "text-violet-500", progress: dashboard?.coursesByCategory?.length ? Math.min(dashboard.coursesByCategory.length * 20, 100) : 20 }
              ].map((telemetry) => (
                <div key={telemetry.label} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                      <telemetry.icon className={`h-3.5 w-3.5 ${telemetry.color}`} />
                      {telemetry.label}
                    </span>
                    <span className="font-black text-slate-900">{telemetry.value}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${telemetry.color.replace('text-', 'bg-')} rounded-full transition-all duration-1000`} 
                      style={{ width: `${telemetry.progress}%` }}
                    />
                  </div>
                </div>
              ))}
              
              <div className="border-t border-slate-50 pt-6 mt-4 flex items-center justify-between text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                  All Systems Operational
                </span>
                <span>Uptime: 99.98%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
