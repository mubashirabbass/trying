import { useState } from "react";
import { Link } from "wouter";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, ArrowLeft, CheckCircle2,
  CreditCard, Calendar, ShieldCheck, AlertCircle, Eye, EyeOff, Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

// ─── CNIC auto-formatter: XXXXX-XXXXXXX-X ───────────────────────────────────
function formatCnic(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export default function ForgotPassword() {
  const { toast } = useToast();

  // ── Step 1: CNIC + DOB verification state ─────────────────────────────────
  const [cnic, setCnic] = useState("");
  const [dob, setDob] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  // ── Step 2: Instant password reset state ──────────────────────────────────
  const [verifiedData, setVerifiedData] = useState<{
    email: string;
    name: string;
    role: string;
    token: string;
  } | null>(null);

  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState({ new: false, confirm: false });
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);

  // Password strength logic
  const strength = (() => {
    const pw = passwordForm.newPassword;
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

  // ── Step 1 Form Handler: Verify identity ───────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const rawCnic = cnic.replace(/\D/g, "");
    if (rawCnic.length !== 13) {
      setError("Please enter a valid 13-digit CNIC.");
      return;
    }
    if (!dob) {
      setError("Please select your date of birth.");
      return;
    }

    setVerifying(true);
    try {
      const r = await fetch(`${BASE}/api/auth/forgot-password-cnic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnic, dob }),
      });
      const data = await r.json();

      if (r.ok && data.token) {
        setVerifiedData({
          email: data.email,
          name: data.name,
          role: data.role,
          token: data.token,
        });
        toast({ title: "Identity verified successfully!" });
      } else {
        const errMsg = typeof data.error === "object" && data.error !== null
          ? (data.error.message || data.message)
          : (data.error || data.message);
        setError(errMsg || "Identity mismatch. Please check your credentials.");
      }
    } catch {
      setError("Network connection error. Please try again.");
    }
    setVerifying(false);
  };

  // ── Step 2 Form Handler: Reset password on the spot ─────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!verifiedData) return;
    if (passwordForm.newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setResetting(true);
    try {
      const r = await fetch(`${BASE}/api/auth/forgot-password-cnic-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: verifiedData.token,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await r.json();

      if (r.ok) {
        setDone(true);
        toast({ title: "Password changed successfully!" });
      } else {
        const errMsg = typeof data.error === "object" && data.error !== null
          ? (data.error.message || data.message)
          : (data.error || data.message);
        setError(errMsg || "Failed to update password. Try starting over.");
      }
    } catch {
      setError("Network connection error. Please try again.");
    }
    setResetting(false);
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/15">
        <div className="w-full max-w-md">

          {/* Back link */}
          <Link href="/login">
            <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-6">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </button>
          </Link>

          <Card className="border-none shadow-2xl shadow-indigo-100/60 ring-1 ring-gray-100 rounded-[32px] overflow-hidden bg-white">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-primary to-blue-500" />

            <CardContent className="p-8 md:p-10">
              {done ? (
                /* Success Screen */
                <div className="text-center py-6 animate-in zoom-in duration-300">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-950 mb-3">Password Updated!</h2>
                  <p className="text-slate-500 text-sm font-medium mb-8">
                    Your password has been changed successfully. You can now log into your portal.
                  </p>
                  <Link href="/login">
                    <Button className="w-full h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200/50">
                      Proceed to Login
                    </Button>
                  </Link>
                </div>
              ) : verifiedData ? (
                /* Step 2 Screen: Reset on the Spot */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <div className="text-center mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                      <ShieldCheck className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">Identity Verified!</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Hello, {verifiedData.name} ({verifiedData.role})</p>
                  </div>

                  {/* Account detail display */}
                  <div className="rounded-2xl p-5 bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Registered Username (Email)</span>
                      <span className="text-sm font-black text-slate-900 font-mono select-all bg-white py-2 px-3 rounded-lg border border-slate-100 break-all">{verifiedData.email}</span>
                    </div>
                  </div>

                  {/* Reset form */}
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {error && (
                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-700 font-bold">{error}</p>
                      </div>
                    )}

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <Label className="font-bold text-gray-700 text-sm">Choose New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <Input
                          type={showPw.new ? "text" : "password"}
                          required
                          className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-indigo-400"
                          placeholder="Minimum 8 characters"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        />
                        <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                          className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600">
                          {showPw.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Password strength visualizer */}
                      {passwordForm.newPassword && (
                        <div className="space-y-1 mt-1.5 pl-0.5">
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : "bg-gray-100"}`} />
                            ))}
                          </div>
                          <p className={`text-[10px] font-bold ${
                            strength <= 1 ? "text-red-500" : strength === 2 ? "text-amber-600" : strength === 3 ? "text-blue-500" : "text-emerald-500"
                          }`}>
                            Strength: {strengthLabel}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <Label className="font-bold text-gray-700 text-sm">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <Input
                          type={showPw.confirm ? "text" : "password"}
                          required
                          className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-indigo-400"
                          placeholder="Re-enter password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        />
                        <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                          className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600">
                          {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordForm.confirmPassword && (
                        <p className={`text-[11px] font-bold mt-1 pl-0.5 ${
                          passwordForm.newPassword === passwordForm.confirmPassword ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {passwordForm.newPassword === passwordForm.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={resetting || strength < 2}
                      className="w-full h-12 rounded-xl font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 mt-2"
                    >
                      {resetting ? (
                        <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Updating Password...</>
                      ) : (
                        "Reset Password & Save"
                      )}
                    </Button>
                  </form>
                </div>
              ) : (
                /* Step 1 Screen: CNIC + DOB credentials verification */
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                      <ShieldCheck className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 leading-tight">Forgot Password</h1>
                    <p className="text-slate-500 text-xs font-semibold mt-1.5 leading-relaxed">
                      Verify your identity to reset password and retrieve username instantly.
                    </p>
                  </div>

                  <form onSubmit={handleVerify} className="space-y-4">
                    {error && (
                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-700 font-bold">{error}</p>
                      </div>
                    )}

                    {/* CNIC input */}
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-700 text-sm">CNIC Number</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="cnic-number"
                          type="text"
                          inputMode="numeric"
                          required
                          maxLength={15}
                          className="pl-10 h-12 rounded-xl border-slate-200 focus:border-indigo-400 font-mono tracking-widest"
                          placeholder="XXXXX-XXXXXXX-X"
                          value={cnic}
                          onChange={(e) => setCnic(formatCnic(e.target.value))}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 pl-0.5">Enter CNIC with dashes (e.g. 35202-1234567-1)</p>
                    </div>

                    {/* Date of Birth input */}
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-700 text-sm">Date of Birth</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="cnic-dob"
                          type="date"
                          required
                          className="pl-10 h-12 rounded-xl border-slate-200 focus:border-indigo-400"
                          max={new Date().toISOString().slice(0, 10)}
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={verifying}
                      className="w-full h-12 rounded-xl font-bold text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 mt-2"
                    >
                      {verifying ? (
                        <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Verifying Identity...</>
                      ) : (
                        "Verify & Reset Password"
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
