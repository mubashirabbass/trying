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
  Loader2, BookOpen, ShieldCheck, ArrowRight, GraduationCap,
  Users, LayoutDashboard, Eye, EyeOff, Mail, Lock, ArrowLeft,
  Star, Trophy, Zap, Globe, CheckCircle2, BarChart3, BookMarked,
  ClipboardList, Settings2,
} from "lucide-react";
import { Link } from "wouter";

type Role = "student" | "teacher" | "admin";

const roleConfigs: Record<Role, {
  label: string;
  emoji: string;
  icon: any;
  tagline: string;
  desc: string;
  leftGlow: string;       // CSS color for glow blobs
  panelBg: string;        // left panel gradient (CSS)
  accentBg: string;       // button / active indicator bg (CSS)
  accentText: string;     // tab active text class
  accentBorder: string;   // tab active border class  
  accentTabBg: string;    // tab active bg class
  features: { icon: any; text: string }[];
  stats: { value: string; label: string }[];
}> = {
  student: {
    label: "Student",
    emoji: "🎓",
    icon: GraduationCap,
    tagline: "Learn. Grow. Succeed.",
    desc: "Access your courses & track your progress",
    panelBg: "linear-gradient(145deg, #0a1628 0%, #0f2456 45%, #1a3a8a 100%)",
    leftGlow: "#2563eb",
    accentBg: "linear-gradient(135deg, #1d4ed8, #4338ca)",
    accentText: "text-blue-700",
    accentBorder: "border-blue-500",
    accentTabBg: "bg-blue-50",
    features: [
      { icon: BookMarked, text: "Access enrolled courses & video lessons" },
      { icon: ClipboardList, text: "Submit assignments & view your grades" },
      { icon: Trophy, text: "Earn certificates & climb the leaderboard" },
    ],
    stats: [{ value: "500+", label: "Courses" }, { value: "10K+", label: "Students" }, { value: "98%", label: "Satisfaction" }],
  },
  teacher: {
    label: "Teacher",
    emoji: "👨‍🏫",
    icon: Users,
    tagline: "Teach. Inspire. Impact.",
    desc: "Manage your classes & students",
    panelBg: "linear-gradient(145deg, #071e17 0%, #064e3b 45%, #065f46 100%)",
    leftGlow: "#10b981",
    accentBg: "linear-gradient(135deg, #059669, #0d9488)",
    accentText: "text-emerald-700",
    accentBorder: "border-emerald-500",
    accentTabBg: "bg-emerald-50",
    features: [
      { icon: BookOpen, text: "Build & manage your course content" },
      { icon: BarChart3, text: "Grade assignments & track performance" },
      { icon: Users, text: "Engage students in live sessions" },
    ],
    stats: [{ value: "120+", label: "Teachers" }, { value: "4.9★", label: "Rating" }, { value: "50K+", label: "Taught" }],
  },
  admin: {
    label: "Admin",
    emoji: "🛡️",
    icon: LayoutDashboard,
    tagline: "Manage. Monitor. Control.",
    desc: "Full control panel & system management",
    panelBg: "linear-gradient(145deg, #0d0720 0%, #2e1065 45%, #4c1d95 100%)",
    leftGlow: "#8b5cf6",
    accentBg: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    accentText: "text-violet-700",
    accentBorder: "border-violet-500",
    accentTabBg: "bg-violet-50",
    features: [
      { icon: Settings2, text: "Full platform configuration control" },
      { icon: Users, text: "Manage students, teachers & enrollments" },
      { icon: BarChart3, text: "Analytics, financial reports & payments" },
    ],
    stats: [{ value: "99.9%", label: "Uptime" }, { value: "256-bit", label: "SSL" }, { value: "24/7", label: "Access" }],
  },
};

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
  const [isSuspended, setIsSuspended] = useState(false);

  const cfg = roleConfigs[selectedRole];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password, rememberMe, role: selectedRole } as any },
      {
        onSuccess: (data) => {
          if (data.user.role !== selectedRole) {
            toast({
              title: "Wrong Portal Selected",
              description: `Your account is a ${data.user.role}. Please select the correct role tab.`,
              variant: "destructive",
            });
            return;
          }
          login(data.user, data.token, rememberMe);
          toast({ title: `Welcome back, ${data.user.name.split(" ")[0]}! 👋` });
          if (data.user.role === "admin") setLocation("/admin");
          else if (data.user.role === "teacher") setLocation("/teacher");
          else setLocation("/dashboard");
        },
        onError: (error: any) => {
          const errMsg = error.message || "";
          if (errMsg.toLowerCase().includes("suspended") || errMsg.toLowerCase().includes("deactivated")) {
            setIsSuspended(true);
          } else {
            toast({
              title: "Authentication Failed",
              description: errMsg || "Invalid credentials. Please try again.",
              variant: "destructive",
            });
          }
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-100">

      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex flex-col w-[44%] xl:w-[40%] relative overflow-hidden transition-all duration-700"
        style={{ background: cfg.panelBg }}
      >
        {/* Decorative glow blobs */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] opacity-30 pointer-events-none transition-all duration-700"
          style={{ background: cfg.leftGlow }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none transition-all duration-700"
          style={{ background: cfg.leftGlow }}
        />
        {/* Fine grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Brand */}
        <div className="relative z-10 p-10">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group w-fit">
              <div
                className="h-11 w-11 rounded-2xl flex items-center justify-center shadow-xl transition-transform group-hover:scale-105"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-lg leading-none">Global College</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Learning Management System
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-6">
          <div className="text-6xl mb-5 select-none">{cfg.emoji}</div>
          <h2 className="text-4xl xl:text-[2.75rem] font-black text-white leading-tight mb-3">
            {cfg.tagline}
          </h2>
          <p className="text-base font-medium mb-10" style={{ color: "rgba(255,255,255,0.65)" }}>
            {cfg.desc}
          </p>

          {/* Feature rows */}
          <div className="space-y-4 mb-12">
            {cfg.features.map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {cfg.stats.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 text-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <div className="text-xl font-black text-white">{s.value}</div>
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust strip */}
        <div
          className="relative z-10 px-10 py-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-center gap-6">
            {[
              { icon: ShieldCheck, text: "SSL Encrypted" },
              { icon: Globe, text: "Multi-Campus" },
              { icon: Star, text: "Trusted Platform" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                <Icon className="h-4 w-4" />
                <span className="text-xs font-bold">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col bg-white min-h-screen overflow-y-auto">
        {/* Mobile top accent bar */}
        <div className="lg:hidden h-1 w-full shrink-0" style={{ background: cfg.accentBg }} />

        <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-12">

          {/* Back link */}
          <div className="w-full max-w-[420px] mb-6">
            <Link href="/">
              <button className="flex items-center gap-2.5 text-slate-400 hover:text-slate-700 transition-colors group text-sm font-semibold">
                <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:border-slate-300 transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </div>
                Back to Home
              </button>
            </Link>
          </div>

          {/* Mobile brand */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl mb-3"
              style={{ background: cfg.accentBg }}
            >
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Global College LMS</h1>
          </div>

          {/* Card */}
          <div className="w-full max-w-[420px]">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">

              {/* Role tabs */}
              <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/60">
                {(Object.keys(roleConfigs) as Role[]).map((roleKey) => {
                  const rc = roleConfigs[roleKey];
                  const isActive = selectedRole === roleKey;
                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => setSelectedRole(roleKey)}
                      className={`flex flex-col items-center gap-1.5 py-4 px-2 text-center transition-all duration-200 border-b-2 ${
                        isActive
                          ? `${rc.accentBorder} ${rc.accentText} ${rc.accentTabBg} font-black`
                          : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-white/70 font-semibold"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
                        isActive ? "bg-white shadow-sm" : ""
                      }`}>
                        <rc.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs">{rc.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Form */}
              <div className="p-8">
                {/* Heading */}
                <div className="flex items-center gap-3 mb-7">
                  <span className="text-4xl select-none">{cfg.emoji}</span>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">
                      Sign in as {cfg.label}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium mt-0.5">{cfg.desc}</p>
                  </div>
                </div>

                {/* Mobile features */}
                <div className="lg:hidden mb-6 rounded-2xl p-4 border border-slate-100 bg-slate-50 space-y-2.5">
                  {cfg.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-slate-600 text-xs font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {f.text}
                    </div>
                  ))}
                </div>

                {isSuspended ? (
                  <div className="space-y-6 text-center py-6 px-4 bg-rose-50/50 rounded-2xl border border-rose-100/60 shadow-inner">
                    <div className="mx-auto h-16 w-16 bg-rose-100 rounded-2xl flex items-center justify-center border border-rose-200 shadow-sm animate-pulse">
                      <ShieldCheck className="h-8 w-8 text-rose-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-rose-700">Login Suspended</h3>
                      <p className="text-xs text-slate-600 font-bold leading-relaxed">
                        Your login has been suspended by the admin. Please contact admin.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsSuspended(false)}
                      className="w-full h-11 font-black rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 mt-4 shadow-sm"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sign In
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all rounded-xl pl-11 font-semibold text-slate-800 placeholder:text-slate-300 placeholder:font-normal"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Password
                        </Label>
                        <Link href="/forgot-password" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                          Forgot Password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all rounded-xl pl-11 pr-12 font-semibold text-slate-800 placeholder:text-slate-300 placeholder:font-normal"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(c) => setRememberMe(c as boolean)}
                        className="rounded-md border-slate-300"
                      />
                      <label htmlFor="remember" className="text-sm font-medium text-slate-500 cursor-pointer select-none">
                        Keep me signed in for 30 days
                      </label>
                    </div>

                    {/* Submit — inline style avoids Tailwind purging */}
                    <button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full h-12 font-black rounded-xl text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group"
                      style={{ background: cfg.accentBg, boxShadow: `0 4px 20px ${cfg.leftGlow}40` }}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Sign in as {cfg.label}
                          <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Footer */}
                <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
                  <p className="text-sm text-slate-500 font-semibold">
                    Forgot your password?{" "}
                    <Link href="/forgot-password" className="text-indigo-600 hover:text-indigo-800 transition-colors underline underline-offset-2 font-black">
                      Reset it here
                    </Link>
                  </p>
                  {selectedRole === "student" && (
                    <p className="text-sm text-slate-500 font-medium">
                      New to Global College?{" "}
                      <Link href="/register" className="font-black text-slate-800 hover:text-slate-600 transition-colors underline underline-offset-2">
                        Create account →
                      </Link>
                    </p>
                  )}
                  {selectedRole === "teacher" && (
                    <p className="text-sm text-slate-400 italic">Teacher accounts are provisioned by administration.</p>
                  )}
                  {selectedRole === "admin" && (
                    <p className="text-sm text-slate-400 italic">Admin access is restricted to authorized personnel.</p>
                  )}
                  <div className="flex items-center justify-center gap-2 text-slate-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="text-[9px] uppercase tracking-[0.15em] font-bold">256-bit SSL · Secure Login</span>
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick-switch portal badges */}
            <div className="mt-5 flex items-center justify-center gap-2">
              {(Object.keys(roleConfigs) as Role[]).map((roleKey) => {
                const rc = roleConfigs[roleKey];
                const isActive = selectedRole === roleKey;
                return (
                  <button
                    key={roleKey}
                    onClick={() => setSelectedRole(roleKey)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isActive
                        ? "bg-white text-slate-800 border-slate-300 shadow-md"
                        : "bg-slate-100 text-slate-400 border-transparent hover:bg-white hover:text-slate-600 hover:border-slate-200"
                    }`}
                  >
                    <span>{rc.emoji}</span> {rc.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
