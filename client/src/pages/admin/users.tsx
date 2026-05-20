import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Link, useLocation } from "wouter";
import {
  useListUsers, getListUsersQueryKey, useListEnrollments, getListEnrollmentsQueryKey,
  useListPayments, getListPaymentsQueryKey, useListCourses, getListCoursesQueryKey,
  useCreateEnrollment, useUpdateUser, useDeleteUser, useCreateUser, useListBranches, getListBranchesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Loader2, UserPlus, CheckCircle2, XCircle, GraduationCap,
  CreditCard, Users, ClipboardList, Phone, Mail, Search, ExternalLink,
  Eye, FileText, ArrowRight, Table as TableIcon, Edit2, Key, Trash2,
  MoreVertical, ShieldAlert, Plus, BookOpen, MapPin
} from "lucide-react";

type Tab = "dashboard" | "reg" | "enroll_req" | "fee" | "manual" | "enrolled";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "dashboard",  label: "User Directory",         icon: Users },
  { id: "reg",        label: "Registration Requests", icon: UserPlus },
  { id: "enroll_req", label: "Enrollment Requests",   icon: ClipboardList },
  { id: "fee",        label: "Fee Payment",            icon: CreditCard },
  { id: "manual",     label: "Manual Enrollment",      icon: GraduationCap },
  { id: "enrolled",   label: "Enrolled Students",      icon: Users },
];

export default function AdminStudents() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<number | null>(null);
  
  // Manual Enrollment State
  const [manualUserId, setManualUserId] = useState("");
  const [manualCourseId, setManualCourseId] = useState("");
  const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null);

  // Original Dashboard Modals & Filters
  const [roleFilter, setRoleFilter] = useState<string>("student");
  const [studentTab, setStudentTab] = useState<"all" | "registered" | "fee_unpaid" | "enrolled">("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);

  // Add/Edit user form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "student",
    password: "",
    branchId: "",
    cnic: "",
    dob: "",
    lastEducation: "" as "Matric" | "Intermediate" | "BS" | "",
    educationStream: "",
    obtainedMarks: "",
    totalMarks: "",
    branchName: "Global",
  });
  const [cnicFile, setCnicFile] = useState<File | null>(null);
  const [educationFile, setEducationFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Queries
  const { data: usersRaw = [], isLoading: usersLoading } = useListUsers({}, { query: { queryKey: getListUsersQueryKey({}) } });
  const { data: enrollmentsRaw = [] } = useListEnrollments({}, { query: { queryKey: getListEnrollmentsQueryKey({}) } });
  const { data: paymentsRaw = [] } = useListPayments({}, { query: { queryKey: getListPaymentsQueryKey({}) } });
  const { data: coursesRaw = [] } = useListCourses({}, { query: { queryKey: getListCoursesQueryKey({}) } });
  const { data: branchesResponse = [] } = useListBranches({ query: { queryKey: getListBranchesQueryKey() } });

  const users = Array.isArray(usersRaw) ? usersRaw : [];
  const enrollments = Array.isArray(enrollmentsRaw) ? enrollmentsRaw : [];
  const payments = Array.isArray(paymentsRaw) ? paymentsRaw : [];
  const courses = Array.isArray(coursesRaw) ? coursesRaw : [];
  const branches = Array.isArray(branchesResponse) ? branchesResponse : [];

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const createEnrollment = useCreateEnrollment();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
    qc.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) });
    qc.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
  };

  const apiCall = async (url: string, body: object) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error("Failed");
  };

  // Workflow Handlers
  const approveReg = async (userId: number) => {
    setActioning(userId);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await fetch(`/api/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ isActive: true }) });
      toast({ title: "✅ Student approved! Account is now active." });
      invalidate();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setActioning(null); }
  };

  const rejectReg = async (userId: number) => {
    setActioning(userId);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await fetch(`/api/users/${userId}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      toast({ title: "Registration rejected and removed." });
      invalidate();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setActioning(null); }
  };

  const verifyFee = async (paymentId: number, status: "verified" | "rejected") => {
    setActioning(paymentId);
    try {
      await apiCall(`/api/payments/${paymentId}/verify`, { status, notes: status === "verified" ? "Verified by admin — enrollment activated" : "Rejected by admin" });
      toast({ title: status === "verified" ? "✅ Fee verified! Student enrolled." : "Payment rejected." });
      invalidate();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setActioning(null); }
  };

  const enrollManually = async () => {
    if (!manualUserId || !manualCourseId) return;
    try {
      await createEnrollment.mutateAsync({ data: { userId: Number(manualUserId), courseId: Number(manualCourseId) } });
      toast({ title: "✅ Enrollment Request created! Student can now submit their fee slip." });
      setManualUserId(""); setManualCourseId("");
      invalidate();
    } catch { toast({ title: "Enrollment failed", variant: "destructive" }); }
  };

  // Original CRUD Handlers
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.role === "student") {
      let identityDocumentUrl = "";
      let educationDocumentUrl = "";

      try {
        setIsUploading(true);

        // Upload CNIC/B-Form
        if (cnicFile) {
          const fd = new FormData();
          fd.append("document", cnicFile);
          const res = await fetch("/api/auth/upload-identity", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || data.error || "Failed to upload Identity Document");
          identityDocumentUrl = data.url;
        }

        // Upload Education Document
        if (educationFile) {
          const fd = new FormData();
          fd.append("document", educationFile);
          const res = await fetch("/api/auth/upload-identity", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || data.error || "Failed to upload Education Document");
          educationDocumentUrl = data.url;
        }
      } catch (err: any) {
        toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
        setIsUploading(false);
        return;
      }

      setIsUploading(false);

      try {
        const body = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          cnic: formData.cnic || undefined,
          dob: formData.dob || undefined,
          identityDocumentUrl: identityDocumentUrl || undefined,
          lastEducation: formData.lastEducation || undefined,
          educationStream: formData.educationStream || undefined,
          obtainedMarks: formData.obtainedMarks ? Number(formData.obtainedMarks) : undefined,
          totalMarks: formData.totalMarks ? Number(formData.totalMarks) : undefined,
          educationDocumentUrl: educationDocumentUrl || undefined,
          branchId: formData.branchId ? Number(formData.branchId) : undefined,
          role: "student",
        };

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || data.error || "Failed to register student");

        toast({ title: "🎉 Student registered successfully! Placed in Registration Requests." });
        setAddUserOpen(false);
        // Clear files
        setCnicFile(null);
        setEducationFile(null);
        invalidate();
      } catch (err: any) {
        toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
      }
    } else {
      // Normal admin/teacher creation
      try {
        await createUserMutation.mutateAsync({
          data: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || undefined,
            role: formData.role as any,
            password: formData.password,
            branchName: formData.branchName,
            cnic: formData.cnic || undefined,
            isActive: true
          }
        });
        toast({ title: "✅ User created successfully!" });
        setAddUserOpen(false);
        invalidate();
      } catch {
        toast({ title: "Failed to create user", variant: "destructive" });
      }
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserMutation.mutateAsync({
        id: editUser.id,
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role as any,
          cnic: formData.cnic,
          branchName: formData.branchName
        }
      });
      toast({ title: "✅ User updated successfully!" });
      setEditUser(null);
      invalidate();
    } catch {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await deleteUserMutation.mutateAsync({ id: userToDelete.id });
      toast({ title: "User deleted permanently." });
      setUserToDelete(null);
      invalidate();
    } catch {
      toast({ title: "Failed to delete user", variant: "destructive" });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/users/${resetPasswordUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ newPassword: formData.password })
      });
      if (!res.ok) throw new Error();
      toast({ title: "✅ Password reset successfully!" });
      setResetPasswordUser(null);
    } catch {
      toast({ title: "Failed to reset password", variant: "destructive" });
    }
  };

  // --- Computed Pipeline Counts ---
  const countReg = users.filter(u => u.role === "student" && !u.isActive).length;
  const countEnrollReq = users.filter(u => {
    if (u.role !== "student" || !u.isActive) return false;
    return enrollments.some((e: any) => e.userId === u.id && e.status === "pending") &&
      !payments.some((p: any) => p.userId === u.id && p.status === "pending");
  }).length;
  const countFee = payments.filter((p: any) => p.status === "pending").length;
  const countEnrolled = users.filter(u => {
    if (u.role !== "student") return false;
    const active = enrollments.filter((e: any) => e.userId === u.id && e.status === "active");
    return active.some((e: any) => payments.some((p: any) => p.userId === u.id && p.courseId === e.courseId && p.status === "verified"));
  }).length;

  const pipelineCounts = {
    dashboard: users.length,
    reg: countReg,
    enroll_req: countEnrollReq,
    fee: countFee,
    manual: 0,
    enrolled: countEnrolled
  };

  // Filter for Directory/Dashboard Tab
  const q = search.toLowerCase();
  const sSearch = (u: any) => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);

  const filteredUsers = users.filter((u: any) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (!sSearch(u)) return false;

    // Apply student sub-filters
    if (u.role === "student") {
      // Course filter check
      if (courseFilter !== "all") {
        const studEnrollments = enrollments.filter((e: any) => e.userId === u.id);
        const hasCourse = studEnrollments.some((e: any) => String(e.courseId) === courseFilter);
        if (!hasCourse) return false;
      }

      // Student Tab Pipeline Sub-filter check
      if (studentTab === "registered") {
        if (u.isActive) return false;
      } else if (studentTab === "fee_unpaid") {
        const studEnrollments = enrollments.filter((e: any) => e.userId === u.id);
        if (studEnrollments.length === 0) return false;
        const hasUnpaid = studEnrollments.some((e: any) => !payments.some((p: any) => p.userId === u.id && p.courseId === e.courseId && p.status === "verified"));
        if (!hasUnpaid) return false;
      } else if (studentTab === "enrolled") {
        const active = enrollments.filter((e: any) => e.userId === u.id && e.status === "active");
        const hasActive = active.some((e: any) => payments.some((p: any) => p.userId === u.id && p.courseId === e.courseId && p.status === "verified"));
        if (!hasActive) return false;
      }
    }

    return true;
  });

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Filter for Pipeline Lists
  const regList = users.filter(u => u.role === "student" && !u.isActive && sSearch(u));

  const enrollReqList = users.filter(u => {
    if (u.role !== "student" || !u.isActive || !sSearch(u)) return false;
    return enrollments.some((e: any) => e.userId === u.id && e.status === "pending") &&
      !payments.some((p: any) => p.userId === u.id && p.status === "pending");
  });

  const feeList = payments.filter((p: any) => p.status === "pending" &&
    users.some((u: any) => u.id === p.userId && (!q || u.name?.toLowerCase().includes(q) || (p.courseName || "").toLowerCase().includes(q))));

  const enrolledList = users.filter(u => {
    if (u.role !== "student" || !sSearch(u)) return false;
    const active = enrollments.filter((e: any) => e.userId === u.id && e.status === "active");
    return active.some((e: any) => payments.some((p: any) => p.userId === u.id && p.courseId === e.courseId && p.status === "verified"));
  });

  const EmptyState = ({ msg }: { msg: string }) => (
    <div className="py-20 text-center flex flex-col items-center justify-center gap-3 opacity-40">
      <TableIcon className="h-12 w-12 text-slate-400" />
      <p className="font-bold text-slate-600">{msg}</p>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Visual Student Lifecycle Progress Banner */}
      <div className="mb-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-950 p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute left-1/3 bottom-0 w-96 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">LMS System Pipeline</span>
              <h2 className="text-2xl font-black tracking-tight mt-2 text-white">Student Lifecycle Pipeline</h2>
              <p className="text-white/60 text-xs mt-0.5">Real-time workflow pipeline from student sign-up to course activation.</p>
            </div>
            <Button onClick={() => {
              setFormData({ name: "", email: "", phone: "", role: "student", password: "", branchName: "Global", cnic: "" });
              setAddUserOpen(true);
            }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs gap-2 shadow-lg shadow-emerald-900/30 border border-emerald-500/30">
              <UserPlus className="h-4 w-4" /> Add New User
            </Button>
          </div>

          {/* Flow Tracker */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {[
              { step: "1", title: "Registered Requests", count: countReg, desc: "Pending initial account activation", color: "from-amber-500/20 to-amber-600/30 border-amber-500/30 text-amber-300" },
              { step: "2", title: "Enrollment Requests", count: countEnrollReq, desc: "Active account, pending course choice", color: "from-blue-500/20 to-blue-600/30 border-blue-500/30 text-blue-300" },
              { step: "3", title: "Fee Payment Processing", count: countFee, desc: "Awaiting slip verification", color: "from-indigo-500/20 to-indigo-600/30 border-indigo-500/30 text-indigo-300" },
              { step: "4", title: "Enrolled & Active", count: countEnrolled, desc: "Verified fees, accessing LMS courses", color: "from-emerald-500/20 to-emerald-600/30 border-emerald-500/30 text-emerald-300" }
            ].map((s, idx) => (
              <div key={s.step} className={`p-4 rounded-2xl bg-gradient-to-br border ${s.color} backdrop-blur-md relative group flex flex-col justify-between`}>
                <div className="flex justify-between items-start">
                  <span className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center font-black text-xs">{s.step}</span>
                  <span className="text-2xl font-black tracking-tight">{s.count}</span>
                </div>
                <div className="mt-4">
                  <p className="font-bold text-xs text-white">{s.title}</p>
                  <p className="text-[9px] text-white/50 leading-tight mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chrome Style Tab Bar */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto select-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${tab === t.id ? "border-emerald-600 text-emerald-700 font-black" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>
            <t.icon className="h-4 w-4" />
            {t.label}
            {pipelineCounts[t.id] > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ml-1 ${tab === t.id ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
                {pipelineCounts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Actions Bar (Generic/Dashboard) */}
      {tab === "dashboard" && (
        <div className="space-y-4 mb-6">
          <div className="bg-slate-50/50 p-3 rounded-2xl ring-1 ring-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Role Filter:</span>
              <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-full md:w-[160px] bg-white rounded-xl border-slate-200 text-xs h-9">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs">All Users</SelectItem>
                  <SelectItem value="admin" className="text-xs">Admins</SelectItem>
                  <SelectItem value="teacher" className="text-xs">Teachers</SelectItem>
                  <SelectItem value="student" className="text-xs">Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input placeholder="Search directory..." className="pl-9 rounded-xl border-slate-200 text-xs h-9" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
            </div>
          </div>

          {/* Sub Sections Tabs & Course Filters (Visible when filtering for students/all) */}
          {(roleFilter === "student" || roleFilter === "all") && (
            <div className="bg-slate-50/50 p-3 rounded-2xl ring-1 ring-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "All Students", count: users.filter((u: any) => u.role === "student").length, color: "" },
                  { id: "registered", label: "Pending Approval", count: countReg, color: "amber" },
                  { id: "fee_unpaid", label: "Fee Unpaid", count: countEnrollReq + countFee, color: "rose" },
                  { id: "enrolled", label: "Enrolled", count: countEnrolled, color: "emerald" },
                ].map((tabOption) => {
                  const isActive = studentTab === tabOption.id;
                  const accentMap: Record<string, string> = {
                    amber: isActive ? "bg-amber-600 text-white shadow-amber-900/10" : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100",
                    rose: isActive ? "bg-rose-600 text-white shadow-rose-900/10" : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100",
                    emerald: isActive ? "bg-emerald-600 text-white shadow-emerald-900/10" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100",
                  };
                  const cls = tabOption.color ? accentMap[tabOption.color] : (isActive ? "bg-slate-900 text-white shadow-slate-950/15" : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60 hover:text-slate-900");
                  return (
                    <button
                      key={tabOption.id}
                      onClick={() => { setStudentTab(tabOption.id as any); setCurrentPage(1); }}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 border shadow-sm ${cls}`}
                    >
                      <span>{tabOption.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${isActive ? "bg-white/20" : "bg-white/60"}`}>
                        {tabOption.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Course:</span>
                <Select value={courseFilter} onValueChange={(val) => { setCourseFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full md:w-[220px] bg-white rounded-xl border-slate-200 text-xs h-9">
                    <BookOpen className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="text-xs">All Courses</SelectItem>
                    {courses.map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()} className="text-xs">
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search for Excel Pipeline Views */}
      {tab !== "dashboard" && tab !== "manual" && (
        <div className="relative mb-5 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Filter list by student name, email..." className="pl-9 rounded-lg border-slate-200 text-xs h-9 shadow-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {/* ─── TAB 1: Core Dashboard (Original System Directory) ─── */}
      {tab === "dashboard" && (
        <Card className="border border-slate-200 shadow-xl overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                <TableRow>
                  <TableHead className="font-bold py-4">User Profile</TableHead>
                  <TableHead className="font-bold">Role</TableHead>
                  <TableHead className="font-bold">Campus</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto opacity-20" /></TableCell></TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-64 text-center text-gray-500 font-bold">No users match your filters.</TableCell></TableRow>
                ) : (
                  paginatedUsers.map((user: any) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/admin/users/${user.id}`}>
                                <span className="font-bold text-gray-900 hover:text-emerald-600 cursor-pointer transition-colors">{user.name}</span>
                              </Link>
                              {user.role === "student" && !user.isActive && (
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-bold px-1.5 py-0.5 rounded">Pending Approval</Badge>
                              )}
                              {user.role === "student" && enrollments.some((e: any) => e.userId === user.id && e.status === "pending") && (
                                <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold px-1.5 py-0.5 rounded">Pending Admission</Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-mono"><Mail className="h-3 w-3" /> {user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`capitalize font-bold text-[10px] ${user.role === 'admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' : user.role === 'teacher' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-slate-600"><MapPin className="h-3.5 w-3.5 text-slate-400" />{user.branchName || "Global"}</div>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold"><XCircle className="h-3 w-3 mr-1" /> Blocked</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl w-44">
                            <DropdownMenuLabel className="text-xs">User Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setFormData({ name: user.name, email: user.email, phone: user.phone || "", role: user.role, password: "", branchName: user.branchName || "Global", cnic: user.cnic || "" });
                              setEditUser(user);
                            }} className="text-xs font-bold gap-2"><Edit2 className="h-3.5 w-3.5" /> Edit Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setFormData(prev => ({ ...prev, password: "" }));
                              setResetPasswordUser(user);
                            }} className="text-xs font-bold gap-2"><Key className="h-3.5 w-3.5" /> Reset Password</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setUserToDelete(user)} className="text-xs font-bold text-rose-600 hover:bg-rose-50 gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete Permanently</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-50/50 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold h-8" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <Button key={idx} variant={currentPage === idx + 1 ? "default" : "outline"} size="sm" className={`h-8 w-8 rounded-xl text-xs font-bold ${currentPage === idx + 1 ? "bg-slate-900 text-white" : ""}`} onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</Button>
                ))}
                <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold h-8" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ─── SPREADSHEET PIPELINE EXCEL VIEWS ─── */}
      {tab !== "dashboard" && tab !== "manual" && (
        <Card className="border border-slate-200 shadow-xl overflow-hidden rounded-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <Table className="border-collapse text-left text-xs w-full">
                <TableHeader className="bg-slate-50 border-b border-slate-200 select-none">
                  <TableRow className="hover:bg-transparent divide-x divide-slate-200">
                    <TableHead className="w-10 text-center font-black text-slate-400 bg-slate-100/50">#</TableHead>
                    {tab === "reg" && (
                      <>
                        <TableHead className="font-bold text-slate-700 py-3">Student Name</TableHead>
                        <TableHead className="font-bold text-slate-700">Email Address</TableHead>
                        <TableHead className="font-bold text-slate-700">Phone</TableHead>
                        <TableHead className="font-bold text-slate-700">CNIC / Form-B</TableHead>
                        <TableHead className="font-bold text-slate-700">Registration Date</TableHead>
                        <TableHead className="font-bold text-slate-700 text-right w-64">Workflow Actions</TableHead>
                      </>
                    )}
                    {tab === "enroll_req" && (
                      <>
                        <TableHead className="font-bold text-slate-700 py-3">Student Name</TableHead>
                        <TableHead className="font-bold text-slate-700">Email Address</TableHead>
                        <TableHead className="font-bold text-slate-700">Applied Courses</TableHead>
                        <TableHead className="font-bold text-slate-700">Enrollment Status</TableHead>
                        <TableHead className="font-bold text-slate-700 text-center w-36">Profile Info</TableHead>
                      </>
                    )}
                    {tab === "fee" && (
                      <>
                        <TableHead className="font-bold text-slate-700 py-3">Student Name</TableHead>
                        <TableHead className="font-bold text-slate-700">Applied Course</TableHead>
                        <TableHead className="font-bold text-slate-700">Fee Amount</TableHead>
                        <TableHead className="font-bold text-slate-700">Payment Method</TableHead>
                        <TableHead className="font-bold text-slate-700">Date Submitted</TableHead>
                        <TableHead className="font-bold text-slate-700 text-center w-28">Payment Slip</TableHead>
                        <TableHead className="font-bold text-slate-700 text-right w-48">Actions</TableHead>
                      </>
                    )}
                    {tab === "enrolled" && (
                      <>
                        <TableHead className="font-bold text-slate-700 py-3">Student Name</TableHead>
                        <TableHead className="font-bold text-slate-700">Email Address</TableHead>
                        <TableHead className="font-bold text-slate-700">Enrolled Courses</TableHead>
                        <TableHead className="font-bold text-slate-700">Status</TableHead>
                        <TableHead className="font-bold text-slate-700 text-center w-36">Profile Info</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {/* --- REGISTRATION REQUESTS --- */}
                  {tab === "reg" && (
                    regList.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="h-48"><EmptyState msg="No pending registration requests found." /></TableCell></TableRow>
                    ) : (
                      regList.map((u: any, idx) => (
                        <TableRow key={u.id} className="hover:bg-slate-50/50 divide-x divide-slate-100 transition-colors">
                          <TableCell className="text-center font-bold text-slate-400 bg-slate-50/30 w-10 select-none">{idx + 1}</TableCell>
                          <TableCell className="font-bold text-slate-900 py-2.5">
                            <Link href={`/admin/users/${u.id}`}>
                              <span className="hover:text-emerald-600 cursor-pointer transition-colors flex items-center gap-1">
                                {u.name}
                                <ExternalLink className="h-3 w-3 text-slate-400" />
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell className="text-slate-600 font-mono">{u.email}</TableCell>
                          <TableCell className="text-slate-600">{u.phone || "—"}</TableCell>
                          <TableCell className="text-slate-600 font-mono">{u.cnic || "—"}</TableCell>
                          <TableCell className="text-slate-500">{new Date(u.createdAt || Date.now()).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                          <TableCell className="text-right py-2">
                            <div className="flex justify-end gap-1.5">
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold h-7 px-2.5" disabled={actioning === u.id} onClick={() => approveReg(u.id)}>
                                {actioning === u.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />} Approve Account
                              </Button>
                              <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg text-[10px] font-bold h-7 px-2.5" disabled={actioning === u.id} onClick={() => rejectReg(u.id)}>
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  )}

                  {/* --- ENROLLMENT REQUESTS --- */}
                  {tab === "enroll_req" && (
                    enrollReqList.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="h-48"><EmptyState msg="No enrollment requests." /></TableCell></TableRow>
                    ) : (
                      enrollReqList.map((u: any, idx) => {
                        const pending = enrollments.filter((e: any) => e.userId === u.id && e.status === "pending");
                        return (
                          <TableRow key={u.id} className="hover:bg-slate-50/50 divide-x divide-slate-100 transition-colors">
                            <TableCell className="text-center font-bold text-slate-400 bg-slate-50/30 w-10 select-none">{idx + 1}</TableCell>
                            <TableCell className="font-bold text-slate-900 py-2.5">
                              <Link href={`/admin/users/${u.id}`}>
                                <span className="hover:text-emerald-600 cursor-pointer transition-colors flex items-center gap-1">
                                  {u.name}
                                  <ExternalLink className="h-3 w-3 text-slate-400" />
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell className="text-slate-600 font-mono">{u.email}</TableCell>
                            <TableCell className="py-2.5">
                              <div className="flex flex-wrap gap-1">
                                {pending.map((e: any) => (
                                  <Badge key={e.id} className="bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-50 rounded text-[10px] font-bold px-1.5 py-0.5">
                                    {e.courseName || `Course #${e.courseId}`}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 rounded text-[10px] font-bold">
                                Awaiting Payment Receipt
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-[10px] font-black hover:bg-slate-900 hover:text-white border-slate-200" onClick={() => setLocation(`/admin/users/${u.id}`)}>
                                View Profile <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  )}

                  {/* --- FEE PAYMENT --- */}
                  {tab === "fee" && (
                    feeList.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="h-48"><EmptyState msg="No pending fee payment slips to verify." /></TableCell></TableRow>
                    ) : (
                      feeList.map((p: any, idx) => {
                        const student = users.find((u: any) => u.id === p.userId);
                        return (
                          <TableRow key={p.id} className="hover:bg-slate-50/50 divide-x divide-slate-100 transition-colors">
                            <TableCell className="text-center font-bold text-slate-400 bg-slate-50/30 w-10 select-none">{idx + 1}</TableCell>
                            <TableCell className="font-bold text-slate-900 py-2.5">{student?.name || `User #${p.userId}`}</TableCell>
                            <TableCell className="font-bold text-slate-700">{p.courseName || `Course #${p.courseId}`}</TableCell>
                            <TableCell className="font-extrabold text-slate-950 font-mono">Rs. {(p.amount || 0).toLocaleString()}</TableCell>
                            <TableCell className="font-black text-slate-500 uppercase">{p.method}</TableCell>
                            <TableCell className="text-slate-500">{new Date(p.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                            <TableCell className="text-center py-1">
                              {p.receiptUrl ? (
                                <Button size="sm" variant="outline" className="h-7 rounded-lg border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-[10px] font-bold px-2 flex items-center justify-center gap-1 mx-auto" onClick={() => setPreviewSlipUrl(p.receiptUrl)}>
                                  <Eye className="h-3.5 w-3.5" /> View Slip
                                </Button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold uppercase">No Receipt</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right py-2">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold h-7 px-2.5" disabled={actioning === p.id} onClick={() => verifyFee(p.id, "verified")}>
                                  {actioning === p.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />} Verify & Enroll
                                </Button>
                                <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg text-[10px] font-bold h-7 px-2.5" disabled={actioning === p.id} onClick={() => verifyFee(p.id, "rejected")}>
                                  <XCircle className="h-3 w-3 mr-1" /> Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  )}

                  {/* --- ENROLLED STUDENTS --- */}
                  {tab === "enrolled" && (
                    enrolledList.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="h-48"><EmptyState msg="No fully enrolled students yet." /></TableCell></TableRow>
                    ) : (
                      enrolledList.map((u: any, idx) => {
                        const activeEnrollments = enrollments.filter((e: any) => e.userId === u.id && e.status === "active");
                        return (
                          <TableRow key={u.id} className="hover:bg-slate-50/50 divide-x divide-slate-100 transition-colors">
                            <TableCell className="text-center font-bold text-slate-400 bg-slate-50/30 w-10 select-none">{idx + 1}</TableCell>
                            <TableCell className="font-bold text-slate-900 py-2.5">
                              <Link href={`/admin/users/${u.id}`}>
                                <span className="hover:text-emerald-600 cursor-pointer transition-colors flex items-center gap-1">
                                  {u.name}
                                  <ExternalLink className="h-3 w-3 text-slate-400" />
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell className="text-slate-600 font-mono">{u.email}</TableCell>
                            <TableCell className="py-2.5">
                              <div className="flex flex-wrap gap-1">
                                {activeEnrollments.map((e: any) => (
                                  <Badge key={e.id} className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50 rounded text-[10px] font-bold px-1.5 py-0.5">
                                    {e.courseName || `Course #${e.courseId}`}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
                                Fully Enrolled
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-[10px] font-black hover:bg-slate-900 hover:text-white border-slate-200" onClick={() => setLocation(`/admin/users/${u.id}`)}>
                                View Profile <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── TAB: Manual Enrollment ─── */}
      {tab === "manual" && (
        <div className="max-w-lg mx-auto">
          <Card className="border border-slate-200 shadow-xl rounded-xl">
            <CardContent className="p-6 space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                  Manual Enrollment Form
                </h2>
                <p className="text-xs text-slate-500 mt-1">Enroll any student instantly. Bypass payment requirements. Automatically activates student profile.</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Select Student Account</Label>
                <Select value={manualUserId} onValueChange={setManualUserId}>
                  <SelectTrigger className="rounded-lg border-slate-200 text-sm h-10"><SelectValue placeholder="Choose a student account..." /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">{users.filter((u: any) => u.role === "student").map((u: any) => <SelectItem key={u.id} value={String(u.id)} className="text-xs">{u.name} ({u.email})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Select Target Course</Label>
                <Select value={manualCourseId} onValueChange={setManualCourseId}>
                  <SelectTrigger className="rounded-lg border-slate-200 text-sm h-10"><SelectValue placeholder="Choose target course..." /></SelectTrigger>
                  <SelectContent>{courses.map((c: any) => <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold h-10 transition-colors" disabled={!manualUserId || !manualCourseId || createEnrollment.isPending} onClick={enrollManually}>
                {createEnrollment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GraduationCap className="h-4 w-4 mr-2" />}
                Enroll Student & Activate
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── ORIGINAL USER DIALOGS & MODALS ─── */}

      {/* Add User Modal */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-lg font-black text-slate-900">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Add New User Profile
            </DialogTitle>
            <DialogDescription className="text-xs">Create a system login profile for a student, teacher, or administrator.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUserSubmit} className="space-y-4 py-2">
            <div className="bg-slate-50 p-3 rounded-xl ring-1 ring-slate-100 flex flex-col gap-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Account Role & Basics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">System Role</Label>
                  <Select value={formData.role} onValueChange={val => setFormData(prev => ({ ...prev, role: val }))}>
                    <SelectTrigger className="rounded-xl bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Select Branch / Campus</Label>
                  <Select value={formData.branchId} onValueChange={val => setFormData(prev => ({ ...prev, branchId: val }))}>
                    <SelectTrigger className="rounded-xl bg-white"><SelectValue placeholder="Choose branch..." /></SelectTrigger>
                    <SelectContent>
                      {branches.map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name} — {b.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Full Name</Label>
                  <Input required value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Hammad Ali" className="rounded-xl bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Email Address</Label>
                  <Input required type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@domain.com" className="rounded-xl bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="e.g. 0300-1234567" className="rounded-xl bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Initial Password</Label>
                  <Input required type="password" value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="••••••••" className="rounded-xl bg-white" />
                </div>
              </div>
            </div>

            {/* Student Registration Specific Details */}
            {formData.role === "student" && (
              <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  Student Identity & Academic Background
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600">CNIC / Form-B Number</Label>
                    <Input required value={formData.cnic} onChange={e => setFormData(prev => ({ ...prev, cnic: e.target.value }))} placeholder="35201-XXXXXXX-X" className="rounded-xl bg-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600">Date of Birth</Label>
                    <Input required type="date" value={formData.dob} onChange={e => setFormData(prev => ({ ...prev, dob: e.target.value }))} className="rounded-xl bg-white" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Upload CNIC / Form-B Photo</Label>
                  <Input required type="file" accept="image/*" onChange={e => setCnicFile(e.target.files?.[0] || null)} className="rounded-xl bg-white pt-2 text-xs" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Last Completed Education Level</Label>
                  <Select value={formData.lastEducation} onValueChange={(val: any) => setFormData(prev => ({ ...prev, lastEducation: val }))}>
                    <SelectTrigger className="rounded-xl bg-white"><SelectValue placeholder="Select education..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Matric">Matric / O-Level</SelectItem>
                      <SelectItem value="Intermediate">Intermediate / A-Level</SelectItem>
                      <SelectItem value="BS">BS / Bachelor's</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.lastEducation && (
                  <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-3">
                    {(formData.lastEducation === "Intermediate" || formData.lastEducation === "BS") && (
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600">Major / Stream (e.g. ICS, Pre-Medical, CS)</Label>
                        <Input required value={formData.educationStream} onChange={e => setFormData(prev => ({ ...prev, educationStream: e.target.value }))} placeholder="e.g. BS Software Engineering" className="rounded-xl bg-slate-50" />
                      </div>
                    )}

                    {(formData.lastEducation === "Matric" || formData.lastEducation === "Intermediate") && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600">Obtained Marks</Label>
                          <Input required type="number" value={formData.obtainedMarks} onChange={e => setFormData(prev => ({ ...prev, obtainedMarks: e.target.value }))} placeholder="850" className="rounded-xl bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600">Total Marks</Label>
                          <Input required type="number" value={formData.totalMarks} onChange={e => setFormData(prev => ({ ...prev, totalMarks: e.target.value }))} placeholder="1100" className="rounded-xl bg-slate-50" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600">Upload Transcript / Result Card</Label>
                      <Input required type="file" accept="image/*,.pdf" onChange={e => setEducationFile(e.target.files?.[0] || null)} className="rounded-xl bg-slate-50 pt-2 text-xs" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-slate-100 flex gap-2">
              <Button type="button" variant="outline" className="rounded-xl text-xs h-9" onClick={() => setAddUserOpen(false)} disabled={isUploading}>Cancel</Button>
              <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-md" disabled={createUserMutation.isPending || isUploading}>
                {createUserMutation.isPending || isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Processing Registration...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Student Profile
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={val => !val && setEditUser(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleEditUserSubmit} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Full Name</Label>
                <Input required value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Email Address</Label>
                <Input required type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">System Role</Label>
                  <Select value={formData.role} onValueChange={val => setFormData(prev => ({ ...prev, role: val }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">CNIC / Form-B</Label>
                <Input value={formData.cnic} onChange={e => setFormData(prev => ({ ...prev, cnic: e.target.value }))} className="rounded-xl" />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button type="submit" className="rounded-xl" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!userToDelete} onOpenChange={val => !val && setUserToDelete(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-2"><ShieldAlert className="h-6 w-6" /></div>
            <DialogTitle>Confirm Permanently Delete</DialogTitle>
            <DialogDescription className="text-xs">
              Are you absolute sure you wish to delete profile <strong>{userToDelete?.name}</strong>? All associated logs, grades, and enrollments will be wiped.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-center sm:justify-center pt-2">
            <Button variant="outline" className="rounded-xl flex-1 text-xs" onClick={() => setUserToDelete(null)}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex-1 text-xs" onClick={handleDeleteConfirm} disabled={deleteUserMutation.isPending}>
              {deleteUserMutation.isPending ? "Deleting..." : "Yes, Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={!!resetPasswordUser} onOpenChange={val => !val && setResetPasswordUser(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="bg-amber-50 text-amber-800 border border-amber-100 p-3 rounded-lg text-[11px] leading-relaxed flex gap-2">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
              Resetting password for {resetPasswordUser?.name} ({resetPasswordUser?.email}). Keep this password secure.
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">New Password</Label>
              <Input required type="password" value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="Enter new strong password" className="rounded-xl" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => setResetPasswordUser(null)}>Cancel</Button>
              <Button type="submit" className="rounded-xl text-xs bg-slate-900 hover:bg-slate-800 text-white">Save Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Slip Image Dialog modal */}
      <Dialog open={!!previewSlipUrl} onOpenChange={val => !val && setPreviewSlipUrl(null)}>
        <DialogContent className="max-w-xl rounded-2xl overflow-hidden p-0 bg-slate-950 border border-slate-800">
          <DialogHeader className="bg-slate-900 border-b border-slate-800 p-4">
            <DialogTitle className="text-sm font-black text-white flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-emerald-500" />
              Verified Payment Receipt Slip
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center bg-slate-900 min-h-[300px]">
            {previewSlipUrl && (
              <img src={previewSlipUrl} alt="Slip Receipt" className="max-h-[480px] w-auto object-contain rounded border border-slate-800 shadow-2xl" />
            )}
          </div>
          <div className="bg-slate-950 px-4 py-3 flex justify-end gap-2 border-t border-slate-800">
            {previewSlipUrl && (
              <a href={previewSlipUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors">
                Open in New Tab <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <Button size="sm" variant="outline" className="text-slate-400 hover:text-white border-slate-800 hover:bg-slate-900 text-[10px] font-bold uppercase rounded-lg" onClick={() => setPreviewSlipUrl(null)}>
              Close Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
