import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  useListEnrollments, getListEnrollmentsQueryKey,
  useListPayments,   getListPaymentsQueryKey,
  useListCourses,    getListCoursesQueryKey,
} from "@workspace/api-client-react";
import {
  Loader2, CheckCircle2, XCircle, Clock, CreditCard,
  TrendingUp, Search, AlertTriangle, Shield, ShieldOff,
  Lock, Unlock, User, BookOpen, AlertCircle,
  ChevronDown, ChevronUp, Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

// ─── helpers ────────────────────────────────────────────────────────────────

function parseDurationMonths(duration?: string | null): number {
  if (!duration) return 1;
  const m = duration.match(/(\d+)\s*month/i);
  if (m) return parseInt(m[1], 10);
  const y = duration.match(/(\d+)\s*year/i);
  if (y) return parseInt(y[1], 10) * 12;
  return 1;
}

// ─── main component ──────────────────────────────────────────────────────────

export default function AdminFees() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const BASE = (import.meta.env.BASE_URL || "").replace(/\/$/, "");

  const [search, setSearch]           = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [busyKeys, setBusyKeys]       = useState<Record<string, boolean>>({});
  const [loginOverride, setLoginOverride] = useState<Record<number, boolean>>({});

  // ── data ──────────────────────────────────────────────────────────────────
  const { data: enrollmentsRaw = [], isLoading: enrLoading, refetch: refetchEnr } =
    useListEnrollments({}, { query: { queryKey: getListEnrollmentsQueryKey({}) } });

  const { data: paymentsRaw = [], isLoading: payLoading, refetch: refetchPay } =
    useListPayments({}, { query: { queryKey: getListPaymentsQueryKey({}) } });

  const { data: coursesRaw = [], isLoading: coursesLoading } =
    useListCourses({} as any, { query: { queryKey: getListCoursesQueryKey({} as any) } } as any);

  const isLoading = enrLoading || payLoading || coursesLoading;

  const enrollments = Array.isArray(enrollmentsRaw) ? enrollmentsRaw : [];
  const payments    = Array.isArray(paymentsRaw)    ? paymentsRaw    : [];
  const courses     = Array.isArray(coursesRaw)     ? coursesRaw     : [];

  // ── build rows ────────────────────────────────────────────────────────────
  const rows = enrollments.map((enr: any) => {
    const course    = courses.find((c: any) => c.id === enr.courseId) as any;
    const enrPays   = payments.filter((p: any) => p.userId === enr.userId && p.courseId === enr.courseId);
    const firstPay  = [...enrPays].sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];

    const courseFee      = course?.fee      ?? firstPay?.totalFee ?? 0;
    const courseDuration = course?.duration ?? "";
    const durationMonths = parseDurationMonths(courseDuration) || 1;
    const installmentAmt = courseFee > 0 ? Math.ceil(courseFee / durationMonths) : 0;

    const verifiedPays = enrPays.filter((p: any) => p.status === "verified");
    const pendingPays  = enrPays.filter((p: any) => p.status === "pending");
    const totalPaid    = verifiedPays.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const remaining    = Math.max(0, courseFee - totalPaid);
    const isMonthly    = firstPay?.paymentPlan === "monthly";

    // next overdue installment
    let nextDueMonth = -1;
    if (isMonthly) {
      for (let m = 1; m <= durationMonths; m++) {
        const verified = enrPays.some((p: any) => p.installmentNumber === m && p.status === "verified");
        if (!verified) { nextDueMonth = m; break; }
      }
    }

    return {
      userId: enr.userId,
      userName: enr.userName || `User #${enr.userId}`,
      enrollmentId: enr.id,
      enrollmentStatus: enr.status as string,
      courseId: enr.courseId,
      courseName: enr.courseName || course?.title || `Course #${enr.courseId}`,
      courseFee,
      courseDuration,
      durationMonths,
      installmentAmt,
      isMonthly,
      totalPaid,
      remaining,
      nextDueMonth,
      payments: enrPays,
      pendingPays,
    };
  });

  const filtered = rows.filter(r =>
    r.userName.toLowerCase().includes(search.toLowerCase()) ||
    r.courseName.toLowerCase().includes(search.toLowerCase())
  );

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalEnrollments = rows.length;
  const blockedCount = rows.filter(r => r.enrollmentStatus === "blocked").length;
  const pendingCount = rows.filter(r => r.enrollmentStatus === "pending").length;
  const totalRevenue = payments
    .filter((p: any) => p.status === "verified")
    .reduce((s: number, p: any) => s + (p.amount || 0), 0);

  // ── helpers ───────────────────────────────────────────────────────────────
  const setBusy = (k: string, v: boolean) => setBusyKeys(prev => ({ ...prev, [k]: v }));
  const toggleExpand = (key: string) =>
    setExpandedRows(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  // Block / restore login (isActive)
  const toggleLogin = async (userId: number) => {
    const currentlyBlocked = loginOverride[userId] === false;
    const k = `login-${userId}`;
    setBusy(k, true);
    try {
      const res = await fetch(`${BASE}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: currentlyBlocked }),   // toggle
      });
      if (!res.ok) throw new Error(await res.text());
      setLoginOverride(prev => ({ ...prev, [userId]: currentlyBlocked ? undefined as any : false }));
      toast({
        title: currentlyBlocked ? "✅ Login Restored" : "🔒 Login Blocked",
        description: currentlyBlocked ? "Student can now log in." : "Student is blocked from logging in.",
      });
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    } finally {
      setBusy(k, false);
    }
  };

  // Block / restore course enrollment
  const toggleEnrollment = async (enrollmentId: number, currentStatus: string) => {
    const newStatus = currentStatus === "blocked" ? "active" : "blocked";
    const k = `enr-${enrollmentId}`;
    setBusy(k, true);
    try {
      const res = await fetch(`${BASE}/api/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(await res.text());
      qc.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) });
      await refetchEnr();
      toast({
        title: newStatus === "blocked" ? "🚫 Course Blocked" : "✅ Course Restored",
        description: newStatus === "blocked"
          ? "Student cannot access this course until fees are cleared."
          : "Student can now access the course again.",
      });
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    } finally {
      setBusy(k, false);
    }
  };

  // ── status badge ──────────────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    const base = "text-[10px] font-bold flex items-center gap-1 rounded-full px-2.5 py-0.5";
    switch (status) {
      case "active":    return <Badge className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-200`}><CheckCircle2 className="h-3 w-3" />Active</Badge>;
      case "blocked":   return <Badge className={`${base} bg-rose-50 text-rose-700 border border-rose-200`}><XCircle className="h-3 w-3" />Blocked</Badge>;
      case "pending":   return <Badge className={`${base} bg-amber-50 text-amber-700 border border-amber-200 animate-pulse`}><Clock className="h-3 w-3" />Pending</Badge>;
      case "completed": return <Badge className={`${base} bg-blue-50 text-blue-700 border border-blue-200`}><CheckCircle2 className="h-3 w-3" />Completed</Badge>;
      default:          return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  // ── loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-40" />
          <p className="text-slate-400 text-sm font-medium">Loading fee records…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Fee Tracker</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Monitor each student's monthly fee status. Block access when dues are unpaid.
          </p>
        </div>
        {blockedCount > 0 && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold px-4 py-2 rounded-2xl">
            <AlertTriangle className="h-4 w-4" />
            {blockedCount} enrollment{blockedCount > 1 ? "s" : ""} currently blocked
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Enrollments", value: totalEnrollments, Icon: BookOpen,   bg: "bg-blue-50",    ic: "text-blue-500",    vc: "text-blue-700" },
          { label: "Pending Approval",  value: pendingCount,     Icon: Clock,      bg: "bg-amber-50",   ic: "text-amber-500",   vc: "text-amber-700" },
          { label: "Blocked Access",    value: blockedCount,     Icon: Shield,     bg: "bg-rose-50",    ic: "text-rose-500",    vc: "text-rose-700" },
          { label: "Total Collected",   value: `Rs. ${totalRevenue.toLocaleString()}`, Icon: TrendingUp, bg: "bg-emerald-50", ic: "text-emerald-500", vc: "text-emerald-700" },
        ].map(({ label, value, Icon, bg, ic, vc }) => (
          <Card key={label} className="border-none shadow-sm ring-1 ring-gray-100">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${ic}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className={`text-xl font-extrabold ${vc}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by student name or course…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl border-slate-200 bg-white"
        />
      </div>

      {/* ── Rows ── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">No fee records found.</p>
            <p className="text-slate-400 text-sm mt-1">Students will appear here once they enroll and submit a payment.</p>
          </div>
        ) : (
          filtered.map(row => {
            const key = `${row.userId}-${row.courseId}`;
            const isExpanded = expandedRows.has(key);
            const isLoginBlocked = loginOverride[row.userId] === false;
            const isCourseBlocked = row.enrollmentStatus === "blocked";

            return (
              <Card
                key={key}
                className={`border shadow-sm rounded-2xl overflow-hidden transition-all ${
                  isCourseBlocked ? "border-rose-200 bg-rose-50/20" :
                  row.enrollmentStatus === "pending" ? "border-amber-200 bg-amber-50/10" :
                  "border-slate-200 bg-white"
                }`}
              >
                {/* ── Row Summary ── */}
                <CardHeader className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: student + course info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{row.userName}</span>
                        {isLoginBlocked && (
                          <Badge className="bg-red-100 text-red-700 border border-red-200 text-[9px] font-black flex items-center gap-0.5 rounded-full px-2 py-0.5">
                            <Lock className="h-2.5 w-2.5" /> Login Blocked
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-medium truncate">
                        <BookOpen className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{row.courseName}</span>
                        {row.courseDuration && (
                          <span className="text-slate-400 shrink-0">· {row.courseDuration}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: fee info + status + expand */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {statusBadge(row.enrollmentStatus)}

                    <div className="text-xs font-semibold bg-slate-100 rounded-lg px-2.5 py-1 text-slate-600">
                      Paid:{" "}
                      <span className="text-emerald-700 font-black">Rs.{row.totalPaid.toLocaleString()}</span>
                      {" / "}
                      <span className="text-slate-800 font-black">Rs.{row.courseFee.toLocaleString()}</span>
                    </div>

                    {row.remaining > 0 && (
                      <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1">
                        Due: Rs.{row.remaining.toLocaleString()}
                      </div>
                    )}

                    {row.remaining === 0 && row.courseFee > 0 && (
                      <div className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
                        ✓ Cleared
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(key)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>

                {/* ── Action Bar ── */}
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    {/* Login block toggle */}
                    <Button
                      size="sm"
                      disabled={busyKeys[`login-${row.userId}`]}
                      onClick={() => toggleLogin(row.userId)}
                      className={`h-8 text-xs font-bold rounded-xl border flex items-center gap-1.5 ${
                        isLoginBlocked
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                          : "bg-red-600 border-transparent text-white hover:bg-red-700"
                      }`}
                    >
                      {busyKeys[`login-${row.userId}`] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isLoginBlocked ? (
                        <><Unlock className="h-3 w-3" /> Restore Login</>
                      ) : (
                        <><Lock className="h-3 w-3" /> Block Login</>
                      )}
                    </Button>

                    {/* Course access toggle */}
                    <Button
                      size="sm"
                      disabled={busyKeys[`enr-${row.enrollmentId}`]}
                      onClick={() => toggleEnrollment(row.enrollmentId, row.enrollmentStatus)}
                      className={`h-8 text-xs font-bold rounded-xl border flex items-center gap-1.5 ${
                        isCourseBlocked
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                          : "bg-orange-500 border-transparent text-white hover:bg-orange-600"
                      }`}
                    >
                      {busyKeys[`enr-${row.enrollmentId}`] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isCourseBlocked ? (
                        <><ShieldOff className="h-3 w-3" /> Restore Course Access</>
                      ) : (
                        <><Shield className="h-3 w-3" /> Block Course Access</>
                      )}
                    </Button>

                    {row.pendingPays.length > 0 && (
                      <Badge className="h-8 px-3 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] flex items-center gap-1 rounded-xl animate-pulse">
                        <Clock className="h-3 w-3" />
                        {row.pendingPays.length} payment{row.pendingPays.length > 1 ? "s" : ""} pending verification
                      </Badge>
                    )}

                    {row.nextDueMonth > 0 && row.remaining > 0 && (
                      <Badge className="h-8 px-3 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] flex items-center gap-1 rounded-xl">
                        <AlertCircle className="h-3 w-3" />
                        Month {row.nextDueMonth} unpaid
                      </Badge>
                    )}
                  </div>

                  {/* ── Expanded detail ── */}
                  {isExpanded && (
                    <div className="mt-4 space-y-5 border-t border-slate-100 pt-4">

                      {/* Plan type */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                          row.isMonthly
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}>
                          {row.isMonthly
                            ? `📅 Monthly Plan · ${row.durationMonths} instalments`
                            : "💳 Full One-Time Payment"}
                        </Badge>
                        {row.remaining === 0 && row.courseFee > 0 && (
                          <Badge className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> All dues cleared
                          </Badge>
                        )}
                      </div>

                      {/* Monthly breakdown grid */}
                      {row.isMonthly && row.durationMonths > 1 && (
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Monthly Instalment Breakdown
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {Array.from({ length: row.durationMonths }).map((_, i) => {
                              const mNum = i + 1;
                              const pay = row.payments.find((p: any) => p.installmentNumber === mNum);
                              const isV = pay?.status === "verified";
                              const isP = pay?.status === "pending";
                              const isR = pay?.status === "rejected";
                              const isDue = !pay && mNum === row.nextDueMonth;
                              const amt = mNum === row.durationMonths
                                ? row.courseFee - (row.installmentAmt * (row.durationMonths - 1))
                                : row.installmentAmt;

                              return (
                                <div
                                  key={i}
                                  className={`rounded-xl border p-2.5 text-center text-[10px] font-bold ${
                                    isV  ? "border-emerald-200 bg-emerald-50 text-emerald-800" :
                                    isP  ? "border-amber-200 bg-amber-50 text-amber-800" :
                                    isDue ? "border-rose-200 bg-rose-50 text-rose-800 animate-pulse" :
                                    isR  ? "border-red-200 bg-red-50 text-red-700" :
                                    "border-slate-100 bg-slate-50 text-slate-400 opacity-60"
                                  }`}
                                >
                                  <div className="text-[9px] text-slate-400 font-black uppercase mb-1">M{mNum}</div>
                                  <div className="font-black text-xs">Rs.{amt.toLocaleString()}</div>
                                  <div className="mt-0.5">
                                    {isV ? "✓ Paid" : isP ? "⏳" : isDue ? "❗" : isR ? "✗" : "—"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Payment history */}
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                          Payment History
                        </p>
                        {row.payments.length === 0 ? (
                          <p className="text-xs text-slate-400 font-medium py-2">No payments submitted yet.</p>
                        ) : (
                          <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                            {row.payments.map((p: any) => (
                              <div key={p.id} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50 transition-colors">
                                <div>
                                  <div className="font-bold text-slate-800">
                                    {p.paymentPlan === "monthly"
                                      ? `Instalment #${p.installmentNumber}`
                                      : "Full Course Fee"}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {new Date(p.createdAt).toLocaleDateString()} · {(p.method || "").toUpperCase()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-black text-slate-900">Rs. {(p.amount || 0).toLocaleString()}</div>
                                  <Badge className={`mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                    p.status === "verified"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : p.status === "pending"
                                      ? "bg-amber-50 text-amber-700 border border-amber-100"
                                      : "bg-rose-50 text-rose-700 border border-rose-100"
                                  }`}>
                                    {p.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
