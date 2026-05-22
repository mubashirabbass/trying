import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { 
  useGetStudentDashboard, 
  getGetStudentDashboardQueryKey, 
  useListCourses, 
  useListEnrollments,
  useListPayments
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, Play, BookOpen, Clock, Calendar, CheckCircle2, 
  Activity, Info, Bell, FileText, MessageSquare, Award, User, LogOut, AlertCircle, CreditCard
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function StudentDashboard() {
  const { user, logout, token } = useAuth();
  
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // 1. Dashboard statistics and activity
  const { data: dashboard, isLoading: isDashboardLoading } = useGetStudentDashboard(
    { userId: user?.id || 0 },
    { query: { enabled: !!user?.id, queryKey: getGetStudentDashboardQueryKey({ userId: user?.id || 0 }) } }
  );

  // 2. Enrolled courses list
  const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useListEnrollments(
    { userId: user?.id },
    { query: { enabled: !!user?.id } }
  );

  // 3. Courses list to map teachers
  const { data: courses = [], isLoading: isCoursesLoading } = useListCourses();

  // 4. Pending payments for this student
  const { data: allPayments = [], isLoading: isPaymentsLoading } = useListPayments(
    { userId: user?.id },
    { query: { enabled: !!user?.id } }
  );
  const pendingPayments = allPayments.filter((p: any) => p.status === "pending");

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const response = await fetch(`${window.location.origin}/api/notifications?userId=${user.id}`, { headers });
      if (response.ok) {
        setNotifications(await response.json());
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      await fetch(`${window.location.origin}/api/notifications/read-all?userId=${user.id}`, { 
        method: "PATCH", 
        headers 
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const isLoading = isDashboardLoading || isEnrollmentsLoading || isCoursesLoading || isPaymentsLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </DashboardLayout>
    );
  }

  const firstName = user?.name.split(" ")[0] || "Student";
  
  // Format deadlines to match the mockup's behavior
  const formatDeadlineDate = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return { text: "due TODAY - urgent", isUrgent: true };
    } else if (diffDays === 1) {
      return { text: "due TOMORROW - high urgency", isUrgent: true };
    } else if (diffDays === 2) {
      return { text: "due in 2 days", isUrgent: false };
    } else {
      return { text: `in ${diffDays} days`, isUrgent: false };
    }
  };

  // Helper to choose the right icon for notifications based on title
  const getNotificationIcon = (title: string) => {
    const lowercase = title.toLowerCase();
    if (lowercase.includes("assignment") || lowercase.includes("grade") || lowercase.includes("submit")) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    } else if (lowercase.includes("message") || lowercase.includes("chat") || lowercase.includes("reply") || lowercase.includes("forum")) {
      return <MessageSquare className="h-5 w-5 text-blue-600" />;
    } else if (lowercase.includes("certificate") || lowercase.includes("unlock") || lowercase.includes("completed")) {
      return <Award className="h-5 w-5 text-blue-600" />;
    }
    return <Bell className="h-5 w-5 text-blue-600" />;
  };

  // Helper to format time ago for notifications
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return { time: `${diffMins || 1}m`, sub: `${diffMins || 1} minutes ago` };
    if (diffHours < 24) return { time: `${diffHours}h`, sub: `${diffHours} hours ago` };
    return { time: `${diffDays}d`, sub: `${diffDays} days ago` };
  };

  // Helper to map notifications to relevant pages/sections
  const getNotificationLink = (title: string) => {
    const lowercase = title.toLowerCase();
    if (lowercase.includes("assignment") || lowercase.includes("grade") || lowercase.includes("graded") || lowercase.includes("submit")) {
      return "/dashboard/assignments";
    }
    if (lowercase.includes("quiz") || lowercase.includes("score")) {
      return "/dashboard/quizzes";
    }
    if (lowercase.includes("message") || lowercase.includes("chat") || lowercase.includes("reply") || lowercase.includes("teach")) {
      return "/dashboard/messages";
    }
    if (lowercase.includes("forum") || lowercase.includes("post") || lowercase.includes("comment")) {
      return "/dashboard/forum";
    }
    if (lowercase.includes("certificate") || lowercase.includes("completed") || lowercase.includes("unlock")) {
      return "/dashboard/certificates";
    }
    if (lowercase.includes("enrolled") || lowercase.includes("enroll") || lowercase.includes("course")) {
      return "/dashboard/courses";
    }
    if (lowercase.includes("identity") || lowercase.includes("verify") || lowercase.includes("cnic")) {
      return "/dashboard/verify-identity";
    }
    return "/dashboard";
  };

  // Separate active/completed enrollments
  const activeEnrollments = enrollments.filter(e => e.status === "active" || e.status === "completed");

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 bg-[#f8fafc] min-h-screen">
        
        {/* Welcome Section */}
        <div className="flex justify-between items-center mb-8 relative">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Welcome back, {firstName}!
          </h1>
          <div className="flex items-center gap-4 relative z-50">
            {/* Notification Bell Dropdown Button */}
            <div className="relative">
              <button 
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                  fetchNotifications();
                }}
                className="relative p-2 text-slate-500 hover:text-slate-750 hover:bg-slate-50 bg-white rounded-full border border-slate-200/80 shadow-sm transition-colors cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover Dropdown */}
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2.5 z-40 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden py-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800">Notifications</span>
                      {unreadCount > 0 ? (
                        <button 
                          onClick={markAllRead} 
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline bg-transparent border-0 cursor-pointer transition-colors"
                        >
                          Mark all read
                        </button>
                      ) : (
                        <span className="text-[10px] bg-slate-50 text-slate-500 font-bold px-2 py-0.5 rounded-full">All Read</span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length > 0 ? (
                        notifications.map((activity, i) => {
                          const timeInfo = formatTimeAgo(activity.createdAt);
                          const targetLink = getNotificationLink(activity.title);
                          return (
                            <Link href={targetLink} key={activity.id || i}>
                              <div 
                                onClick={async () => {
                                  setNotificationsOpen(false);
                                  if (!activity.isRead) {
                                    try {
                                      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
                                      await fetch(`${window.location.origin}/api/notifications/${activity.id}/read`, { 
                                        method: "PATCH", 
                                        headers 
                                      });
                                      fetchNotifications();
                                    } catch {}
                                  }
                                }}
                                className={`p-3.5 transition-colors flex gap-3 cursor-pointer group ${
                                  !activity.isRead ? "bg-blue-50/20 hover:bg-blue-50/40" : "hover:bg-slate-50"
                                }`}
                              >
                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform relative">
                                  {getNotificationIcon(activity.title)}
                                  {!activity.isRead && (
                                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-600 border border-white" />
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  <p className={`text-xs leading-snug group-hover:text-primary transition-colors ${
                                    !activity.isRead ? "font-bold text-slate-800" : "font-semibold text-slate-650"
                                  }`}>
                                    {activity.title}
                                  </p>
                                  <p className="text-[10px] text-slate-450 font-medium leading-snug">{activity.message}</p>
                                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">{timeInfo.sub}</p>
                                </div>
                              </div>
                            </Link>
                          );
                        })
                      ) : (
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

            {/* Profile Avatar Info Card Popover Button */}
            <div className="relative">
              <button 
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationsOpen(false);
                }}
                className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-slate-200 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer block"
              >
                <img 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop" 
                  alt={user?.name} 
                  className="h-full w-full object-cover"
                />
              </button>

              {/* Mini Profile Info Card Popover */}
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2.5 z-40 w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden p-4 animate-in fade-in slide-in-from-top-1 duration-200 space-y-4">
                    {/* Mini Student Info Card */}
                    <div className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <div className="h-12 w-12 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-slate-200 shrink-0">
                        <img 
                          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop" 
                          alt={user?.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{user?.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">ID: GC-S100{user?.id}</p>
                        <span className="inline-block text-[9px] bg-blue-50 text-blue-600 font-bold border border-blue-100 px-1.5 py-0.25 rounded">
                          {(user as any)?.branchName || "Faisalabad"}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Navigation Actions */}
                    <div className="space-y-1.5">
                      <Link href="/dashboard/profile">
                        <button 
                          onClick={() => setProfileOpen(false)}
                          className="w-full text-left font-bold text-slate-650 hover:text-slate-800 hover:bg-slate-50 px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          View Full Profile
                        </button>
                      </Link>
                      <button 
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="w-full text-left font-bold text-red-600 hover:text-red-700 hover:bg-red-50/50 px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5 text-red-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT & CENTER COLUMNS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* PROFILE CARD */}
            <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white overflow-hidden">
              <CardContent className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
                
                {/* Profile Details */}
                <div className="flex items-center gap-5">
                  <div className="h-20 w-20 rounded-full overflow-hidden border border-slate-100 shadow-md bg-slate-200 shrink-0">
                    <img 
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop" 
                      alt={user?.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                      {user?.name || "John Doe"}
                    </h2>
                    <p className="text-sm font-semibold text-slate-400">
                      Student ID: GC-S100{user?.id || "12345"}
                    </p>
                    <Badge className="bg-blue-50 hover:bg-blue-50 text-blue-600 border border-blue-100/60 rounded-full font-bold px-3 py-0.5 text-xs shadow-none">
                      Branch: {(user as any)?.branchName || "Faisalabad"}
                    </Badge>
                  </div>
                </div>

                {/* Useful details on the right of the profile card */}
                <div className="flex flex-col md:items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 justify-start md:justify-end">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-500">Academic Status: Active</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-400 md:text-right">
                    Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'May 2026'}
                  </div>
                  <Link href="/dashboard/verify-identity">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      user?.isIdentityVerified 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100/50' 
                        : 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100/50 animate-pulse'
                    }`}>
                      {user?.isIdentityVerified ? (
                        <>✓ Verified Student</>
                      ) : (
                        <>⚠ Verify Identity</>
                      )}
                    </span>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* PENDING FEE PAYMENTS ALERT */}
            {pendingPayments.length > 0 && (
              <Card className="border-2 border-amber-200 bg-amber-50/50 shadow-sm rounded-[1.25rem] overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <CreditCard className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-amber-900 mb-1">Pending Fee Payment</h3>
                      <p className="text-sm text-amber-800 mb-4">
                        You have {pendingPayments.length} course{pendingPayments.length > 1 ? 's' : ''} awaiting fee payment. Upload your receipt to activate your enrollment.
                      </p>
                      <div className="space-y-2">
                        {pendingPayments.map((payment: any) => {
                          const course = courses.find(c => c.id === payment.courseId);
                          return (
                            <div key={payment.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-100">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-sm truncate">{course?.title || `Course #${payment.courseId}`}</p>
                                <p className="text-xs text-slate-500">Amount: Rs. {payment.amount?.toLocaleString() || 0}</p>
                              </div>
                              <Link href={`/dashboard/payment/${payment.courseId}`}>
                                <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 px-3 rounded-lg shrink-0">
                                  Upload Receipt
                                </Button>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ENROLLED COURSES */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Enrolled Courses</h3>
                <Link href="/dashboard/courses" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                  View all courses
                </Link>
              </div>

              {activeEnrollments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeEnrollments.map((enrollment, idx) => {
                    const matchedCourse = courses.find(c => c.id === enrollment.courseId);
                    const teacherName = matchedCourse?.teacherName || "Teach Smith";
                    const progress = enrollment.progress ?? 0;
                    
                    // We dynamically style: first course in active courses gets filled slate button, others bordered
                    const isPrimary = idx === 0 || enrollment.courseId === dashboard?.continueLearning?.courseId;

                    return (
                      <Card key={enrollment.id} className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                        <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2">
                                {enrollment.courseName}
                              </h4>
                              <span className="text-sm font-semibold text-slate-700 shrink-0">
                                {progress}%
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-400">
                              Teacher: {teacherName}
                            </p>
                          </div>

                          <div className="space-y-4 mt-auto">
                            {/* Progress bar */}
                            <Progress value={progress} className="h-1.5 rounded-full bg-slate-100" />

                            {/* Continue button */}
                            <Link href={`/dashboard/lessons/${enrollment.courseId}`}>
                              <Button 
                                className={`w-full h-11 rounded-lg font-bold text-xs shadow-none transition-all ${
                                  isPrimary 
                                    ? 'bg-slate-700 hover:bg-slate-800 text-white' 
                                    : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                Continue Learning
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-white border border-slate-100 rounded-[1.25rem] text-slate-400">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No enrolled courses yet</p>
                </div>
              )}
            </section>

            {/* LEADERBOARD RANK */}
            <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-base font-bold text-slate-800">Leaderboard Rank</h3>
                <button className="text-slate-400 hover:text-slate-600">
                  <Info className="h-4 w-4" />
                </button>
              </div>
              <div className="bg-blue-50/70 border border-blue-100/60 rounded-xl p-4 flex items-center gap-4 shadow-none">
                <div className="h-12 w-12 rounded-xl bg-blue-100/80 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Current Rank: #{dashboard?.leaderboardRank || 15} (Global)
                  </h4>
                  <p className="text-slate-400 text-xs font-semibold mt-0.5">
                    Top 10%
                  </p>
                </div>
              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            
            {/* UPCOMING DEADLINES */}
            <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <h3 className="text-base font-bold text-slate-800">Upcoming Deadlines</h3>
                
                {dashboard?.deadlines && dashboard.deadlines.length > 0 ? (
                  <div className="space-y-4">
                    {dashboard.deadlines.map((deadline, i) => {
                      const dateInfo = formatDeadlineDate(deadline.dueDate);
                      return (
                        <div key={i} className="flex gap-3.5 items-start">
                          <div className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${dateInfo.isUrgent ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <h4 className={`text-sm font-semibold leading-snug ${dateInfo.isUrgent ? 'text-red-600' : 'text-slate-800'}`}>
                              {deadline.title}
                            </h4>
                            <p className="text-xs text-slate-400 font-semibold line-clamp-1">
                              {deadline.courseName}
                            </p>
                            <p className={`text-xs font-bold ${dateInfo.isUrgent ? 'text-red-500' : 'text-slate-500'}`}>
                              ({dateInfo.text})
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 flex flex-col items-center">
                    <Calendar className="h-8 w-8 mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">No upcoming deadlines</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RECENT NOTIFICATIONS */}
            <Card className="border border-slate-100 shadow-sm rounded-[1.25rem] bg-white overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800">Recent Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                {notifications.length > 0 ? (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {notifications.slice(0, 5).map((activity, i) => {
                      const timeInfo = formatTimeAgo(activity.createdAt);
                      const targetLink = getNotificationLink(activity.title);
                      return (
                        <Link href={targetLink} key={activity.id || i}>
                          <div className={`flex gap-4 items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer group ${
                            !activity.isRead ? "bg-blue-50/20 hover:bg-blue-50/40 border-l-2 border-blue-500 rounded-l-none" : "hover:bg-slate-50"
                          }`}>
                            <div className="flex gap-3.5 items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform relative">
                                {getNotificationIcon(activity.title)}
                                {!activity.isRead && (
                                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-blue-600 border border-white animate-pulse" />
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <h4 className={`text-xs leading-snug group-hover:text-primary transition-colors ${
                                  !activity.isRead ? "font-bold text-slate-800" : "font-semibold text-slate-650"
                                }`}>
                                  {activity.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[160px]">
                                  {activity.message}
                                </p>
                                <p className="text-[9px] text-slate-400 font-medium">
                                  {timeInfo.sub}
                                </p>
                              </div>
                            </div>
                            
                            {/* Time badge */}
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded shrink-0">
                              {timeInfo.time}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 flex flex-col items-center">
                    <Bell className="h-8 w-8 mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No new notifications</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
