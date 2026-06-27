import { useState, useEffect } from "react";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FeeReceipt } from "@/components/FeeReceipt";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useListEnrollments, useListCourses, useListPayments, useListSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  CreditCard, Wallet, Calendar, AlertCircle, Info, CheckCircle2,
  Clock, XCircle, ArrowUpRight, DollarSign, Loader2, Upload,
  Smartphone, Copy, ShieldAlert, Award, FileText, Receipt
} from "lucide-react";

const BASE = window.location.origin;

type PaymentMethod = "easypaisa" | "jazzcash" | "bank_transfer";

const METHODS = [
  { id: "easypaisa" as PaymentMethod, label: "EasyPaisa", settingKey: "easypaisa_no", bg: "bg-emerald-50/50 hover:bg-emerald-50", color: "text-emerald-600 border-emerald-200" },
  { id: "jazzcash" as PaymentMethod, label: "JazzCash", settingKey: "jazzcash_no", bg: "bg-amber-50/50 hover:bg-amber-50", color: "text-amber-600 border-amber-200" },
  { id: "bank_transfer" as PaymentMethod, label: "Bank Transfer", settingKey: "bank_details", bg: "bg-blue-50/50 hover:bg-blue-50", color: "text-blue-600 border-blue-200" },
];

// Helper to parse course duration (e.g. "6 Months" -> 6)
const parseDurationMonths = (durationStr: string): number => {
  if (!durationStr) return 3; // Fallback
  const match = durationStr.match(/(\d+)\s*(month|Month|mon|Mon)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  const numMatch = durationStr.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (durationStr.toLowerCase().includes("year")) {
      return num * 12;
    }
    return num;
  }
  return 3; // Default default
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

  // Form State
  const [method, setMethod] = useState<PaymentMethod>("easypaisa");
  const [transactionId, setTransactionId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Receipt display
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const getSetting = (key: string) => settings?.find((s: any) => s.key === key)?.value || "Not configured";
  const selectedMethod = METHODS.find(m => m.id === method) || METHODS[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
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
      formData.append("avatar", file); // reuse avatar upload endpoint
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
      // Calculate remaining fee after this installment
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

      // Reset & refresh
      setIsPayOpen(false);
      setSelectedCourse(null);
      setSelectedMonthIndex(null);
      setTransactionId("");
      setReceiptFile(null);
      setReceiptPreview("");
      setReceiptUrl("");
      
      // Invalidate queries to refresh listing data
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

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Fee Payments Portal
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            Track outstanding course balances, view monthly tuition installments, and submit monthly receipts for verification.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-slate-400 font-bold">Synchronizing financial ledger...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <Card className="border-2 border-slate-100 rounded-3xl p-12 text-center">
            <CardContent className="space-y-4">
              <ShieldAlert className="h-12 w-12 text-slate-400 mx-auto" />
              <h3 className="text-lg font-black text-slate-800">No Active Enrollments Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">
                You must be enrolled in a premium academic course to access monthly installments and payment tools.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
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

              // Calculate monthly partitions dynamically from course duration
              const durationMonths = parseDurationMonths(course.duration);
              const installmentAmount = Math.ceil(totalCourseFee / durationMonths);

              // Find the first payment to know if they chose a monthly or full plan
              const sortedPayments = [...coursePayments].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              const firstPayment = sortedPayments[0];
              const isMonthly = firstPayment ? firstPayment.paymentPlan === "monthly" : false;

              return (
                <Card key={enr.id} className="border border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="bg-slate-50 border-b border-slate-150 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <Badge className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-1">
                        Academic Enrollment Ledger
                      </Badge>
                      <CardTitle className="text-xl font-black text-slate-900">{course.title}</CardTitle>
                      <CardDescription className="text-xs text-slate-500 font-semibold mt-1">
                        Duration: {course.duration} &bull; {isMonthly ? `Monthly Installment Plan (${durationMonths} Months)` : "Complete Course Fee Plan (No Installments)"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs font-bold shrink-0">
                      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm text-center min-w-28">
                        <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">Total Tuition</span>
                        <span className="text-sm font-black text-slate-800">Rs. {totalCourseFee.toLocaleString()}</span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2.5 shadow-sm text-center min-w-28">
                        <span className="text-[10px] text-emerald-600 uppercase font-black block tracking-wider">Total Paid</span>
                        <span className="text-sm font-black text-emerald-800">Rs. {totalPaid.toLocaleString()}</span>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2.5 shadow-sm text-center min-w-28">
                        <span className="text-[10px] text-indigo-600 uppercase font-black block tracking-wider">Remaining Dues</span>
                        <span className="text-sm font-black text-indigo-800">Rs. {remainingFee.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* PLAN HEADING */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-indigo-500" />
                        Plan Type: {isMonthly ? `Monthly Installment Plan (${durationMonths} Months)` : "Complete Course Fee (Full Plan)"}
                      </h4>
                      <Badge className={isMonthly ? "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50" : "bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-50"}>
                        {isMonthly ? "Installment Plan" : "One-Time Payment"}
                      </Badge>
                    </div>

                    {/* PLAN DETAILS CONTENT */}
                    {isMonthly ? (
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Monthly Installments Breakdown</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {Array.from({ length: durationMonths }).map((_, i) => {
                            const monthNum = i + 1;
                            // Find matching verified or pending payment for this slot
                            const paymentForMonth = coursePayments.find((p: any) => p.installmentNumber === monthNum);
                            
                            let status: "verified" | "pending" | "due" | "upcoming" = "upcoming";
                            if (paymentForMonth) {
                              status = paymentForMonth.status === "verified" ? "verified" : paymentForMonth.status === "rejected" ? "due" : "pending";
                            } else {
                              // The next due installment is the first month with no verified or pending payment
                              const alreadyPaidOrPending = coursePayments.some((p: any) => p.installmentNumber === monthNum && (p.status === "verified" || p.status === "pending"));
                              if (!alreadyPaidOrPending) {
                                const previousMonthsCleared = Array.from({ length: i }).every((_, prevIdx) => {
                                  return coursePayments.some((p: any) => p.installmentNumber === (prevIdx + 1) && p.status === "verified");
                                });
                                if (previousMonthsCleared) {
                                  status = "due";
                                }
                              }
                            }

                            // Determine installment amount (last month takes remaining if rounding issue occurs)
                            const currentMonthAmount = monthNum === durationMonths ? (totalCourseFee - (installmentAmount * (durationMonths - 1))) : installmentAmount;

                            return (
                              <div
                                key={i}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-36 ${
                                  status === "verified" ? "border-emerald-200 bg-emerald-50/20" :
                                  status === "pending" ? "border-amber-200 bg-amber-50/10" :
                                  status === "due" ? "border-indigo-200 bg-indigo-50/5" :
                                  "border-slate-100 bg-slate-50/50 opacity-60"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Month {monthNum}</span>
                                    {status === "verified" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                                    {status === "pending" && <Clock className="h-4 w-4 text-amber-500 animate-pulse" />}
                                    {status === "due" && <AlertCircle className="h-4 w-4 text-indigo-500" />}
                                  </div>
                                  <h5 className="text-base font-black text-slate-800 mt-2">Rs. {currentMonthAmount.toLocaleString()}</h5>
                                  <p className="text-[10px] text-slate-500 font-semibold mt-1">
                                    {status === "verified" && paymentForMonth
                                      ? `Verified on ${new Date((paymentForMonth as any).createdAt).toLocaleDateString()}`
                                      : status === "pending" ? "Awaiting Admin Approval"
                                      : status === "due" ? "Due / Ready to Pay"
                                      : "Locked (Upcoming)"}
                                  </p>
                                </div>

                                <div className="mt-4">
                                  {status === "due" ? (
                                    <Button
                                      disabled={hasPending}
                                      onClick={() => openPayDialog(course, i, currentMonthAmount)}
                                      className="w-full h-8 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                                    >
                                      {hasPending ? "Pending Other Review" : "Pay Month Fee"}
                                    </Button>
                                  ) : status === "verified" ? (
                                    <Badge className="w-full py-1 justify-center bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold border-none rounded-lg text-[10px]">
                                      Paid & Verified
                                    </Badge>
                                  ) : status === "pending" ? (
                                    <Badge className="w-full py-1 justify-center bg-amber-100 text-amber-800 hover:bg-amber-100 font-bold border-none rounded-lg text-[10px] animate-pulse">
                                      Verification Pending
                                    </Badge>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-bold block text-center py-1">
                                      Upcoming Installment
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      // FULL PAYMENT PLAN SECTION
                      <div className="p-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h5 className="text-sm font-black text-slate-800">
                            {remainingFee === 0 ? "🎉 Fee Paid in Full" : "Complete Course Fee Payment"}
                          </h5>
                          <p className="text-xs text-slate-500 font-medium">
                            {remainingFee === 0
                              ? "Excellent! Your full course fee has been paid and verified. Enjoy full course access."
                              : hasPending
                              ? "Your payment receipt has been submitted and is currently awaiting admin verification."
                              : `Please submit the payment receipt for the complete course fee of Rs. ${totalCourseFee.toLocaleString()}.`}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {remainingFee === 0 ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold border-none rounded-xl py-1.5 px-3 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Paid & Verified
                            </Badge>
                          ) : hasPending ? (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-bold border-none rounded-xl py-1.5 px-3 flex items-center gap-1 animate-pulse">
                              <Clock className="h-4 w-4" /> Awaiting Verification
                            </Badge>
                          ) : (
                            <Link href={`/dashboard/payment/${course.id}`}>
                              <Button className="font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-4 flex items-center gap-1.5 shadow-sm">
                                <ArrowUpRight className="h-4 w-4" /> Submit Receipt / Pay Dues
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TRANSACTIONS LEDGER (PAID AND UPCOMING) */}
                    <div className="border-t border-slate-100 pt-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* LEFT COLUMN: PAID FEES LEDGER */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Fee Paid Ledger
                          </h5>
                          <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white">
                            {coursePayments.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                                No payments submitted yet.
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                                {coursePayments.map((p: any) => (
                                  <div key={p.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between text-xs mb-2">
                                      <div>
                                        <div className="font-bold text-slate-800">
                                          {p.paymentPlan === "monthly" ? `Installment #${p.installmentNumber}` : "Full Course Fee"}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                          {new Date(p.createdAt).toLocaleDateString()} &bull; {p.method.toUpperCase()}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-black text-slate-900">Rs. {p.amount.toLocaleString()}</div>
                                        <Badge className={`mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                          p.status === 'verified' ? 'bg-emerald-55 text-emerald-700 border border-emerald-100' :
                                          p.status === 'pending' ? 'bg-amber-55 text-amber-700 border border-amber-100' :
                                          'bg-rose-55 text-rose-700 border border-rose-100'
                                        }`}>
                                          {p.status}
                                        </Badge>
                                      </div>
                                    </div>
                                    {(p.status === 'verified' || p.status === 'pending') && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className={`w-full h-7 text-[10px] font-bold rounded-lg ${
                                          p.status === 'verified'
                                            ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                                            : 'border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                                        }`}
                                        onClick={() => {
                                          setReceiptData({
                                            ...p,
                                            // Coerce numeric fields from API string types
                                            amount: Number(p.amount) || 0,
                                            totalFee: Number(p.totalFee) || Number(p.amount) || 0,
                                            remainingFee: p.remainingFee !== undefined && p.remainingFee !== null ? Number(p.remainingFee) : undefined,
                                            userName: user?.name || "Student",
                                            courseName: course.title,
                                          });
                                          setShowReceipt(true);
                                        }}
                                      >
                                        <Receipt className="h-3 w-3 mr-1" />
                                        {p.status === 'verified' ? 'View Receipt' : 'View Submission'}
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* RIGHT COLUMN: UPCOMING FEES LEDGER */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-indigo-500" />
                            Upcoming Fees Ledger
                          </h5>
                          <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white">
                            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                              {/* If monthly plan */}
                              {isMonthly ? (
                                Array.from({ length: durationMonths }).map((_, i) => {
                                  const monthNum = i + 1;
                                  const paymentForMonth = coursePayments.find((p: any) => p.installmentNumber === monthNum);
                                  
                                  // Skip if already verified or pending
                                  if (paymentForMonth && (paymentForMonth.status === "verified" || paymentForMonth.status === "pending")) {
                                    return null;
                                  }

                                  const currentMonthAmount = monthNum === durationMonths ? (totalCourseFee - (installmentAmount * (durationMonths - 1))) : installmentAmount;

                                  // Check if it's the next active due installment
                                  const isDue = Array.from({ length: i }).every((_, prevIdx) => {
                                    return coursePayments.some((p: any) => p.installmentNumber === (prevIdx + 1) && p.status === "verified");
                                  });

                                  return (
                                    <div key={i} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                                      <div>
                                        <div className="font-bold text-slate-800">Month {monthNum} Installment</div>
                                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                          {isDue ? "Due & Payable" : "Upcoming schedule"}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-black text-slate-900">Rs. {currentMonthAmount.toLocaleString()}</div>
                                        <Badge className={`mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                          isDue ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                        }`}>
                                          {isDue ? 'Due Now' : 'Upcoming'}
                                        </Badge>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                // If full plan
                                remainingFee > 0 ? (
                                  <div className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                                    <div>
                                      <div className="font-bold text-slate-800">Remaining Course Fee</div>
                                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                        Complete fee balance
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-black text-slate-900">Rs. {remainingFee.toLocaleString()}</div>
                                      <Badge className="mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse">
                                        Due Now
                                      </Badge>
                                    </div>
                                  </div>
                                ) : null
                              )}

                              {/* If no upcoming dues */}
                              {((isMonthly && durationMonths === verifiedPayments.length) || (!isMonthly && remainingFee === 0)) && (
                                <div className="p-8 text-center text-xs text-emerald-600 font-bold flex flex-col items-center gap-1.5">
                                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                  No upcoming fees. All dues cleared!
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* PAY MONTHLY INSTALLMENT DIALOG */}
        <Dialog open={isPayOpen} onOpenChange={open => { if (!open) setIsPayOpen(false); }}>
          <DialogContent className="max-w-2xl bg-white border border-slate-200 rounded-[24px] shadow-2xl p-0 gap-0 overflow-hidden">
            <DialogHeader className="bg-slate-900 text-white p-6">
              <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-indigo-400" />
                Submit Installment Payment
              </DialogTitle>
              <DialogDescription className="text-slate-400 mt-1 text-xs">
                Upload transaction details for <strong className="text-indigo-300">Month #{selectedMonthIndex !== null ? selectedMonthIndex + 1 : ""}</strong> of {selectedCourse?.title}.
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {/* Select Payment Method */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Channel</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {METHODS.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id)}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all ${method === m.id ? `${m.bg} border-current ${m.color}` : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                        >
                          <Smartphone className="h-4 w-4 mx-auto mb-1" />
                          <span className="text-[10px] font-black block">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transfer details */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      Please transfer <strong className="text-slate-900">Rs. {amountDue.toLocaleString()}</strong> to:
                    </p>
                    <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-3 py-2">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{selectedMethod.label} Account</p>
                        <p className="font-black text-slate-900 text-sm font-mono">{getSetting(selectedMethod.settingKey)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleCopy(getSetting(selectedMethod.settingKey))}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Transaction ID */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600">Transaction ID / Reference Number *</Label>
                    <Input
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      className="h-10 rounded-xl border-slate-200 font-semibold text-sm"
                      placeholder="Enter EasyPaisa / Bank TxID"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Upload Receipt screenshot */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-650">Upload Receipt Screenshot *</Label>
                    <label className={`block w-full border-2 border-dashed rounded-2xl cursor-pointer transition-all relative overflow-hidden ${
                      uploadingReceipt ? "border-indigo-300 bg-indigo-50/5 cursor-wait" :
                      receiptPreview ? "border-emerald-300 bg-emerald-50/20" : 
                      "border-slate-350 hover:border-indigo-300 hover:bg-indigo-50/10"
                    }`}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        disabled={uploadingReceipt}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(f); }} 
                      />
                      {uploadingReceipt ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-7 w-7 animate-spin text-indigo-650" />
                          <div className="text-center">
                            <p className="font-black text-indigo-900 text-xs">Uploading Receipt...</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Please wait, saving to server</p>
                          </div>
                        </div>
                      ) : receiptPreview ? (
                        <div className="p-3 flex items-center gap-3">
                          <img src={receiptPreview} alt="Receipt" className="h-16 w-16 object-cover rounded-xl border border-slate-200" />
                          <div className="min-w-0">
                            <p className="font-black text-emerald-700 text-xs flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Image Uploaded
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5 max-w-[150px]">{receiptFile?.name}</p>
                            <p className="text-[10px] text-indigo-600 font-bold mt-1">Tap to replace</p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 flex flex-col items-center gap-2">
                          <Upload className="h-6 w-6 text-slate-400" />
                          <div className="text-center">
                            <p className="font-bold text-slate-705 text-xs">Tap to upload receipt</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">JPG or PNG (max 5MB)</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* URL Paste Fallback */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500">Or Paste Image URL</Label>
                    <Input
                      value={receiptUrl}
                      onChange={e => setReceiptUrl(e.target.value)}
                      className="h-10 rounded-xl border-slate-200 text-xs font-medium"
                      placeholder="https://imgur.com/your-receipt.jpg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-[24px]">
              <Button
                variant="outline"
                onClick={() => setIsPayOpen(false)}
                className="rounded-xl font-bold text-xs h-10 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                disabled={submitting || uploadingReceipt || !receiptUrl || !transactionId.trim()}
                onClick={handleSubmitPayment}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs h-10 px-5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Installment Receipt
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fee Receipt Modal */}
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
