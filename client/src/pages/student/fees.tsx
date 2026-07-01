import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FeeReceipt } from "@/components/FeeReceipt";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useListEnrollments, useListCourses, useListPayments, useListSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  CreditCard,
  Wallet,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  DollarSign,
  Loader2,
  Upload,
  Smartphone,
  Copy,
  ShieldAlert,
  FileText,
  Receipt,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Coins,
  ShieldCheck,
  Check,
  Eye,
} from "lucide-react";

const BASE = window.location.origin;

type PaymentMethod = "easypaisa" | "jazzcash" | "bank_transfer";

const METHODS = [
  { id: "easypaisa" as PaymentMethod, label: "EasyPaisa", settingKey: "easypaisa_no", bg: "bg-emerald-50/50 hover:bg-emerald-50", color: "text-emerald-600 border-emerald-200" },
  { id: "jazzcash" as PaymentMethod, label: "JazzCash", settingKey: "jazzcash_no", bg: "bg-amber-50/50 hover:bg-amber-50", color: "text-amber-600 border-amber-200" },
  { id: "bank_transfer" as PaymentMethod, label: "Bank Transfer", settingKey: "bank_details", bg: "bg-blue-50/50 hover:bg-blue-50", color: "text-blue-600 border-blue-200" },
];

const fmtRs = (n: number) => `Rs. ${n.toLocaleString()}`;

const parseDurationMonths = (durationStr: string): number => {
  if (!durationStr) return 3;
  const match = durationStr.match(/(\d+)\s*(month|Month|mon|Mon)/);
  if (match) return parseInt(match[1], 10);
  const numMatch = durationStr.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (durationStr.toLowerCase().includes("year")) return num * 12;
    return num;
  }
  return 3;
};

export default function StudentFees() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: enrollmentsResponse = [], isLoading: enrollmentsLoading } = useListEnrollments({ userId: user?.id });
  const enrollments = Array.isArray(enrollmentsResponse) ? enrollmentsResponse : [];

  const { data: coursesResponse = [], isLoading: coursesLoading } = useListCourses();
  const courses = Array.isArray(coursesResponse) ? coursesResponse : [];

  const { data: paymentsResponse = [], isLoading: paymentsLoading } = useListPayments({ userId: user?.id });
  const payments = Array.isArray(paymentsResponse) ? paymentsResponse : [];

  const { data: settings = [], isLoading: settingsLoading } = useListSettings();

  // Dialog State
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [amountDue, setAmountDue] = useState<number>(0);
  const [isPayOpen, setIsPayOpen] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"schedule" | "details">("schedule");

  // Form State
  const [method, setMethod] = useState<PaymentMethod>("easypaisa");
  const [transactionId, setTransactionId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Receipt display modal
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const getSetting = (key: string) => settings?.find((s: any) => s.key === key)?.value || "Not configured";
  const selectedMethod = METHODS.find(m => m.id === method) || METHODS[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied successfully! ✓" });
  };

  const handleReceiptUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }

    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch(`${BASE}/api/users/upload-avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setReceiptUrl(data.url);
      toast({ title: "Receipt uploaded successfully!" });
    } catch (err: any) {
      toast({ title: err.message || "Upload failed", variant: "destructive" });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!receiptUrl) {
      toast({ title: "Please upload payment receipt screenshot", variant: "destructive" });
      return;
    }
    if (!transactionId.trim()) {
      toast({ title: "Please enter transaction ID or reference code", variant: "destructive" });
      return;
    }
    if (selectedMonthIndex === null || !selectedCourse) return;

    setSubmitting(true);
    try {
      const coursePayments = payments.filter((p: any) => p.courseId === selectedCourse.id);
      const verifiedPayments = coursePayments.filter((p: any) => p.status === "verified");
      const totalPaid = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalCourseFee = selectedCourse.fee || 0;
      const remainingFee = Math.max(0, totalCourseFee - totalPaid);

      const res = await fetch(`${BASE}/api/payments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          userId: user?.id,
          amount: amountDue,
          totalFee: totalCourseFee,
          remainingFee: Math.max(0, remainingFee - amountDue),
          paymentPlan: "monthly",
          installmentMonths: parseDurationMonths(selectedCourse.duration),
          installmentNumber: selectedMonthIndex + 1,
          method,
          receiptUrl,
          notes: `Monthly Installment #${selectedMonthIndex + 1} | Transaction ID: ${transactionId} | Student: ${user?.name}`,
        }),
      });

      if (!res.ok) throw new Error("Payment submission failed");

      toast({
        title: "Receipt submitted successfully! 🎉",
        description: "Admin will verify this installment shortly.",
      });

      setIsPayOpen(false);
      setSelectedCourse(null);
      setSelectedMonthIndex(null);
      setTransactionId("");
      setReceiptFile(null);
      setReceiptPreview("");
      setReceiptUrl("");
      queryClient.invalidateQueries({ queryKey: [`/api/payments`] });
    } catch (err: any) {
      toast({ title: err.message || "Failed to submit", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openPayDialog = (course: any, monthIndex: number, installmentAmount: number) => {
    setSelectedCourse(course);
    setSelectedMonthIndex(monthIndex);
    setAmountDue(installmentAmount);
    setIsPayOpen(true);
  };

  const isLoading = enrollmentsLoading || coursesLoading || paymentsLoading || settingsLoading;

  // ── Aggregated Stats across all enrolled courses ───────────────────────────
  const aggregatedStats = useMemo(() => {
    let tuition = 0;
    let paid = 0;

    enrollments.forEach((enr: any) => {
      const course = courses.find((c: any) => c.id === enr.courseId);
      if (course && !course.isFree) {
        tuition += course.fee || 0;
        const verified = payments.filter((p: any) => p.courseId === course.id && p.status === "verified");
        paid += verified.reduce((sum, p) => sum + (p.amount || 0), 0);
      }
    });

    return {
      totalTuition: tuition,
      totalPaid: paid,
      remaining: Math.max(0, tuition - paid),
    };
  }, [enrollments, courses, payments]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Branded Header ────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Tuition Fees & Payments</h1>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Review monthly installments, upload payment screenshots, and access official receipts
            </p>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 w-fit shadow-inner">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === "schedule"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Fee Schedule
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === "details"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileText className="h-4 w-4" />
            Fee Details
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3 opacity-40">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Synchronizing ledgers...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-[32px] p-12 text-center bg-white">
            <CardContent className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mx-auto">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-slate-800">No Course Enrollments Found</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto font-semibold">
                You are not currently registered in any premium courses. Active fees and installment schedules will appear here once enrolled.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">

            {/* ── Aggregate Stats (always visible) ──────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-slate-900 text-white overflow-hidden">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Coins className="h-6 w-6 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tuition Investment</p>
                    <p className="text-xl font-black mt-0.5">{fmtRs(aggregatedStats.totalTuition)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-emerald-500 text-white overflow-hidden">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Total Paid & Approved</p>
                    <p className="text-xl font-black mt-0.5">{fmtRs(aggregatedStats.totalPaid)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-indigo-600 text-white overflow-hidden">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-indigo-200" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Net Outstanding</p>
                    <p className="text-xl font-black mt-0.5">{fmtRs(aggregatedStats.remaining)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: FEE SCHEDULE                                          */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === "schedule" && (
              <div className="space-y-6">
                {enrollments.map((enr: any) => {
                  const course = courses.find((c: any) => c.id === enr.courseId);
                  if (!course || course.isFree) return null;

                  const coursePayments = payments.filter((p: any) => p.courseId === course.id);
                  const verifiedPayments = coursePayments.filter((p: any) => p.status === "verified");
                  const pendingPayments = coursePayments.filter((p: any) => p.status === "pending");
                  const hasPending = pendingPayments.length > 0;

                  const totalCourseFee = course.fee || 0;
                  const totalPaid = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                  const remainingFee = Math.max(0, totalCourseFee - totalPaid);

                  const durationMonths = parseDurationMonths(course.duration);
                  const installmentAmount = Math.ceil(totalCourseFee / durationMonths);

                  const sortedPayments = [...coursePayments].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                  const firstPayment = sortedPayments[0];
                  const isMonthly = firstPayment ? (firstPayment as any).paymentPlan === "monthly" : true;
                  const percentCleared = totalCourseFee > 0 ? Math.round((totalPaid / totalCourseFee) * 100) : 0;

                  const enrollmentDate = enr.createdAt ? new Date(enr.createdAt) : new Date();
                  const now = new Date();
                  const diffMonths = (now.getFullYear() - enrollmentDate.getFullYear()) * 12 + (now.getMonth() - enrollmentDate.getMonth()) + 1;
                  const currentElapsedMonths = Math.max(1, diffMonths);

                  return (
                    <Card key={enr.id} className="border-none shadow-lg ring-1 ring-slate-100 rounded-[32px] overflow-hidden bg-white">
                      <div className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl text-xs font-bold text-slate-500 border border-slate-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                            {(course as any).code || "GCCSC"}
                          </span>
                          <h3 className="text-lg font-black text-slate-900 mt-2.5">{course.title}</h3>
                          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                            Duration: {course.duration} · {isMonthly ? "Installment Schedule" : "Standard Full Tuition"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tuition Cleared</span>
                            <span className="text-sm font-black text-slate-800">{percentCleared}% Approved</span>
                            <div className="w-28 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${percentCleared}%` }} />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs font-bold shrink-0">
                            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm text-center">
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Fees</span>
                              <span className="text-xs font-black text-slate-800">{fmtRs(totalCourseFee)}</span>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2.5 shadow-sm text-center">
                              <span className="text-[9px] text-indigo-600 uppercase font-black tracking-wider block">Dues</span>
                              <span className="text-xs font-black text-indigo-700">{fmtRs(remainingFee)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          <div className="lg:col-span-7 space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              Installments Timeline
                            </h4>
                            {isMonthly ? (
                              <div className="relative pl-6 space-y-5 border-l-2 border-slate-100">
                                {Array.from({ length: durationMonths }).map((_, i) => {
                                  const monthNum = i + 1;

                                  const monthPayments = coursePayments.filter((p: any) => (p as any).installmentNumber === monthNum);
                                  const verifiedP = monthPayments.find((p: any) => p.status === "verified");
                                  const pendingP  = monthPayments.find((p: any) => p.status === "pending");
                                  const rejectedP = monthPayments.find((p: any) => p.status === "rejected");
                                  const paymentForMonth = verifiedP ?? pendingP ?? rejectedP ?? monthPayments[0];
                                  const hasPendingThisMonth = !!pendingP;

                                  let status: "verified" | "pending" | "rejected" | "due" | "upcoming" = "upcoming";
                                  if (verifiedP) {
                                    status = "verified";
                                  } else if (pendingP) {
                                    status = "pending";
                                  } else if (rejectedP) {
                                    status = "rejected";
                                  } else {
                                    // Unlock if current calendar month has arrived OR previous months are cleared
                                    const isMonthArrived = monthNum <= currentElapsedMonths;
                                    const previousMonthsCleared = Array.from({ length: i }).every((_, prevIdx) =>
                                      coursePayments.some((p: any) => (p as any).installmentNumber === (prevIdx + 1) && p.status === "verified")
                                    );
                                    if (isMonthArrived || previousMonthsCleared) status = "due";
                                  }

                                  const currentMonthAmount = monthNum === durationMonths ? (totalCourseFee - (installmentAmount * (durationMonths - 1))) : installmentAmount;
                                  const canPay = status === "due" || status === "rejected";

                                  return (
                                    <div key={i} className="relative group">
                                      <div className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                                        status === "verified" ? "border-emerald-500 bg-emerald-500 text-white" :
                                        status === "pending" ? "border-amber-400 text-amber-500 animate-pulse" :
                                        status === "rejected" ? "border-rose-500 bg-rose-50" :
                                        status === "due" ? "border-indigo-600 bg-indigo-50" : "border-slate-200"
                                      }`}>
                                        {status === "verified" && <Check className="h-2.5 w-2.5 stroke-[4]" />}
                                        {status === "pending" && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                                        {status === "rejected" && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                                        {status === "due" && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                                      </div>
                                      <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                        status === "verified" ? "border-emerald-100 bg-emerald-50/10" :
                                        status === "pending" ? "border-amber-100 bg-amber-50/10" :
                                        status === "rejected" ? "border-rose-200 bg-rose-50/20" :
                                        status === "due" ? "border-indigo-200 bg-indigo-50/5 shadow-sm" :
                                        "border-slate-50 bg-slate-50/20 opacity-60"
                                      }`}>
                                        <div>
                                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tuition Installment</p>
                                          <h5 className="text-sm font-black text-slate-900 mt-0.5">Month {monthNum} · {fmtRs(currentMonthAmount)}</h5>
                                          <p className={`text-[10px] font-semibold mt-1 ${
                                            status === "rejected" ? "text-rose-500" : "text-slate-500"
                                          }`}>
                                            {status === "verified" && paymentForMonth
                                              ? `Received on ${new Date((paymentForMonth as any).createdAt).toLocaleDateString()}`
                                              : status === "pending" ? "Awaiting receipt review by admin"
                                              : status === "rejected" ? `❌ Receipt rejected — please pay again`
                                              : status === "due" ? "Upload your payment screenshot to proceed"
                                              : "Locked (Previous installment not yet cleared)"}
                                          </p>
                                        </div>
                                        <div className="shrink-0 sm:text-right flex flex-col items-end gap-1.5">
                                          {canPay ? (
                                            <Button
                                              disabled={hasPendingThisMonth}
                                              onClick={() => openPayDialog(course, i, currentMonthAmount)}
                                              className={`h-8 font-bold text-xs text-white rounded-lg px-4 gap-1 flex items-center shadow-md ${
                                                status === "rejected"
                                                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10"
                                                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10"
                                              }`}
                                            >
                                              {status === "rejected" ? "Pay Again" : "Pay Now"} <ArrowRight className="h-3 w-3" />
                                            </Button>
                                          ) : status === "verified" ? (
                                            <Badge className="bg-emerald-50 text-emerald-700 border-0 font-bold rounded-lg text-[10px] px-2.5 py-1">✓ Approved</Badge>
                                          ) : status === "pending" ? (
                                            <Badge className="bg-amber-50 text-amber-700 border-0 font-bold rounded-lg text-[10px] px-2.5 py-1 animate-pulse">☕ Under Review</Badge>
                                          ) : (
                                            <span className="text-[10px] text-slate-400 font-semibold italic">Locked</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <h5 className="text-sm font-black text-slate-800">{remainingFee === 0 ? "🎉 Tuition Cleared in Full" : "Outstanding Tuition Dues"}</h5>
                                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    {remainingFee === 0 ? "Full fee verified." : "Transfer outstanding dues to continue."}
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  {remainingFee === 0 ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-0 font-bold rounded-xl py-1.5 px-3">✓ Verified In Full</Badge>
                                  ) : (
                                    <Link href={`/dashboard/payment/${course.id}`}>
                                      <Button className="font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-4 flex items-center gap-1 shadow-sm">
                                        Pay Dues <ArrowUpRight className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: FEE DETAILS (University Portal Table)                 */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === "details" && (
              <div className="space-y-8">
                {enrollments.map((enr: any) => {
                  const course = courses.find((c: any) => c.id === enr.courseId);
                  if (!course || course.isFree) return null;

                  const coursePayments = payments.filter((p: any) => p.courseId === course.id);
                  const verifiedPayments = coursePayments.filter((p: any) => p.status === "verified");
                  const totalCourseFee = course.fee || 0;
                  const totalPaid = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                  const durationMonths = parseDurationMonths(course.duration);
                  const installmentAmount = Math.ceil(totalCourseFee / durationMonths);

                  const enrollmentDate = enr.createdAt ? new Date(enr.createdAt) : new Date();
                  const now = new Date();
                  const diffMonths = (now.getFullYear() - enrollmentDate.getFullYear()) * 12 + (now.getMonth() - enrollmentDate.getMonth()) + 1;
                  const currentElapsedMonths = Math.max(1, diffMonths);

                  const allRows = Array.from({ length: durationMonths }).map((_, i) => {
                    const monthNum = i + 1;
                    const monthPayments = coursePayments.filter((p: any) => (p as any).installmentNumber === monthNum);
                    const amt = monthNum === durationMonths ? (totalCourseFee - installmentAmount * (durationMonths - 1)) : installmentAmount;
                    
                    const verifiedP = monthPayments.find((p: any) => p.status === "verified");
                    const pendingP  = monthPayments.find((p: any) => p.status === "pending");
                    const rejectedP = monthPayments.find((p: any) => p.status === "rejected");
                    const paymentForMonth = verifiedP ?? pendingP ?? rejectedP ?? monthPayments[0];
                    const hasPendingThisMonth = !!pendingP;

                    let status: "verified" | "pending" | "rejected" | "due" | "upcoming" = "upcoming";
                    if (verifiedP) status = "verified";
                    else if (pendingP) status = "pending";
                    else if (rejectedP) status = "rejected";
                    else {
                      const isMonthArrived = monthNum <= currentElapsedMonths;
                      const prevCleared = Array.from({ length: i }).every((_, prevIdx) =>
                        coursePayments.some((p: any) => (p as any).installmentNumber === (prevIdx + 1) && p.status === "verified")
                      );
                      if (isMonthArrived || prevCleared) status = "due";
                    }
                    return { monthNum, paymentForMonth, amt, status, hasPendingThisMonth };
                  });

                  const SEMESTERS = ["0th Semester", "1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester"];

                  return (
                    <div key={enr.id} className="space-y-3">
                      {/* Course Info Banner */}
                      <div className="bg-indigo-900 text-white rounded-2xl px-5 py-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-indigo-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Program</p>
                          <p className="font-black text-sm leading-tight truncate">{course.title}</p>
                        </div>
                        <div className="hidden sm:block pl-6 border-l border-white/20 text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Student</p>
                          <p className="font-black text-sm">{user?.name || "—"}</p>
                        </div>
                        <div className="pl-6 border-l border-white/20 text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Duration</p>
                          <p className="font-black text-sm">{course.duration}</p>
                        </div>
                        <div className="pl-6 border-l border-white/20 text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Total Fee</p>
                          <p className="font-black text-sm">{fmtRs(totalCourseFee)}</p>
                        </div>
                      </div>

                      {/* Table */}
                      <Card className="border-none shadow-lg ring-1 ring-slate-100 rounded-3xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-white">
                                <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/10">SR #</th>
                                <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/10">Vouch. No</th>
                                <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/10">Semester</th>
                                <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/10">Roll No</th>
                                <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/10">Student Name</th>
                                <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/10">Program Title</th>
                                <th className="px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-widest border-r border-white/10">Net Amt.</th>
                                <th className="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest border-r border-white/10">Due Date</th>
                                <th className="px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-widest border-r border-white/10">Paid Amt.</th>
                                <th className="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest border-r border-white/10">Paid Date</th>
                                <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/10">Method</th>
                                <th className="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest border-r border-white/10">Status</th>
                                <th className="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {allRows.map(({ monthNum, paymentForMonth, amt, status, hasPendingThisMonth }, idx) => {
                                const isPaid = status === "verified";
                                 const isPending = status === "pending";
                                 const isDue = status === "due";
                                 const isRejected = status === "rejected";
                                 const canPayRow = isDue || isRejected;
                                 const rowBg = isPaid ? "hover:bg-emerald-50/30" : isPending ? "hover:bg-amber-50/20" : isRejected ? "bg-rose-50/20 hover:bg-rose-50/30" : isDue ? "hover:bg-indigo-50/20" : "opacity-60 hover:bg-slate-50/50";

                                const methodLabel = paymentForMonth
                                  ? (paymentForMonth.method === "easypaisa" ? "EasyPaisa" : paymentForMonth.method === "jazzcash" ? "JazzCash" : "Bank Transfer")
                                  : "—";

                                return (
                                  <tr key={monthNum} className={`transition-colors text-xs ${rowBg}`}>
                                    <td className="px-4 py-3.5 font-bold text-slate-500">{idx + 1}</td>
                                    <td className="px-4 py-3.5 font-mono font-bold text-slate-700 text-[11px]">
                                      {paymentForMonth ? `#${String(paymentForMonth.id).padStart(7, "0")}` : "—"}
                                    </td>
                                    <td className="px-4 py-3.5 font-semibold text-slate-600">
                                      {SEMESTERS[idx] ?? `Month ${monthNum}`}
                                    </td>
                                    <td className="px-4 py-3.5 font-bold text-slate-600">
                                      {(user as any)?.rollNo || (user as any)?.id || "—"}
                                    </td>
                                    <td className="px-4 py-3.5 font-bold text-slate-800">{user?.name || "—"}</td>
                                    <td className="px-4 py-3.5 font-medium text-slate-600 max-w-[180px] truncate">{course.title}</td>
                                    <td className="px-4 py-3.5 text-right font-black text-slate-900">{fmtRs(amt)}</td>
                                    <td className="px-4 py-3.5 text-center font-bold text-indigo-650">
                                      {paymentForMonth
                                        ? new Date((paymentForMonth as any).createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase()
                                        : <span className="text-amber-500 font-extrabold">PENDING</span>}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-black text-emerald-700">
                                      {isPaid ? fmtRs((paymentForMonth as any).amount) : isPending ? fmtRs((paymentForMonth as any).amount) : "—"}
                                    </td>
                                    <td className="px-4 py-3.5 text-center font-bold text-slate-600 text-[11px]">
                                      {isPaid || isPending
                                        ? new Date((paymentForMonth as any).createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase()
                                        : "—"}
                                    </td>
                                    <td className="px-4 py-3.5 font-medium text-slate-600">{methodLabel}</td>
                                    <td className="px-4 py-3.5 text-center">
                                      {isPaid ? (
                                        <Badge className="bg-emerald-50 text-emerald-700 border-0 font-extrabold text-[10px] rounded-lg px-2.5 py-1">Paid</Badge>
                                      ) : isPending ? (
                                        <Badge className="bg-amber-50 text-amber-700 border-0 font-extrabold text-[10px] rounded-lg px-2.5 py-1 animate-pulse">Review</Badge>
                                      ) : isRejected ? (
                                        <Badge className="bg-rose-50 text-rose-700 border-0 font-extrabold text-[10px] rounded-lg px-2.5 py-1">❌ Rejected</Badge>
                                      ) : isDue ? (
                                        <Badge className="bg-rose-50 text-rose-700 border-0 font-extrabold text-[10px] rounded-lg px-2.5 py-1">Due</Badge>
                                      ) : (
                                        <Badge className="bg-slate-50 text-slate-400 border-0 font-extrabold text-[10px] rounded-lg px-2.5 py-1">Upcoming</Badge>
                                      )}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                      {isPaid || isPending ? (
                                        <Button
                                          size="sm" variant="outline"
                                          onClick={() => { setReceiptData({ ...paymentForMonth, amount: Number((paymentForMonth as any).amount) || 0, totalFee: Number((paymentForMonth as any).totalFee) || 0, remainingFee: (paymentForMonth as any).remainingFee !== undefined ? Number((paymentForMonth as any).remainingFee) : undefined, userName: user?.name || "Student", courseName: course.title }); setShowReceipt(true); }}
                                          className="h-8 w-8 p-0 rounded-xl border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-600"
                                          title="View / Print Receipt"
                                        >
                                          <Receipt className="h-3.5 w-3.5" />
                                        </Button>
                                      ) : canPayRow ? (
                                        <Button
                                          size="sm"
                                          disabled={hasPendingThisMonth}
                                          onClick={() => openPayDialog(course, monthNum - 1, amt)}
                                          className={`h-8 px-3 font-bold text-[10px] text-white rounded-xl shadow-sm ${
                                            isRejected ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"
                                          }`}
                                        >
                                          {isRejected ? "Pay Again" : "Pay"}
                                        </Button>
                                      ) : (
                                        <span className="text-slate-300 text-[10px] font-bold">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            {/* Footer totals row */}
                            <tfoot>
                              <tr className="bg-slate-50 border-t-2 border-slate-200">
                                <td colSpan={6} className="px-4 py-3 text-xs font-black text-slate-700 uppercase tracking-widest">TOTAL SUMMARY</td>
                                <td className="px-4 py-3 text-right font-black text-slate-900 text-xs">{fmtRs(totalCourseFee)}</td>
                                <td colSpan={1} />
                                <td className="px-4 py-3 text-right font-black text-emerald-700 text-xs">{fmtRs(totalPaid)}</td>
                                <td colSpan={3} />
                                <td className="px-4 py-3 text-center">
                                  <span className="text-[10px] font-black text-indigo-600">
                                    Due: {fmtRs(Math.max(0, totalCourseFee - totalPaid))}
                                  </span>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PAY MONTHLY INSTALLMENT DIALOG */}
        <Dialog open={isPayOpen} onOpenChange={open => { if (!open) setIsPayOpen(false); }}>
          <DialogContent className="max-w-2xl bg-white border border-slate-200 rounded-[28px] shadow-2xl p-0 gap-0 overflow-hidden">
            <DialogHeader className="bg-slate-900 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-white">Upload Payment Details</DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs mt-0.5">
                    Provide billing details for <span className="text-indigo-300 font-bold">Month #{selectedMonthIndex !== null ? selectedMonthIndex + 1 : ""}</span> of {selectedCourse?.title}.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Method and Instructions */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Channel</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {METHODS.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id)}
                          className={`p-2 rounded-xl border-2 text-center transition-all ${
                            method === m.id
                              ? `${m.bg} ${m.color} border-current`
                              : "border-slate-100 text-slate-400 hover:border-slate-200"
                          }`}
                        >
                          <Smartphone className="h-4 w-4 mx-auto mb-1" />
                          <span className="text-[9px] font-black block leading-none">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <p className="text-[11px] font-bold text-slate-500 leading-normal">
                      Please transfer exactly <span className="text-indigo-600 font-extrabold">{fmtRs(amountDue)}</span> to:
                    </p>
                    <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200/80 px-3 py-2 shadow-sm">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">{selectedMethod.label} No</p>
                        <p className="font-mono font-black text-slate-800 text-sm mt-1 truncate">{getSetting(selectedMethod.settingKey)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                        onClick={() => handleCopy(getSetting(selectedMethod.settingKey))}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-650">Transaction ID / TxID *</Label>
                    <Input
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      className="h-10 rounded-xl border-slate-200 font-semibold text-sm"
                      placeholder="e.g. 104593452"
                    />
                  </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-450 uppercase tracking-wider">Screenshot Receipt *</Label>
                    <label className={`block w-full border-2 border-dashed rounded-2xl cursor-pointer transition-all relative overflow-hidden ${
                      uploadingReceipt ? "border-indigo-300 bg-indigo-50/5 cursor-wait" :
                      receiptPreview ? "border-emerald-300 bg-emerald-50/5" : 
                      "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/5"
                    }`}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        disabled={uploadingReceipt}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(f); }} 
                      />
                      {uploadingReceipt ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                          <p className="font-bold text-indigo-900 text-xs">Uploading Screen...</p>
                        </div>
                      ) : receiptPreview ? (
                        <div className="p-3 flex items-center gap-3">
                          <img src={receiptPreview} alt="Receipt" className="h-16 w-16 object-cover rounded-xl border border-slate-200" />
                          <div>
                            <p className="font-black text-emerald-700 text-xs">✓ Screenshot Attached</p>
                            <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[120px]">{receiptFile?.name}</p>
                            <p className="text-[10px] text-indigo-600 font-bold mt-1.5">Change image</p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-10 flex flex-col items-center gap-2">
                          <Upload className="h-6 w-6 text-slate-400" />
                          <div className="text-center">
                            <p className="font-bold text-slate-700 text-xs">Select Payment Screenshot</p>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">JPEG or PNG (under 5MB)</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Or Paste Screenshot Link</Label>
                    <Input
                      value={receiptUrl}
                      onChange={e => setReceiptUrl(e.target.value)}
                      className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                      placeholder="https://..."
                    />
                  </div>
                </div>

              </div>
            </div>

            <DialogFooter className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-[28px]">
              <Button
                variant="ghost"
                onClick={() => setIsPayOpen(false)}
                className="rounded-xl font-bold text-xs h-10"
              >
                Cancel
              </Button>
              <Button
                disabled={submitting || uploadingReceipt || !receiptUrl || !transactionId.trim()}
                onClick={handleSubmitPayment}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs h-10 px-5 shadow-lg shadow-indigo-600/10"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Submitting...
                  </>
                ) : "Submit Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Official printable slip popup */}
      {showReceipt && receiptData && (
        <FeeReceipt
          payment={receiptData}
          institute={{
            name: "Global College",
            address: "Main Campus, City Center, Pakistan",
            phone: "+92-XXX-XXXXXXX",
            email: "info@globalcollege.edu.pk",
          }}
          onClose={() => {
            setShowReceipt(false);
            setReceiptData(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
