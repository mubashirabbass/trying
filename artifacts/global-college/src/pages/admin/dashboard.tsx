import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useGetAdminDashboard, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, BookOpen, CreditCard, TrendingUp, CheckCircle, Clock, XCircle, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  sub,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  sub?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-extrabold text-gray-900">{value}</p>
            {sub && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                {sub}
              </p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  verified: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's what's happening at Global College today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={dashboard?.totalStudents ?? 0}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          sub="Registered students"
        />
        <StatCard
          title="Total Teachers"
          value={dashboard?.totalTeachers ?? 0}
          icon={Users}
          color="bg-indigo-50 text-indigo-600"
          sub="Active instructors"
        />
        <StatCard
          title="Total Courses"
          value={dashboard?.totalCourses ?? 0}
          icon={BookOpen}
          color="bg-emerald-50 text-emerald-600"
          sub="Published courses"
        />
        <StatCard
          title="Total Revenue"
          value={`Rs. ${(dashboard?.totalRevenue ?? 0).toLocaleString()}`}
          icon={TrendingUp}
          color="bg-orange-50 text-orange-600"
          sub="Collected payments"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Manage Users", href: "/admin/users", icon: Users, color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
          { label: "Manage Courses", href: "/admin/courses", icon: BookOpen, color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" },
          { label: "Payments", href: "/admin/payments", icon: CreditCard, color: "text-orange-600 bg-orange-50 hover:bg-orange-100" },
          { label: "Branches", href: "/admin/branches", icon: TrendingUp, color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <div className={`rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors ${color}`}>
              <Icon className="h-5 w-5" />
              <span className="text-sm font-semibold">{label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Enrollments</CardTitle>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="text-xs text-primary">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {dashboard?.recentEnrollments && dashboard.recentEnrollments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {dashboard.recentEnrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {enrollment.userName?.charAt(0) ?? "U"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {enrollment.userName ?? `User #${enrollment.userId}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {enrollment.courseName ?? `Course #${enrollment.courseId}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(enrollment.enrolledAt).toLocaleDateString("en-PK")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic text-center py-8">No recent enrollments.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
            <Link href="/admin/payments">
              <Button variant="ghost" size="sm" className="text-xs text-primary">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {dashboard?.recentPayments && dashboard.recentPayments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {dashboard.recentPayments.map((payment: any) => {
                  const StatusIcon = STATUS_ICONS[payment.status] ?? Clock;
                  return (
                    <div key={payment.id} className="flex justify-between items-center py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Rs. {Number(payment.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">{payment.method}</p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${STATUS_COLORS[payment.status] ?? "bg-gray-100 text-gray-600"}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {payment.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic text-center py-8">No recent payments.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
