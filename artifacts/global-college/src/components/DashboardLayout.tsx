import { ReactNode, useState } from "react";
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
  LogOut
} from "lucide-react";
import { Button } from "./ui/button";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
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
          { name: "Certificates", path: "/dashboard/certificates", icon: Award },
        ];
      case "teacher":
        return [
          { name: "Overview", path: "/teacher", icon: LayoutDashboard },
          { name: "My Courses", path: "/teacher/courses", icon: BookOpen },
          { name: "Assignments", path: "/teacher/assignments", icon: FileText },
          { name: "Quizzes", path: "/teacher/quizzes", icon: CheckSquare },
        ];
      case "admin":
        return [
          { name: "Overview", path: "/admin", icon: LayoutDashboard },
          { name: "Users", path: "/admin/users", icon: Users },
          { name: "Courses", path: "/admin/courses", icon: BookOpen },
          { name: "Payments", path: "/admin/payments", icon: CreditCard },
          { name: "Success Stories", path: "/admin/success-stories", icon: Award },
          { name: "Testimonials", path: "/admin/testimonials", icon: Star },
          { name: "Branches", path: "/admin/branches", icon: Building },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-[100dvh] flex bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="h-16 flex items-center px-6 border-b shrink-0">
          <Link href="/" className="font-bold text-xl text-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            LMS Panel
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || location.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button 
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-auto">
            {/* Add user profile dropdown or notifications here if needed */}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
