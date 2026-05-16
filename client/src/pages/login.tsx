import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/AuthContext";
import { useLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  Users,
  LayoutDashboard,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";

type Role = "student" | "teacher" | "admin";

const roles: {
  id: Role;
  label: string;
  icon: any;
  activeCls: string;
  btnCls: string;
  desc: string;
}[] = [
  {
    id: "student",
    label: "Student",
    icon: GraduationCap,
    activeCls: "border-blue-600 text-blue-600 bg-blue-50/60",
    btnCls: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",
    desc: "Access your courses & progress",
  },
  {
    id: "teacher",
    label: "Teacher",
    icon: Users,
    activeCls: "border-emerald-600 text-emerald-600 bg-emerald-50/60",
    btnCls: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20",
    desc: "Manage classes & students",
  },
  {
    id: "admin",
    label: "Admin",
    icon: LayoutDashboard,
    activeCls: "border-purple-600 text-purple-600 bg-purple-50/60",
    btnCls: "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20",
    desc: "Access the control panel",
  },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const activeRole = roles.find((r) => r.id === selectedRole)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password, rememberMe } as any },
      {
        onSuccess: (data) => {
          login(data.user, data.token, rememberMe);
          toast({
            title: "Welcome Back! 👋",
            description: `Signed in as ${data.user.name.split(" ")[0]}.`,
          });
          if (data.user.role === "admin") setLocation("/admin");
          else if (data.user.role === "teacher") setLocation("/teacher");
          else setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast({
            title: "Authentication Failed",
            description: error.message || "Invalid credentials.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top gradient accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#1a47b8] via-primary to-emerald-500 shrink-0" />

      {/* Page body */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {/* Back to Home Button */}
        <div className="absolute top-8 left-4 sm:left-8 z-20">
          <Link href="/">
            <Button
              variant="ghost"
              className="group gap-2 text-slate-500 hover:text-primary hover:bg-white/50 backdrop-blur-sm transition-all duration-200 rounded-xl"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white shadow-sm border border-slate-200 group-hover:border-primary/30 group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm">Back to Home</span>
            </Button>
          </Link>
        </div>

        {/* Soft radial background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at top right, #eff6ff 0%, transparent 55%), radial-gradient(ellipse at bottom left, #f0fdf4 0%, transparent 55%)",
          }}
        />

        {/* Login card wrapper */}
        <div className="relative z-10 w-full max-w-md">
          {/* Logo block */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 mb-4">
              <BookOpen className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Global College</h1>
            <p className="text-gray-500 text-sm font-semibold mt-1">
              Learning Management System
            </p>
          </div>

          {/* White card */}
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden">
            {/* Role tabs */}
            <div className="grid grid-cols-3 border-b border-gray-100">
              {roles.map(({ id, label, icon: Icon, activeCls }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedRole(id)}
                  className={`flex flex-col items-center gap-1.5 py-5 px-2 text-center font-bold text-sm border-b-2 transition-all duration-200 ${
                    selectedRole === id
                      ? activeCls
                      : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900">
                  Sign in as {activeRole.label}
                </h2>
                <p className="text-gray-500 text-sm font-medium mt-1">
                  {activeRole.desc}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-black text-gray-600 uppercase tracking-widest"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all rounded-xl pl-11 font-medium"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs font-black text-gray-600 uppercase tracking-widest"
                    >
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all rounded-xl pl-11 pr-11 font-medium"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                    className="rounded-md border-slate-300 data-[state=checked]:bg-primary"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium text-slate-600 cursor-pointer select-none"
                  >
                    Keep me signed in for 30 days
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className={`w-full h-12 font-black rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] text-base group text-white ${activeRole.btnCls}`}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5 mr-2" />
                      Sign in as {activeRole.label}
                      <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* Footer links */}
              <div className="mt-6 pt-6 border-t border-gray-50 text-center space-y-3">
                {selectedRole === "student" && (
                  <p className="text-sm text-slate-500">
                    New to Global College?{" "}
                    <Link
                      href="/register"
                      className="text-primary font-black hover:text-primary/80 transition-colors"
                    >
                      Create Free Account →
                    </Link>
                  </p>
                )}
                {selectedRole !== "student" && (
                  <p className="text-sm text-slate-400 italic">
                    {selectedRole === "admin"
                      ? "Admin accounts are created by the system administrator."
                      : "Teacher accounts are created by administration."}
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">
                    256-bit SSL · Secure Login
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
