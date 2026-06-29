import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CheckSquare,
  Award,
  Users,
  CreditCard,
  Star,
  Building,
  Menu,
  X,
  LogOut,
  MessageSquare,
  Trophy,
  ShieldCheck,
  Bell,
  Megaphone,
  Settings,
  TrendingUp,
  GraduationCap,
  MessageCircle,
  FileBarChart,
  BadgeCheck,
  UserCog,
  ClipboardList,
  MailOpen,
  User,
  BarChart3,
  Compass,
  Sun,
  Moon,
  CalendarRange,
  Video,
  Newspaper,
  IdCard,
  Banknote,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Notif { id: number; title: string; message: string; isRead: boolean; type: string; createdAt: string; link?: string; }

function NotificationBell({ userId, token }: { userId: number; token: string | null }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const unread = notifs.filter(n => !n.isRead).length;

  const fetch_n = async () => {
    try {
      const r = await fetch(`${BASE}/api/notifications?userId=${userId}`, { headers });
      if (r.ok) setNotifs(await r.json());
    } catch {}
  };

  const markAllRead = async () => {
    await fetch(`${BASE}/api/notifications/read-all?userId=${userId}`, { method: "PATCH", headers });
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  useEffect(() => {
    fetch_n();
    const id = setInterval(fetch_n, 30000);
    return () => clearInterval(id);
  }, [userId]);

  const TYPE_COLOR: Record<string, string> = {
    announcement: "bg-blue-100 text-blue-600",
    payment: "bg-green-100 text-green-600",
    grade: "bg-purple-100 text-purple-600",
    certificate: "bg-orange-100 text-orange-600",
    info: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetch_n(); }}
        className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 bg-popover rounded-xl shadow-xl border border-popover-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-sm text-popover-foreground">Notifications</h3>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Bell className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                  No notifications yet
                </div>
              ) : (
                notifs.slice(0, 20).map(n => (
                  <div
                    key={n.id}
                    className={`p-4 border-b border-border hover:bg-accent/50 transition-colors ${!n.isRead ? "bg-primary/5 text-primary" : "text-popover-foreground"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${TYPE_COLOR[n.type] ?? TYPE_COLOR.info}`}>
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-sm font-medium leading-tight ${!n.isRead ? "text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                          {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Admin grouped navigation per spec
const ADMIN_NAV_GROUPS = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
      { name: "Live Classes", path: "/admin/live-classes", icon: Video },
    ],
  },
  {
    label: "USERS",
    items: [
      { name: "Students", path: "/admin/users", icon: Users },
      { name: "Teachers", path: "/admin/teachers", icon: UserCog },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { name: "Courses", path: "/admin/courses", icon: BookOpen },
      { name: "Lecture Reviews", path: "/admin/reviews", icon: Star },
      { name: "FAQs", path: "/admin/faqs", icon: ClipboardList },
      { name: "Success Stories", path: "/admin/success-stories", icon: Award },
      { name: "Featured Courses", path: "/admin/featured-courses", icon: Star },
      { name: "Articles & News", path: "/admin/articles", icon: Newspaper },
      { name: "Student Attendance", path: "/admin/attendance", icon: CalendarRange },
      { name: "Teacher Attendance", path: "/admin/teacher-attendance", icon: UserCog },
    ],
  },
  {
    label: "PAYMENTS",
    items: [
      { name: "Fee Tracker", path: "/admin/fees", icon: CreditCard },
      { name: "Payroll Management", path: "/admin/payroll", icon: Banknote },
    ],
  },
  {
    label: "CERTIFICATES",
    items: [
      { name: "Certificates", path: "/admin/certificates", icon: BadgeCheck },
    ],
  },
  {
    label: "COMMUNICATION",
    items: [
      { name: "Messages", path: "/admin/messages", icon: MessageCircle },
      { name: "Announcements", path: "/admin/announcements", icon: Megaphone },
      { name: "Forum", path: "/admin/forum", icon: MessageSquare },
      { name: "Franchise Applications", path: "/admin/franchise-applications", icon: GraduationCap },
    ],
  },
  {
    label: "DATA",
    items: [
      { name: "Reports", path: "/admin/reports", icon: FileBarChart },
      { name: "Payment Records", path: "/admin/payments", icon: CreditCard },
      { name: "Cashbook", path: "/admin/cashbook", icon: BookOpen },
      { name: "Forms", path: "/admin/forms", icon: FileText },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { name: "Branches", path: "/admin/branches", icon: Building },
      { name: "Settings", path: "/admin/settings", icon: Settings },
    ],
  },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout, token } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const [unreadMessages, setUnreadMessages] = useState<number>(() => {
    const val = localStorage.getItem("unread_messages_count");
    return val !== null ? Number(val) : 0;
  });
  const [pendingAssignments, setPendingAssignments] = useState<number>(0);
  const [pendingCourses, setPendingCourses] = useState<number>(0);
  const [attendanceStatus, setAttendanceStatus] = useState<"green" | "red" | null>(null);
  const [pendingQuizzes, setPendingQuizzes] = useState<number>(() => {
    const val = localStorage.getItem("unread_quizzes_count");
    return val !== null ? Number(val) : 0;
  });
  const [forumHasUpdates, setForumHasUpdates] = useState<boolean>(() => {
    const val = localStorage.getItem("unread_forum_has_updates");
    return val !== null ? val === "true" : false;
  });

  // One-time: clear any stale fake counts from old code defaults
  useEffect(() => {
    if (!localStorage.getItem("_badge_defaults_cleared")) {
      localStorage.setItem("unread_messages_count", "0");
      localStorage.setItem("unread_quizzes_count", "0");
      localStorage.setItem("unread_forum_has_updates", "false");
      localStorage.setItem("_badge_defaults_cleared", "1");
      setUnreadMessages(0);
      setPendingQuizzes(0);
      setForumHasUpdates(false);
    }
  }, []);

  // Track location changes to clear counts/marks
  useEffect(() => {
    if (location === "/dashboard/messages") {
      setUnreadMessages(0);
      localStorage.setItem("unread_messages_count", "0");
    }
    if (location === "/dashboard/quizzes") {
      setPendingQuizzes(0);
      localStorage.setItem("unread_quizzes_count", "0");
    }
    if (location === "/dashboard/forum") {
      setForumHasUpdates(false);
      localStorage.setItem("unread_forum_has_updates", "false");
    }
  }, [location]);

  // Real-time backend fetching sync
  useEffect(() => {
    if (!user || user.role !== "student") return;

    const headers = { 
      Authorization: `Bearer ${token}`, 
      "Content-Type": "application/json" 
    };
    const fetchSidebarData = async () => {
      try {
        // 1. Fetch Student Dashboard Stats for Pending Assignments
        const rDash = await fetch(`/api/dashboard/student?userId=${user.id}`, { headers });
        if (rDash.ok) {
          const data = await rDash.json();
          setPendingAssignments(data.pendingAssignments || 0);
        }

        // 2. Fetch Enrollments for Course Approvals
        const rEnroll = await fetch(`/api/enrollments?userId=${user.id}`, { headers });
        if (rEnroll.ok) {
          const enrollments = await rEnroll.json();
          // Count courses that are pending approval OR active but 0 progress
          const count = enrollments.filter((e: any) => 
            e.status === "pending" || (e.status === "active" && (e.progress ?? 0) === 0)
          ).length;
          setPendingCourses(count);
        }

        // 3. Fetch Attendance Status for today/recent
        const rAttend = await fetch(`/api/attendance/my`, { headers });
        if (rAttend.ok) {
          const attendData = await rAttend.json();
          const records = attendData.records || [];
          if (records.length > 0) {
            const lastRecord = records[records.length - 1];
            if (lastRecord.status === "present" || lastRecord.status === "late") {
              setAttendanceStatus("green");
            } else if (lastRecord.status === "absent") {
              setAttendanceStatus("red");
            }
          }
        }
      } catch (err) {
        console.error("Error fetching dynamic sidebar states:", err);
      }
    };

    fetchSidebarData();
    const interval = setInterval(fetchSidebarData, 12000); // refresh every 12 seconds
    return () => clearInterval(interval);
  }, [user, token, location]);

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case "student":
        return [
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
          { name: "Profile", path: "/dashboard/student-card", icon: IdCard },
          { name: "Browse Courses", path: "/dashboard/browse", icon: Compass },
          { name: "My Courses", path: "/dashboard/courses", icon: BookOpen },
          { name: "Fee Payments", path: "/dashboard/fees", icon: CreditCard },
          { name: "Live Classes", path: "/dashboard/live-classes", icon: Video },
          { name: "Attendance", path: "/dashboard/attendance", icon: CalendarRange },
          { name: "Progress", path: "/dashboard/progress", icon: BarChart3 },
          { name: "Assignments", path: "/dashboard/assignments", icon: FileText },
          { name: "Quizzes", path: "/dashboard/quizzes", icon: CheckSquare },
          { name: "Forum", path: "/dashboard/forum", icon: MessageSquare },
          { name: "Messages", path: "/dashboard/messages", icon: MessageCircle },
          { name: "Leaderboard", path: "/dashboard/leaderboard", icon: Trophy },
          { name: "Certificates", path: "/dashboard/certificates", icon: Award },
          { name: "Settings", path: "/dashboard/profile", icon: Settings },
        ];
      case "teacher":
        return [
          { name: "Overview", path: "/teacher", icon: LayoutDashboard },
          { name: "My Courses", path: "/teacher/courses", icon: BookOpen },
          { name: "Grading Hub", path: "/teacher/grading", icon: GraduationCap },
          { name: "Lecture Reviews", path: "/teacher/reviews", icon: Star },
          { name: "Live Classes", path: "/teacher/live-classes", icon: Video },
          { name: "Mark Attendance", path: "/teacher/attendance", icon: CalendarRange },
          { name: "My Attendance", path: "/teacher/my-attendance", icon: User },
          { name: "Students", path: "/teacher/students", icon: Users },
          { name: "Articles & News", path: "/teacher/articles", icon: Newspaper },
          { name: "Forum", path: "/teacher/forum", icon: MessageSquare },
          { name: "Messages", path: "/teacher/messages", icon: MessageCircle },
          { name: "My Profile", path: "/teacher/profile", icon: User },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const headerTitle =
    location === "/teacher/attendance"
      ? "Teacher Attendance Dashboard"
      : location === "/admin/attendance"
        ? "Admin Attendance Dashboard"
        : location === "/dashboard/attendance"
          ? "Attendance Dashboard"
          : "";

  const ROLE_COLOR: Record<string, string> = {
    student: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    teacher: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    admin: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden" style={{ zoom: "90%", width: "111.11vw", height: "111.11vh" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 h-full bg-sidebar text-sidebar-foreground border-sidebar-border border-r transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col overflow-hidden shrink-0
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0 gap-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-sidebar-foreground leading-tight">Global College</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role} Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 sidebar-scroll">
          {user.role === "admin" ? (
            // Admin: grouped navigation
            <div className="space-y-6">
              {ADMIN_NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[9px] font-black text-sidebar-foreground/40 uppercase tracking-[0.2em] px-3 mb-2">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        location === item.path ||
                        (item.path !== "/admin" && location.startsWith(item.path));
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group ${
                            isActive
                              ? "bg-sidebar-primary/10 text-primary dark:bg-sidebar-primary/25 dark:text-primary-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          <Icon className={`h-4 w-4 transition-all duration-200 ${
                            isActive 
                              ? "text-primary scale-110" 
                              : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80 group-hover:scale-105"
                          }`} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Student/Teacher: flat navigation
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location === item.path ||
                  (item.path !== "/dashboard" &&
                    item.path !== "/teacher" &&
                    location.startsWith(item.path));
                
                let badgeContent: React.ReactNode = null;
                
                if (item.path === "/dashboard/messages" && unreadMessages > 0) {
                  badgeContent = (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-red-500 to-rose-600 text-[10px] font-black text-white rounded-full flex items-center justify-center shadow-md shadow-red-500/40 shrink-0 ring-1 ring-white/30">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  );
                } else if (item.path === "/dashboard/assignments" && pendingAssignments > 0) {
                  badgeContent = (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-orange-500 to-red-500 text-[10px] font-black text-white rounded-full flex items-center justify-center shadow-md shadow-orange-500/40 shrink-0 ring-1 ring-white/30">
                      {pendingAssignments > 9 ? "9+" : pendingAssignments}
                    </span>
                  );
                } else if (item.path === "/dashboard/courses" && pendingCourses > 0) {
                  badgeContent = (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-black text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/40 shrink-0 ring-1 ring-white/30" title="Pending courses / approval">
                      {pendingCourses > 9 ? "9+" : pendingCourses}
                    </span>
                  );
                } else if (item.path === "/dashboard/quizzes" && pendingQuizzes > 0) {
                  badgeContent = (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-violet-500 to-purple-600 text-[10px] font-black text-white rounded-full flex items-center justify-center shadow-md shadow-violet-500/40 shrink-0 ring-1 ring-white/30">
                      {pendingQuizzes > 9 ? "9+" : pendingQuizzes}
                    </span>
                  );
                } else if (item.path === "/dashboard/attendance" && attendanceStatus) {
                  badgeContent = (
                    <span
                      className={`ml-auto relative flex h-3.5 w-3.5 shrink-0`}
                      title={attendanceStatus === "green" ? "Marked Present Today" : "Marked Absent / Update"}
                    >
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
                        attendanceStatus === "green" ? "bg-emerald-400" : "bg-red-400"
                      }`} />
                      <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ring-2 ring-white/70 shadow-sm ${
                        attendanceStatus === "green" ? "bg-emerald-500" : "bg-red-500"
                      }`} />
                    </span>
                  );
                } else if (item.path === "/dashboard/forum" && forumHasUpdates) {
                  badgeContent = (
                    <span className="ml-auto relative flex h-3.5 w-3.5 shrink-0" title="New discussion replies">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white/70 shadow-sm" />
                    </span>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group ${
                      isActive
                        ? "bg-sidebar-primary/10 text-primary dark:bg-sidebar-primary/25 dark:text-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <Icon className={`h-4 w-4 transition-all duration-200 ${
                      isActive 
                        ? "text-primary scale-110" 
                        : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80 group-hover:scale-105"
                    }`} />
                    <span>{item.name}</span>
                    {badgeContent}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{user.name}</p>
              <Badge className={`text-xs py-0 ${ROLE_COLOR[user.role] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                {user.role}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-100 dark:border-red-900/30 text-sm h-9"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background h-full">
          {/* Mobile menu trigger — floats over content on small screens */}
          <button
            className="lg:hidden fixed top-3 left-3 z-40 text-muted-foreground hover:text-foreground bg-card border border-border rounded-md p-1.5 shadow-sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          {children}
        </div>
    </div>
  );
}

