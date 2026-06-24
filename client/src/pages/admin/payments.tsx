import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useListPayments, useVerifyPayment, getListPaymentsQueryKey } from "@workspace/api-client-react";
import {
  Loader2, CheckCircle2, XCircle, Clock, ExternalLink,
  CreditCard, TrendingUp, Search, Receipt, AlertTriangle,
  GraduationCap, BadgeCheck, Ban
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type StatusFilter = "pending" | "verified" | "rejected" | "all";

export default function AdminPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: payments, isLoading } = useListPayments({}, { query: { queryKey: getListPaymentsQueryKey({}) } });
  const verifyPayment = useVerifyPayment();

  const [reviewPayment, setReviewPayment] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async (id: number, status: "verified" | "rejected") => {
    setIsSubmitting(true);
    try {
      await verifyPayment.mutateAsync({ id, data: { status, notes } });
      toast({
        title: status === "verified" ? "✅ Payment Verified & Enrollment Activated!" : "❌ Payment Rejected",
        description: status === "verified"
          ? "The student's enrollment has been activated. They can now access the course."
          : "The payment has been rejected. Student can resubmit.",
      });
      queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
      setIsReviewOpen(false);
      setReviewPayment(null);
      setNotes("");
    } catch {
      toast({ title: "Action failed. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentsArr = Array.isArray(payments) ? payments : [];

  const pendingCount   = paymentsArr.filter(p => p.status === "pending").length;
  const verifiedCount  = paymentsArr.filter(p => p.status === "verified").length;
  const rejectedCount  = paymentsArr.filter(p => p.status === "rejected").length;
  const totalRevenue   = paymentsArr.filter(p => p.status === "verified").reduce((s, p) => s + (p.amount || 0), 0);

  const filtered = paymentsArr.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (p.userName || "").toLowerCase().includes(s) || (p.courseName || "").toLowerCase().includes(s);
    }
    return true;
  });

  const TABS: { id: StatusFilter; label: string; count: number; color: string; activeClass: string }[] = [
    { id: "pending",  label: "Pending Review", count: pendingCount,  color: "text-amber-600",  activeClass: "bg-amber-600 text-white border-amber-600 shadow-amber-900/10" },
    { id: "verified", label: "Verified",        count: verifiedCount, color: "text-emerald-600", activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-emerald-900/10" },
    { id: "rejected", label: "Rejected",        count: rejectedCount, color: "text-rose-600",    activeClass: "bg-rose-600 text-white border-rose-600 shadow-rose-900/10" },
    { id: "all",      label: "All",             count: paymentsArr.length, color: "text-slate-600", activeClass: "bg-slate-900 text-white border-slate-900 shadow-slate-900/10" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
      case "rejected": return <Badge className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-50"><Ban className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:         return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50"><Clock className="h-3 w-3 mr-1 animate-pulse" />Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Fee Verification</h1>
          <p className="text-gray-500 mt-1">Review payment receipts and activate student enrollments.</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold px-4 py-2 rounded-2xl">
            <AlertTriangle className="h-4 w-4" />
            {pendingCount} payment{pendingCount > 1 ? "s" : ""} awaiting review
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending Review",  value: pendingCount,   icon: Clock,        bg: "bg-amber-50",   icon_c: "text-amber-500",   val_c: "text-amber-700" },
          { label: "Verified",        value: verifiedCount,  icon: BadgeCheck,   bg: "bg-emerald-50", icon_c: "text-emerald-500", val_c: "text-emerald-700" },
          { label: "Rejected",        value: rejectedCount,  icon: XCircle,      bg: "bg-rose-50",    icon_c: "text-rose-500",    val_c: "text-rose-700" },
          { label: "Total Revenue",   value: `Rs. ${totalRevenue.toLocaleString()}`, icon: TrendingUp, bg: "bg-blue-50", icon_c: "text-blue-500", val_c: "text-blue-700" },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm ring-1 ring-gray-100">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`h-5 w-5 ${stat.icon_c}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className={`text-xl font-extrabold ${stat.val_c}`}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(tab => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 flex items-center gap-2 shadow-sm
                  ${isActive ? tab.activeClass : `bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900`}`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${isActive ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search student or course..."
            className="pl-9 h-9 rounded-xl border-slate-200 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="border-none shadow-xl ring-1 ring-gray-100 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="py-4 font-semibold">Student</TableHead>
                <TableHead className="py-4 font-semibold">Course</TableHead>
                <TableHead className="py-4 font-semibold">Amount</TableHead>
                <TableHead className="py-4 font-semibold">Method</TableHead>
                <TableHead className="py-4 font-semibold">Submitted</TableHead>
                <TableHead className="py-4 font-semibold">Status</TableHead>
                <TableHead className="py-4 font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <CreditCard className="h-12 w-12" />
                      <p className="font-semibold text-lg">No payments found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((payment: any) => (
                  <TableRow key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {(payment.userName || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{payment.userName || `User #${payment.userId}`}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                        <GraduationCap className="h-4 w-4 text-blue-400 shrink-0" />
                        {payment.courseName || `Course #${payment.courseId}`}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-gray-900">Rs. {(payment.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="uppercase text-[11px] font-black tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        {payment.method}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">{new Date(payment.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-slate-200 text-xs font-bold hover:bg-slate-900 hover:text-white transition-all"
                        onClick={() => { setReviewPayment(payment); setIsReviewOpen(true); setNotes(payment.notes || ""); }}
                      >
                        {payment.status === "pending" ? "Review →" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={v => { if (!v) { setIsReviewOpen(false); setReviewPayment(null); } }}>
        <DialogContent className="max-w-3xl rounded-3xl overflow-hidden p-0 gap-0">
          {/* Dialog Header */}
          <div className="bg-slate-900 text-white p-6">
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-400" />
              Payment Receipt Review
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-1 text-sm">
              Verify the payment details. Approving will <strong className="text-amber-400">instantly activate the student's enrollment</strong>.
            </DialogDescription>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Receipt Preview */}
            <div className="p-6 border-r border-slate-100">
              <div className="aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-800 relative group shadow-2xl">
                {reviewPayment?.receiptUrl ? (
                  <>
                    <div className="w-full h-full overflow-hidden cursor-zoom-in">
                      <img
                        src={reviewPayment.receiptUrl}
                        alt="Payment Receipt"
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-150 origin-center"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-white text-xs font-black uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">Hover to Zoom</span>
                    </div>
                    <a
                      href={reviewPayment.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-3 right-3 h-9 w-9 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/20"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                    <XCircle className="h-10 w-10 opacity-20" />
                    No receipt image provided
                  </div>
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mt-3">Payment Receipt</p>
            </div>

            {/* Details & Actions */}
            <div className="p-6 flex flex-col gap-5">
              {/* Info rows */}
              <div className="space-y-3">
                {[
                  { label: "Student",  value: reviewPayment?.userName },
                  { label: "Course",   value: reviewPayment?.courseName },
                  { label: "Plan",     value: reviewPayment?.paymentPlan === "monthly" ? `Monthly (${reviewPayment?.installmentMonths} Months)` : "Pay in Full" },
                  { label: "Installment", value: reviewPayment?.paymentPlan === "monthly" ? `Month #${reviewPayment?.installmentNumber}` : "N/A" },
                  { label: "Amount Paid Now", value: `Rs. ${(reviewPayment?.amount || 0).toLocaleString()}` },
                  { label: "Total Course Fee", value: reviewPayment?.totalFee ? `Rs. ${(reviewPayment?.totalFee).toLocaleString()}` : "N/A" },
                  { label: "Remaining Fee", value: reviewPayment?.remainingFee !== null ? `Rs. ${(reviewPayment?.remainingFee).toLocaleString()}` : "N/A" },
                  { label: "Method",   value: (reviewPayment?.method || "").toUpperCase() },
                  { label: "Date",     value: reviewPayment?.createdAt ? new Date(reviewPayment.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" }) : "—" },
                  { label: "Status",   value: reviewPayment ? getStatusBadge(reviewPayment.status) : null },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{row.label}</span>
                    {typeof row.value === "string"
                      ? <span className="text-sm font-bold text-slate-800">{row.value || "—"}</span>
                      : row.value}
                  </div>
                ))}
              </div>

              {/* Enrollment activation notice */}
              {reviewPayment?.status === "pending" && (
                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                  <GraduationCap className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    Verifying this payment will <strong>activate the student's enrollment</strong> and grant them full course access.
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Admin Notes (Optional)</Label>
                <Textarea
                  placeholder="e.g. Receipt verified via EasyPaisa transaction ID..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="rounded-xl border-slate-200 text-sm resize-none"
                  rows={3}
                  disabled={reviewPayment?.status !== "pending"}
                />
              </div>

              {/* Action buttons */}
              {reviewPayment?.status === "pending" ? (
                <div className="flex gap-3 mt-auto">
                  <Button
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
                    disabled={isSubmitting}
                    onClick={() => handleVerify(reviewPayment.id, "rejected")}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Reject
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                    disabled={isSubmitting}
                    onClick={() => handleVerify(reviewPayment.id, "verified")}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Verify & Enroll
                  </Button>
                </div>
              ) : (
                <div className={`flex items-center gap-2 rounded-xl p-3 font-bold text-sm ${reviewPayment?.status === "verified" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {reviewPayment?.status === "verified"
                    ? <><BadgeCheck className="h-5 w-5" /> Payment verified. Student is enrolled.</>
                    : <><Ban className="h-5 w-5" /> This payment was rejected.</>
                  }
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
