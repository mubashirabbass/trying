import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FeeReceipt } from "@/components/FeeReceipt";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  
  // Manual payment recording
  const [isManualPaymentOpen, setIsManualPaymentOpen] = useState(false);
  const [manualPaymentStudent, setManualPaymentStudent] = useState<any>(null);
  const [manualAmount, setManualAmount] = useState<string>("");
  const [manualMethod, setManualMethod] = useState<string>("cash");
  const [manualNotes, setManualNotes] = useState<string>("");

  // Receipt display
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const isLoading = paymentsLoading || coursesLoading || enrollmentsLoading;

  const handleVerify = async (id: number, status: "verified" | "rejected") => {
    setIsSubmitting(true);
    try {
      await verifyPayment.mutateAsync({ id, data: { status, notes } });
      
      if (status === "verified" && reviewPayment) {
        // Show receipt after verification
        setReceiptData({
          ...reviewPayment,
          verifiedAt: new Date().toISOString(),
        });
        setShowReceipt(true);
      }
      
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

      // Show receipt after manual payment
      setReceiptData({
        id: payment.id,
        userName: manualPaymentStudent.userName,
        courseName: manualPaymentStudent.courseName,
        amount: parseFloat(manualAmount),
        method: manualMethod,
        installmentNumber: monthNum,
        createdAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        notes: manualNotes,
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
      
      // Show receipt
      setShowReceipt(true);
    } catch (err: any) {
      toast({ title: err?.message || "Failed to record payment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkVerify = async () => {
    if (selectedStudents.length === 0) {
      toast({ title: "Please select students to verify", variant: "destructive" });
      return;
    }

    const pendingPayments = filteredStudents.filter(s => 
      selectedStudents.includes(s.userId) && s.monthPending
    );

    if (pendingPayments.length === 0) {
      toast({ title: "No pending payments selected", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const verifyPromises = pendingPayments.map(student =>
        verifyPayment.mutateAsync({
          id: student.monthPayment.id,
          data: {
            status: "verified",
            notes: `Bulk verified by admin on ${new Date().toLocaleDateString()}`
          }
        })
      );

      await Promise.all(verifyPromises);

      toast({
        title: "✅ Bulk Verification Complete!",
        description: `${pendingPayments.length} payment(s) verified successfully`,
      });

      queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
      setSelectedStudents([]);
    } catch (err: any) {
      toast({ title: "Bulk verification failed", variant: "destructive" });
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
    let filtered = studentPaymentList;
    
    // Search filter
    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.userName.toLowerCase().includes(searchTerm)
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "paid") {
        filtered = filtered.filter(s => s.monthPaid);
      } else if (statusFilter === "pending") {
        filtered = filtered.filter(s => s.monthPending);
      } else if (statusFilter === "unpaid") {
        filtered = filtered.filter(s => !s.monthPaid && !s.monthPending);
      }
    }
    
    return filtered;
  }, [studentPaymentList, search, statusFilter]);

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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Course-Wise Fee Collection</h1>
          <p className="text-gray-500 mt-1">Select course and month to view and collect student payments</p>
        </div>

        {/* Filters Card - Fee Tracker Style */}
        <Card className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-700">
              <Filter className="h-5 w-5" />
              <h2 className="font-bold text-sm uppercase tracking-wider">Select Course & Month</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">Choose a course and month to view student payment status</p>
          </div>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Course Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Course *</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Select value={selectedCourse} onValueChange={(val) => { setSelectedCourse(val); setSelectedMonth(""); setSelectedStudents([]); }}>
                    <SelectTrigger className="h-11 pl-10 rounded-xl border-gray-200 hover:border-indigo-300 transition-colors">
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
              </div>

              {/* Month Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Month *</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Select value={selectedMonth} onValueChange={(val) => { setSelectedMonth(val); setSelectedStudents([]); }} disabled={!selectedCourse}>
                    <SelectTrigger className="h-11 pl-10 rounded-xl border-gray-200 hover:border-indigo-300 transition-colors disabled:opacity-50">
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
              </div>

              {/* Search Student */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Search Student</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name..."
                    className="h-11 pl-10 rounded-xl border-gray-200 hover:border-indigo-300 transition-colors"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    disabled={!selectedCourse || !selectedMonth}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards - Fee Tracker Style */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { 
                label: "Total Students", 
                value: stats.totalStudents, 
                icon: Users, 
                bg: "bg-blue-500", 
                lightBg: "bg-blue-50",
                iconColor: "text-blue-500"
              },
              { 
                label: "Paid", 
                value: stats.paidCount, 
                icon: CheckCircle2, 
                bg: "bg-emerald-500", 
                lightBg: "bg-emerald-50",
                iconColor: "text-emerald-500"
              },
              { 
                label: "Pending", 
                value: stats.pendingCount, 
                icon: Clock, 
                bg: "bg-amber-500", 
                lightBg: "bg-amber-50",
                iconColor: "text-amber-500"
              },
              { 
                label: "Unpaid", 
                value: stats.unpaidCount, 
                icon: XCircle, 
                bg: "bg-rose-500", 
                lightBg: "bg-rose-50",
                iconColor: "text-rose-500"
              },
              { 
                label: "Collected", 
                value: `Rs. ${stats.collectedAmount.toLocaleString()}`, 
                icon: TrendingUp, 
                bg: "bg-purple-500", 
                lightBg: "bg-purple-50",
                iconColor: "text-purple-500"
              },
            ].map((stat) => {
              const valStr = String(stat.value);
              let fontSizeClass = "text-base sm:text-lg xl:text-xl";
              if (valStr.length > 15) {
                fontSizeClass = "text-[10px] xs:text-xs sm:text-sm xl:text-base";
              } else if (valStr.length > 10) {
                fontSizeClass = "text-xs sm:text-sm xl:text-lg";
              }

              return (
                <Card key={stat.label} className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4">
                      <div className={`h-9 w-9 sm:h-12 sm:w-12 rounded-xl ${stat.lightBg} flex items-center justify-center shrink-0`}>
                        <stat.icon className={`h-4.5 w-4.5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">{stat.label}</p>
                        <p className={`${fontSizeClass} font-black ${stat.iconColor} mt-0.5 whitespace-nowrap`}>{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tabs & Filters Bar - Fee Tracker Style */}
        {stats && (
          <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl p-4 shadow-sm ring-1 ring-gray-100">
            {/* Status Tabs */}
            <div className="flex items-center gap-2 flex-1">
              {[
                { value: "all", label: "All Status", count: stats.totalStudents },
                { value: "paid", label: "Paid", count: stats.paidCount, color: "emerald" },
                { value: "pending", label: "Pending", count: stats.pendingCount, color: "amber" },
                { value: "unpaid", label: "Unpaid", count: stats.unpaidCount, color: "rose" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => { setStatusFilter(tab.value); setSelectedStudents([]); }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    statusFilter === tab.value
                      ? tab.color 
                        ? `bg-${tab.color}-100 text-${tab.color}-700 ring-2 ring-${tab.color}-200`
                        : "bg-gray-100 text-gray-700 ring-2 ring-gray-200"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs opacity-75">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Bulk Actions */}
            {selectedStudents.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 font-bold px-3 py-1">
                  {selectedStudents.length} selected
                </Badge>
                <Button
                  size="sm"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                  onClick={handleBulkVerify}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  )}
                  Verify Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg font-bold"
                  onClick={() => setSelectedStudents([])}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

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
                  <TableHead className="py-4 font-semibold w-12">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(filteredStudents.map(s => s.userId));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="py-4 font-semibold">Student</TableHead>
                  <TableHead className="py-4 font-semibold">Amount Due</TableHead>
                  <TableHead className="py-4 font-semibold">Month Status</TableHead>
                  <TableHead className="py-4 font-semibold">Total Paid</TableHead>
                  <TableHead className="py-4 font-semibold">Installments</TableHead>
                  <TableHead className="py-4 font-semibold">Last Payment</TableHead>
                  <TableHead className="py-4 font-semibold">Receipt</TableHead>
                  <TableHead className="py-4 font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <Users className="h-12 w-12" />
                        <p className="font-semibold text-lg">No students found</p>
                        <p className="text-sm text-gray-500">
                          {search || statusFilter !== "all" ? "Try adjusting your filters" : "No students enrolled in this course yet"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.userId} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selectedStudents.includes(student.userId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.userId]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.userId));
                            }
                          }}
                        />
                      </TableCell>
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
                      <TableCell>
                        {student.monthPayment?.receiptUrl ? (
                          <div
                            className="h-12 w-12 rounded-lg overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-indigo-400 transition-all"
                            onClick={() => {
                              setReviewPayment(student.monthPayment);
                              setIsReviewOpen(true);
                              setNotes(student.monthPayment?.notes || "");
                            }}
                          >
                            <img
                              src={student.monthPayment.receiptUrl}
                              alt="Receipt"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {student.monthPending ? (
                          <div className="flex items-center justify-end gap-2">
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
                              Review Receipt
                            </Button>
                          </div>
                        ) : student.monthPaid ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-emerald-300 text-emerald-700 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all"
                              onClick={() => {
                                setReceiptData({
                                  ...student.monthPayment,
                                  userName: student.userName,
                                  courseName: student.courseName,
                                });
                                setShowReceipt(true);
                              }}
                            >
                              <Receipt className="h-3 w-3 mr-1" />
                              View Receipt
                            </Button>
                          </div>
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
