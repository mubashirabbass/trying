import { useState } from "react";
import { Link } from "wouter";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Please enter your email address", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success (don't reveal if email exists)
      setSent(true);
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Back link */}
          <Link href="/login">
            <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-8">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </button>
          </Link>

          <Card className="border-none shadow-xl ring-1 ring-gray-100 rounded-[32px] overflow-hidden">
            {/* Top bar */}
            <div className="h-1.5 bg-gradient-to-r from-primary to-blue-500" />
            
            <CardContent className="p-10">
              {sent ? (
                /* Success state */
                <div className="text-center py-4">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-3">Check Your Email</h2>
                  <p className="text-gray-500 font-medium mb-2">
                    We've sent a password reset link to:
                  </p>
                  <p className="font-black text-gray-900 mb-6">{email}</p>
                  <p className="text-sm text-gray-400 mb-8">
                    The link will expire in 1 hour. If you don't see it, check your spam folder.
                  </p>
                  <Link href="/login">
                    <Button className="w-full h-12 rounded-xl font-bold">
                      Return to Login
                    </Button>
                  </Link>
                </div>
              ) : (
                /* Form state */
                <>
                  <div className="text-center mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Forgot Password?</h1>
                    <p className="text-gray-500 font-medium">
                      No worries! Enter your email and we'll send you a reset link.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-700">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        <Input
                          type="email"
                          required
                          className="pl-10 h-12 rounded-xl border-gray-200 focus:border-primary"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20"
                    >
                      {loading ? (
                        <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Sending...</>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-gray-500 mt-6 font-medium">
                    Remembered your password?{" "}
                    <Link href="/login" className="text-primary font-bold hover:underline">
                      Login here
                    </Link>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
