import { useState, useMemo } from "react";
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
  CreditCard, Users, User, ClipboardList, Phone, Mail, Search, ExternalLink,
  Eye, FileText, ArrowRight, Table as TableIcon, Edit2, Key, Trash2,
  MoreVertical, ShieldAlert, Plus, BookOpen, MapPin, AlertCircle, Clock, Camera, Upload
} from "lucide-react";

type Tab = "dashboard" | "reg" | "enroll_req" | "fee" | "manual" | "enrolled";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "dashboard",  label: "Student Directory",      icon: Users },
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
  const [manualStudentSearch, setManualStudentSearch] = useState("");
  const [selectedManualStudent, setSelectedManualStudent] = useState<any>(null);
  const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null);
  const [manualPaymentStatus, setManualPaymentStatus] = useState<"pending" | "paid">("pending");

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
  const [avatarFile, setAdminAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAdminAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Queries with error handling
  const { data: usersRaw = [], isLoading: usersLoading, error: usersError } = useListUsers({}, { query: { queryKey: getListUsersQueryKey({}) } });
  const { data: enrollmentsRaw = [], error: enrollmentsError } = useListEnrollments({}, { query: { queryKey: getListEnrollmentsQueryKey({}) } });
  const { data: paymentsRaw = [], error: paymentsError } = useListPayments({}, { query: { queryKey: getListPaymentsQueryKey({}) } });
  const { data: coursesRaw = [], error: coursesError } = useListCourses({}, { query: { queryKey: getListCoursesQueryKey({}) } });
  const { data: branchesResponse = [], error: branchesError } = useListBranches({ query: { queryKey: getListBranchesQueryKey() } });

  // Safe data extraction with fallbacks
  const users = Array.isArray(usersRaw) ? usersRaw : [];
  const enrollments = Array.isArray(enrollmentsRaw) ? enrollmentsRaw : [];
  const payments = Array.isArray(paymentsRaw) ? paymentsRaw : [];
  const courses = Array.isArray(coursesRaw) ? coursesRaw : [];
  const branches = Array.isArray(branchesResponse) ? branchesResponse : [];

  // Error handling
  if (usersError || enrollmentsError || paymentsError || coursesError || branchesError) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-gray-500">Please refresh the page or try again later.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Refresh Page
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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

  // Disapprove / Revoke handlers
  const disapproveStudent = async (userId: number, userName: string) => {
    if (!confirm(`Disapprove and deactivate "${userName}"? Their account will be blocked and all active enrollments will be reverted to pending.`)) return;
    setActioning(userId);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      // Deactivate account
      await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ isActive: false })
      });
      // Revert all active enrollments to pending
      const userEnrollments = enrollments.filter((e: any) => e.userId === userId && e.status === "active");
      for (const enr of userEnrollments) {
        await fetch(`/api/enrollments/${enr.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ status: "pending" })
        });
      }
      toast({ title: `⛔ ${userName} has been disapproved and deactivated.` });
      invalidate();
    } catch { toast({ title: "Failed to disapprove student", variant: "destructive" }); }
    finally { setActioning(null); }
  };

  const disapproveEnrollment = async (enrollmentId: number, courseName: string, studentName: string) => {
    setActioning(enrollmentId);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      toast({ title: `Enrollment request removed for ${studentName}.` });
      invalidate();
    } catch { toast({ title: "Failed to remove enrollment", variant: "destructive" }); }
    finally { setActioning(null); }
  };

  const approveEnrollment = async (enrollmentId: number, courseName: string, studentName: string) => {
    setActioning(enrollmentId);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: "active" })
      });
      if (!res.ok) throw new Error("Failed to approve");
      toast({ title: `✅ Enrollment approved! ${studentName} is now enrolled in ${courseName}.` });
      invalidate();
    } catch { toast({ title: "Failed to approve enrollment", variant: "destructive" }); }
    finally { setActioning(null); }
  };

  const unenrollStudent = async (enrollmentId: number, courseName: string, studentName: string) => {
    if (!confirm(`Unenroll "${studentName}" from "${courseName}"? This will revert their enrollment to pending and require re-payment.`)) return;
    setActioning(enrollmentId);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: "pending" })
      });
      toast({ title: `${studentName} has been unenrolled from ${courseName}.` });
      invalidate();
    } catch { toast({ title: "Failed to unenroll student", variant: "destructive" }); }
    finally { setActioning(null); }
  };

  const enrollManually = async () => {
    if (!manualUserId || !manualCourseId) return;
    try {
      await createEnrollment.mutateAsync({ 
        data: { 
          userId: Number(manualUserId), 
          courseId: Number(manualCourseId),
          paymentStatus: manualPaymentStatus
        } 
      });
      
      const message = manualPaymentStatus === "paid" 
        ? "✅ Student enrolled successfully! Course is now active for learning."
        : "✅ Enrollment Request created! Student can now submit their fee slip.";
      
      toast({ title: message });
      setManualUserId(""); 
      setManualCourseId("");
      setSelectedManualStudent(null); 
      setManualStudentSearch("");
      setManualPaymentStatus("pending");
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
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");

        // Upload profile picture
        let avatarUrl = "";
        if (avatarFile) {
          const fd = new FormData();
          fd.append("file", avatarFile);
          const res = await fetch("/api/upload/image", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to upload profile picture");
          avatarUrl = data.url;
        }

        // Upload CNIC/B-Form
        if (cnicFile) {
          const fd = new FormData();
          fd.append("file", cnicFile);
          const res = await fetch("/api/upload/image", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || data.error || "Failed to upload Identity Document");
          identityDocumentUrl = data.url;
        }

        // Upload Education Document
        if (educationFile) {
          const fd = new FormData();
          fd.append("file", educationFile);
          const isPdf = educationFile.type === "application/pdf";
          const endpoint = isPdf ? "/api/upload/pdf" : "/api/upload/image";
          const res = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
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
          avatar: avatarUrl || undefined,
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
        setAdminAvatarFile(null);
        setAdminAvatarPreview(null);
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
          phone: formData.phone || undefined,
          role: formData.role as any,
          cnic: formData.cnic || undefined,
          dob: formData.dob || undefined,
          branchId: formData.branchId ? Number(formData.branchId) : undefined,
          branchName: formData.branchName || undefined,
          lastEducation: formData.lastEducation || undefined,
          educationStream: formData.educationStream || undefined,
          obtainedMarks: formData.obtainedMarks ? Number(formData.obtainedMarks) : undefined,
          totalMarks: formData.totalMarks ? Number(formData.totalMarks) : undefined,
        }
      });
      toast({ title: "✅ Student profile updated successfully!" });
      setEditUser(null);
      invalidate();
    } catch (error: any) {
      toast({ 
        title: "Failed to update profile", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
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
        body: JSON.stringify({ password: formData.password })
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
    dashboard: users.filter(u => u.role === "student").length,
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
              setFormData({ name: "", email: "", phone: "", role: "student", password: "", branchName: "Global", cnic: "", dob: "", lastEducation: "", educationStream: "", obtainedMarks: "", totalMarks: "", branchId: "" });
              setAdminAvatarFile(null);
              setAdminAvatarPreview(null);
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-800">Directory Search</span>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input placeholder="Search students..." className="pl-9 rounded-xl border-slate-200 text-xs h-9" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
            </div>
          </div>

          {/* Sub Sections Tabs & Course Filters */}
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
            <div className="max-w-full">
              <Table className="border-collapse text-left text-xs w-full">
                <TableHeader className="bg-slate-50 border-b border-slate-200 select-none">
                  <TableRow className="hover:bg-transparent divide-x divide-slate-200">
                    <TableHead className="w-10 text-center font-black text-slate-400 bg-slate-100/50 py-4">#</TableHead>
                    <TableHead className="font-bold text-slate-700 py-4 text-xs">Student Profile</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Contact & CNIC</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Campus & DOB</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Academic History</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-center">Verification Docs</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-center">Status</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-64 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto opacity-20" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-64 text-center text-gray-500 font-bold">
                        No students match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user: any, idx: number) => {
                      const globalIndex = ((currentPage - 1) * itemsPerPage) + idx + 1;
                      
                      // Calculate score percentage
                      let marksPercentage = "";
                      if (user.obtainedMarks && user.totalMarks) {
                        marksPercentage = `(${Math.round((user.obtainedMarks / user.totalMarks) * 100)}%)`;
                      }

                      return (
                        <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors divide-x divide-slate-200">
                          {/* 1. Index */}
                          <TableCell className="text-center font-mono text-slate-400 bg-slate-50/30 py-4 font-bold">{globalIndex}</TableCell>
                          
                          {/* 2. Profile */}
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover animate-in fade-in duration-300" />
                                ) : (
                                  <User className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Link href={`/admin/users/${user.id}`}>
                                    <span className="font-extrabold text-slate-900 hover:text-emerald-600 cursor-pointer transition-colors text-sm">{user.name}</span>
                                  </Link>
                                  {user.role === "student" && !user.isActive && (
                                    <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-bold px-1 rounded">Pending Approval</span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 font-mono leading-none">{user.email}</span>
                                {user.createdAt && (
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-semibold">
                                    <Clock className="h-3 w-3" /> Joined: {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* 3. Contact & CNIC */}
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5 text-slate-400" /> {user.phone || "—"}
                              </span>
                              <span className="text-xs font-mono text-slate-500 pl-4.5">CNIC: {user.cnic || "—"}</span>
                            </div>
                          </TableCell>

                          {/* 4. Campus & DOB */}
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-emerald-500" /> {user.branchName || "Global"}
                              </span>
                              <span className="text-xs text-slate-500 pl-4.5">DOB: {user.dob ? new Date(user.dob).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}</span>
                            </div>
                          </TableCell>

                          {/* 5. Academic History */}
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold px-2 py-0">
                                  {user.lastEducation || "Matric"}
                                </Badge>
                                {user.educationStream && (
                                  <span className="text-xs font-bold text-slate-800">— {user.educationStream}</span>
                                )}
                              </div>
                              {user.obtainedMarks ? (
                                <span className="text-xs font-mono text-slate-500">
                                  Marks: <span className="font-extrabold text-slate-700">{user.obtainedMarks}</span> / {user.totalMarks} <span className="text-emerald-600 font-extrabold">{marksPercentage}</span>
                                </span>
                              ) : null}
                            </div>
                          </TableCell>

                          {/* 6. Verification Docs */}
                          <TableCell className="text-center py-4">
                            <div className="flex items-center justify-center gap-2">
                              {user.identityDocumentUrl ? (
                                <a href={user.identityDocumentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-black text-[10px] transition-colors shadow-sm">
                                  <FileText className="h-3 w-3" /> CNIC
                                </a>
                              ) : null}
                              {user.educationDocumentUrl ? (
                                <a href={user.educationDocumentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-black text-[10px] transition-colors shadow-sm">
                                  <ClipboardList className="h-3 w-3" /> Sheet
                                </a>
                              ) : null}
                              {!user.identityDocumentUrl && !user.educationDocumentUrl ? (
                                <span className="text-slate-300 italic text-[11px]">No Uploads</span>
                              ) : null}
                            </div>
                          </TableCell>

                          {/* 7. Status */}
                          <TableCell className="text-center py-4">
                            {user.isActive ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-lg">Active</Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-lg">Inactive</Badge>
                            )}
                          </TableCell>

                          {/* 8. Actions */}
                          <TableCell className="text-center py-4">
                            <div className="flex items-center justify-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl w-48">
                                  <DropdownMenuLabel className="text-xs">Student Options</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setLocation(`/admin/users/${user.id}`)} className="text-xs font-bold gap-2"><Eye className="h-3.5 w-3.5 text-indigo-500" /> View Full Profile</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => {
                                    setFormData({ 
                                      name: user.name || "", 
                                      email: user.email || "", 
                                      phone: user.phone || "", 
                                      role: user.role || "student", 
                                      password: "", 
                                      branchId: user.branchId ? user.branchId.toString() : "",
                                      cnic: user.cnic || "",
                                      dob: user.dob || "",
                                      lastEducation: (user.lastEducation || "") as any,
                                      educationStream: user.educationStream || "",
                                      obtainedMarks: user.obtainedMarks ? user.obtainedMarks.toString() : "",
                                      totalMarks: user.totalMarks ? user.totalMarks.toString() : "",
                                      branchName: user.branchName || "Global"
                                    });
                                    setEditUser(user);
                                  }} className="text-xs font-bold gap-2"><Edit2 className="h-3.5 w-3.5" /> Edit Profile</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setFormData(prev => ({ ...prev, password: "" }));
                                    setResetPasswordUser(user);
                                  }} className="text-xs font-bold gap-2"><Key className="h-3.5 w-3.5" /> Reset Password</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setUserToDelete(user)} className="text-xs font-bold text-rose-600 hover:bg-rose-50 gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete Permanently</DropdownMenuItem>
                                  {user.isActive && (
                                    <DropdownMenuItem onClick={() => disapproveStudent(user.id, user.name)} className="text-xs font-bold text-amber-600 hover:bg-amber-50 gap-2"><XCircle className="h-3.5 w-3.5" /> Disapprove & Deactivate</DropdownMenuItem>
                                  )}
                                  {!user.isActive && (
                                    <DropdownMenuItem onClick={() => approveReg(user.id)} className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> Re-Approve Account</DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                title="Delete Student permanently"
                                onClick={() => setUserToDelete(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
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
                        <TableHead className="font-bold text-slate-700 text-center w-80">Workflow Actions</TableHead>
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
                        <TableHead className="font-bold text-slate-700 text-right pr-6 w-28">Actions</TableHead>
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
                              <div className="flex items-center justify-center gap-2 flex-wrap">
                                <Button size="sm" variant="outline" className="rounded-lg h-7 px-2.5 text-[10px] font-black hover:bg-slate-900 hover:text-white border-slate-200" onClick={() => setLocation(`/admin/users/${u.id}`)}>
                                  View Profile
                                </Button>
                                {pending.map((e: any) => (
                                  <div key={e.id} className="flex items-center gap-1.5 border border-slate-200/60 p-1 rounded-lg bg-slate-50/70 shadow-sm">
                                    <span className="text-[9px] font-extrabold max-w-[90px] truncate text-slate-700">{e.courseName || `Course #${e.courseId}`}</span>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md h-6 px-2 text-[9px] font-bold flex items-center justify-center" disabled={actioning === e.id} onClick={() => approveEnrollment(e.id, e.courseName || `Course #${e.courseId}`, u.name)}>
                                      {actioning === e.id ? <Loader2 className="h-2.5 w-2.5 animate-spin mr-0.5" /> : <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                                      Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-md h-6 px-2 text-[9px] font-bold flex items-center justify-center" disabled={actioning === e.id} onClick={() => disapproveEnrollment(e.id, e.courseName || `Course #${e.courseId}`, u.name)}>
                                      {actioning === e.id ? <Loader2 className="h-2.5 w-2.5 animate-spin mr-0.5" /> : <XCircle className="h-2.5 w-2.5 mr-0.5" />}
                                      Reject
                                    </Button>
                                  </div>
                                ))}
                              </div>
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
                            <TableCell className="text-slate-500">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</TableCell>
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
                            <TableCell className="text-right py-2 pr-6">
                              <div className="flex justify-end items-center gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Delete Student from LMS"
                                  className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                                  onClick={() => setUserToDelete(u)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl border border-slate-200/60 hover:bg-slate-100 shadow-sm">
                                      <MoreVertical className="h-4 w-4 text-slate-500" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
                                    <DropdownMenuItem className="rounded-xl font-bold text-xs gap-2 py-2" onClick={() => setLocation(`/admin/users/${u.id}`)}>
                                      <User className="h-4 w-4 text-slate-400" /> View Profile
                                    </DropdownMenuItem>
                                    
                                    {activeEnrollments.length > 0 && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase px-2 py-1">Active Enrollments</DropdownMenuLabel>
                                        {activeEnrollments.map((e: any) => (
                                          <DropdownMenuItem 
                                            key={e.id} 
                                            className="rounded-xl font-bold text-xs gap-2 py-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50" 
                                            disabled={actioning === e.id}
                                            onClick={() => unenrollStudent(e.id, e.courseName || `Course #${e.courseId}`, u.name)}
                                          >
                                            <XCircle className="h-4 w-4" /> 
                                            Unenroll: {e.courseName || `Course #${e.courseId}`}
                                          </DropdownMenuItem>
                                        ))}
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
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
        <div className="max-w-2xl mx-auto">
          <Card className="border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-lg font-black">Manual Enrollment</h2>
                  <p className="text-xs text-white/60 mt-0.5">Search a student by name, CNIC, or ID and enroll them instantly</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Student Search */}
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 uppercase tracking-wider">Step 1 — Find Student</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, CNIC number, or student ID..."
                    className="pl-9 rounded-xl border-slate-200 h-11 text-sm"
                    value={manualStudentSearch}
                    onChange={e => {
                      setManualStudentSearch(e.target.value);
                      // Clear selected student when search changes
                      if (selectedManualStudent && e.target.value !== (selectedManualStudent.name || "")) {
                        setSelectedManualStudent(null);
                        setManualUserId("");
                      }
                    }}
                  />
                </div>

                {/* Search Results */}
                {manualStudentSearch.trim().length >= 2 && !selectedManualStudent && (
                  <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden shadow-lg">
                    {(() => {
                      try {
                        const q = manualStudentSearch.trim().toLowerCase();
                        if (!users || users.length === 0) {
                          return (
                            <div className="p-4 text-center text-sm text-slate-500">
                              <Loader2 className="h-5 w-5 mx-auto mb-1 text-slate-300 animate-spin" />
                              Loading students...
                            </div>
                          );
                        }

                        const results = users
                          .filter((u: any) => {
                            if (!u || u.role !== "student") return false;
                            if (!u.name && !u.cnic && !u.id) return false;
                            
                            const nameMatch = u.name ? u.name.toLowerCase().includes(q) : false;
                            const cnicMatch = u.cnic ? u.cnic.toLowerCase().includes(q) : false;
                            const idMatch = String(u.id) === q.replace(/^#?stu-?/i, "");
                            
                            return nameMatch || cnicMatch || idMatch;
                          })
                          .slice(0, 8);

                        if (results.length === 0) {
                          return (
                            <div className="p-4 text-center text-sm text-slate-500">
                              <AlertCircle className="h-5 w-5 mx-auto mb-1 text-slate-300" />
                              No students found matching "{manualStudentSearch}"
                            </div>
                          );
                        }

                        return results.map((u: any) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedManualStudent(u);
                              setManualUserId(String(u.id));
                              setManualStudentSearch(u.name || "");
                            }}
                            className="flex items-center gap-4 p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0 border-slate-100 transition-colors"
                          >
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                              {(u.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-slate-900 truncate">{u.name || "Unknown"}</p>
                              <p className="text-xs text-slate-500 font-mono truncate">{u.email || "No email"}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] font-black text-slate-400 uppercase">ID</p>
                              <p className="text-xs font-bold text-slate-700">#{u.id}</p>
                            </div>
                            {u.cnic && (
                              <div className="text-right shrink-0 hidden md:block">
                                <p className="text-[10px] font-black text-slate-400 uppercase">CNIC</p>
                                <p className="text-xs font-mono text-slate-600">{u.cnic}</p>
                              </div>
                            )}
                          </div>
                        ));
                      } catch (error) {
                        console.error('Search error:', error);
                        return (
                          <div className="p-4 text-center text-sm text-rose-500">
                            <AlertCircle className="h-5 w-5 mx-auto mb-1" />
                            Error searching students
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}

                {/* Selected Student Card */}
                {selectedManualStudent && (
                  <div className="mt-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-lg shrink-0">
                      {(selectedManualStudent.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900">{selectedManualStudent.name || "Unknown Student"}</p>
                      <p className="text-xs text-slate-600 font-mono">{selectedManualStudent.email || "No email"}</p>
                      {selectedManualStudent.cnic && (
                        <p className="text-xs text-slate-500 font-mono mt-0.5">CNIC: {selectedManualStudent.cnic}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-black">ID #{selectedManualStudent.id}</Badge>
                      <Badge className={selectedManualStudent.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]" : "bg-amber-100 text-amber-700 border-amber-200 text-[10px]"}>
                        {selectedManualStudent.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <button
                      onClick={() => { setSelectedManualStudent(null); setManualUserId(""); setManualStudentSearch(""); }}
                      className="h-7 w-7 rounded-lg hover:bg-rose-100 flex items-center justify-center text-rose-500 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Course Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 uppercase tracking-wider">Step 2 — Select Course</Label>
                <Select value={manualCourseId} onValueChange={setManualCourseId} disabled={!selectedManualStudent}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11 text-sm">
                    <BookOpen className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue placeholder={selectedManualStudent ? "Choose a course to enroll into..." : "Select a student first"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {courses.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 uppercase tracking-wider">Step 3 — Payment Status</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setManualPaymentStatus("pending")}
                    disabled={!selectedManualStudent || !manualCourseId}
                    className={`p-4 rounded-xl border-2 transition-all font-bold text-sm flex flex-col items-center gap-2 ${
                      manualPaymentStatus === "pending"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50/30"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Clock className="h-5 w-5" />
                    <span>Pending Payment</span>
                    <span className="text-[10px] font-normal text-slate-500">Student uploads receipt</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setManualPaymentStatus("paid")}
                    disabled={!selectedManualStudent || !manualCourseId}
                    className={`p-4 rounded-xl border-2 transition-all font-bold text-sm flex flex-col items-center gap-2 ${
                      manualPaymentStatus === "paid"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Mark as Paid</span>
                    <span className="text-[10px] font-normal text-slate-500">Activate immediately</span>
                  </button>
                </div>
              </div>

              {/* Enroll Button */}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-12 text-sm transition-colors shadow-md shadow-emerald-900/20"
                disabled={!manualUserId || !manualCourseId || createEnrollment.isPending}
                onClick={enrollManually}
              >
                {createEnrollment.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing Enrollment...</>
                  : manualPaymentStatus === "paid"
                  ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Enroll &amp; Activate Course</>
                  : <><GraduationCap className="h-4 w-4 mr-2" /> Enroll &amp; Request Payment</>}
              </Button>

              <p className="text-[10px] text-slate-400 text-center">
                {manualPaymentStatus === "paid" 
                  ? "Student can start learning immediately. No payment verification needed."
                  : "Student will receive a payment request and must submit their fee slip for approval."}
              </p>
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
              Add New Student Profile
            </DialogTitle>
            <DialogDescription className="text-xs">Create a system login profile for a new student.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUserSubmit} className="space-y-4 py-2">
            <div className="bg-slate-50 p-3 rounded-xl ring-1 ring-slate-100 flex flex-col gap-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Account Campus</h3>
              
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

                {/* Profile Picture Upload */}
                <div className="flex flex-col items-center gap-2 pb-2 border-b border-dashed border-slate-200">
                  <div className="relative">
                    <label htmlFor="adminAvatarInput" className="cursor-pointer block">
                      <div className={`h-20 w-20 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all ${
                        avatarPreview ? "border-emerald-500 shadow-md shadow-emerald-100" : "border-dashed border-slate-300 bg-white hover:border-emerald-500"
                      }`}>
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Profile preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="h-6 w-6 text-slate-300" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-600 border border-white flex items-center justify-center shadow-sm">
                        <Upload className="h-3 w-3 text-white" />
                      </div>
                    </label>
                    <input
                      id="adminAvatarInput"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          toast({ title: "Image too large. Maximum size is 2 MB.", variant: "destructive" });
                          return;
                        }
                        setAdminAvatarFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setAdminAvatarPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-slate-700">
                      {avatarPreview ? "Profile Photo Selected ✓" : "Upload Profile Photo (Optional)"}
                    </p>
                    <p className="text-[9px] text-slate-400">JPEG, PNG, WebP · Max 2 MB</p>
                  </div>
                </div>

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

      {/* Edit User Modal - Full Signup Form */}
      <Dialog open={!!editUser} onOpenChange={val => !val && setEditUser(null)}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Student Profile</DialogTitle>
            <DialogDescription>Update student information with all details from registration</DialogDescription>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleEditUserSubmit} className="space-y-6 py-4">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700 border-b pb-2">Personal Information</h3>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">Full Name *</Label>
                  <Input 
                    required 
                    value={formData.name || ""} 
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                    className="rounded-xl" 
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600">Email Address *</Label>
                    <Input 
                      required 
                      type="email" 
                      value={formData.email || ""} 
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} 
                      className="rounded-xl"
                      placeholder="student@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600">Phone Number</Label>
                    <Input 
                      value={formData.phone || ""} 
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} 
                      className="rounded-xl"
                      placeholder="+92 300 1234567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600">CNIC / B-Form Number</Label>
                    <Input 
                      value={formData.cnic || ""} 
                      onChange={e => setFormData(prev => ({ ...prev, cnic: e.target.value }))} 
                      className="rounded-xl"
                      placeholder="12345-1234567-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600">Date of Birth</Label>
                    <Input 
                      type="date" 
                      value={formData.dob || ""} 
                      onChange={e => setFormData(prev => ({ ...prev, dob: e.target.value }))} 
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">Campus Branch</Label>
                  <Select value={formData.branchId || ""} onValueChange={val => setFormData(prev => ({ ...prev, branchId: val }))}>
                    <SelectTrigger className="rounded-xl">
                      <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Select campus branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Global / Online</SelectItem>
                      {branches && branches.map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.name} - {branch.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Academic Information Section */}
              {editUser.role === "student" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 border-b pb-2">Academic Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">Last Education Level</Label>
                      <Select 
                        value={formData.lastEducation || ""} 
                        onValueChange={val => setFormData(prev => ({ ...prev, lastEducation: val as any }))}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select education level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not specified</SelectItem>
                          <SelectItem value="Matric">Matric</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="BS">Bachelor's Degree</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">Education Stream/Field</Label>
                      <Input 
                        value={formData.educationStream || ""} 
                        onChange={e => setFormData(prev => ({ ...prev, educationStream: e.target.value }))} 
                        className="rounded-xl"
                        placeholder="e.g., Science, Commerce, Arts"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">Obtained Marks</Label>
                      <Input 
                        type="number" 
                        value={formData.obtainedMarks || ""} 
                        onChange={e => setFormData(prev => ({ ...prev, obtainedMarks: e.target.value }))} 
                        className="rounded-xl"
                        placeholder="850"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">Total Marks</Label>
                      <Input 
                        type="number" 
                        value={formData.totalMarks || ""} 
                        onChange={e => setFormData(prev => ({ ...prev, totalMarks: e.target.value }))} 
                        className="rounded-xl"
                        placeholder="1100"
                      />
                    </div>
                  </div>

                  {formData.obtainedMarks && formData.totalMarks && Number(formData.totalMarks) > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-700">Percentage:</span>
                        <span className="text-lg font-black text-blue-900">
                          {Math.round((Number(formData.obtainedMarks) / Number(formData.totalMarks)) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* System Settings Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700 border-b pb-2">System Settings</h3>

                {editUser.identityDocumentUrl && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-bold text-purple-700">Identity Document</span>
                      </div>
                      <a 
                        href={editUser.identityDocumentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}

                {editUser.educationDocumentUrl && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700">Education Certificate</span>
                      </div>
                      <a 
                        href={editUser.educationDocumentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
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
            <DialogTitle>Are you sure you want to delete the student?</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete the student <strong>{userToDelete?.name}</strong>? This will permanently delete all of their data from the LMS.
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
