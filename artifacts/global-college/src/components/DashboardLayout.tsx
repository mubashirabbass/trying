import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
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
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
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
          <div className="absolute right-0 top-10 z-50 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  <Bell className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                  No notifications yet
                </div>
              ) : (
                notifs.slice(0, 20).map(n => (
                  <div
                    key={n.id}
                    className={`p-4 border-b hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50/50" : ""}`}
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

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout, token } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case "student":
        return [
          { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
          { name: "My Courses", path: "/dashboard/courses", icon: BookOpen },
          { name: "Assignments", path: "/dashboard/assignments", icon: FileText },
          { name: "Quizzes", path: "/dashboard/quizzes", icon: CheckSquare },
          { name: "Forum", path: "/dashboard/forum", icon: MessageSquare },
          { name: "Messages", path: "/dashboard/messages", icon: MessageSquare },
          { name: "Leaderboard", path: "/dashboard/leaderboard", icon: Trophy },
          { name: "Certificates", path: "/dashboard/certificates", icon: Award },
          { name: "Verify Identity", path: "/dashboard/verify-identity", icon: ShieldCheck },
        ];
      case "teacher":
        return [
          { name: "Overview", path: "/teacher", icon: LayoutDashboard },
          { name: "My Courses", path: "/teacher/courses", icon: BookOpen },
          { name: "Assignments", path: "/teacher/assignments", icon: FileText },
          { name: "Quizzes", path: "/teacher/quizzes", icon: CheckSquare },
          { name: "Messages", path: "/teacher/messages", icon: MessageSquare },
        ];
      case "admin":
        return [
          { name: "Overview", path: "/admin", icon: LayoutDashboard },
          { name: "Users", path: "/admin/users", icon: Users },
          { name: "Courses", path: "/admin/courses", icon: BookOpen },
          { name: "Payments", path: "/admin/payments", icon: CreditCard },
          { name: "Identity Verify", path: "/admin/identity-verifications", icon: ShieldCheck },
          { name: "Announcements", path: "/admin/announcements", icon: Megaphone },
          { name: "Success Stories", path: "/admin/success-stories", icon: Award },
          { name: "Testimonials", path: "/admin/testimonials", icon: Star },
          { name: "Branches", path: "/admin/branches", icon: Building },
          { name: "Settings", path: "/admin/settings", icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const ROLE_COLOR: Record<string, string> = {
    student: "bg-blue-100 text-blue-700",
    teacher: "bg-emerald-100 text-emerald-700",
    admin: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="min-h-[100dvh] flex bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b shrink-0 gap-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 leading-tight">Global College</p>
              <p className="text-xs text-gray-400 capitalize">{user.role} Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (item.path !== "/dashboard" && item.path !== "/teacher" && item.path !== "/admin" && location.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t shrink-0">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <Badge className={`text-xs py-0 ${ROLE_COLOR[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                {user.role}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 text-sm h-9"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b flex items-center justify-between px-4 lg:px-6 shrink-0 gap-4">
          <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 hidden md:block">
            <p className="text-sm text-gray-400">
              Welcome back, <span className="font-semibold text-gray-700">{user.name.split(" ")[0]}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hidden md:flex text-xs text-gray-500">
                ← Public Site
              </Button>
            </Link>
            <NotificationBell userId={user.id} token={token} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
