import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetUser, 
  useListEnrollments, 
  useListPayments,
  useDeleteEnrollment,
  getListEnrollmentsQueryKey,
  useListBranches,
  getListBranchesQueryKey,
  getGetUserQueryKey
} from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  BookOpen, 
  CreditCard, 
  FileText, 
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Download,
  Eye,
  File,
  Edit2,
  Key,
  Plus,
  GraduationCap,
  Calendar,
  IdCard,
} from "lucide-react";
import { GcufCard } from "@/pages/student/student-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminStudentDetail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { id } = useParams();
  const studentId = id ? Number(id) : 0;
  const { data: student, isLoading: userLoading } = useGetUser(studentId);
  
  const { data: enrollments = [], isLoading: enrollLoading } = useListEnrollments({ userId: studentId });
  const { data: payments = [], isLoading: payLoading } = useListPayments({ userId: studentId });

  // Fetch identity verification documents
  const { data: identityDoc, isLoading: docsLoading } = useQuery({
    queryKey: ['identity-verification', studentId],
    queryFn: async () => {
      const res = await fetch(`/api/identity-verification?userId=${studentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!studentId,
  });

  const identityDocs = identityDoc ? [identityDoc] : [];

  const unenrollMutation = useDeleteEnrollment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({ userId: studentId }) });
        toast({ title: "Student unenrolled successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to unenroll", variant: "destructive" }),
    }
  });

  const handleUnenroll = (enrollId: number) => {
    if (confirm("Are you sure you want to unenroll this student? This action cannot be undone.")) {
      unenrollMutation.mutate({ id: enrollId });
    }
  };

  const [, setLocation] = useLocation();
  const [editOpen, setEditOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    branchId: "",
    cnic: "",
    dob: "",
    gender: "",
    address: "",
    lastEducation: "" as "Matric" | "Intermediate" | "BS" | "",
    educationStream: "",
    obtainedMarks: "",
    totalMarks: "",
    // Student Card fields
    nameUrdu: "",
    fatherName: "",
    regNo: "",
    rollNo: "",
    session: "",
    semesterTerm: "",
    shift: "",
    department: "",
  });
  const [cnicFile, setCnicFile] = useState<File | null>(null);
  const [educationFile, setEducationFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: branchesResponse = [] } = useListBranches({ query: { queryKey: getListBranchesQueryKey() } });
  const branches = Array.isArray(branchesResponse) ? branchesResponse : [];

  const initEditForm = () => {
    if (!student) return;
    setFormData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      branchId: student.branchId ? String(student.branchId) : "",
      cnic: student.cnic || "",
      dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : "",
      gender: student.gender || "",
      address: student.address || "",
      lastEducation: (student.qualification || "") as any,
      educationStream: student.specialization || "",
      obtainedMarks: student.obtainedMarks ? String(student.obtainedMarks) : "",
      totalMarks: student.totalMarks ? String(student.totalMarks) : "",
      // Student Card fields
      nameUrdu: (student as any).nameUrdu || "",
      fatherName: (student as any).fatherName || "",
      regNo: (student as any).regNo || "",
      rollNo: (student as any).rollNo || "",
      session: (student as any).session || "",
      semesterTerm: (student as any).semesterTerm || "",
      shift: (student as any).shift || "",
      department: (student as any).department || "",
    });
    setCnicFile(null);
    setEducationFile(null);
    setEditOpen(true);
  };

  const approveStudent = async () => {
    setActioning(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/users/${studentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: true })
      });
      if (!res.ok) throw new Error("Approval failed");
      toast({ title: "✅ Student Approved!", description: "The account is now active and verified." });
      
      queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(studentId) });
    } catch (err: any) {
      toast({ title: "Failed to approve student", description: err.message, variant: "destructive" });
    } finally {
      setActioning(false);
    }
  };

  const deactivateStudent = async () => {
    setActioning(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/users/${studentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: false })
      });
      if (!res.ok) throw new Error("Deactivation failed");
      toast({ title: "Student Account Deactivated", description: "The account is now inactive." });
      queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(studentId) });
    } catch (err: any) {
      toast({ title: "Failed to deactivate student", description: err.message, variant: "destructive" });
    } finally {
      setActioning(false);
    }
  };

  const rejectStudent = async () => {
    if (!confirm("Are you sure you want to REJECT and permanently delete this registration request?")) return;
    setActioning(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/users/${studentId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Rejection failed");
      toast({ title: "Registration Request Rejected", description: "The student registration request has been deleted." });
      setLocation("/admin/users");
    } catch (err: any) {
      toast({ title: "Failed to reject registration", description: err.message, variant: "destructive" });
    } finally {
      setActioning(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/users/${studentId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || data?.message || "Reset failed");
      }
      toast({ title: "✅ Password Reset Successfully!", description: `Password for ${student?.name} has been updated.` });
      setResetPasswordOpen(false);
      setNewPassword("");
    } catch (err: any) {
      toast({ title: "Failed to reset password", description: err.message, variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    let identityDocumentUrl = student.identityDocumentUrl || "";
    let educationDocumentUrl = student.educationDocumentUrl || "";

    try {
      setIsUploading(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      // Upload CNIC if changed
      if (cnicFile) {
        const fd = new FormData();
        fd.append("file", cnicFile);
        const res = await fetch("/api/upload/image", { 
          method: "POST", 
          headers: { "Authorization": `Bearer ${token}` },
          body: fd 
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "CNIC Upload Failed");
        identityDocumentUrl = data.url;
      }

      // Upload transcript if changed
      if (educationFile) {
        const fd = new FormData();
        fd.append("file", educationFile);
        const isPdf = educationFile.type === "application/pdf";
        const endpoint = isPdf ? "/api/upload/pdf" : "/api/upload/image";
        const res = await fetch(endpoint, { 
          method: "POST", 
          headers: { "Authorization": `Bearer ${token}` },
          body: fd 
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Transcript Upload Failed");
        educationDocumentUrl = data.url;
      }
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
      setIsUploading(false);
      return;
    }

    setIsUploading(false);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/users/${studentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          branchId: formData.branchId ? Number(formData.branchId) : undefined,
          cnic: formData.cnic || undefined,
          dob: formData.dob ? new Date(formData.dob) : undefined,
          gender: formData.gender || undefined,
          address: formData.address || undefined,
          qualification: formData.lastEducation || undefined,
          specialization: formData.educationStream || undefined,
          obtainedMarks: formData.obtainedMarks ? Number(formData.obtainedMarks) : undefined,
          totalMarks: formData.totalMarks ? Number(formData.totalMarks) : undefined,
          identityDocumentUrl: identityDocumentUrl || undefined,
          educationDocumentUrl: educationDocumentUrl || undefined,
          // Student Card fields
          nameUrdu: formData.nameUrdu || undefined,
          fatherName: formData.fatherName || undefined,
          regNo: formData.regNo || undefined,
          rollNo: formData.rollNo || undefined,
          session: formData.session || undefined,
          semesterTerm: formData.semesterTerm || undefined,
          shift: formData.shift || undefined,
          department: formData.department || undefined,
        })
      });
      if (!res.ok) throw new Error("Update failed");
      
      toast({ title: "✅ Profile Updated Successfully!" });
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(studentId) });
      queryClient.invalidateQueries({ queryKey: ['identity-verification', studentId] });
    } catch (err: any) {
      toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
    }
  };

  if (userLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    console.log('Student data:', student);
    console.log('Student ID:', studentId);
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Student Not Found</h2>
          <p className="text-gray-500 mt-2">The student you are looking for does not exist or has been removed.</p>
          <p className="text-sm text-gray-400 mt-2">Student ID: {studentId}</p>
          <p className="text-sm text-gray-400">Please check if you're logged in and have the correct permissions.</p>
          <Link href="/admin/users">
            <Button className="mt-6">Back to Students</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link href="/admin/users">
          <Button variant="ghost" className="mb-4 text-gray-500 hover:text-gray-900 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Student List
          </Button>
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-[32px] overflow-hidden bg-primary/10 flex items-center justify-center text-primary text-4xl font-black shadow-inner shrink-0 border border-slate-200">
              {student.avatar ? (
                <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                (student.name || "S").charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-gray-900">{student.name}</h1>
                <Badge className={student.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}>
                  {student.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                Student ID: #STU-{student.id} • Joined {new Date(student.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="rounded-xl font-bold h-10 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm" onClick={initEditForm}>
              <Edit2 className="h-4 w-4 mr-2 text-slate-500" /> Edit Profile
            </Button>
            <Button variant="outline" className="rounded-xl font-bold h-10 border-amber-200 text-amber-700 hover:bg-amber-50 shadow-sm" onClick={() => { setNewPassword(""); setResetPasswordOpen(true); }}>
              <Key className="h-4 w-4 mr-2 text-amber-500" /> Reset Password
            </Button>
            {student.isActive ? (
              <Button 
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border-none font-bold shadow-none rounded-xl h-10 px-4 transition-colors"
                onClick={deactivateStudent}
                disabled={actioning}
              >
                {actioning ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <XCircle className="h-4 w-4 mr-1.5" />}
                Deactivate Account
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 px-4 shadow-sm transition-colors"
                  onClick={approveStudent}
                  disabled={actioning}
                >
                  {actioning ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                  Approve Account
                </Button>
                <Button 
                  variant="outline"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold rounded-xl h-10 px-4 shadow-none transition-colors"
                  onClick={rejectStudent}
                  disabled={actioning}
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Reject Registration
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info Cards */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Email Address</p>
                  <p className="font-bold text-gray-900">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Phone Number</p>
                  <p className="font-bold text-gray-900">{student.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Campus Branch</p>
                  <p className="font-bold text-gray-900">{student.branchName || "Global / Online"}</p>
                </div>
              </div>
              {student.cnic && (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">CNIC / Form-B</p>
                    <p className="font-bold text-gray-900">{student.cnic}</p>
                  </div>
                </div>
              )}
              {student.dob && (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Date of Birth</p>
                    <p className="font-bold text-gray-900">{new Date(student.dob).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Academic & Qualification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Degree / Qualification</p>
                  <p className="font-bold text-gray-900">{student.qualification || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Specialization / Stream</p>
                  <p className="font-bold text-gray-900">{student.specialization || "Not provided"}</p>
                </div>
              </div>
              {student.obtainedMarks !== undefined && student.totalMarks !== undefined && student.obtainedMarks !== null && student.totalMarks !== null && (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Obtained Marks</p>
                    <p className="font-bold text-gray-900">
                      {student.obtainedMarks} / {student.totalMarks} 
                      <span className="text-xs text-gray-500 font-semibold ml-2">
                        ({Math.round((student.obtainedMarks / student.totalMarks) * 100)}%)
                      </span>
                    </p>
                  </div>
                </div>
              )}
              {student.educationDocumentUrl && (
                <div className="pt-2 border-t border-gray-50">
                  <a 
                    href={student.educationDocumentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700 hover:text-slate-900 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                      <span className="text-xs font-bold truncate max-w-[180px]">Education Certificate</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
                  </a>
                </div>
              )}
              {student.identityDocumentUrl && (
                <div className="pt-2 border-t border-gray-50">
                  <a 
                    href={student.identityDocumentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700 hover:text-slate-900 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <IdCard className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                      <span className="text-xs font-bold truncate max-w-[180px]">Identity Document</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Content Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="enrollments" className="space-y-6">
            <TabsList className="bg-white p-1 rounded-2xl shadow-sm ring-1 ring-gray-100 w-full justify-start h-14">
              <TabsTrigger value="enrollments" className="rounded-xl h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                <BookOpen className="h-4 w-4 mr-2" /> Enrollments
              </TabsTrigger>
              <TabsTrigger value="payments" className="rounded-xl h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                <CreditCard className="h-4 w-4 mr-2" /> Payments
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-xl h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" /> Documents
              </TabsTrigger>
              <TabsTrigger value="student-card" className="rounded-xl h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                <IdCard className="h-4 w-4 mr-2" /> Student Card
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-xl h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                <Clock className="h-4 w-4 mr-2" /> Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enrollments">
              <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Course</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Enrolled Date</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Progress</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollLoading ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
                    ) : enrollments.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center text-gray-500 font-medium">No courses enrolled yet.</TableCell></TableRow>
                    ) : (
                      enrollments.map((enr: any) => (
                        <tr key={enr.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4 font-bold text-gray-900">{enr.courseName || `Course #${enr.courseId}`}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">{enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${enr.progress || 0}%` }} />
                              </div>
                              <span className="text-xs font-black text-primary">{enr.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-rose-600 font-bold hover:bg-rose-50 rounded-xl"
                              onClick={() => handleUnenroll(enr.id)}
                              disabled={unenrollMutation.isPending}
                            >
                              {unenrollMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unenroll"}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Payment ID</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Course</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Amount</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Plan & Details</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Method</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payLoading ? (
                      <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
                    ) : payments.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="h-32 text-center text-gray-500 font-medium">No payment history found.</TableCell></TableRow>
                    ) : (
                      payments.map((pay: any) => (
                        <tr key={pay.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4 font-mono text-xs font-bold text-gray-500 uppercase">#PAY-{pay.id}</td>
                          <td className="px-4 py-4 font-bold text-gray-900">{pay.courseName || `Course #${pay.courseId}`}</td>
                          <td className="px-4 py-4 font-black text-gray-900">Rs. {(pay.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-4 text-xs font-semibold text-slate-650">
                            {pay.paymentPlan === "monthly" ? (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-0.5 font-bold">
                                Installment #{pay.installmentNumber} of {pay.installmentMonths || "3"}M
                              </span>
                            ) : (
                              <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-0.5 font-bold">
                                Full Payment
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="outline" className="capitalize border-slate-200">{pay.method?.replace('_', ' ') || 'Unknown'}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={
                              pay.status === 'verified' ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100" :
                              pay.status === 'pending' ? "bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-100" :
                              "bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-100"
                            }>
                              {pay.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                  <CardTitle className="text-lg font-black">Uploaded Documents</CardTitle>
                  <p className="text-sm text-gray-500 font-medium">All documents submitted by the student for verification and enrollment</p>
                </CardHeader>
                <CardContent className="p-6">
                  {docsLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Education Document */}
                      {student?.educationDocumentUrl && (
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                              <Award className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">Education Certificate</h4>
                              <p className="text-xs text-gray-500 font-medium">
                                {student.qualification || "Academic qualification document"}
                              </p>
                              {student.obtainedMarks && student.totalMarks && (
                                <p className="text-xs text-blue-600 font-bold mt-1">
                                  Marks: {student.obtainedMarks}/{student.totalMarks} ({Math.round((student.obtainedMarks / student.totalMarks) * 100)}%)
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={student.educationDocumentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="h-10 w-10 rounded-xl bg-white hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors"
                              title="View Document"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                            <a 
                              href={student.educationDocumentUrl} 
                              download
                              className="h-10 w-10 rounded-xl bg-white hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors"
                              title="Download Document"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Identity Document */}
                      {student?.identityDocumentUrl && (
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                              <IdCard className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">Identity Document</h4>
                              <p className="text-xs text-gray-500 font-medium">
                                {student.cnic || "CNIC / B-Form verification document"}
                              </p>
                              {student.isIdentityVerified ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-500 border-none text-white text-[10px] px-2 py-0.5 mt-1 font-bold">
                                  Verified
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500 hover:bg-amber-500 border-none text-white text-[10px] px-2 py-0.5 mt-1 font-bold animate-pulse">
                                  Pending Verification
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={student.identityDocumentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="h-10 w-10 rounded-xl bg-white hover:bg-purple-100 flex items-center justify-center text-purple-600 transition-colors"
                              title="View Document"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                            <a 
                              href={student.identityDocumentUrl} 
                              download
                              className="h-10 w-10 rounded-xl bg-white hover:bg-purple-100 flex items-center justify-center text-purple-600 transition-colors"
                              title="Download Document"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* No Documents Message */}
                      {!student?.educationDocumentUrl && !student?.identityDocumentUrl && (
                        <div className="text-center py-12">
                          <File className="h-16 w-16 mx-auto text-gray-200 mb-4" />
                          <h3 className="text-lg font-bold text-gray-900 mb-2">No Documents Uploaded</h3>
                          <p className="text-sm text-gray-500">
                            This student hasn't uploaded any documents yet.
                          </p>
                        </div>
                      )}

                      {/* Document Summary */}
                      {(student?.educationDocumentUrl || student?.identityDocumentUrl) && (
                        <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm">Document Summary</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                Total documents: {[student?.educationDocumentUrl, student?.identityDocumentUrl].filter(Boolean).length}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="student-card">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Visual Card Preview */}
                <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-red-600 to-red-400" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold text-gray-700 flex items-center gap-2">
                      <IdCard className="h-5 w-5 text-red-600" /> Card Visual Preview
                    </CardTitle>
                    <CardDescription>Visual replica of the official student identity card.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center py-8 bg-slate-50 border-t border-slate-100">
                    <div className="scale-95 sm:scale-100 origin-center">
                      <GcufCard user={student} />
                    </div>
                  </CardContent>
                </Card>

                {/* Details and Edit Action */}
                <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base font-bold text-gray-700">Student Card Information</CardTitle>
                      <CardDescription>Metadata displayed on the physical student card.</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      className="rounded-xl font-bold h-9 border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={initEditForm}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Edit Card Fields
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 border-t border-slate-100">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-bold text-xs text-gray-500 uppercase tracking-wider py-3 px-6">Name (Urdu)</TableCell>
                          <TableCell className="text-sm font-semibold py-3 px-6 text-right" dir="rtl">
                            {student.nameUrdu || <span className="text-gray-300 font-normal italic">Not set</span>}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold text-xs text-gray-500 uppercase tracking-wider py-3 px-6">Father's Name</TableCell>
                          <TableCell className="text-sm font-semibold py-3 px-6">
                            {student.fatherName || <span className="text-gray-300 font-normal italic">Not set</span>}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold text-xs text-gray-500 uppercase tracking-wider py-3 px-6">Registration No</TableCell>
                          <TableCell className="text-sm font-semibold py-3 px-6">
                            {student.regNo || <span className="text-gray-300 font-normal italic">Not set</span>}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold text-xs text-gray-500 uppercase tracking-wider py-3 px-6">Roll No</TableCell>
                          <TableCell className="text-sm font-semibold py-3 px-6">
                            {student.rollNo || <span className="text-gray-300 font-normal italic">Not set</span>}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold text-xs text-gray-500 uppercase tracking-wider py-3 px-6">Session</TableCell>
                          <TableCell className="text-sm font-semibold py-3 px-6">
                            {student.session || <span className="text-gray-300 font-normal italic">Not set</span>}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold text-xs text-gray-500 uppercase tracking-wider py-3 px-6">Term / Semester</TableCell>
                          <TableCell className="text-sm font-semibold py-3 px-6">
                            {student.semesterTerm || <span className="text-gray-300 font-normal italic">Not set</span>}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold text-xs text-gray-500 uppercase tracking-wider py-3 px-6">Shift</TableCell>
                          <TableCell className="text-sm font-semibold py-3 px-6">
                            {student.shift || <span className="text-gray-300 font-normal italic">Not set</span>}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold text-xs text-gray-500 uppercase tracking-wider py-3 px-6">Department</TableCell>
                          <TableCell className="text-sm font-semibold py-3 px-6">
                            {student.department || <span className="text-gray-300 font-normal italic">Not set</span>}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity">
               <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] p-8 text-center text-gray-400">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  <p className="font-bold">Coming Soon</p>
                  <p className="text-sm">Detailed student activity logs will be available here.</p>
               </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Edit Student Profile Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-lg font-black text-slate-900">
              <Edit2 className="h-5 w-5 text-emerald-600" />
              Edit Student Profile
            </DialogTitle>
            <DialogDescription className="text-xs">Modify identity details and academic records for this student.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="bg-slate-50 p-3 rounded-xl ring-1 ring-slate-100 flex flex-col gap-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Full Name</Label>
                  <Input required value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="rounded-xl bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Email Address</Label>
                  <Input required type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} className="rounded-xl bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="rounded-xl bg-white" />
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
                  <Label className="text-xs font-bold text-slate-600">Gender</Label>
                  <Select value={formData.gender} onValueChange={val => setFormData(prev => ({ ...prev, gender: val }))}>
                    <SelectTrigger className="rounded-xl bg-white"><SelectValue placeholder="Select gender..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Home Address</Label>
                  <Input value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} className="rounded-xl bg-white" placeholder="Complete address..." />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-xl flex flex-col gap-4">
              <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                Academic Qualification & Documents
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">CNIC / Form-B Number</Label>
                  <Input required value={formData.cnic} onChange={e => setFormData(prev => ({ ...prev, cnic: e.target.value }))} className="rounded-xl bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Date of Birth</Label>
                  <Input required type="date" value={formData.dob} onChange={e => setFormData(prev => ({ ...prev, dob: e.target.value }))} className="rounded-xl bg-white" />
                </div>
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
                      <Input required value={formData.educationStream} onChange={e => setFormData(prev => ({ ...prev, educationStream: e.target.value }))} className="rounded-xl bg-slate-50" />
                    </div>
                  )}

                  {(formData.lastEducation === "Matric" || formData.lastEducation === "Intermediate") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600">Obtained Marks</Label>
                        <Input required type="number" value={formData.obtainedMarks} onChange={e => setFormData(prev => ({ ...prev, obtainedMarks: e.target.value }))} className="rounded-xl bg-slate-50" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600">Total Marks</Label>
                        <Input required type="number" value={formData.totalMarks} onChange={e => setFormData(prev => ({ ...prev, totalMarks: e.target.value }))} className="rounded-xl bg-slate-50" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600">Update Transcript / Result Card</Label>
                    <Input type="file" accept="image/*,.pdf" onChange={e => setEducationFile(e.target.files?.[0] || null)} className="rounded-xl bg-slate-50 pt-2 text-xs" />
                    <p className="text-[10px] text-slate-400">Leave blank to keep existing document</p>
                  </div>
                </div>
              )}
            </div>

            {/* Student Card Section */}
            <div className="bg-red-50/40 border border-red-100 p-4 rounded-xl flex flex-col gap-4">
              <h3 className="text-xs font-black text-red-800 uppercase tracking-wider flex items-center gap-1">
                🪪 Student Card Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Registration No <span className="text-slate-400 font-normal">(auto-assigned on approval)</span></Label>
                  <Input placeholder="e.g. 2026-GCCSC-01" value={formData.regNo} onChange={e => setFormData(prev => ({ ...prev, regNo: e.target.value }))} className="rounded-xl bg-white font-mono" />
                  <p className="text-[10px] text-slate-400">Format: 2026-GCCSC-XX · Auto-filled when enrollment is approved</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Roll No <span className="text-slate-400 font-normal">(auto-assigned on approval)</span></Label>
                  <Input placeholder="e.g. GC-01" value={formData.rollNo} onChange={e => setFormData(prev => ({ ...prev, rollNo: e.target.value }))} className="rounded-xl bg-white font-mono" />
                  <p className="text-[10px] text-slate-400">Format: GC-XX · Sequential, assigned when course is activated</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Session (e.g. 2024-2028)</Label>
                  <Input placeholder="2024-2028" value={formData.session} onChange={e => setFormData(prev => ({ ...prev, session: e.target.value }))} className="rounded-xl bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Semester / Term</Label>
                  <Select value={formData.semesterTerm} onValueChange={val => setFormData(prev => ({ ...prev, semesterTerm: val }))}>
                    <SelectTrigger className="rounded-xl bg-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spring">Spring</SelectItem>
                      <SelectItem value="Fall">Fall</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Shift</Label>
                  <Select value={formData.shift} onValueChange={val => setFormData(prev => ({ ...prev, shift: val }))}>
                    <SelectTrigger className="rounded-xl bg-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">Morning</SelectItem>
                      <SelectItem value="Evening">Evening</SelectItem>
                      <SelectItem value="Self-Support">Self-Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Department</Label>
                  <Input placeholder="e.g. Computer Science" value={formData.department} onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))} className="rounded-xl bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Father's Name</Label>
                  <Input placeholder="Father's full name" value={formData.fatherName} onChange={e => setFormData(prev => ({ ...prev, fatherName: e.target.value }))} className="rounded-xl bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Name in Urdu (اردو نام)</Label>
                  <Input placeholder="اردو میں نام" value={formData.nameUrdu} onChange={e => setFormData(prev => ({ ...prev, nameUrdu: e.target.value }))} className="rounded-xl bg-white" dir="rtl" />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex gap-2">
              <Button type="button" variant="outline" className="rounded-xl text-xs h-9" onClick={() => setEditOpen(false)} disabled={isUploading}>Cancel</Button>
              <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-md" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Uploading Documents...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Save Profile Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={(open) => { setResetPasswordOpen(open); if (!open) setNewPassword(""); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <Key className="h-5 w-5 text-amber-600" />
              Reset Student Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Set a new password for <strong>{student?.name}</strong>. They will need to use this new password to login.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="bg-amber-50 text-amber-800 border border-amber-200 p-3 rounded-xl text-xs leading-relaxed flex gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              Make sure to share the new password securely with the student. Passwords are stored encrypted and cannot be retrieved.
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">New Password</Label>
              <Input
                required
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="rounded-xl"
                minLength={6}
              />
            </div>
            <DialogFooter className="pt-2 flex gap-2">
              <Button type="button" variant="outline" className="rounded-xl text-xs flex-1" onClick={() => setResetPasswordOpen(false)} disabled={resetLoading}>Cancel</Button>
              <Button type="submit" className="rounded-xl text-xs flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold" disabled={resetLoading}>
                {resetLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Resetting...</> : <><Key className="h-3.5 w-3.5 mr-1.5" /> Reset Password</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
