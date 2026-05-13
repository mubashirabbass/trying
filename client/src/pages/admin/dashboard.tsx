import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useGetAdminDashboard, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Users, BookOpen, CreditCard, TrendingUp, 
  CheckCircle, Clock, XCircle, ArrowUpRight, 
  ShieldCheck, Building2, Megaphone, Star
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
    query: { queryKey: getGetAdminDashboardQueryKey() },
  });

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
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 lg:p-12 text-white shadow-2xl">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">System Admin</p>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">
              Admin Command Center
            </h1>
            <p className="text-slate-400 font-medium text-lg">
              Global College LMS — Platform Health & Operations Overview
            </p>
          </div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
          <div className="absolute bottom-0 left-0 ml-32 mb-0 h-40 w-40 rounded-full bg-blue-500/10 blur-[60px]" />
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Total Students", value: dashboard?.totalStudents ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50", sub: "Registered accounts" },
            { title: "Total Teachers", value: dashboard?.totalTeachers ?? 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Active instructors" },
            { title: "Total Courses", value: dashboard?.totalCourses ?? 0, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50", sub: "Published content" },
            { title: "Total Revenue", value: `Rs. ${(dashboard?.totalRevenue ?? 0).toLocaleString()}`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50", sub: "Verified payments" },
          ].map((stat, i) => (
            <Card key={i} className="border-2 border-slate-100 hover:border-primary/20 transition-all hover:shadow-xl hover:shadow-primary/5 rounded-[28px] bg-white group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
                    <ArrowUpRight className="h-3 w-3" /> Live
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                <div className="text-3xl font-black text-slate-900 mt-1">{stat.value}</div>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Users", href: "/admin/users", icon: Users, color: "bg-blue-600" },
            { label: "Courses", href: "/admin/courses", icon: BookOpen, color: "bg-emerald-600" },
            { label: "Payments", href: "/admin/payments", icon: CreditCard, color: "bg-orange-600" },
            { label: "Verification", href: "/admin/identity-verifications", icon: ShieldCheck, color: "bg-violet-600" },
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
      </div>
    </DashboardLayout>
  );
}
