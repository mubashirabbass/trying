import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  useListEnrollments, getListEnrollmentsQueryKey,
  useListPayments,   getListPaymentsQueryKey,
  useListCourses,    getListCoursesQueryKey,
} from "@workspace/api-client-react";
import {
  Loader2, CheckCircle2, XCircle, Clock, CreditCard,
  Search, AlertTriangle, Shield, ShieldOff,
  User, BookOpen, AlertCircle, Plus, DollarSign,
  ChevronDown, ChevronUp, Check, RefreshCw, Printer, FileText, Sparkles
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

// ─── parse duration months from course duration string ────────────────────────
function parseDurationMonths(duration?: string | null): number {
  if (!duration) return 1;
  const m = duration.match(/(\d+)\s*month/i);
  if (m) return parseInt(m[1], 10);
  const y = duration.match(/(\d+)\s*year/i);
  if (y) return parseInt(y[1], 10) * 12;
  return 1;
}

interface LedgerHistoryItem {
  paymentId: number;
  amount: number;
  paidAt: string;
  method: string;
  notes?: string;
}

interface InstallmentLedger {
  id: number;
  userId: number;
  courseId: number;
  monthNumber: number;
  installmentAmount: number;
  totalFee: number;
  totalPaid: number;
  remainingBalance: number;
  status: string; // unpaid, partial, paid
  paymentHistory: LedgerHistoryItem[];
  receiptNumber: string;
  updatedAt: string;
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

  // ─── ledger data state ──────────────────────────────────────────────────────
  const [ledgerEntries, setLedgerEntries] = useState<InstallmentLedger[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // ─── collect dialog states ──────────────────────────────────────────────────
  const [collectingLedger, setCollectingLedger] = useState<InstallmentLedger | null>(null);
  const [collectAmount, setCollectAmount] = useState<string>("");
  const [collectMethod, setCollectMethod] = useState<string>("cash");
  const [collectNotes, setCollectNotes] = useState<string>("");
  const [isSubmittingCollection, setIsSubmittingCollection] = useState(false);

  // ─── receipt modal state ────────────────────────────────────────────────────
  const [viewingReceiptLedger, setViewingReceiptLedger] = useState<InstallmentLedger | null>(null);

  // ─── manual fee collection state (sidebar) ──────────────────────────────────
  const [sidebarStudentEnrollmentId, setSidebarStudentEnrollmentId] = useState<string>("");
  const [sidebarMonthNumber, setSidebarMonthNumber] = useState<string>("1");
  const [sidebarAmount, setSidebarAmount] = useState<string>("");
  const [sidebarMethod, setSidebarMethod] = useState<string>("cash");
  const [sidebarNotes, setSidebarNotes] = useState<string>("");
  const [isSubmittingSidebar, setIsSubmittingSidebar] = useState(false);

  // ─── data fetching ──────────────────────────────────────────────────────────
  const { data: enrollmentsRaw = [], isLoading: enrLoading, refetch: refetchEnr } =
    useListEnrollments({}, { query: { queryKey: getListEnrollmentsQueryKey({}) } });

  const { data: paymentsRaw = [], isLoading: payLoading, refetch: refetchPay } =
    useListPayments({}, { query: { queryKey: getListPaymentsQueryKey({}) } });

  const { data: coursesRaw = [], isLoading: coursesLoading } =
    useListCourses({} as any, { query: { queryKey: getListCoursesQueryKey({} as any) } } as any);

  const isLoading = enrLoading || payLoading || coursesLoading || loadingLedger;

  const enrollments = Array.isArray(enrollmentsRaw) ? enrollmentsRaw : [];
  const payments    = Array.isArray(paymentsRaw)    ? paymentsRaw    : [];
  const courses     = Array.isArray(coursesRaw)     ? coursesRaw     : [];

  // Fetch ledger rows (filtered by courseId to optimize speed)
  const fetchLedgers = async () => {
    setLoadingLedger(true);
    try {
      const courseFilter = selectedCourseId !== "all" ? `?courseId=${selectedCourseId}` : "";
      const res = await fetch(`${BASE}/api/installment-ledger${courseFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLedgerEntries(data);
      }
    } catch (err) {
      console.error("Failed to load installment ledger:", err);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, [token, selectedCourseId]);

  // ─── build rows ────────────────────────────────────────────────────────────
  const rows = enrollments.map((enr: any) => {
    const course    = courses.find((c: any) => c.id === enr.courseId) as any;
    const enrPays   = payments.filter((p: any) => p.userId === enr.userId && p.courseId === enr.courseId);
    const firstPay  = [...enrPays].sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];

    const courseFee      = course?.fee      ?? (firstPay as any)?.totalFee ?? 0;
    const courseDuration = course?.duration ?? "";
    const durationMonths = parseDurationMonths(courseDuration) || 1;
    const installmentAmt = courseFee > 0 ? Math.ceil(courseFee / durationMonths) : 0;

    const verifiedPays = enrPays.filter((p: any) => p.status === "verified");
    const totalPaid    = verifiedPays.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const remaining    = Math.max(0, courseFee - totalPaid);
    const isMonthly    = (firstPay as any)?.paymentPlan === "monthly";

    // next due month index
    let nextDueMonth = -1;
    if (isMonthly) {
      const studentLedgers = ledgerEntries.filter(l => l.userId === enr.userId && l.courseId === enr.courseId);
      const nextDue = studentLedgers.find(l => l.status !== "paid");
      if (nextDue) nextDueMonth = nextDue.monthNumber;
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
      if (!r.isMonthly) {
        return selectedMonthNum === 1;
      }
      // monthly: check if student has a ledger row for that month
      const hasLedgerForMonth = ledgerEntries.some(
        l => l.userId === r.userId && l.courseId === r.courseId && l.monthNumber === selectedMonthNum
      );
      if (!hasLedgerForMonth) return false;
    }
    return true;
  });

  // ─── stats calculation for selected view ──────────────────────────────────
  const totalEnrollments = courseFilteredRows.length;
  const blockedCount = courseFilteredRows.filter(r => r.enrollmentStatus === "blocked").length;
  const pendingCount = courseFilteredRows.filter(r => r.enrollmentStatus === "pending").length;
  
  const totalExpectedRevenue = courseFilteredRows.reduce((sum, r) => sum + r.courseFee, 0);
  const totalCollectedRevenue = courseFilteredRows.reduce((sum, r) => sum + r.totalPaid, 0);
  const totalRemainingDues = Math.max(0, totalExpectedRevenue - totalCollectedRevenue);

  const setBusy = (k: string, v: boolean) => setBusyKeys(prev => ({ ...prev, [k]: v }));
  
  const toggleExpand = (key: string) =>
    setExpandedRows(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  // ─── API actions ────────────────────────────────────────────────────────────

  // Inline collection handler for partial / unpaid months
  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingLedger || !collectAmount) return;

    const amountNum = parseFloat(collectAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: "Please enter a valid positive amount", variant: "destructive" });
      return;
    }
    if (amountNum > collectingLedger.remainingBalance + 0.01) {
      toast({
        title: "Validation Error",
        description: `Cannot collect more than the remaining balance of Rs. ${collectingLedger.remainingBalance.toLocaleString()}`,
        variant: "destructive"
      });
      return;
    }

    // ── OPTIMISTIC UPDATE: immediately patch local state ──────────────────────
    const optimisticNewPaid   = collectingLedger.totalPaid + amountNum;
    const optimisticRemaining = Math.max(0, collectingLedger.installmentAmount - optimisticNewPaid);
    const optimisticStatus    = optimisticRemaining <= 0 ? "paid" : "partial";
    setLedgerEntries(prev => prev.map(l =>
      l.id === collectingLedger.id
        ? { ...l, totalPaid: optimisticNewPaid, remainingBalance: optimisticRemaining, status: optimisticStatus }
        : l
    ));

    // Close dialog immediately (feels instant)
    const capturedLedger = collectingLedger;
    setCollectingLedger(null);
    setCollectAmount("");
    setCollectNotes("");

    setIsSubmittingCollection(true);
    try {
      const res = await fetch(`${BASE}/api/installment-ledger/${capturedLedger.id}/collect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amountNum,
          method: collectMethod,
          notes: collectNotes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        // Revert optimistic update on failure
        setLedgerEntries(prev => prev.map(l => l.id === capturedLedger.id ? capturedLedger : l));
        throw new Error(err.error || "Collection failed");
      }

      // Patch state with authoritative server response (no full refetch needed)
      const data = await res.json();
      if (data.ledger) {
        setLedgerEntries(prev => prev.map(l => l.id === capturedLedger.id ? { ...l, ...data.ledger } : l));
      }

      toast({ title: "✅ Payment Recorded", description: `Collected Rs. ${amountNum.toLocaleString()} successfully.` });

      // Light background sync for payment list (non-blocking)
      qc.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
    } catch (err: any) {
      toast({ title: "Error collecting fee", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmittingCollection(false);
    }
  };

  const handleExpressCashPay = async (ledger: InstallmentLedger, amount: number) => {
    const key = `express-${ledger.id}`;

    // ── OPTIMISTIC UPDATE: immediately show new state ─────────────────────────
    const optimisticNewPaid   = ledger.totalPaid + amount;
    const optimisticRemaining = Math.max(0, ledger.installmentAmount - optimisticNewPaid);
    const optimisticStatus    = optimisticRemaining <= 0 ? "paid" : "partial";
    setLedgerEntries(prev => prev.map(l =>
      l.id === ledger.id
        ? { ...l, totalPaid: optimisticNewPaid, remainingBalance: optimisticRemaining, status: optimisticStatus }
        : l
    ));

    setBusy(key, true);
    try {
      const res = await fetch(`${BASE}/api/installment-ledger/${ledger.id}/collect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          method: "cash",
          notes: "Collected in-person by admin (Express Cash)"
        })
      });

      if (!res.ok) {
        const err = await res.json();
        // Revert optimistic update on failure
        setLedgerEntries(prev => prev.map(l => l.id === ledger.id ? ledger : l));
        throw new Error(err.error || "Express collection failed");
      }

      // Patch state with authoritative server response (no full refetch needed)
      const data = await res.json();
      if (data.ledger) {
        setLedgerEntries(prev => prev.map(l => l.id === ledger.id ? { ...l, ...data.ledger } : l));
      }

      toast({
        title: "✅ Cash Payment Success",
        description: `Rs. ${amount.toLocaleString()} marked as paid instantly!`
      });

      // Light background sync for payment list only (non-blocking)
      qc.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
    } catch (err: any) {
      toast({ title: "Failed to record payment", description: err.message, variant: "destructive" });
    } finally {
      setBusy(key, false);
    }
  };

  // Sidebar manual form submission
  const handleSidebarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidebarStudentEnrollmentId || !sidebarAmount) {
      toast({ title: "Please fill out all fields", variant: "destructive" });
      return;
    }

    const studentRow = rows.find(r => r.enrollmentId === parseInt(sidebarStudentEnrollmentId, 10));
    if (!studentRow) return;

    const amountNum = parseFloat(sidebarAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    setIsSubmittingSidebar(true);
    try {
      const mNum = parseInt(sidebarMonthNumber, 10);
      // Try to find if a ledger entry already exists for this student+course+month
      let targetLedger = ledgerEntries.find(
        l => l.userId === studentRow.userId && l.courseId === studentRow.courseId && l.monthNumber === mNum
      );

      // If it doesn't exist, we generate the ledger first (which automatically happens when payment plan is monthly)
      if (!targetLedger) {
        // If not found, let's trigger a generation request to the server
        const genRes = await fetch(`${BASE}/api/installment-ledger/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: studentRow.userId,
            courseId: studentRow.courseId,
            totalFee: studentRow.courseFee,
            durationMonths: studentRow.durationMonths
          })
        });
        if (genRes.ok) {
          const freshRes = await fetch(`${BASE}/api/installment-ledger?userId=${studentRow.userId}&courseId=${studentRow.courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const freshData = await freshRes.json();
          targetLedger = freshData.find((l: any) => l.monthNumber === mNum);
        }
      }

      if (!targetLedger) {
        throw new Error("Could not initialize installment ledger for selected month.");
      }

      if (amountNum > targetLedger.remainingBalance + 0.01) {
        throw new Error(`Amount exceeds the remaining balance of Rs. ${targetLedger.remainingBalance.toLocaleString()} for Month ${mNum}`);
      }

      // Collect via the ledger collection API
      const res = await fetch(`${BASE}/api/installment-ledger/${targetLedger.id}/collect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amountNum,
          method: sidebarMethod,
          notes: sidebarNotes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Collection failed");
      }

      toast({ title: "✅ Payment Recorded & Verified", description: `Collected Rs. ${amountNum.toLocaleString()} for Month ${mNum}` });
      
      // Reset sidebar form
      setSidebarAmount("");
      setSidebarNotes("");

      // Refresh queries in the background (non-blocking)
      qc.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
      qc.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) });
      fetchLedgers();
    } catch (err: any) {
      toast({ title: "Failed to record payment", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmittingSidebar(false);
    }
  };

  // Block/Restore user login
  const toggleLogin = async (userId: number) => {
    const currentlyBlocked = loginOverride[userId] === false;
    const k = `login-${userId}`;
    setBusy(k, true);
    try {
      const res = await fetch(`${BASE}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: currentlyBlocked }),
      });
      if (!res.ok) throw new Error(await res.text());
      setLoginOverride(prev => ({ ...prev, [userId]: currentlyBlocked ? (true as boolean) : false }));
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

  // Block/Restore course enrollment access
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

  // Verify pending online uploads
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
      // Refresh queries in the background (non-blocking)
      qc.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
      qc.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) });
      fetchLedgers();
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(k, false);
    }
  };

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

  const pendingPayments = payments.filter((p: any) => {
    if (p.status !== "pending") return false;
    if (selectedCourseNum !== null && p.courseId !== selectedCourseNum) return false;
    return true;
  });

  return (
    <DashboardLayout>
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Tuition Fee Roster
            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-50 font-bold px-2 py-0.5 rounded-lg text-xs flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-650" /> Installments v2
            </Badge>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Select course and month to view dedicated metrics, student roster, and collect monthly installments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { refetchEnr(); refetchPay(); fetchLedgers(); }} className="rounded-xl flex items-center gap-1.5 font-bold border-slate-200 text-slate-700">
            <RefreshCw className="h-3.5 w-3.5" /> Sync Roster
          </Button>
        </div>
      </div>

      {/* ─── Selectors Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
        <div>
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Select Course</Label>
          <Select value={selectedCourseId} onValueChange={(val) => { setSelectedCourseId(val); setSidebarStudentEnrollmentId(""); setSidebarAmount(""); }}>
            <SelectTrigger className="rounded-xl bg-white border-slate-200 font-bold text-slate-800">
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
            <SelectTrigger className="rounded-xl bg-white border-slate-200 font-bold text-slate-800">
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
          <Card className="border-none shadow-md ring-1 ring-gray-150 overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl">
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
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Enrollments</p>
              <p className="text-2xl font-black text-blue-900 mt-1">{totalEnrollments}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Appr.</p>
              <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Blocked Access</p>
              <p className="text-2xl font-black text-rose-900 mt-1">{blockedCount}</p>
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">
              Student Tuition Roster ({finalFilteredRows.length})
            </h4>

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

                const isMSelected = selectedMonthNum !== null;
                const studentLedger = ledgerEntries.filter(l => l.userId === row.userId && l.courseId === row.courseId);

                // Find ledger entry for selected month
                const selectedMonthLedger = isMSelected
                  ? studentLedger.find(l => l.monthNumber === selectedMonthNum)
                  : null;

                return (
                  <Card
                    key={key}
                    className={`border shadow-sm rounded-2xl overflow-hidden transition-all duration-200 ${
                      isCourseBlocked ? "border-rose-200 bg-rose-50/20" :
                      row.enrollmentStatus === "pending" ? "border-amber-200 bg-amber-50/10" :
                      "border-slate-200 bg-white hover:border-slate-350"
                    }`}
                  >
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
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
                            {row.isMonthly && (
                              <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-150 text-[9px] font-black rounded-full px-2">
                                Monthly
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{row.courseName}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isMSelected && selectedMonthLedger && (
                          <Badge className={`text-[10px] font-bold ${
                            selectedMonthLedger.status === "paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            selectedMonthLedger.status === "partial" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            Month {selectedMonthNum}: {selectedMonthLedger.status.toUpperCase()} (Rs. {selectedMonthLedger.remainingBalance.toLocaleString()} Left)
                          </Badge>
                        )}

                        <div className="text-xs font-semibold bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-slate-600">
                          Paid: Rs. {row.totalPaid.toLocaleString()} / {row.courseFee.toLocaleString()}
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => toggleExpand(key)} className="h-8 w-8 p-0 rounded-lg text-slate-400">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-4 border-t border-slate-50 bg-slate-50/30 space-y-4">
                        {/* Account Locks Section */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={isLoginBlocked ? "outline" : "destructive"}
                            onClick={() => toggleLogin(row.userId)}
                            className="h-8 text-xs font-bold rounded-xl"
                          >
                            {isLoginBlocked ? "Restore Login" : "Block Login"}
                          </Button>
                          <Button
                            size="sm"
                            variant={isCourseBlocked ? "outline" : "destructive"}
                            onClick={() => toggleEnrollment(row.enrollmentId, row.enrollmentStatus)}
                            className="h-8 text-xs font-bold rounded-xl"
                          >
                            {isCourseBlocked ? "Restore Course Access" : "Block Course Access"}
                          </Button>
                        </div>

                        {/* Per-Month Installment Ledger Cards */}
                        {row.isMonthly && (
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Installment Ledger Status</Label>
                            
                            {studentLedger.length === 0 ? (
                              <div className="text-xs text-slate-400 p-2 border border-dashed rounded-xl text-center bg-white">
                                Ledger not generated yet. Generating happens on first verified payment.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[...studentLedger].sort((a,b)=>a.monthNumber-b.monthNumber).map((ledger) => {
                                  return (
                                    <div
                                      key={ledger.id}
                                      className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-3 transition-colors hover:border-slate-300"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <span className="font-extrabold text-slate-900 text-sm block">Month {ledger.monthNumber}</span>
                                          <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                                            Installment: Rs. {ledger.installmentAmount.toLocaleString()}
                                          </span>
                                        </div>
                                        <Badge className={`text-[9px] font-black rounded-lg ${
                                          ledger.status === "paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                          ledger.status === "partial" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                          "bg-slate-100 text-slate-500 border border-slate-200"
                                        }`}>
                                          {ledger.status.toUpperCase()}
                                        </Badge>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-100 py-2">
                                        <div>
                                          <span className="text-slate-400 font-medium block">Paid</span>
                                          <span className="font-extrabold text-emerald-600">Rs. {ledger.totalPaid.toLocaleString()}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 font-medium block">Remaining</span>
                                          <span className="font-extrabold text-slate-700">Rs. {ledger.remainingBalance.toLocaleString()}</span>
                                        </div>
                                      </div>

                                      {/* Smart Buttons */}
                                      <div className="flex flex-col gap-1.5 pt-1 w-full">
                                        {ledger.status === "unpaid" && (
                                          <div className="flex gap-1.5 w-full">
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                setCollectingLedger(ledger);
                                                setCollectAmount(ledger.installmentAmount.toString());
                                                setCollectMethod("cash");
                                              }}
                                              className="h-8 text-[11px] font-bold rounded-lg bg-indigo-650 hover:bg-indigo-750 text-white flex-1"
                                            >
                                              Record Fee
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              disabled={busyKeys[`express-${ledger.id}`]}
                                              onClick={() => handleExpressCashPay(ledger, ledger.installmentAmount)}
                                              className="h-8 text-[11px] font-bold rounded-lg border-slate-200 text-emerald-650 hover:bg-emerald-50/50"
                                            >
                                              {busyKeys[`express-${ledger.id}`] ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                                              ) : (
                                                "Express Cash"
                                              )}
                                            </Button>
                                          </div>
                                        )}

                                        {ledger.status === "partial" && (
                                          <div className="flex flex-col gap-1.5 w-full">
                                            <div className="flex gap-1.5 w-full">
                                              <Button
                                                size="sm"
                                                disabled={busyKeys[`express-${ledger.id}`]}
                                                onClick={() => handleExpressCashPay(ledger, ledger.remainingBalance)}
                                                className="h-8 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                                              >
                                                {busyKeys[`express-${ledger.id}`] ? (
                                                  <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                                                ) : (
                                                  "Collect Remaining Fee"
                                                )}
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  setCollectingLedger(ledger);
                                                  setCollectAmount(ledger.remainingBalance.toString());
                                                  setCollectMethod("cash");
                                                }}
                                                className="h-8 text-[11px] font-bold rounded-lg border-slate-200 text-slate-700"
                                              >
                                                Record Fee
                                              </Button>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => setViewingReceiptLedger(ledger)}
                                              className="h-8 text-[11px] font-bold rounded-lg border-slate-200 text-slate-650 flex items-center justify-center gap-1 w-full"
                                            >
                                              <FileText className="h-3.5 w-3.5" /> View Receipt
                                            </Button>
                                          </div>
                                        )}

                                        {ledger.status === "paid" && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setViewingReceiptLedger(ledger)}
                                            className="h-8 text-[11px] font-bold rounded-lg border-slate-200 text-indigo-650 hover:text-indigo-750 bg-white w-full flex items-center justify-center gap-1.5"
                                          >
                                            <FileText className="h-3.5 w-3.5" /> View Receipt
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
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
                  <form onSubmit={handleSidebarSubmit} className="space-y-4">
                    
                    {/* Student Select */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Student Enrollment</Label>
                      <Select
                        value={sidebarStudentEnrollmentId}
                        onValueChange={(val) => {
                          setSidebarStudentEnrollmentId(val);
                          const row = rows.find(r => r.enrollmentId === parseInt(val, 10));
                          if (row && row.installmentAmt > 0) {
                            setSidebarAmount(row.installmentAmt.toString());
                          }
                        }}
                      >
                        <SelectTrigger className="rounded-xl border-slate-200 font-semibold text-xs text-slate-800">
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
                      <Select value={sidebarMonthNumber} onValueChange={setSidebarMonthNumber}>
                        <SelectTrigger className="rounded-xl border-slate-200 font-semibold text-xs text-slate-800">
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
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs</span>
                        <Input
                          type="number"
                          placeholder="e.g. 10000"
                          value={sidebarAmount}
                          onChange={e => setSidebarAmount(e.target.value)}
                          className="pl-8 rounded-xl border-slate-200"
                        />
                      </div>
                    </div>

                    {/* Method Select */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Payment Method</Label>
                      <Select value={sidebarMethod} onValueChange={setSidebarMethod}>
                        <SelectTrigger className="rounded-xl border-slate-200 font-semibold text-xs text-slate-800">
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
                        placeholder="e.g. Received monthly installment"
                        value={sidebarNotes}
                        onChange={e => setSidebarNotes(e.target.value)}
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <Button type="submit" disabled={isSubmittingSidebar} className="w-full rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white mt-2">
                      {isSubmittingSidebar ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : <>Record Payment</>}
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

      {/* ─── MODAL: Collect Remaining / Partial Installment Form ─── */}
      <Dialog open={collectingLedger !== null} onOpenChange={(open) => !open && setCollectingLedger(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-950">Record Installment Payment</DialogTitle>
            <DialogDescription className="text-xs">
              Installment details for Month {collectingLedger?.monthNumber}. Remaining Balance: Rs. {collectingLedger?.remainingBalance.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCollectSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Installment Fee Amount</Label>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-xs font-bold text-slate-700">
                Rs. {collectingLedger?.installmentAmount.toLocaleString()}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-650">Amount Paid in this Transaction (Rs.)</Label>
              <Input
                type="number"
                required
                max={collectingLedger ? collectingLedger.remainingBalance : undefined}
                value={collectAmount}
                onChange={e => setCollectAmount(e.target.value)}
                className="rounded-xl border-slate-200 text-sm font-bold"
              />
              <p className="text-[10px] text-slate-400">Cannot exceed remaining balance of Rs. {collectingLedger?.remainingBalance.toLocaleString()}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-650">Payment Method</Label>
              <Select value={collectMethod} onValueChange={setCollectMethod}>
                <SelectTrigger className="rounded-xl border-slate-200 font-semibold text-xs text-slate-800">
                  <SelectValue placeholder="Cash" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Cash Payment</SelectItem>
                  <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                  <SelectItem value="easy_paisa">📱 EasyPaisa / JazzCash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-650">Notes / Comments</Label>
              <Input
                placeholder="e.g. Paid in-person cash"
                value={collectNotes}
                onChange={e => setCollectNotes(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setCollectingLedger(null)} className="rounded-xl font-bold border-slate-200 text-slate-700">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingCollection} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmittingCollection ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: View Receipt Details (Month Receipt history) ─── */}
      <Dialog open={viewingReceiptLedger !== null} onOpenChange={(open) => !open && setViewingReceiptLedger(null)}>
        <DialogContent className="max-w-xl rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
          {viewingReceiptLedger && (
            <div className="space-y-6">
              {/* Receipt Header Card */}
              <div className="border-b border-dashed border-slate-200 pb-4 text-center space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">GLOBAL COLLEGE</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Tuition Receipt</p>
                <div className="inline-block mt-2 bg-slate-50 border border-slate-150 font-mono text-xs px-3 py-1 rounded-lg text-slate-600">
                  {viewingReceiptLedger.receiptNumber}
                </div>
              </div>

              {/* Admission / Monthly Breakdown details */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-semibold block">Admission Fee</span>
                  <span className="font-extrabold text-slate-800">Rs. {viewingReceiptLedger.totalFee.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Total Fee for This Month</span>
                  <span className="font-extrabold text-slate-850">Rs. {viewingReceiptLedger.installmentAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Paid Fee</span>
                  <span className="font-extrabold text-emerald-600">Rs. {viewingReceiptLedger.totalPaid.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Remaining Fee</span>
                  <span className="font-extrabold text-slate-700">Rs. {viewingReceiptLedger.remainingBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment History Log */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Payment Transaction History</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="min-w-full divide-y divide-slate-150">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-450 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-450 uppercase tracking-wider">Method</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-450 uppercase tracking-wider">Notes</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-black text-slate-450 uppercase tracking-wider">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {viewingReceiptLedger.paymentHistory.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2 text-slate-600 font-medium">
                            {new Date(item.paidAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 font-mono text-slate-500 font-bold text-[10px]">
                            {item.method.toUpperCase()}
                          </td>
                          <td className="px-4 py-2 text-slate-500 font-medium">
                            {item.notes || "—"}
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-slate-900">
                            Rs. {item.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status footer banner */}
              <div className={`p-3 rounded-xl border text-center text-xs font-bold ${
                viewingReceiptLedger.status === "paid"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                {viewingReceiptLedger.status === "paid" ? "✓ Month Fully Cleared" : `⚠ Month Partially Paid - Outstanding: Rs. ${viewingReceiptLedger.remainingBalance.toLocaleString()}`}
              </div>

              {/* Print CTA */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setViewingReceiptLedger(null)} className="rounded-xl font-bold border-slate-200 text-slate-700">
                  Close
                </Button>
                <Button onClick={() => window.print()} className="rounded-xl font-bold bg-slate-900 hover:bg-slate-950 text-white flex items-center gap-1.5">
                  <Printer className="h-4 w-4" /> Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
