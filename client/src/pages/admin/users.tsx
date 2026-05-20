import { DashboardLayout } from "@/components/DashboardLayout";

import { 
  useListUsers, 
  getListUsersQueryKey, 
  useListBranches,
  getListBranchesQueryKey,
  useUpdateUser,
  useDeleteUser,
  useListEnrollments,
  getListEnrollmentsQueryKey,
  useListPayments,
  getListPaymentsQueryKey,
  useListCourses,
  getListCoursesQueryKey,
  useCreateUser
} from "@workspace/api-client-react";
import { 
  Loader2, 
  Users, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  UserPlus, 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  Edit,
  MapPin,
  Trash2,
  BookOpen,
  ArrowRight,
  UserCheck,
  CreditCard,
  GraduationCap,
  Clock
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("student");
  const [branchFilter, setBranchFilter] = useState("all");
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // Advanced Student Sub-Section States
  const [studentTab, setStudentTab] = useState<"all" | "registered" | "applications" | "fee_unpaid" | "enrolled">("applications");
  const [courseFilter, setCourseFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add User states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    branchId: "",
    phone: "",
    cnic: "",
    gender: "male",
  });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
        toast({ title: "User registered successfully!" });
        setIsAddOpen(false);
        setAddUserForm({
          name: "",
          email: "",
          password: "",
          role: "student",
          branchId: "",
          phone: "",
          cnic: "",
          gender: "male",
        });
      },
      onError: (err: any) => {
        toast({ title: "Registration failed", description: err.message || "Email might be already in use", variant: "destructive" });
      }
    }
  });

  const { data: users = [], isLoading: usersLoading } = useListUsers({
    role: roleFilter === "all" ? undefined : roleFilter as any,
    branchId: branchFilter === "all" ? undefined : Number(branchFilter),
    search: search || undefined
  }, { 
    query: { 
      queryKey: getListUsersQueryKey({
        role: roleFilter === "all" ? undefined : roleFilter as any,
        branchId: branchFilter === "all" ? undefined : Number(branchFilter),
        search: search || undefined
      }) 
    } 
  });

  const { data: branches = [] } = useListBranches({}, {
    query: { queryKey: getListBranchesQueryKey() }
  });

  // Relational hooks for student metrics and category wise filters
  const { data: enrollments = [] } = useListEnrollments({}, {
    query: { queryKey: getListEnrollmentsQueryKey({}) }
  });

  const { data: payments = [] } = useListPayments({}, {
    query: { queryKey: getListPaymentsQueryKey({}) }
  });

  const { data: courses = [] } = useListCourses({}, {
    query: { queryKey: getListCoursesQueryKey({}) }
  });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
        setUserToDelete(null);
        toast({ title: "User deleted successfully" });
      },
    }
  });

  const toggleStatusMutation = useUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
        toast({ title: "User status updated" });
      },
    }
  });

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Manual fetch for password reset as it might not be in the hook library
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`/api/users/${resetPasswordUser.id}/reset-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      
      if (!response.ok) throw new Error("Failed to reset password");
      
      toast({ title: "Password reset successfully" });
      setResetPasswordUser(null);
      setNewPassword("");
    } catch (error) {
      toast({ title: "Error resetting password", variant: "destructive" });
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, branchFilter, studentTab, courseFilter]);

  const rawUsersList = Array.isArray(users) ? users : (users as any)?.data || [];

  // Computed sub-section badge metrics
  const registeredPendingCount = rawUsersList.filter((u: any) => u.role === "student" && !u.isActive).length;
  const enrolledCount = rawUsersList.filter((u: any) => {
    if (u.role !== "student") return false;
    const activeEnrollments = enrollments.filter((e: any) => e.userId === u.id && e.status === "active");
    if (activeEnrollments.length === 0) return false;
    return activeEnrollments.some((e: any) => payments.some((p: any) => p.userId === u.id && p.courseId === e.courseId && p.status === "verified"));
  }).length;
  const feeUnpaidCount = rawUsersList.filter((u: any) => {
    if (u.role !== "student") return false;
    const studEnrollments = enrollments.filter((e: any) => e.userId === u.id);
    if (studEnrollments.length === 0) return false;
    return studEnrollments.some((e: any) => !payments.some((p: any) => p.userId === u.id && p.courseId === e.courseId && p.status === "verified"));
  }).length;

  // Applications: students with at least one pending payment (combined review)
  const applicationsList = (Array.isArray(payments) ? payments : []).filter((p: any) => p.status === "pending").map((p: any) => {
    const student = rawUsersList.find((u: any) => u.id === p.userId && u.role === "student");
    return student ? { ...p, student } : null;
  }).filter(Boolean) as any[];
  const applicationsCount = applicationsList.length;

  // Approve application = verify payment (server will also activate account + enrollment)
  const [actioningPaymentId, setActioningPaymentId] = useState<number | null>(null);
  const handleApproveApplication = async (paymentId: number) => {
    setActioningPaymentId(paymentId);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/payments/${paymentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: "verified", notes: "Approved by admin — enrollment activated" })
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "✅ Application Approved!", description: "Payment verified, enrollment activated, account unlocked." });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) });
    } catch {
      toast({ title: "Approval failed", variant: "destructive" });
    } finally {
      setActioningPaymentId(null);
    }
  };
  const handleRejectApplication = async (paymentId: number) => {
    setActioningPaymentId(paymentId);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/payments/${paymentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: "rejected", notes: "Rejected by admin" })
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Application Rejected" });
      queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) });
    } catch {
      toast({ title: "Rejection failed", variant: "destructive" });
    } finally {
      setActioningPaymentId(null);
    }
  };

  const filteredUsers = rawUsersList.filter((user: any) => {
    // If not role student, only display if searching all roles
    if (user.role !== "student") {
      return roleFilter === "all" || roleFilter === user.role;
    }

    // 1. Course wise Filter
    if (courseFilter !== "all") {
      const cId = Number(courseFilter);
      const isEnrolled = enrollments.some((e: any) => e.userId === user.id && e.courseId === cId);
      if (!isEnrolled) return false;
    }

    // 2. Tab Filter
    if (studentTab === "registered") {
      return !user.isActive;
    }

    if (studentTab === "enrolled") {
      const activeEnrollments = enrollments.filter((e: any) => e.userId === user.id && e.status === "active");
      if (activeEnrollments.length === 0) return false;
      return activeEnrollments.some((e: any) => payments.some((p: any) => p.userId === user.id && p.courseId === e.courseId && p.status === "verified"));
    }

    if (studentTab === "fee_unpaid") {
      const studEnrollments = enrollments.filter((e: any) => e.userId === user.id);
      if (studEnrollments.length === 0) return false;
      return studEnrollments.some((e: any) => {
        const isPaid = payments.some((p: any) => p.userId === user.id && p.courseId === e.courseId && p.status === "verified");
        return !isPaid;
      });
    }

    return true;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalStudents = rawUsersList.filter((u: any) => u.role === "student").length;

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1">Manage the full student lifecycle — from registration to enrollment.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-primary hover:bg-primary/90 shadow-lg transition-all">
          <UserPlus className="h-4 w-4 mr-2" /> Add New Student
        </Button>
      </div>

      {/* Enrollment Pipeline Banner */}
      {roleFilter === "student" && (
        <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              step: "1",
              label: "Registered",
              sub: "Pending admin approval",
              count: registeredPendingCount,
              icon: Clock,
              bg: "bg-amber-50",
              border: "border-amber-200",
              iconColor: "text-amber-500",
              countColor: "text-amber-700",
              tab: "registered" as const,
            },
            {
              step: "2",
              label: "Approved",
              sub: "Active accounts",
              count: totalStudents - registeredPendingCount,
              icon: UserCheck,
              bg: "bg-blue-50",
              border: "border-blue-200",
              iconColor: "text-blue-500",
              countColor: "text-blue-700",
              tab: "all" as const,
            },
            {
              step: "3",
              label: "Fee Unpaid",
              sub: "Enrolled, awaiting fee",
              count: feeUnpaidCount,
              icon: CreditCard,
              bg: "bg-rose-50",
              border: "border-rose-200",
              iconColor: "text-rose-500",
              countColor: "text-rose-700",
              tab: "fee_unpaid" as const,
            },
            {
              step: "4",
              label: "Enrolled",
              sub: "Fee verified & active",
              count: enrolledCount,
              icon: GraduationCap,
              bg: "bg-emerald-50",
              border: "border-emerald-200",
              iconColor: "text-emerald-500",
              countColor: "text-emerald-700",
              tab: "enrolled" as const,
            },
          ].map((stage, idx) => (
            <div key={stage.label} className="flex items-center gap-2">
              <button
                onClick={() => { setRoleFilter("student"); setStudentTab(stage.tab); }}
                className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border ${stage.bg} ${stage.border} hover:shadow-md transition-all duration-200 text-left group`}
              >
                <div className={`h-10 w-10 rounded-xl ${stage.bg} border ${stage.border} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <stage.icon className={`h-5 w-5 ${stage.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black ${stage.iconColor} bg-white/80 px-1.5 py-0.5 rounded-md`}>Step {stage.step}</span>
                  </div>
                  <p className={`text-lg font-extrabold ${stage.countColor} leading-none mt-0.5`}>{stage.count}</p>
                  <p className="text-xs font-bold text-slate-600 truncate">{stage.label}</p>
                  <p className="text-[10px] text-slate-400 truncate">{stage.sub}</p>
                </div>
              </button>
              {idx < 3 && <ArrowRight className="h-4 w-4 text-slate-300 shrink-0 hidden lg:block" />}
            </div>
          ))}
        </div>
      )}

      <Card className="mb-8 border-none shadow-sm ring-1 ring-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by name, email or CNIC..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[180px]">
                <MapPin className="h-3.5 w-3.5 mr-2 text-gray-400" />
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch: any) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {roleFilter === "student" && (
        <div className="mb-6 bg-slate-50/50 p-2.5 rounded-[20px] ring-1 ring-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Sub Sections Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "applications", label: "📋 Applications", count: applicationsCount, color: "indigo" },
              { id: "all", label: "All Students", count: rawUsersList.filter((u: any) => u.role === "student").length, color: "" },
              { id: "registered", label: "Pending Approval", count: registeredPendingCount, color: "amber" },
              { id: "fee_unpaid", label: "Fee Unpaid", count: feeUnpaidCount, color: "rose" },
              { id: "enrolled", label: "Enrolled", count: enrolledCount, color: "emerald" },
            ].map((tab) => {
              const isActive = studentTab === tab.id;
              const accentMap: Record<string, string> = {
                indigo: isActive ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-900/10" : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
                amber: isActive ? "bg-amber-600 text-white shadow-amber-900/10" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
                rose: isActive ? "bg-rose-600 text-white shadow-rose-900/10" : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
                emerald: isActive ? "bg-emerald-600 text-white shadow-emerald-900/10" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
              };
              const cls = tab.color ? accentMap[tab.color] : (isActive ? "bg-slate-900 text-white shadow-slate-950/15" : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60 hover:text-slate-900");
              return (
                <button
                  key={tab.id}
                  onClick={() => setStudentTab(tab.id as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 border shadow-sm ${cls}`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${isActive ? "bg-white/20" : "bg-white/60"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Course-Wise Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Course:</span>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full md:w-[220px] bg-white rounded-xl border-slate-200">
                <BookOpen className="h-3.5 w-3.5 mr-2 text-slate-400" />
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course: any) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* ─── APPLICATIONS CARD GRID (only when Applications tab active) ─── */}
      {roleFilter === "student" && studentTab === "applications" && (
        <div className="space-y-4">
          {applicationsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-lg font-bold text-slate-700">No Pending Applications</p>
              <p className="text-sm text-slate-400 mt-1">All student applications have been reviewed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {applicationsList.map((app: any) => (
                <Card key={app.id} className="border-none shadow-lg ring-1 ring-slate-100 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 px-5 py-4 flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center text-white font-extrabold text-lg shrink-0">
                        {(app.student?.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-white text-sm">{app.student?.name}</p>
                          {!app.student?.isActive && (
                            <span className="text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">Account Pending</span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 mt-0.5 truncate">{app.student?.email}</p>
                      </div>
                      <Link href={`/admin/users/${app.student?.id}`}>
                        <button className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" title="View Profile">
                          <Users className="h-4 w-4" />
                        </button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-0 divide-x divide-slate-100">
                      {/* Left: details */}
                      <div className="p-4 space-y-3">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Course Applied</p>
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <GraduationCap className="h-4 w-4 text-blue-400 shrink-0" />
                            {app.courseName || `Course #${app.courseId}`}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fee</p>
                            <p className="text-sm font-extrabold text-slate-900">Rs. {(app.amount || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Method</p>
                            <p className="text-xs font-black uppercase text-slate-600 bg-slate-100 px-2 py-1 rounded-lg mt-0.5">{app.method}</p>
                          </div>
                        </div>
                        {app.student?.phone && (
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone</p>
                            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" />{app.student.phone}
                            </p>
                          </div>
                        )}
                        <div className="pt-2 flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs h-9"
                            disabled={actioningPaymentId === app.id}
                            onClick={() => handleApproveApplication(app.id)}
                          >
                            {actioningPaymentId === app.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl font-bold text-xs h-9"
                            disabled={actioningPaymentId === app.id}
                            onClick={() => handleRejectApplication(app.id)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>

                      {/* Right: fee slip */}
                      <div className="p-3 flex flex-col gap-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment Slip</p>
                        {app.receiptUrl ? (
                          <a href={app.receiptUrl} target="_blank" rel="noreferrer" className="block flex-1 relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-200 min-h-[140px]">
                            <img
                              src={app.receiptUrl}
                              alt="Payment Receipt"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-black uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">View Full</span>
                            </div>
                          </a>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 min-h-[140px] rounded-xl border border-dashed border-slate-200 bg-slate-50">
                            <XCircle className="h-8 w-8 mb-1 opacity-30" />
                            <p className="text-xs text-slate-400">No slip uploaded</p>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 text-center">
                          {new Date(app.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── REGULAR TABLE (hidden when Applications tab active) ─── */}
      {!(roleFilter === "student" && studentTab === "applications") && (
      <Card className="border-none shadow-xl ring-1 ring-gray-100 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="py-4 font-semibold">User Profile</TableHead>
                <TableHead className="py-4 font-semibold">Role</TableHead>
                <TableHead className="py-4 font-semibold">Campus</TableHead>
                <TableHead className="py-4 font-semibold">Status</TableHead>
                <TableHead className="py-4 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto opacity-20" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-gray-500">
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user: any) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/admin/users/${user.id}`}>
                              <span className="font-bold text-gray-900 hover:text-primary cursor-pointer transition-colors">{user.name}</span>
                            </Link>
                            {user.role === "student" && enrollments.some((e: any) => e.userId === user.id && e.status === "pending") && (
                              <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200 text-[9px] font-bold px-1.5 py-0 rounded-md">
                                Pending Admission
                              </Badge>
                            )}
                            {user.role === "student" && enrollments.filter((e: any) => e.userId === user.id).length > 0 && enrollments.filter((e: any) => e.userId === user.id).some((e: any) => !payments.some((p: any) => p.userId === user.id && p.courseId === e.courseId && p.status === "verified")) && (
                              <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200 text-[9px] font-bold px-1.5 py-0 rounded-md">
                                Fee Unpaid
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" /> {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={`capitalize font-medium ${
                          user.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          user.role === 'teacher' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {user.branchName || "Global"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : user.role === "student" ? (
                        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200">
                          <Loader2 className="h-3 w-3 animate-spin mr-1 text-amber-500" /> Pending Approval
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-50 text-gray-500 hover:bg-gray-50 border-gray-200">
                          <XCircle className="h-3 w-3 mr-1" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>User Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Link href={`/admin/users/${user.id}`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Users className="h-4 w-4 mr-2" /> View Profile
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => setResetPasswordUser(user)}
                          >
                            <Key className="h-4 w-4 mr-2" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className={`cursor-pointer ${!user.isActive && user.role === "student" ? "text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 font-bold" : ""}`}
                            onClick={() => toggleStatusMutation.mutate({ id: user.id, data: { isActive: !user.isActive } })}
                          >
                            {user.isActive ? (
                              <><XCircle className="h-4 w-4 mr-2 text-red-500" /> Deactivate Account</>
                            ) : user.role === "student" ? (
                              <><CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> Approve & Activate Account</>
                            ) : (
                              <><CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> Activate Account</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                            onSelect={(e) => {
                              e.preventDefault();
                              setUserToDelete(user);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-50/50 border-t border-slate-100 rounded-b-3xl">
            <span className="text-xs font-bold text-slate-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold text-xs h-8 px-3 border-slate-200"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pNum = idx + 1;
                const isCurrent = currentPage === pNum;
                return (
                  <Button
                    key={pNum}
                    variant={isCurrent ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 rounded-xl font-bold text-xs ${isCurrent ? "shadow-md shadow-slate-900/10 bg-slate-900 text-white" : "border-slate-200"}`}
                    onClick={() => setCurrentPage(pNum)}
                  >
                    {pNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold text-xs h-8 px-3 border-slate-200"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
      )}

      {/* Password Reset Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={(val) => !val && setResetPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-3 text-amber-800 text-sm">
              <Shield className="h-5 w-5 shrink-0" />
              <p>You are resetting the password for <strong>{resetPasswordUser?.name}</strong>. The user will need this new password to log in.</p>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input 
                type="password" 
                placeholder="Enter strong new password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setResetPasswordUser(null)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={!newPassword}>Confirm Reset</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(val) => !val && setUserToDelete(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete User Account
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to completely delete <strong>{userToDelete?.name}</strong>?
              <br/><br/>
              This will safely detach them from any courses they were assigned to and cleanly delete all of their records. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" className="rounded-xl font-bold" onClick={() => setUserToDelete(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              className="rounded-xl font-bold"
              disabled={deleteMutation.isPending}
              onClick={() => {
                deleteMutation.mutate({ id: userToDelete.id });
              }}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Yes, Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Manual Student / User Registration Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl overflow-hidden border-2 border-slate-100 shadow-2xl p-0">
          <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-black text-white">Register New User</DialogTitle>
              <p className="text-xs text-slate-300 font-medium mt-1">Manually enroll or register students and staff</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ data: addUserForm });
          }} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Full Name</Label>
                <Input 
                  placeholder="Enter full name" 
                  value={addUserForm.name}
                  onChange={(e) => setAddUserForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Role</Label>
                <Select 
                  value={addUserForm.role} 
                  onValueChange={(val) => setAddUserForm(prev => ({ ...prev, role: val }))}
                >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Email Address</Label>
                <Input 
                  type="email"
                  placeholder="name@globalcollege.com" 
                  value={addUserForm.email}
                  onChange={(e) => setAddUserForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Password</Label>
                <Input 
                  type="password"
                  placeholder="••••••••" 
                  value={addUserForm.password}
                  onChange={(e) => setAddUserForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Campus / Branch</Label>
                <Select 
                  value={addUserForm.branchId} 
                  onValueChange={(val) => setAddUserForm(prev => ({ ...prev, branchId: val }))}
                >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Campus" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {branches.map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Gender</Label>
                <Select 
                  value={addUserForm.gender} 
                  onValueChange={(val) => setAddUserForm(prev => ({ ...prev, gender: val }))}
                >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">Phone Number (Optional)</Label>
                <Input 
                  placeholder="+92 300 0000000" 
                  value={addUserForm.phone}
                  onChange={(e) => setAddUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600">CNIC (Optional)</Label>
                <Input 
                  placeholder="35201-0000000-0" 
                  value={addUserForm.cnic}
                  onChange={(e) => setAddUserForm(prev => ({ ...prev, cnic: e.target.value }))}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
              <Button type="button" variant="ghost" className="rounded-2xl font-bold" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/10 px-6"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Register User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
