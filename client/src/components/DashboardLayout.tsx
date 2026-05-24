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
  Newspaper
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
      { name: "Testimonials", path: "/admin/testimonials", icon: Star },
      { name: "Attendance", path: "/admin/attendance", icon: CalendarRange },
    ],
  },
  {
    label: "PAYMENTS",
    items: [
      { name: "Manual Enrollment", path: "/admin/enrollments", icon: ClipboardList },
    ],
  },
  {
    label: "VERIFICATION",
    items: [
      { name: "Identity Verifications", path: "/admin/identity-verifications", icon: ShieldCheck },
      { name: "Certificates", path: "/admin/certificates", icon: BadgeCheck },
    ],
  },
  {
    label: "COMMUNICATION",
    items: [
      { name: "Messages", path: "/admin/messages", icon: MessageCircle },
      { name: "Announcements", path: "/admin/announcements", icon: Megaphone },
      { name: "Forum", path: "/admin/forum", icon: MessageSquare },
    ],
  },
  {
    label: "DATA",
    items: [
      { name: "Reports", path: "/admin/reports", icon: FileBarChart },
      { name: "Payment Records", path: "/admin/payments", icon: CreditCard },
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
    return val !== null ? Number(val) : 2; // Default to 2 on first load
  });
  const [pendingAssignments, setPendingAssignments] = useState<number>(0);
  const [pendingCourses, setPendingCourses] = useState<number>(0);
  const [attendanceStatus, setAttendanceStatus] = useState<"green" | "red" | null>(null);
  const [pendingQuizzes, setPendingQuizzes] = useState<number>(() => {
    const val = localStorage.getItem("unread_quizzes_count");
    return val !== null ? Number(val) : 1; // Default to 1 on first load
  });
  const [forumHasUpdates, setForumHasUpdates] = useState<boolean>(() => {
    const val = localStorage.getItem("unread_forum_has_updates");
    return val !== null ? val === "true" : true; // Default to true on first load
  });

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
          { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
          { name: "Browse Courses", path: "/dashboard/browse", icon: Compass },
          { name: "My Courses", path: "/dashboard/courses", icon: BookOpen },
          { name: "Live Classes", path: "/dashboard/live-classes", icon: Video },
          { name: "Attendance", path: "/dashboard/attendance", icon: CalendarRange },
          { name: "Progress", path: "/dashboard/progress", icon: BarChart3 },
          { name: "Assignments", path: "/dashboard/assignments", icon: FileText },
          { name: "Quizzes", path: "/dashboard/quizzes", icon: CheckSquare },
          { name: "Forum", path: "/dashboard/forum", icon: MessageSquare },
          { name: "Messages", path: "/dashboard/messages", icon: MessageCircle },
          { name: "Leaderboard", path: "/dashboard/leaderboard", icon: Trophy },
          { name: "Certificates", path: "/dashboard/certificates", icon: Award },
          { name: "Verify Identity", path: "/dashboard/verify-identity", icon: ShieldCheck },
          { name: "My Profile", path: "/dashboard/profile", icon: User },
        ];
      case "teacher":
        return [
          { name: "Overview", path: "/teacher", icon: LayoutDashboard },
          { name: "My Courses", path: "/teacher/courses", icon: BookOpen },
          { name: "Grading Hub", path: "/teacher/grading", icon: GraduationCap },
          { name: "Lecture Reviews", path: "/teacher/reviews", icon: Star },
          { name: "Live Classes", path: "/teacher/live-classes", icon: Video },
          { name: "Attendance", path: "/teacher/attendance", icon: CalendarRange },
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
    <div className="min-h-[100dvh] flex bg-background text-foreground">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-sidebar text-sidebar-foreground border-sidebar-border border-r transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col
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
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {user.role === "admin" ? (
            // Admin: grouped navigation
            <div className="space-y-4">
              {ADMIN_NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[9px] font-black text-sidebar-foreground/40 uppercase tracking-[0.2em] px-3 mb-1">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
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
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-sidebar-primary/10 text-primary dark:bg-sidebar-primary/25 dark:text-primary-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-sidebar-foreground/45"}`} />
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
                    <span className="ml-auto h-5 w-5 bg-red-500 text-[10px] font-black text-white rounded-full flex items-center justify-center shadow-sm animate-pulse shrink-0">
                      {unreadMessages}
                    </span>
                  );
                } else if (item.path === "/dashboard/assignments" && pendingAssignments > 0) {
                  badgeContent = (
                    <span className="ml-auto h-5 w-5 bg-red-500 text-[10px] font-black text-white rounded-full flex items-center justify-center shadow-sm animate-pulse shrink-0">
                      {pendingAssignments}
                    </span>
                  );
                } else if (item.path === "/dashboard/courses" && pendingCourses > 0) {
                  badgeContent = (
                    <span className="ml-auto h-5 w-5 bg-blue-500 text-[10px] font-black text-white rounded-full flex items-center justify-center shadow-sm animate-pulse shrink-0" title="Pending courses / approval">
                      {pendingCourses}
                    </span>
                  );
                } else if (item.path === "/dashboard/quizzes" && pendingQuizzes > 0) {
                  badgeContent = (
                    <span className="ml-auto h-5 w-5 bg-red-500 text-[10px] font-black text-white rounded-full flex items-center justify-center shadow-sm animate-pulse shrink-0">
                      {pendingQuizzes}
                    </span>
                  );
                } else if (item.path === "/dashboard/attendance" && attendanceStatus) {
                  badgeContent = (
                    <span className={`ml-auto h-2.5 w-2.5 rounded-full shadow-sm animate-pulse shrink-0 ${
                      attendanceStatus === "green" ? "bg-emerald-500" : "bg-red-500"
                    }`} title={attendanceStatus === "green" ? "Marked Present Today" : "Marked Absent / Update"} />
                  );
                } else if (item.path === "/dashboard/forum" && forumHasUpdates) {
                  badgeContent = (
                    <span className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm animate-pulse shrink-0" title="New discussion replies" />
                  );
                }

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sidebar-primary/10 text-primary dark:bg-sidebar-primary/25 dark:text-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-sidebar-foreground/45"}`} />
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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-12 bg-card text-card-foreground border-border border-b flex items-center justify-between px-4 lg:px-6 shrink-0 gap-4">
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 min-w-0">
            {headerTitle && (
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <CalendarRange className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{headerTitle}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Icons moved or cleaned for simplified header */}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background">
          {children}
        </div>
      </main>
    </div>
  );
}

