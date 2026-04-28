import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/AuthContext";
import { useLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Info } from "lucide-react";
import { Link } from "wouter";

const DEMO_CREDS = {
  student: { email: "ali@student.pk", password: "Student@123" },
  teacher: { email: "farhan@globalcollege.pk", password: "Teacher@123" },
  admin: { email: "admin@globalcollege.pk", password: "Admin@123" },
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeRole, setActiveRole] = useState("student");
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useLogin();

  const fillDemo = (role: string) => {
    const creds = DEMO_CREDS[role as keyof typeof DEMO_CREDS];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          login(data.user, data.token);
          toast({
            title: "Login successful",
            description: `Welcome back, ${data.user.name}!`,
          });
          if (data.user.role === "admin") setLocation("/admin");
          else if (data.user.role === "teacher") setLocation("/teacher");
          else setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast({
            title: "Login failed",
            description: error.message || "Invalid email or password.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <MainLayout>
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to access your Global College account
            </p>
          </div>

          {/* Demo credentials info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">Demo Credentials</p>
                <div className="space-y-1 text-xs">
                  <p>
                    <span className="font-medium">Student:</span>{" "}
                    ali@student.pk / Student@123
                  </p>
                  <p>
                    <span className="font-medium">Teacher:</span>{" "}
                    farhan@globalcollege.pk / Teacher@123
                  </p>
                  <p>
                    <span className="font-medium">Admin:</span>{" "}
                    admin@globalcollege.pk / Admin@123
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <Tabs
              defaultValue="student"
              onValueChange={(v) => {
                setActiveRole(v);
                setEmail("");
                setPassword("");
              }}
            >
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="teacher">Teacher</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              {(["student", "teacher", "admin"] as const).map((role) => (
                <TabsContent key={role} value={role}>
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                      <Label htmlFor={`email-${role}`}>Email address</Label>
                      <Input
                        id={`email-${role}`}
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 h-11"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`password-${role}`}>Password</Label>
                      <Input
                        id={`password-${role}`}
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 h-11"
                        placeholder="••••••••"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-primary hover:text-primary/80 hover:bg-primary/5"
                      onClick={() => fillDemo(role)}
                    >
                      Fill demo {role} credentials
                    </Button>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : null}
                      Sign in as{" "}
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Button>
                  </form>
                </TabsContent>
              ))}
            </Tabs>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
