import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useListPayments, useVerifyPayment, getListPaymentsQueryKey, useListCourses, useListEnrollments } from "@workspace/api-client-react";
import {
  Loader2, CheckCircle2, XCircle, Clock, ExternalLink, AlertTriangle,
  GraduationCap, Search, Receipt, Filter, CalendarDays, DollarSign, Users, TrendingUp, HandCoins
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";

// Utility: Calculate month name based on course creation date
const getMonthName = (courseCreatedAt: string | Date | null | undefined, installmentNumber: number): string => {
  if (!courseCreatedAt) return `Month #${installmentNumber}`;
  
  const startDate = new Date(courseCreatedAt);
  const targetDate = new Date(startDate);
  targetDate.setMonth(startDate.getMonth() + (installmentNumber - 1));
  
  const monthName = targetDate.toLocaleString("en-US", { month: "long" });
  const year = targetDate.getFullYear();
  
  return `${monthName} ${year}`;
};

export default function AdminPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { data: payments, isLoading: paymentsLoading, error } = useListPayments({}, { query: { queryKey: getListPaymentsQueryKey({}) } });
  const { data: courses, isLoading: coursesLoading } = useListCourses();
  const { data: enrollments, isLoading: enrollmentsLoading } = useListEnrollments({});
  const verifyPayment = useVerifyPayment();

  const [reviewPayment, setReviewPayment] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Course and Month selection
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [search, setSearch] = useState("");
  
  // Manual payment recording
  const [isManualPaymentOpen, setIsManualPaymentOpen] = useState(false);
  const [manualPaymentStudent, setManualPaymentStudent] = useState<any>(null);
  const [manualAmount, setManualAmount] = useState<string>("");
  const [manualMethod, setManualMethod] = useState<string>("cash");
  const [manualNotes, setManualNotes] = useState<string>("");

  const isLoading = paymentsLoading || coursesLoading || enrollmentsLoading;

  const handleVerify = async (id: number, status: "verified" | "rejected") => {
    setIsSubmitting(true);
    try {
      await verifyPayment.mutateAsync({ id, data: { status, notes } });
      toast({
        title: status === "verified" ? "✅ Payment Verified!" : "❌ Payment Rejected",
        description: status === "verified"
          ? "The student's payment has been verified and recorded."
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

  const handleManualPayment = async () => {
    if (!manualAmount || parseFloat(manualAmount) <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const BASE = window.location.origin;
      const courseId = Number(selectedCourse);
      const monthNum = Number(selectedMonth);
      
      const course = coursesArr.find((c: any) => c.id === courseId);
      const courseFee = course?.fee || 0;
      const installmentMonths = manualPaymentStudent.installmentMonths || 6;
      
      const res = await fetch(`${BASE}/api/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: manualPaymentStudent.userId,
          courseId: courseId,
          amount: parseFloat(manualAmount),
          totalFee: courseFee,
          remainingFee: Math.max(0, courseFee - parseFloat(manualAmount)),
          paymentPlan: "monthly",
          installmentMonths: installmentMonths,
          installmentNumber: monthNum,
          method: manualMethod,
          receiptUrl: null,
          notes: `Manual payment recorded by admin - ${manualMethod.toUpperCase()} payment for ${course ? getMonthName(course.createdAt, monthNum) : `Month #${monthNum}`}. ${manualNotes}`,
        }),
      });

      if (!res.ok) throw new Error("Failed to record payment");
      
      const payment = await res.json();
      
      await verifyPayment.mutateAsync({ 
        id: payment.id, 
        data: { 
          status: "verified", 
          notes: `Manually recorded by admin on ${new Date().toLocaleDateString()} - ${manualMethod.toUpperCase()}. ${manualNotes}` 
        } 
      });

      toast({
        title: "✅ Payment Recorded Successfully!",
        description: `Rs. ${parseFloat(manualAmount).toLocaleString()} recorded for ${manualPaymentStudent.userName}`,
      });

      queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
      setIsManualPaymentOpen(false);
      setManualPaymentStudent(null);
      setManualAmount("");
      setManualMethod("cash");
      setManualNotes("");
    } catch (err: any) {
      toast({ title: err?.message || "Failed to record payment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentsArr = Array.isArray(payments) ? payments : [];
  const coursesArr = Array.isArray(courses) ? courses : [];
  const enrollmentsArr = Array.isArray(enrollments) ? enrollments : [];

  const paidCourses = useMemo(() => {
    const courseIds = new Set<number>();
    enrollmentsArr.forEach((e: any) => courseIds.add(e.courseId));
    return coursesArr.filter((c: any) => courseIds.has(c.id) && !c.isFree);
  }, [coursesArr, enrollmentsArr]);

  const selectedCourseData = useMemo(() => {
    return coursesArr.find((c: any) => c.id === Number(selectedCourse));
  }, [coursesArr, selectedCourse]);

  const parseDurationMonths = (durationStr: string): number => {
    if (!durationStr) return 6; // Default fallback
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
    return 6; // Default
  };

  const availableMonths = useMemo(() => {
    const courseDurationMonths = selectedCourseData ? parseDurationMonths(selectedCourseData.duration) : 12;
    return Array.from({ length: courseDurationMonths }, (_, i) => {
      const monthNum = i + 1;
      return {
        value: monthNum,
        label: selectedCourseData ? getMonthName(selectedCourseData.createdAt, monthNum) : `Month #${monthNum}`,
      };
    });
  }, [selectedCourseData]);

  const studentPaymentList = useMemo(() => {
    if (!selectedCourse || !selectedMonth) return [];
    
    const courseId = Number(selectedCourse);
    const monthNum = Number(selectedMonth);
    
    const courseEnrollments = enrollmentsArr.filter((e: any) => e.courseId === courseId);
    
    return courseEnrollments.map((enrollment: any) => {
      const userId = enrollment.userId;
      
      const userPayments = paymentsArr.filter(
        (p: any) => p.userId === userId && p.courseId === courseId
      );
      
      const monthPayment = userPayments.find(
        (p: any) => p.installmentNumber === monthNum && p.paymentPlan === "monthly"
      );
      
      const verifiedPayments = userPayments.filter((p: any) => p.status === "verified");
      const totalPaid = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const paidInstallments = verifiedPayments.filter((p: any) => p.paymentPlan === "monthly").length;
      
      const course = coursesArr.find((c: any) => c.id === courseId);
      const courseFee = course?.fee || 0;
      const installmentMonths = userPayments[0]?.installmentMonths || 6;
      const installmentAmount = Math.ceil(courseFee / installmentMonths);
      
      return {
        userId,
        userName: userPayments[0]?.userName || `User #${userId}`,
        courseName: course?.title || `Course #${courseId}`,
        courseFee,
        totalPaid,
        paidInstallments,
        installmentAmount,
        installmentMonths,
        monthPayment,
        monthPaid: monthPayment?.status === "verified",
        monthPending: monthPayment?.status === "pending",
        lastPaymentDate: verifiedPayments.length > 0 
          ? verifiedPayments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
          : null,
      };
    });
  }, [selectedCourse, selectedMonth, paymentsArr, enrollmentsArr, coursesArr]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return studentPaymentList;
    const searchTerm = search.toLowerCase();
    return studentPaymentList.filter(s => 
      s.userName.toLowerCase().includes(searchTerm)
    );
  }, [studentPaymentList, search]);

  const stats = useMemo(() => {
    if (!selectedCourse || !selectedMonth) return null;
    const totalStudents = studentPaymentList.length;
    const paidCount = studentPaymentList.filter(s => s.monthPaid).length;
    const pendingCount = studentPaymentList.filter(s => s.monthPending).length;
    const unpaidCount = totalStudents - paidCount - pendingCount;
    const collectedAmount = studentPaymentList
      .filter(s => s.monthPaid)
      .reduce((sum, s) => sum + (s.monthPayment?.amount || 0), 0);
    return { totalStudents, paidCount, pendingCount, unpaidCount, collectedAmount };
  }, [selectedCourse, selectedMonth, studentPaymentList]);

  const getMonthStatusBadge = (student: any) => {
    if (student.monthPaid) {
      return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
    } else if (student.monthPending) {
      return <Badge className="bg-amber-50 text-amber-700 border border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
    } else {
      return <Badge className="bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="h-3 w-3 mr-1" />Unpaid</Badge>;
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <AlertTriangle className="h-12 w-12 text-rose-500" />
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">Failed to Load Payments</h3>
            <p className="text-sm text-gray-500 mt-1">There was an error loading the payment data. Please try refreshing.</p>
          </div>
          <Button onClick={() => window.location.reload()} className="rounded-xl">
            Refresh Page
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Course-Wise Fee Collection</h1>
          <p className="text-gray-500 mt-1">Select course and month to collect fees systematically</p>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Select Course & Month
          </CardTitle>
          <CardDescription>Choose a course and month to view student payment status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600">Course *</Label>
              <Select value={selectedCourse} onValueChange={(val) => { setSelectedCourse(val); setSelectedMonth(""); }}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {paidCourses.length === 0 ? (
                    <SelectItem value="none" disabled>No courses available</SelectItem>
                  ) : (
                    paidCourses.map((course: any) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600">Month *</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={!selectedCourse}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={selectedCourse ? "Select month" : "Select course first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600">Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name..."
                  className="pl-9 h-11 rounded-xl border-slate-200"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  disabled={!selectedCourse || !selectedMonth}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Students", value: stats.totalStudents, icon: Users, bg: "bg-blue-50", icon_c: "text-blue-500", val_c: "text-blue-700" },
            { label: "Paid", value: stats.paidCount, icon: CheckCircle2, bg: "bg-emerald-50", icon_c: "text-emerald-500", val_c: "text-emerald-700" },
            { label: "Pending", value: stats.pendingCount, icon: Clock, bg: "bg-amber-50", icon_c: "text-amber-500", val_c: "text-amber-700" },
            { label: "Unpaid", value: stats.unpaidCount, icon: XCircle, bg: "bg-rose-50", icon_c: "text-rose-500", val_c: "text-rose-700" },
            { label: "Collected", value: `Rs. ${stats.collectedAmount.toLocaleString()}`, icon: TrendingUp, bg: "bg-purple-50", icon_c: "text-purple-500", val_c: "text-purple-700" },
          ].map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm ring-1 ring-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                    <stat.icon className={`h-5 w-5 ${stat.icon_c}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    <p className={`text-xl font-extrabold ${stat.val_c}`}>{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-none shadow-xl ring-1 ring-gray-100 overflow-hidden">
        <CardContent className="p-0">
          {!selectedCourse || !selectedMonth ? (
            <div className="py-24 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center">
                  <Filter className="h-10 w-10 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Select Course & Month</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-md">
                    Choose a course and month from the filters above to view student payment status and collect fees.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="py-4 font-semibold">Student</TableHead>
                  <TableHead className="py-4 font-semibold">Amount Due</TableHead>
                  <TableHead className="py-4 font-semibold">Month Status</TableHead>
                  <TableHead className="py-4 font-semibold">Total Paid</TableHead>
                  <TableHead className="py-4 font-semibold">Installments</TableHead>
                  <TableHead className="py-4 font-semibold">Last Payment</TableHead>
                  <TableHead className="py-4 font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <Users className="h-12 w-12" />
                        <p className="font-semibold text-lg">No students found</p>
                        <p className="text-sm text-gray-500">No students enrolled in this course yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.userId} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {student.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900">{student.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-gray-900">
                        Rs. {student.installmentAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>{getMonthStatusBadge(student)}</TableCell>
                      <TableCell className="font-bold text-emerald-700">
                        Rs. {student.totalPaid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {student.paidInstallments} paid
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {student.lastPaymentDate 
                          ? new Date(student.lastPaymentDate).toLocaleDateString("en-PK", { day: "2-digit", month: "short" })
                          : "No payments"}
                      </TableCell>
                      <TableCell className="text-right">
                        {student.monthPending ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-amber-300 text-amber-700 text-xs font-bold hover:bg-amber-600 hover:text-white transition-all"
                            onClick={() => { 
                              setReviewPayment(student.monthPayment); 
                              setIsReviewOpen(true); 
                              setNotes(student.monthPayment?.notes || ""); 
                            }}
                          >
                            <Receipt className="h-3 w-3 mr-1" />
                            Review Receipt →
                          </Button>
                        ) : student.monthPaid ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-slate-200 text-xs font-bold"
                            onClick={() => { 
                              setReviewPayment(student.monthPayment); 
                              setIsReviewOpen(true); 
                              setNotes(student.monthPayment?.notes || ""); 
                            }}
                          >
                            <Receipt className="h-3 w-3 mr-1" />
                            View Receipt
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                            onClick={() => {
                              setManualPaymentStudent(student);
                              setManualAmount(String(student.installmentAmount));
                              setIsManualPaymentOpen(true);
                            }}
                          >
                            <HandCoins className="h-3 w-3 mr-1" />
                            Record Payment
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isManualPaymentOpen} onOpenChange={setIsManualPaymentOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-indigo-500" />
              Record Manual Payment
            </DialogTitle>
            <DialogDescription>
              Record cash or offline payment received from student
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-500">Student</Label>
                <Input value={manualPaymentStudent?.userName || ""} disabled className="mt-1.5 bg-slate-50" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-500">Course</Label>
                <Input value={manualPaymentStudent?.courseName || ""} disabled className="mt-1.5 bg-slate-50" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-500">Month</Label>
              <Input 
                value={selectedCourseData ? getMonthName(selectedCourseData.createdAt, Number(selectedMonth)) : `Month #${selectedMonth}`} 
                disabled 
                className="mt-1.5 bg-slate-50" 
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-600">Amount Received (Rs.) *</Label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="8000"
                  className="pl-9 h-11 rounded-xl border-slate-200 font-bold text-lg"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Expected: Rs. {manualPaymentStudent?.installmentAmount.toLocaleString()}</p>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-600">Payment Method *</Label>
              <Select value={manualMethod} onValueChange={setManualMethod}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_deposit">Bank Deposit</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-600">Notes (Optional)</Label>
              <Textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="e.g. Received cash payment in office"
                className="mt-1.5 rounded-xl border-slate-200 resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 font-medium leading-relaxed">
                This payment will be automatically verified and the student's {selectedCourseData ? getMonthName(selectedCourseData.createdAt, Number(selectedMonth)) : `Month #${selectedMonth}`} will be marked as PAID.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setIsManualPaymentOpen(false);
                  setManualPaymentStudent(null);
                  setManualAmount("");
                  setManualMethod("cash");
                  setManualNotes("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                onClick={handleManualPayment}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Recording...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> Record & Mark Paid</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewOpen} onOpenChange={(v) => { if (!v) { setIsReviewOpen(false); setReviewPayment(null); } }}>
        <DialogContent className="max-w-3xl rounded-3xl overflow-hidden p-0 gap-0">
          <div className="bg-slate-900 text-white p-6">
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-400" />
              Payment Receipt Review
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-1 text-sm">
              Review payment details and receipt screenshot
            </DialogDescription>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
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
                    <Receipt className="h-10 w-10 opacity-20" />
                    No receipt image
                  </div>
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mt-3">Payment Receipt</p>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="space-y-3">
                {reviewPayment && [
                  { label: "Student", value: reviewPayment.userName || `User #${reviewPayment.userId}` },
                  { label: "Course", value: reviewPayment.courseName || `Course #${reviewPayment.courseId}` },
                  { label: "Month", value: `Month #${reviewPayment.installmentNumber || 1}` },
                  { label: "Amount", value: `Rs. ${(reviewPayment.amount || 0).toLocaleString()}` },
                  { label: "Method", value: (reviewPayment.method || "").toUpperCase() },
                  { label: "Date", value: reviewPayment.createdAt ? new Date(reviewPayment.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" }) : "—" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{row.label}</span>
                    <span className="text-sm font-bold text-slate-800">{row.value || "—"}</span>
                  </div>
                ))}
              </div>

              {reviewPayment?.notes && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <Label className="text-xs font-bold text-slate-500">Student Notes</Label>
                  <p className="text-sm text-slate-700 mt-1">{reviewPayment.notes}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Admin Notes (Optional)</Label>
                <Textarea
                  placeholder="Add verification notes..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="rounded-xl border-slate-200 text-sm resize-none"
                  rows={3}
                  disabled={reviewPayment?.status !== "pending"}
                />
              </div>

              {reviewPayment?.status === "pending" ? (
                <div className="flex gap-3 mt-auto">
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-xl font-bold"
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
                    Verify & Approve
                  </Button>
                </div>
              ) : (
                <div className={`flex items-center gap-2 rounded-xl p-3 font-bold text-sm ${reviewPayment?.status === "verified" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {reviewPayment?.status === "verified"
                    ? <><CheckCircle2 className="h-5 w-5" /> Payment verified and recorded</>
                    : <><XCircle className="h-5 w-5" /> Payment was rejected</>
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
