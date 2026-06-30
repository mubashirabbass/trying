import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FeeReceipt } from "@/components/FeeReceipt";
import { useListPayments, useVerifyPayment, getListPaymentsQueryKey, useListCourses, useListEnrollments, getListCoursesQueryKey, getListEnrollmentsQueryKey, getListUsersQueryKey } from "@workspace/api-client-react";
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
  const { data: payments, isLoading: paymentsLoading, error } = useListPayments(
    {},
    {
      query: {
        queryKey: getListPaymentsQueryKey({}),
        staleTime: 30 * 1000, // Reduced from 5 minutes to 30 seconds
        refetchOnWindowFocus: true, // Enable refetch on focus for fresh data
      },
    }
  );
  const { data: courses, isLoading: coursesLoading } = useListCourses(
    {} as any,
    {
      query: {
        staleTime: 2 * 60 * 1000, // Keep courses cached longer (2 min) as they change less
        refetchOnWindowFocus: false,
      },
    } as any
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useListEnrollments(
    {},
    {
      query: {
        staleTime: 30 * 1000, // Reduced from 5 minutes to 30 seconds
        refetchOnWindowFocus: true, // Enable refetch on focus
      },
    } as any
  );
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
    // Enhanced validation
    if (!manualPaymentStudent?.installmentAmount || manualPaymentStudent.installmentAmount <= 0) {
      toast({ title: "Invalid installment amount", variant: "destructive" });
      return;
    }

    if (!manualPaymentStudent?.userId) {
      toast({ title: "Invalid student - missing user ID", variant: "destructive" });
      return;
    }

    if (!selectedCourse || !selectedMonth) {
      toast({ title: "Please select course and month", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const BASE = window.location.origin;
      const courseId = Number(selectedCourse);
      const monthNum = Number(selectedMonth);
      const fullInstallmentAmount = manualPaymentStudent.installmentAmount;
      const userId = Number(manualPaymentStudent.userId);

      // Validate numbers
      if (isNaN(courseId) || isNaN(monthNum) || isNaN(userId) || isNaN(fullInstallmentAmount)) {
        throw new Error("Invalid numeric data - please refresh and try again");
      }

      const course = coursesArr.find((c: any) => c.id === courseId);
      const courseFee = course?.fee || 0;
      // Always derive from course duration posted by admin, not from stored payment field
      const installmentMonths = parseDurationMonths(course?.duration || "");

      const requestData = {
        userId,
        courseId,
        amount: fullInstallmentAmount,
        totalFee: courseFee,
        paymentPlan: "monthly",
        installmentMonths,
        installmentNumber: monthNum,
        method: manualMethod || "cash",
        notes: `Manual FULL payment collected by admin - ${course ? getMonthName(course.createdAt, monthNum) : `Month #${monthNum}`} (Rs. ${fullInstallmentAmount.toLocaleString()}). ${manualNotes}`.trim(),
      };

    // Generate a proper receipt number immediately (don't wait for API)
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
    const tempPaymentId = Date.now();
    
    queryClient.setQueryData(getListPaymentsQueryKey({}), (oldData: any) => {
      if (!Array.isArray(oldData)) return oldData;
      return [...oldData, {
        id: receiptNumber, // Use receipt number as stable ID
        userId,
        courseId,
        amount: fullInstallmentAmount,
        installmentNumber: monthNum,
        method: manualMethod,
        status: "verified", // This makes monthPaid = true immediately
        userName: manualPaymentStudent.userName,
        courseName: manualPaymentStudent.courseName,
        createdAt: new Date().toISOString(),
        paymentPlan: "monthly",
        installmentMonths,
      }];
    });

    // INSTANT enrollment update
    queryClient.setQueryData(getListEnrollmentsQueryKey({}), (oldData: any) => {
      if (!Array.isArray(oldData)) return oldData;
      const existing = oldData.find((e: any) => e.userId === userId && e.courseId === courseId);
      if (existing) {
        return oldData.map((e: any) => 
          e.userId === userId && e.courseId === courseId ? { ...e, status: "active" } : e
        );
      }
      return [...oldData, { 
        id: Date.now() + 1, 
        userId, 
        courseId, 
        status: "active", 
        createdAt: new Date().toISOString() 
      }];
    });

    // INSTANT user activation (for enrolled count)
    queryClient.setQueryData(getListUsersQueryKey({ role: "student" }), (oldData: any) => {
      if (!Array.isArray(oldData)) return oldData;
      return oldData.map((user: any) => 
        user.id === userId ? { ...user, isActive: true } : user
      );
    });

    // INSTANT receipt data preparation with user details
    const receipt = {
      id: receiptNumber, // Use stable receipt number
      userName: manualPaymentStudent.userName,
      userFatherName: manualPaymentStudent.userFatherName,
      userId: manualPaymentStudent.userId,
      rollNumber: "Processing...", // Better loading message
      courseName: manualPaymentStudent.courseName,
      amount: fullInstallmentAmount,
      totalFee: courseFee,
      method: manualMethod,
      installmentNumber: monthNum,
      installmentMonths,
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(), // Mark as verified immediately
      notes: manualNotes,
    };

    // INSTANT UI updates - all at once
    setIsManualPaymentOpen(false);
    setManualPaymentStudent(null);
    setManualAmount("");
    setManualMethod("cash");
    setManualNotes("");
    setReceiptData(receipt);
    setShowReceipt(true);

    toast({
      title: "✅ Payment Collected!",
      description: `Rs. ${fullInstallmentAmount.toLocaleString()} collected from ${manualPaymentStudent.userName}`,
    });

    // API call in background - update real ID when done
    fetch(`${BASE}/api/payments/admin-collect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    }).then(async (res) => {
      if (res.ok) {
        const payment = await res.json();
        
        // DON'T replace the optimistic payment - keep stable receipt number
        // Just update roll number when available
        try {
          const userRes = await fetch(`${BASE}/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            // Update receipt with roll number only
            setReceiptData(prev => prev ? { 
              ...prev, 
              rollNumber: userData.rollNo || "GC-" + String(Math.floor(Math.random() * 99) + 1).padStart(2, '0')
            } : prev);
          }
        } catch (userErr) {
          // Generate a placeholder roll number if fetch fails
          setReceiptData(prev => prev ? { 
            ...prev, 
            rollNumber: "GC-" + String(Math.floor(Math.random() * 99) + 1).padStart(2, '0')
          } : prev);
        }
        
        // Background refresh to ensure admin users page gets updated enrollment status
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) });
        queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
        
        // Force refetch of student data with fresh cache
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: getListUsersQueryKey({ role: "student" }) });
          queryClient.refetchQueries({ queryKey: getListEnrollmentsQueryKey({}) });
        }, 500);
      } else {
        // Remove optimistic updates on error
        queryClient.setQueryData(getListPaymentsQueryKey({}), (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.filter(p => p.id !== receiptNumber);
        });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
        setShowReceipt(false);
        const errBody = await res.json().catch(() => ({}));
        toast({ 
          title: errBody?.error || `Server error ${res.status}`, 
          variant: "destructive" 
        });
      }
    }).catch(() => {
      // Remove optimistic updates on network error
      queryClient.setQueryData(getListPaymentsQueryKey({}), (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.filter(p => p.id !== receiptNumber);
      });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
      setShowReceipt(false);
      toast({ 
        title: "Network error - payment collection failed", 
        variant: "destructive" 
      });
    });

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
      // Derive total installments from course duration set by admin (e.g. "6 Months" → 6, "1 Year" → 12)
      const installmentMonths = parseDurationMonths(course?.duration || "");
      const installmentAmount = installmentMonths > 0 ? Math.ceil(courseFee / installmentMonths) : courseFee;
      
      return {
        userId,
        userName: userPayments[0]?.userName || `User #${userId}`,
        userFatherName: userPayments[0]?.userFatherName || "",
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
        <div className="space-y-6 animate-pulse">
          {/* Header skeleton */}
          <div>
            <div className="h-9 w-72 bg-gray-200 rounded-lg mb-2" />
            <div className="h-4 w-96 bg-gray-100 rounded" />
          </div>

          {/* Filter card skeleton */}
          <div className="rounded-2xl ring-1 ring-gray-100 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
              <div className="h-4 w-48 bg-indigo-100 rounded" />
              <div className="h-3 w-64 bg-indigo-50 rounded mt-2" />
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                  <div className="h-11 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl ring-1 ring-gray-100 p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gray-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                  <div className="h-6 w-10 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="rounded-2xl ring-1 ring-gray-100 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
              <div className="h-8 w-32 bg-gray-200 rounded-lg" />
              <div className="h-8 w-24 bg-gray-100 rounded-lg" />
              <div className="ml-auto h-8 w-40 bg-gray-200 rounded-lg" />
            </div>
            <div className="divide-y divide-gray-50">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-5 w-5 bg-gray-200 rounded" />
                  <div className="h-9 w-9 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-36 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-gray-100 rounded-full" />
                  <div className="h-6 w-16 bg-gray-200 rounded" />
                  <div className="h-8 w-28 bg-gray-100 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
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
                                  id: student.monthPayment.id,
                                  userName: student.userName,
                                  userFatherName: student.userFatherName,
                                  courseName: student.courseName,
                                  amount: student.monthPayment.amount,
                                  totalFee: student.courseFee,
                                  remainingFee: null,
                                  method: student.monthPayment.method,
                                  installmentNumber: student.monthPayment.installmentNumber,
                                  installmentMonths: student.installmentMonths,
                                  createdAt: student.monthPayment.createdAt,
                                  verifiedAt: student.monthPayment.verifiedAt,
                                  notes: student.monthPayment.notes,
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
                              setManualAmount(String(student.installmentAmount)); // Set full amount (though not used in logic)
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
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
          {/* Professional Invoice Header */}
          <div className="bg-gradient-to-r from-[#6b1a2e] to-[#8b1538] text-white p-4">
            <div className="text-center">
              <div className="text-sm font-bold">Global College</div>
              <div className="text-xs opacity-90">Fee Collection Receipt</div>
              <div className="text-xs opacity-75 mt-1">#{new Date().getTime().toString().slice(-6)}</div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Compact Student Info */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Student:</span>
                  <div className="font-semibold text-gray-900">{manualPaymentStudent?.userName}</div>
                </div>
                <div>
                  <span className="text-gray-500">Course:</span>
                  <div className="font-semibold text-gray-900">{manualPaymentStudent?.courseName}</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-500 text-xs">Month:</span>
                <div className="font-semibold text-gray-900 text-xs">
                  {selectedCourseData ? getMonthName(selectedCourseData.createdAt, Number(selectedMonth)) : `Month #${selectedMonth}`}
                </div>
              </div>
            </div>

            {/* Amount Section - Invoice Style */}
            <div className="border border-green-200 rounded-lg p-3 bg-green-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Monthly Fee:</span>
                <span className="text-xl font-bold text-green-700">
                  Rs. {manualPaymentStudent?.installmentAmount.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-green-600 mt-1 text-center">
                ✓ Full Payment - No Partial Allowed
              </div>
            </div>

            {/* Compact Payment Method */}
            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1 block">Payment Method</Label>
              <Select value={manualMethod} onValueChange={setManualMethod}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="bank_deposit">🏦 Bank Deposit</SelectItem>
                  <SelectItem value="check">📄 Check</SelectItem>
                  <SelectItem value="other">📱 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Compact Notes */}
            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1 block">Notes</Label>
              <Textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Payment details..."
                className="text-sm resize-none"
                rows={2}
              />
            </div>

            {/* Compact Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
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
                size="sm"
                className="flex-1 bg-[#6b1a2e] hover:bg-[#5a1628] text-white font-bold"
                onClick={handleManualPayment}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Collecting...
                  </>
                ) : (
                  <>
                    <HandCoins className="h-3 w-3 mr-1" />
                    Collect Rs. {manualPaymentStudent?.installmentAmount.toLocaleString()}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Invoice Footer */}
          <div className="bg-gray-50 px-4 py-2 text-center">
            <div className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
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
