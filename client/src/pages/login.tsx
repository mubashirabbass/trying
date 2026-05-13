import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/AuthContext";
import { useLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    loginMutation.mutate(
      { data: { email, password, rememberMe } as any },
      {
        onSuccess: (data) => {
          login(data.user, data.token, rememberMe);
          toast({
            title: "Access Granted",
            description: `Welcome back to your workspace, ${data.user.name.split(" ")[0]}.`,
          });
          
          // Smart redirection based on role
          if (data.user.role === "admin") setLocation("/admin");
          else if (data.user.role === "teacher") setLocation("/teacher");
          else setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast({
            title: "Authentication Failed",
            description: error.message || "Invalid credentials. Please verify your email and password.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <MainLayout>
      <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50/50">
        <div className="max-w-md w-full space-y-8">
          {/* Brand & Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center transform transition-transform hover:scale-105 duration-300">
                <BookOpen className="h-9 w-9 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 pt-4">
              Secure Login
            </h2>
            <p className="text-slate-500 text-sm">
              Enter your credentials to access the Global College LMS
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium ml-1">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200 rounded-xl px-4"
                    placeholder="name@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-slate-700 font-medium">
                      Password
                    </Label>
                    <Link 
                      href="/forgot-password" 
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200 rounded-xl px-4"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-1">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="rounded-md border-slate-300 data-[state=checked]:bg-primary"
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none text-slate-600 cursor-pointer select-none"
                >
                  Keep me logged in for 30 days
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-md shadow-primary/20 transition-all duration-200 active:scale-[0.98] group"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="h-5 w-5 mr-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                )}
                Sign In to Platform
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-50 text-center">
              <p className="text-sm text-slate-500">
                New to Global College?{" "}
                <Link href="/register" className="text-primary font-bold hover:text-primary/80 transition-colors inline-flex items-center group">
                  Create Account
                  <ArrowRight className="h-3 w-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>
          </div>
          
          {/* Security Badge */}
          <div className="flex items-center justify-center space-x-2 text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-widest font-bold">
              256-bit SSL Encrypted Connection
            </span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
