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
  Lock, Unlock, User, BookOpen, AlertCircle, Plus, DollarSign,
  ChevronDown, ChevronUp, Eye, Check, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

export default function AdminFees() {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const BASE = (import.meta.env.BASE_URL || "").replace(/\/$/, "");

  // ─── selectors state ────────────────────────────────────────────────────────
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // "all" | "1" | "2" etc.
  
  // ─── ui state ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [busyKeys, setBusyKeys] = useState<Record<string, boolean>>({});
  const [loginOverride, setLoginOverride] = useState<Record<number, boolean>>({});

  // ─── manual fee collection state (keyed by enrollmentId for uniqueness) ────
  const [collectEnrollmentId, setCollectEnrollmentId] = useState<string>("");
  const [collectAmount, setCollectAmount] = useState<string>("");
  const [collectMethod, setCollectMethod] = useState<string>("cash");
  const [collectMonth, setCollectMonth] = useState<string>("1");
  const [collectNotes, setCollectNotes] = useState<string>("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // ─── data fetching ──────────────────────────────────────────────────────────
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

  // ─── build rows ────────────────────────────────────────────────────────────
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

  // ─── filter by selections ──────────────────────────────────────────────────
  const selectedCourseNum = selectedCourseId !== "all" ? parseInt(selectedCourseId, 10) : null;
  const selectedMonthNum  = selectedMonth !== "all" ? parseInt(selectedMonth, 10) : null;

  const courseFilteredRows = rows.filter(r => {
    if (selectedCourseNum !== null && r.courseId !== selectedCourseNum) return false;
    return true;
  });

  const finalFilteredRows = courseFilteredRows.filter(r => {
    // text search
    const matchesSearch = r.userName.toLowerCase().includes(search.toLowerCase()) ||
                          r.courseName.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // month filter
    if (selectedMonthNum !== null) {
      // if looking for a specific month, check if that month is either paid, pending, or due
      // monthly plan only makes sense if it has duration
      if (!r.isMonthly) {
        // for full payment plan, it is considered "paid" in month 1 and N/A in later months
        return selectedMonthNum === 1;
      }
    }
    return true;
  });

  // ─── stats calculation for selected view ──────────────────────────────────
  const totalEnrollments = courseFilteredRows.length;
  const blockedCount = courseFilteredRows.filter(r => r.enrollmentStatus === "blocked").length;
  const pendingCount = courseFilteredRows.filter(r => r.enrollmentStatus === "pending").length;
  
  // calculate total expected/collected for selected course
  const totalExpectedRevenue = courseFilteredRows.reduce((sum, r) => sum + r.courseFee, 0);
  const totalCollectedRevenue = courseFilteredRows.reduce((sum, r) => sum + r.totalPaid, 0);
  const totalRemainingDues = Math.max(0, totalExpectedRevenue - totalCollectedRevenue);

  // ─── helpers ───────────────────────────────────────────────────────────────
  const setBusy = (k: string, v: boolean) => setBusyKeys(prev => ({ ...prev, [k]: v }));
  
  const toggleExpand = (key: string) =>
    setExpandedRows(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  // ─── actions ────────────────────────────────────────────────────────────────

  // Submit manual fee payment
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectEnrollmentId || !collectAmount) {
      toast({ title: "Please select a student and enter an amount", variant: "destructive" });
      return;
    }

    // Find by enrollmentId (unique per student+course combo)
    const studentRow = rows.find(r => r.enrollmentId === parseInt(collectEnrollmentId, 10));
    if (!studentRow) {
      toast({ title: "Student enrollment not found", variant: "destructive" });
      return;
    }

    const amountNum = parseFloat(collectAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    setIsSubmittingManual(true);
    try {
      // STEP 1: Create the payment — include userId so server records it against the STUDENT not the admin
      const createRes = await fetch(`${BASE}/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: studentRow.userId,           // ← critical: record against student, not admin
          courseId: studentRow.courseId,
          amount: amountNum,
          method: collectMethod,
          paymentPlan: studentRow.isMonthly ? "monthly" : "full",
          installmentMonths: studentRow.durationMonths,
          installmentNumber: parseInt(collectMonth, 10),
          totalFee: studentRow.courseFee,
          remainingFee: Math.max(0, studentRow.remaining - amountNum),
          notes: collectNotes || `Manually collected by admin — Month ${collectMonth}`,
        })
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(errText || `HTTP ${createRes.status}`);
      }

      // STEP 2: Auto-verify since admin is recording it directly
      const paymentData = await createRes.json();
      const verifyRes = await fetch(`${BASE}/api/payments/${paymentData.id}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "verified",
          notes: "Auto-verified: collected in-person by admin"
        })
      });

      if (!verifyRes.ok) {
        const errText = await verifyRes.text();
        throw new Error(`Payment created but verification failed: ${errText}`);
      }

      toast({
        title: "✅ Payment Recorded & Verified",
        description: `Rs. ${amountNum.toLocaleString()} collected from ${studentRow.userName} for Month ${collectMonth}`
      });

      // Reset form
      setCollectAmount("");
      setCollectNotes("");

      // Refresh data
      await Promise.all([
        qc.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) }),
        qc.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) }),
      ]);
      refetchPay();
      refetchEnr();
    } catch (err: any) {
      toast({ title: "Failed to record payment", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmittingManual(false);
    }
  };

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

  // Verify pending online payment
  const handleVerifyPayment = async (paymentId: number, approve: boolean) => {
    const k = `verify-${paymentId}`;
    setBusy(k, true);
    try {
      const res = await fetch(`${BASE}/api/payments/${paymentId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: approve ? "verified" : "rejected",
          notes: approve ? "Approved by Admin" : "Rejected by Admin"
        })
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: approve ? "✅ Payment Approved" : "❌ Payment Rejected" });
      qc.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
      qc.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) });
      refetchPay();
      refetchEnr();
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(k, false);
    }
  };

  // ─── status badge ──────────────────────────────────────────────────────────
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

  // Pending payments list filtered by selected course
  const pendingPayments = payments.filter((p: any) => {
    if (p.status !== "pending") return false;
    if (selectedCourseNum !== null && p.courseId !== selectedCourseNum) return false;
    return true;
  });

  // ─── loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-40" />
          <p className="text-slate-400 text-sm font-medium">Loading fee management system…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Fee Record Portal</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Select course and month to view dedicated metrics, student roster, and collect fees.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { refetchEnr(); refetchPay(); }} className="rounded-xl flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ─── Selectors Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Select Course</Label>
          <Select value={selectedCourseId} onValueChange={(val) => { setSelectedCourseId(val); setCollectEnrollmentId(""); setCollectAmount(""); }}>
            <SelectTrigger className="rounded-xl bg-white border-slate-200 font-bold">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📚 All Courses</SelectItem>
              {courses.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Select Month</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="rounded-xl bg-white border-slate-200 font-bold">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📅 All Months</SelectItem>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  Month {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2 md:col-span-1">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Search Student</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-slate-200 bg-white"
            />
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Dedicated Course Dashboard & Student List (70%) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Dedicated Course Dashboard Header / Metrics */}
          <Card className="border-none shadow-sm ring-1 ring-gray-150 overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider mb-1.5 rounded-full px-2 py-0.5">
                    {selectedCourseId === "all" ? "Global Overview" : courses.find(c => c.id.toString() === selectedCourseId)?.title}
                  </Badge>
                  <h3 className="text-xl font-bold tracking-tight">Dedicated Course Dashboard</h3>
                </div>
                <BookOpen className="h-6 w-6 text-indigo-400" />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/10">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Expected</p>
                  <p className="text-lg sm:text-xl font-black text-slate-100 mt-0.5">Rs. {totalExpectedRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Collected</p>
                  <p className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">Rs. {totalCollectedRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outstanding Dues</p>
                  <p className="text-lg sm:text-xl font-black text-rose-400 mt-0.5">Rs. {totalRemainingDues.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Enrollments</p>
              <p className="text-2xl font-black text-blue-900 mt-1">{totalEnrollments}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Appr.</p>
              <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Blocked Access</p>
              <p className="text-2xl font-black text-rose-900 mt-1">{blockedCount}</p>
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Student Tuition Roster ({finalFilteredRows.length})
              </h4>
            </div>

            {finalFilteredRows.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-sm">
                No matching students found for selected filters.
              </div>
            ) : (
              finalFilteredRows.map(row => {
                const key = `${row.userId}-${row.courseId}`;
                const isExpanded = expandedRows.has(key);
                const isLoginBlocked = loginOverride[row.userId] === false;
                const isCourseBlocked = row.enrollmentStatus === "blocked";

                // month selected check
                const isMSelected = selectedMonthNum !== null;
                const paidForSelectedMonth = isMSelected
                  ? row.payments.find(p => p.installmentNumber === selectedMonthNum && p.status === "verified")
                  : null;
                const pendingForSelectedMonth = isMSelected
                  ? row.payments.find(p => p.installmentNumber === selectedMonthNum && p.status === "pending")
                  : null;

                return (
                  <Card
                    key={key}
                    className={`border shadow-sm rounded-2xl overflow-hidden transition-all ${
                      isCourseBlocked ? "border-rose-200 bg-rose-50/20" :
                      row.enrollmentStatus === "pending" ? "border-amber-200 bg-amber-50/10" :
                      "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <User className="h-4.5 w-4.5 text-slate-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{row.userName}</span>
                            {isLoginBlocked && (
                              <Badge className="bg-red-50 text-red-650 border border-red-150 text-[9px] font-black rounded-full px-2">
                                Login Blocked
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{row.courseName}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isMSelected && (
                          <Badge className={`text-[10px] font-bold ${
                            paidForSelectedMonth ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            pendingForSelectedMonth ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse" :
                            "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            Month {selectedMonthNum}: {
                              paidForSelectedMonth ? "Paid" :
                              pendingForSelectedMonth ? "Pending Verification" :
                              "Unpaid/Due"
                            }
                          </Badge>
                        )}

                        <div className="text-xs font-semibold bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5 text-slate-600">
                          Paid: Rs. {row.totalPaid.toLocaleString()} / {row.courseFee.toLocaleString()}
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => toggleExpand(key)} className="h-8 w-8 p-0 rounded-lg text-slate-400">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-50 space-y-4">
                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={isLoginBlocked ? "outline" : "destructive"}
                            onClick={() => toggleLogin(row.userId)}
                            className="h-8 text-xs font-bold rounded-lg"
                          >
                            {isLoginBlocked ? "Restore Login" : "Block Login"}
                          </Button>
                          <Button
                            size="sm"
                            variant={isCourseBlocked ? "outline" : "destructive"}
                            onClick={() => toggleEnrollment(row.enrollmentId, row.enrollmentStatus)}
                            className="h-8 text-xs font-bold rounded-lg"
                          >
                            {isCourseBlocked ? "Restore Course Access" : "Block Course Access"}
                          </Button>
                        </div>

                        {/* Breakdown */}
                        {row.isMonthly && (
                          <div className="grid grid-cols-6 gap-1 bg-slate-50 p-2 rounded-xl">
                            {Array.from({ length: row.durationMonths }).map((_, i) => {
                              const mNum = i + 1;
                              const verified = row.payments.some(p => p.installmentNumber === mNum && p.status === "verified");
                              return (
                                <div key={i} className="text-center text-[10px] p-1.5 font-bold">
                                  <div className="text-slate-400">M{mNum}</div>
                                  <div className={verified ? "text-emerald-600" : "text-slate-400"}>
                                    {verified ? "✓" : "—"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Side Tab for Fee Collection & Verification (30%) */}
        <div className="lg:col-span-4 space-y-6">
          <Tabs defaultValue="collect" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="collect" className="font-bold text-xs rounded-lg py-2">
                Collect Fee
              </TabsTrigger>
              <TabsTrigger value="verify" className="font-bold text-xs rounded-lg py-2 flex items-center justify-center gap-1.5">
                Verifications
                {pendingPayments.length > 0 && (
                  <span className="h-4 w-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-black">
                    {pendingPayments.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* TAB: Collect Fee Form */}
            <TabsContent value="collect">
              <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white mt-3">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-800">Record Fee Collection</CardTitle>
                  <CardDescription className="text-xs">Record manual cash or bank payment received.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    
                    {/* Student Select */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Student Enrollment</Label>
                      <Select
                        value={collectEnrollmentId}
                        onValueChange={(val) => {
                          setCollectEnrollmentId(val);
                          // Auto-fill the installment amount when student is selected
                          const row = rows.find(r => r.enrollmentId === parseInt(val, 10));
                          if (row && row.installmentAmt > 0) {
                            setCollectAmount(row.installmentAmt.toString());
                          }
                        }}
                      >
                        <SelectTrigger className="rounded-xl border-slate-200 font-semibold text-xs">
                          <SelectValue placeholder="Select Student" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {courseFilteredRows.map((r) => (
                            <SelectItem key={r.enrollmentId} value={r.enrollmentId.toString()}>
                              {r.userName} — {r.courseName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Installment Month Select */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Instalment Month</Label>
                      <Select value={collectMonth} onValueChange={collectMonth => setCollectMonth(collectMonth)}>
                        <SelectTrigger className="rounded-xl border-slate-200 font-semibold text-xs">
                          <SelectValue placeholder="Month 1" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }).map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              Month {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Amount Received (Rs.)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          type="number"
                          placeholder="e.g. 1500"
                          value={collectAmount}
                          onChange={e => setCollectAmount(e.target.value)}
                          className="pl-8 rounded-xl border-slate-200"
                        />
                      </div>
                    </div>

                    {/* Method Select */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Payment Method</Label>
                      <Select value={collectMethod} onValueChange={setCollectMethod}>
                        <SelectTrigger className="rounded-xl border-slate-200 font-semibold text-xs">
                          <SelectValue placeholder="Cash" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">💵 Cash Payment</SelectItem>
                          <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                          <SelectItem value="easy_paisa">📱 EasyPaisa / JazzCash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Collection Notes</Label>
                      <Input
                        placeholder="e.g. Received full installment cash"
                        value={collectNotes}
                        onChange={e => setCollectNotes(e.target.value)}
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <Button type="submit" disabled={isSubmittingManual} className="w-full rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white mt-2">
                      {isSubmittingManual ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : <>Record Payment</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Verification Queue */}
            <TabsContent value="verify">
              <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white mt-3">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-800">Verification Queue</CardTitle>
                  <CardDescription className="text-xs">Verify online payment proofs uploaded by students.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3 max-h-[480px] overflow-y-auto">
                  {pendingPayments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                      No pending payment proofs.
                    </div>
                  ) : (
                    pendingPayments.map((p: any) => (
                      <div key={p.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{p.userName}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{p.courseName}</span>
                          </div>
                          <span className="font-black text-slate-900 text-xs shrink-0">
                            Rs. {p.amount.toLocaleString()}
                          </span>
                        </div>

                        {p.paymentPlan === "monthly" && (
                          <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[8px] font-bold">
                            Month {p.installmentNumber} Instalment
                          </Badge>
                        )}

                        {p.receiptUrl && (
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 mt-1"
                          >
                            View Uploaded Receipt ↗
                          </a>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100/60">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyPayment(p.id, false)}
                            disabled={busyKeys[`verify-${p.id}`]}
                            className="h-7 text-[10px] border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg font-bold"
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleVerifyPayment(p.id, true)}
                            disabled={busyKeys[`verify-${p.id}`]}
                            className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </DashboardLayout>
  );
}
