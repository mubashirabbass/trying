import { useState } from "react";
import { Link, useLocation } from "wouter";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function ResetPassword() {
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Extract token from URL: /reset-password/:token
  const token = location.split("/reset-password/")[1] || "";

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState({ new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const strength = (() => {
    const pw = form.newPassword;
    if (pw.length === 0) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid or expired reset link.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: form.newPassword }),
      });

      if (r.ok) {
        setDone(true);
      } else {
        const data = await r.json();
        setError(data.message || data.error || "This reset link is invalid or has expired.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gray-50">
        <div className="w-full max-w-md">
          <Card className="border-none shadow-xl ring-1 ring-gray-100 rounded-[32px] overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary to-blue-500" />
            
            <CardContent className="p-10">
              {done ? (
                <div className="text-center py-4">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-3">Password Reset!</h2>
                  <p className="text-gray-500 font-medium mb-8">
                    Your password has been changed successfully. You can now log in with your new password.
                  </p>
                  <Link href="/login">
                    <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                      Go to Login
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Set New Password</h1>
                    <p className="text-gray-500 font-medium">
                      Choose a strong password for your account.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-5 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      <p className="text-sm font-bold text-red-700">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* New Password */}
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-700">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        <Input
                          type={showPw.new ? "text" : "password"}
                          required
                          className="pl-10 pr-10 h-12 rounded-xl border-gray-200"
                          placeholder="At least 8 characters"
                          value={form.newPassword}
                          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                        />
                        <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                          {showPw.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Strength bar */}
                      {form.newPassword && (
                        <div className="space-y-1">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : "bg-gray-100"}`} />
                            ))}
                          </div>
                          <p className={`text-xs font-bold ${
                            strength <= 1 ? "text-red-500" : strength === 2 ? "text-amber-500" : strength === 3 ? "text-blue-500" : "text-emerald-500"
                          }`}>
                            {strengthLabel}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-700">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        <Input
                          type={showPw.confirm ? "text" : "password"}
                          required
                          className="pl-10 pr-10 h-12 rounded-xl border-gray-200"
                          placeholder="Re-enter password"
                          value={form.confirmPassword}
                          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        />
                        <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                          {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                        <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Passwords do not match
                        </p>
                      )}
                      {form.confirmPassword && form.newPassword === form.confirmPassword && (
                        <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Passwords match
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || strength < 2}
                      className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20"
                    >
                      {loading ? (
                        <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Updating...</>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-gray-500 mt-6">
                    <Link href="/login" className="text-primary font-bold hover:underline">
                      Back to Login
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
