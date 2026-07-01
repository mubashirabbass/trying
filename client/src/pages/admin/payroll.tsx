import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Loader2,
  Search,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RotateCcw,
  FileDown,
  History,
  BarChart3,
  Calendar,
  CreditCard,
  ChevronRight,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Printer,
  Sparkles,
  FileText,
} from "lucide-react";
import {
  exportMonthlyPayrollReport,
  exportPaySlip,
  exportBulkPaySlips,
  type PayrollRecord,
} from "@/lib/exportPayroll";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const YEARS = [2024, 2025, 2026, 2027];

const AVATAR_COLORS = [
  "from-indigo-500 to-violet-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
];

interface SalaryRecord {
  id: string;
  month: string;
  year: number;
  baseSalary: number;
  allowance: number;
  deductions: number;
  netPaid: number;
  payDate: string;
  paymentMethod: string;
  status: string;
  notes: string;
}

type ActiveTab = "current" | "period_history" | "complete_history";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRs(n: number) {
  return `Rs. ${n.toLocaleString()}`;
}

function monthIndex(m: string) {
  return MONTHS.indexOf(m);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPayroll() {
  const { token } = useAuth();
  const { toast } = useToast();

  // Period state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>("current");

  // History filters
  const [historyMonth, setHistoryMonth] = useState(MONTHS[now.getMonth()]);
  const [historyYear, setHistoryYear] = useState(now.getFullYear());

  // Complete history filters
  const [completeYearFilter, setCompleteYearFilter] = useState<string>("all");
  const [completeMonthFilter, setCompleteMonthFilter] = useState<string>("all");
  const [completeSearch, setCompleteSearch] = useState<string>("");
  const [completeTeacherFilter, setCompleteTeacherFilter] = useState<string>("all");

  // Data
  const [staff, setStaff] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [search, setSearch] = useState("");

  // Payout modal
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Payout form
  const [allowance, setAllowance] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [notes, setNotes] = useState("Regular monthly payroll processed.");

  // Refresh & Export state
  const [refreshKey, setRefreshKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // In-memory salary map: teacherId → records[]
  const [salariesMap, setSalariesMap] = useState<Record<number, SalaryRecord[]>>({});

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // ── Fetch staff list ──────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingStaff(true);
    fetch(`${BASE}/api/users?role=teacher`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then(setStaff)
      .catch(() => toast({ title: "Failed to load faculty", variant: "destructive" }))
      .finally(() => setLoadingStaff(false));
  }, [refreshKey]);

  // ── Load salaries from localStorage ──────────────────────────────────────
  // Optimized: Only parsed from disk once on load. Updates are done in-memory.
  useEffect(() => {
    if (staff.length === 0) return;
    const map: Record<number, SalaryRecord[]> = {};
    staff.forEach((t) => {
      const raw = localStorage.getItem(`teacher_${t.id}_salaries`);
      try { map[t.id] = raw ? JSON.parse(raw) : []; } catch { map[t.id] = []; }
    });
    setSalariesMap(map);
  }, [staff]);

  // ── Helper methods ────────────────────────────────────────────────────────
  const getTeacherSalaries = (id: number): SalaryRecord[] => salariesMap[id] || [];

  const saveTeacherSalaries = (id: number, records: SalaryRecord[]) => {
    localStorage.setItem(`teacher_${id}_salaries`, JSON.stringify(records));
    setSalariesMap((prev) => ({ ...prev, [id]: records }));
  };

  const getPayoutForPeriod = (teacherId: number, month: string, year: number) =>
    getTeacherSalaries(teacherId).find((r) => r.month === month && r.year === year);

  const getPayoutStatus = (teacherId: number) =>
    getPayoutForPeriod(teacherId, selectedMonth, selectedYear);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleOpenPayout = (teacher: any) => {
    setSelectedTeacher(teacher);
    setAllowance("0");
    setDeductions("0");
    setPaymentMethod("Bank Transfer");
    setNotes("Regular monthly payroll processed.");
    setIsPayoutModalOpen(true);
  };

  const handleProcessPayout = () => {
    if (!selectedTeacher) return;
    const base = Number(selectedTeacher.salary) || 120000;
    const allowVal = Number(allowance) || 0;
    const deductVal = Number(deductions) || 0;
    const net = base + allowVal - deductVal;

    const existing = getTeacherSalaries(selectedTeacher.id);
    if (existing.some((r) => r.month === selectedMonth && r.year === selectedYear)) {
      toast({ title: "Salary already processed for this period", variant: "destructive" });
      return;
    }

    const newRecord: SalaryRecord = {
      id: `payout_${Date.now()}`,
      month: selectedMonth,
      year: selectedYear,
      baseSalary: base,
      allowance: allowVal,
      deductions: deductVal,
      netPaid: net,
      payDate: new Date().toISOString().split("T")[0],
      paymentMethod,
      status: "Paid",
      notes: notes || "Payroll processed manually.",
    };

    saveTeacherSalaries(selectedTeacher.id, [newRecord, ...existing]);
    toast({ title: "Salary processed ✓", description: `${fmtRs(net)} paid to ${selectedTeacher.name}.` });
    setIsPayoutModalOpen(false);
    setSelectedTeacher(null);
    setRefreshKey((k) => k + 1);
  };

  const handleRollbackPayout = (teacherId: number, recordId: string) => {
    const updated = getTeacherSalaries(teacherId).filter((r) => r.id !== recordId);
    saveTeacherSalaries(teacherId, updated);
    toast({ title: "Payout rolled back" });
    setRefreshKey((k) => k + 1);
  };

  // ── Exporters: Current Period & Period History ─────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    const records: PayrollRecord[] = staff.map((t) => {
      const payout = getPayoutStatus(t.id);
      return {
        teacherId: t.id,
        teacherName: t.name,
        teacherEmail: t.email,
        baseSalary: Number(t.salary) || 120000,
        allowance: payout?.allowance ?? 0,
        deductions: payout?.deductions ?? 0,
        netPaid: payout ? payout.netPaid : Number(t.salary) || 120000,
        payDate: payout?.payDate ?? null,
        paymentMethod: payout?.paymentMethod ?? null,
        status: payout ? "Paid" : "Pending",
        notes: payout?.notes ?? null,
      };
    });

    await exportMonthlyPayrollReport(records, selectedMonth, selectedYear);
    setIsExporting(false);
  };

  const handleHistoryExport = async () => {
    setIsExporting(true);
    const records: PayrollRecord[] = staff.map((t) => {
      const payout = getPayoutForPeriod(t.id, historyMonth, historyYear);
      return {
        teacherId: t.id,
        teacherName: t.name,
        teacherEmail: t.email,
        baseSalary: Number(t.salary) || 120000,
        allowance: payout?.allowance ?? 0,
        deductions: payout?.deductions ?? 0,
        netPaid: payout ? payout.netPaid : Number(t.salary) || 120000,
        payDate: payout?.payDate ?? null,
        paymentMethod: payout?.paymentMethod ?? null,
        status: payout ? "Paid" : "Pending",
        notes: payout?.notes ?? null,
      };
    });

    await exportMonthlyPayrollReport(records, historyMonth, historyYear);
    setIsExporting(false);
  };

  // ── Pay Slip Download Helpers ──────────────────────────────────────────────
  const handleDownloadSingleSlip = async (teacher: any, payoutRecord: SalaryRecord | null, m: string, y: number) => {
    const t = { id: teacher.id, name: teacher.name, email: teacher.email };
    const r: PayrollRecord | null = payoutRecord ? {
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherEmail: teacher.email,
      baseSalary: payoutRecord.baseSalary,
      allowance: payoutRecord.allowance,
      deductions: payoutRecord.deductions,
      netPaid: payoutRecord.netPaid,
      payDate: payoutRecord.payDate,
      paymentMethod: payoutRecord.paymentMethod,
      status: "Paid",
      notes: payoutRecord.notes,
    } : null;

    await exportPaySlip(t, r, m, y);
  };

  const handleDownloadBulkSlips = async (targetMonth: string, targetYear: number) => {
    setIsExporting(true);
    const data = staff.map((t) => {
      const payout = getPayoutForPeriod(t.id, targetMonth, targetYear);
      const r: PayrollRecord | null = payout ? {
        teacherId: t.id,
        teacherName: t.name,
        teacherEmail: t.email,
        baseSalary: payout.baseSalary,
        allowance: payout.allowance,
        deductions: payout.deductions,
        netPaid: payout.netPaid,
        payDate: payout.payDate,
        paymentMethod: payout.paymentMethod,
        status: "Paid",
        notes: payout.notes,
      } : null;
      return {
        teacher: { id: t.id, name: t.name, email: t.email },
        record: r,
      };
    });

    await exportBulkPaySlips(data, targetMonth, targetYear);
    setIsExporting(false);
  };

  // ── Computed stats ────────────────────────────────────────────────────────
  const filteredStaff = useMemo(
    () => staff.filter((s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    ),
    [staff, search]
  );

  const processedPayouts = useMemo(
    () => staff.map((s) => getPayoutStatus(s.id)).filter(Boolean) as SalaryRecord[],
    [staff, salariesMap, selectedMonth, selectedYear]
  );

  const totalBaseBudget = useMemo(() => staff.reduce((a, s) => a + (Number(s.salary) || 120000), 0), [staff]);
  const totalNetPaid    = useMemo(() => processedPayouts.reduce((a, r) => a + r.netPaid, 0), [processedPayouts]);
  const totalAllowances = useMemo(() => processedPayouts.reduce((a, r) => a + r.allowance, 0), [processedPayouts]);
  const totalDeductions = useMemo(() => processedPayouts.reduce((a, r) => a + r.deductions, 0), [processedPayouts]);
  const pendingCount    = staff.length - processedPayouts.length;
  const payoutPct       = staff.length > 0 ? Math.round((processedPayouts.length / staff.length) * 100) : 0;

  // ── History data ──────────────────────────────────────────────────────────
  const historyRows = useMemo(() => {
    return staff.map((t) => {
      const payout = getPayoutForPeriod(t.id, historyMonth, historyYear);
      return { teacher: t, payout };
    });
  }, [staff, salariesMap, historyMonth, historyYear]);

  const historyPaid    = historyRows.filter((r) => r.payout).length;
  const historyPending = historyRows.length - historyPaid;
  const historyNetPaid = historyRows.reduce((a, r) => a + (r.payout?.netPaid ?? 0), 0);

  // ── Complete History aggregated ledger data ─────────────────────────────────
  const completeHistoryRows = useMemo(() => {
    const list: Array<{
      teacher: any;
      payout: SalaryRecord;
      month: string;
      year: number;
    }> = [];

    staff.forEach((t) => {
      const records = getTeacherSalaries(t.id);
      records.forEach((rec) => {
        list.push({
          teacher: t,
          payout: rec,
          month: rec.month,
          year: rec.year,
        });
      });
    });

    return list.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      const mB = monthIndex(b.month);
      const mA = monthIndex(a.month);
      if (mB !== mA) return mB - mA;
      return b.payout.payDate.localeCompare(a.payout.payDate);
    });
  }, [staff, salariesMap]);

  const filteredCompleteHistory = useMemo(() => {
    return completeHistoryRows.filter((row) => {
      const matchYear = completeYearFilter === "all" || row.year.toString() === completeYearFilter;
      const matchMonth = completeMonthFilter === "all" || row.month === completeMonthFilter;
      const matchTeacher = completeTeacherFilter === "all" || row.teacher.id.toString() === completeTeacherFilter;
      const matchSearch =
        completeSearch === "" ||
        row.teacher.name.toLowerCase().includes(completeSearch.toLowerCase()) ||
        row.teacher.email.toLowerCase().includes(completeSearch.toLowerCase());
      return matchYear && matchMonth && matchTeacher && matchSearch;
    });
  }, [completeHistoryRows, completeYearFilter, completeMonthFilter, completeTeacherFilter, completeSearch]);

  const completeHistoryStats = useMemo(() => {
    const totalDisbursed = filteredCompleteHistory.reduce((a, r) => a + r.payout.netPaid, 0);
    const avgPaid = filteredCompleteHistory.length > 0 ? Math.round(totalDisbursed / filteredCompleteHistory.length) : 0;
    const totalAllowancesSum = filteredCompleteHistory.reduce((a, r) => a + r.payout.allowance, 0);
    const totalDeductionsSum = filteredCompleteHistory.reduce((a, r) => a + r.payout.deductions, 0);

    return {
      count: filteredCompleteHistory.length,
      totalDisbursed,
      avgPaid,
      totalAllowancesSum,
      totalDeductionsSum,
    };
  }, [filteredCompleteHistory]);

  const handleCompleteHistoryLedgerExport = async () => {
    setIsExporting(true);
    const records: PayrollRecord[] = filteredCompleteHistory.map((row) => ({
      teacherId: row.teacher.id,
      teacherName: row.teacher.name,
      teacherEmail: row.teacher.email,
      baseSalary: row.payout.baseSalary,
      allowance: row.payout.allowance,
      deductions: row.payout.deductions,
      netPaid: row.payout.netPaid,
      payDate: row.payout.payDate,
      paymentMethod: row.payout.paymentMethod,
      status: "Paid",
      notes: row.payout.notes,
    }));

    const label = `Filter_${completeMonthFilter}_${completeYearFilter}`;
    await exportMonthlyPayrollReport(records, completeMonthFilter === "all" ? "Filtered" : completeMonthFilter, completeYearFilter === "all" ? 0 : Number(completeYearFilter));
    setIsExporting(false);
  };

  const handleCompleteHistoryBulkSlipsExport = async () => {
    setIsExporting(true);
    const data = filteredCompleteHistory.map((row) => {
      const r: PayrollRecord = {
        teacherId: row.teacher.id,
        teacherName: row.teacher.name,
        teacherEmail: row.teacher.email,
        baseSalary: row.payout.baseSalary,
        allowance: row.payout.allowance,
        deductions: row.payout.deductions,
        netPaid: row.payout.netPaid,
        payDate: row.payout.payDate,
        paymentMethod: row.payout.paymentMethod,
        status: "Paid",
        notes: row.payout.notes,
      };
      return {
        teacher: { id: row.teacher.id, name: row.teacher.name, email: row.teacher.email },
        record: r,
      };
    });

    await exportBulkPaySlips(data, "All", 0);
    setIsExporting(false);
  };

  const netLive = useMemo(
    () => (Number(selectedTeacher?.salary) || 120000) + (Number(allowance) || 0) - (Number(deductions) || 0),
    [selectedTeacher, allowance, deductions]
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Payroll Management</h1>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Disburse monthly salaries, generate styled pay slips, and audit college ledger history
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 shadow-sm">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36 h-10 border-transparent bg-white shadow-none rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-24 h-10 border-transparent bg-white shadow-none rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Faculty */}
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Total Faculty</p>
                <p className="text-3xl font-black mt-1">{staff.length}</p>
                <p className="text-xs text-indigo-200 mt-1 font-semibold">{selectedMonth} {selectedYear}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <Users className="h-7 w-7 text-white" />
              </div>
            </CardContent>
          </Card>

          {/* Total Disbursed */}
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Net Disbursed</p>
                <p className="text-2xl font-black mt-1">Rs. {(totalNetPaid / 1000).toFixed(1)}K</p>
                <p className="text-xs text-emerald-100 mt-1 font-semibold">{processedPayouts.length} of {staff.length} paid</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <Banknote className="h-7 w-7 text-white" />
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-100">Pending Payouts</p>
                <p className="text-3xl font-black mt-1">{pendingCount}</p>
                <p className="text-xs text-amber-100 mt-1 font-semibold">{payoutPct}% processed</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </CardContent>
          </Card>

          {/* Base Budget */}
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 text-white overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Base Budget</p>
                <p className="text-2xl font-black mt-1">Rs. {(totalBaseBudget / 1000).toFixed(0)}K</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                  <p className="text-xs text-slate-300 font-semibold">+{fmtRs(totalAllowances)} allowances</p>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabs Selector ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 w-fit shadow-inner">
          <button
            onClick={() => setActiveTab("current")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === "current"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Current Period
          </button>
          <button
            onClick={() => setActiveTab("period_history")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === "period_history"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Period History
          </button>
          <button
            onClick={() => setActiveTab("complete_history")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === "complete_history"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <History className="h-4 w-4" />
            Complete Payment Ledger
          </button>
        </div>

        {/* ╔══════════════════════════════════════════════════════════════╗ */}
        {/* ║  TAB 1: CURRENT PERIOD                                       ║ */}
        {/* ╚══════════════════════════════════════════════════════════════╝ */}
        {activeTab === "current" && (
          <div className="space-y-4">
            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search faculty by name or email..."
                  className="pl-10 w-80 rounded-xl border-slate-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleDownloadBulkSlips(selectedMonth, selectedYear)}
                  disabled={isExporting || staff.length === 0}
                  variant="outline"
                  className="flex items-center gap-2 font-bold rounded-xl border-slate-200 h-10 hover:bg-slate-50"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  Print All Slips (Bulk)
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isExporting || staff.length === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-md shadow-indigo-900/10 h-10"
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                  Download Monthly Ledger
                </Button>
              </div>
            </div>

            {/* Payroll Table */}
            <Card className="border-none shadow-lg ring-1 ring-slate-100 overflow-hidden rounded-3xl bg-white">
              <CardContent className="p-0">
                {loadingStaff ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-40">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                    <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Loading Payroll...</p>
                  </div>
                ) : filteredStaff.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <AlertCircle className="h-12 w-12 text-slate-400 mb-3" />
                    <p className="font-bold text-slate-900 text-lg">No faculty found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 border-b border-slate-100">
                        <TableHead className="py-4 pl-6 font-bold text-slate-500 text-xs uppercase tracking-wider">Faculty</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Base Salary</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Allowance</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Deductions</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Net Amount</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Payment</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</TableHead>
                        <TableHead className="py-4 pr-6 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.map((teacher: any, idx: number) => {
                        const payout = getPayoutStatus(teacher.id);
                        const base = Number(teacher.salary) || 120000;
                        const avatarGrad = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                        return (
                          <TableRow key={teacher.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-50 last:border-0">
                            {/* Faculty Name */}
                            <TableCell className="pl-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-extrabold text-sm shadow-sm flex-shrink-0`}>
                                  {teacher.name?.charAt(0) ?? "T"}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-sm leading-tight">{teacher.name}</p>
                                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{teacher.email}</p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Base */}
                            <TableCell>
                              <span className="font-bold text-slate-700 text-sm">{fmtRs(base)}</span>
                            </TableCell>

                            {/* Allowance */}
                            <TableCell>
                              {payout && payout.allowance > 0 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-sm">
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                  {fmtRs(payout.allowance)}
                                </span>
                              ) : <span className="text-slate-300 font-semibold">—</span>}
                            </TableCell>

                            {/* Deductions */}
                            <TableCell>
                              {payout && payout.deductions > 0 ? (
                                <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-sm">
                                  <ArrowDownRight className="h-3.5 w-3.5" />
                                  {fmtRs(payout.deductions)}
                                </span>
                              ) : <span className="text-slate-300 font-semibold">—</span>}
                            </TableCell>

                            {/* Net */}
                            <TableCell>
                              <span className={`font-extrabold text-sm ${payout ? "text-indigo-600" : "text-slate-400"}`}>
                                {fmtRs(payout ? payout.netPaid : base)}
                              </span>
                            </TableCell>

                            {/* Payment Method & Date */}
                            <TableCell>
                              {payout ? (
                                <div>
                                  <p className="font-bold text-slate-700 text-xs">{payout.paymentMethod}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {new Date(payout.payDate).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs font-semibold">Not processed</span>
                              )}
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              {payout ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-0 font-bold rounded-xl px-2.5 py-1 gap-1 text-[11px]">
                                  <CheckCircle2 className="h-3 w-3" /> Paid
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-50 text-amber-700 border-0 font-bold rounded-xl px-2.5 py-1 gap-1 text-[11px]">
                                  <Clock className="h-3 w-3" /> Pending
                                </Badge>
                              )}
                            </TableCell>

                            {/* Action Buttons */}
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-1">
                                {/* Payslip Downloader */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadSingleSlip(teacher, payout ?? null, selectedMonth, selectedYear)}
                                  title="Download Pay Slip"
                                  className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold h-9 w-9 p-0"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>

                                {payout ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRollbackPayout(teacher.id, payout.id)}
                                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-bold h-9 gap-1 text-xs"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" /> Rollback
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenPayout(teacher)}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold h-9 gap-1 text-xs shadow-sm shadow-emerald-800/10"
                                  >
                                    <DollarSign className="h-3.5 w-3.5" /> Pay
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ╔══════════════════════════════════════════════════════════════╗ */}
        {/* ║  TAB 2: PERIOD HISTORY                                       ║ */}
        {/* ╚══════════════════════════════════════════════════════════════╝ */}
        {activeTab === "period_history" && (
          <div className="space-y-4">
            {/* History Controls */}
            <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Filter Period</p>
                    <div className="flex items-center gap-2">
                      <Select value={historyMonth} onValueChange={setHistoryMonth}>
                        <SelectTrigger className="w-36 h-10 rounded-xl border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {MONTHS.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={historyYear.toString()} onValueChange={(v) => setHistoryYear(Number(v))}>
                        <SelectTrigger className="w-24 h-10 rounded-xl border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {YEARS.map((y) => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* History mini-stats */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 rounded-2xl">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Paid</p>
                        <p className="text-sm font-black text-emerald-700">{historyPaid}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 rounded-2xl">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending</p>
                        <p className="text-sm font-black text-amber-700">{historyPending}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 rounded-2xl">
                      <Banknote className="h-4 w-4 text-indigo-600" />
                      <div>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Net Paid</p>
                        <p className="text-sm font-black text-indigo-700">Rs. {(historyNetPaid / 1000).toFixed(1)}K</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleDownloadBulkSlips(historyMonth, historyYear)}
                      disabled={isExporting || staff.length === 0}
                      variant="outline"
                      className="flex items-center gap-2 font-bold rounded-xl border-slate-200 h-10 hover:bg-slate-50"
                    >
                      <Printer className="h-4 w-4 text-slate-500" />
                      Print Bulk Slips
                    </Button>

                    <Button
                      onClick={handleHistoryExport}
                      disabled={isExporting}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-md shadow-indigo-900/10 h-10"
                    >
                      {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                      Download Ledger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* History Table */}
            <Card className="border-none shadow-lg ring-1 ring-slate-100 overflow-hidden rounded-3xl bg-white">
              <CardContent className="p-0">
                {loadingStaff ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-40">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                    <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Loading History...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 border-b border-slate-100">
                        <TableHead className="py-4 pl-6 font-bold text-slate-500 text-xs uppercase tracking-wider">Faculty</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Base Salary</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Allowance</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Deductions</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Net Paid</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Payment</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Notes</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Status</TableHead>
                        <TableHead className="py-4 pr-6 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyRows.map(({ teacher, payout }, idx) => {
                        const base = Number(teacher.salary) || 120000;
                        const avatarGrad = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        return (
                          <TableRow key={teacher.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-50 last:border-0">
                            <TableCell className="pl-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-extrabold text-sm shadow-sm flex-shrink-0`}>
                                  {teacher.name?.charAt(0) ?? "T"}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-sm leading-tight">{teacher.name}</p>
                                  <p className="text-[11px] text-slate-400 font-medium">{teacher.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-slate-700 text-sm">{fmtRs(base)}</span>
                            </TableCell>
                            <TableCell>
                              {payout && payout.allowance > 0 ? (
                                <span className="text-emerald-600 font-bold text-sm">+{fmtRs(payout.allowance)}</span>
                              ) : <span className="text-slate-300 font-semibold">—</span>}
                            </TableCell>
                            <TableCell>
                              {payout && payout.deductions > 0 ? (
                                <span className="text-rose-500 font-bold text-sm">-{fmtRs(payout.deductions)}</span>
                              ) : <span className="text-slate-300 font-semibold">—</span>}
                            </TableCell>
                            <TableCell>
                              <span className={`font-extrabold text-sm ${payout ? "text-indigo-600" : "text-slate-300"}`}>
                                {payout ? fmtRs(payout.netPaid) : "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {payout ? (
                                <div>
                                  <p className="font-bold text-slate-700 text-xs">{payout.paymentMethod}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {new Date(payout.payDate).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                                  </p>
                                </div>
                              ) : <span className="text-slate-300 text-xs">—</span>}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-500 max-w-[160px] truncate block">{payout?.notes ?? "—"}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              {payout ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-0 font-bold rounded-xl gap-1 text-[11px]">
                                  <CheckCircle2 className="h-3 w-3" /> Paid
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-500 border-0 font-bold rounded-xl gap-1 text-[11px]">
                                  <AlertCircle className="h-3 w-3" /> Unpaid
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadSingleSlip(teacher, payout ?? null, historyMonth, historyYear)}
                                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl font-bold h-9 gap-1 text-xs"
                              >
                                <Printer className="h-3.5 w-3.5" /> Slip
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ╔══════════════════════════════════════════════════════════════╗ */}
        {/* ║  TAB 3: COMPLETE PAYMENT LEDGER                              ║ */}
        {/* ╚══════════════════════════════════════════════════════════════╝ */}
        {activeTab === "complete_history" && (
          <div className="space-y-4">
            {/* Filter Bar & Mini Stats */}
            <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white">
              <CardContent className="p-5 flex flex-col gap-4">
                {/* Inputs */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search history by teacher name or email..."
                      className="pl-10 rounded-xl border-slate-200 h-10"
                      value={completeSearch}
                      onChange={(e) => setCompleteSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={completeMonthFilter} onValueChange={setCompleteMonthFilter}>
                      <SelectTrigger className="w-36 h-10 rounded-xl border-slate-200">
                        <SelectValue placeholder="All Months" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Months</SelectItem>
                        {MONTHS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={completeYearFilter} onValueChange={setCompleteYearFilter}>
                      <SelectTrigger className="w-28 h-10 rounded-xl border-slate-200">
                        <SelectValue placeholder="All Years" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Years</SelectItem>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={completeTeacherFilter} onValueChange={setCompleteTeacherFilter}>
                      <SelectTrigger className="w-48 h-10 rounded-xl border-slate-200">
                        <SelectValue placeholder="All Teachers" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Teachers</SelectItem>
                        {staff.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dashboard Stats */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-50">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Records</p>
                      <p className="text-lg font-black text-slate-700 mt-0.5">{completeHistoryStats.count}</p>
                    </div>
                    <div className="px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Total Paid Out</p>
                      <p className="text-lg font-black text-indigo-700 mt-0.5">{fmtRs(completeHistoryStats.totalDisbursed)}</p>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Average Paid</p>
                      <p className="text-lg font-black text-emerald-700 mt-0.5">{fmtRs(completeHistoryStats.avgPaid)}</p>
                    </div>
                    <div className="px-4 py-2 bg-amber-50/70 rounded-2xl border border-amber-100">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Allowances Paid</p>
                      <p className="text-lg font-black text-amber-700 mt-0.5">{fmtRs(completeHistoryStats.totalAllowancesSum)}</p>
                    </div>
                    <div className="px-4 py-2 bg-rose-50/70 rounded-2xl border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Deductions Held</p>
                      <p className="text-lg font-black text-rose-700 mt-0.5">{fmtRs(completeHistoryStats.totalDeductionsSum)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleCompleteHistoryBulkSlipsExport}
                      disabled={isExporting || filteredCompleteHistory.length === 0}
                      variant="outline"
                      className="flex items-center gap-2 font-bold rounded-xl border-slate-200 h-10 hover:bg-slate-50"
                    >
                      <Printer className="h-4 w-4 text-slate-500" />
                      Print All Slips ({filteredCompleteHistory.length})
                    </Button>
                    <Button
                      onClick={handleCompleteHistoryLedgerExport}
                      disabled={isExporting || filteredCompleteHistory.length === 0}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-md h-10"
                    >
                      <FileDown className="h-4 w-4" />
                      Export Filtered Ledger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Flat Ledger Table */}
            <Card className="border-none shadow-lg ring-1 ring-slate-100 overflow-hidden rounded-3xl bg-white">
              <CardContent className="p-0">
                {filteredCompleteHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <AlertCircle className="h-12 w-12 text-slate-400 mb-3" />
                    <p className="font-bold text-slate-900 text-lg">No payment transactions found</p>
                    <p className="text-sm font-semibold text-slate-400 mt-1">Try adjusting the filter period or teacher search query</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 border-b border-slate-100">
                        <TableHead className="py-4 pl-6 font-bold text-slate-500 text-xs uppercase tracking-wider">Disbursement Date</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Faculty Member</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Pay Period</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Base Salary</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Allowance</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Deductions</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Net Amount</TableHead>
                        <TableHead className="py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Method</TableHead>
                        <TableHead className="py-4 pr-6 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompleteHistory.map(({ teacher, payout, month, year }, idx) => {
                        const avatarGrad = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        return (
                          <TableRow key={payout.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-50 last:border-0">
                            {/* Date Paid */}
                            <TableCell className="pl-6 py-4 font-bold text-slate-600 text-sm">
                              {new Date(payout.payDate).toLocaleDateString("en-US", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>

                            {/* Faculty Name */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-extrabold text-xs shadow-sm flex-shrink-0`}>
                                  {teacher.name?.charAt(0) ?? "T"}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-sm leading-tight">{teacher.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{teacher.email}</p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Period */}
                            <TableCell className="font-semibold text-slate-500 text-xs">
                              {month} {year}
                            </TableCell>

                            {/* Base */}
                            <TableCell className="font-semibold text-slate-600 text-xs">
                              {fmtRs(payout.baseSalary)}
                            </TableCell>

                            {/* Allowance */}
                            <TableCell className="font-bold text-emerald-600 text-xs">
                              {payout.allowance > 0 ? `+${fmtRs(payout.allowance)}` : "—"}
                            </TableCell>

                            {/* Deductions */}
                            <TableCell className="font-bold text-rose-500 text-xs">
                              {payout.deductions > 0 ? `-${fmtRs(payout.deductions)}` : "—"}
                            </TableCell>

                            {/* Net Paid */}
                            <TableCell className="font-extrabold text-indigo-600 text-sm">
                              {fmtRs(payout.netPaid)}
                            </TableCell>

                            {/* Payment Method */}
                            <TableCell className="font-bold text-slate-700 text-xs">
                              {payout.paymentMethod}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadSingleSlip(teacher, payout, month, year)}
                                  className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl font-bold h-9 gap-1 text-xs"
                                >
                                  <Printer className="h-3.5 w-3.5" /> Slip
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRollbackPayout(teacher.id, payout.id)}
                                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-9 w-9 p-0"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ── Pay Salary Dialog ───────────────────────────────────────────── */}
      <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[32px] p-0 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white">Process Salary Payout</DialogTitle>
                <DialogDescription className="text-indigo-200 text-xs mt-0.5 font-medium">
                  {selectedTeacher?.name} · {selectedMonth} {selectedYear}
                </DialogDescription>
              </div>
            </div>

            {/* Base Salary Badge */}
            <div className="bg-white/10 rounded-2xl px-4 py-3 mt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Base Salary</span>
              <span className="text-lg font-black text-white">
                {fmtRs(Number(selectedTeacher?.salary) || 120000)}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Allowance & Deduction */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> Allowance (Rs.)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  className="rounded-xl border-slate-200 font-semibold focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" /> Deductions (Rs.)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="rounded-xl border-slate-200 font-semibold focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-slate-400" /> Payment Method
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Online Payment">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl border-slate-200 font-medium"
              />
            </div>

            {/* Live Net Pay */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Net Payout</p>
                <p className="text-2xl font-black text-indigo-600 mt-0.5">{fmtRs(netLive)}</p>
              </div>
              <FileCheck className="h-8 w-8 text-indigo-300" />
            </div>
          </div>

          <DialogFooter className="bg-slate-50 border-t border-slate-100 p-5 gap-3">
            <Button variant="ghost" onClick={() => setIsPayoutModalOpen(false)} className="flex-1 font-bold text-slate-600 rounded-xl h-11">
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayout}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-600/20"
            >
              Confirm Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
