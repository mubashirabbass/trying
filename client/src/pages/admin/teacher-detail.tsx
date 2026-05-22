import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, Link } from "wouter";
import { 
  useGetUser, 
  useListCourses,
  useUpdateUser,
  useResetPassword,
  useListBranches,
  useListAssignments,
  useUpdateCourse,
  getGetUserQueryKey,
  getListUsersQueryKey,
  getListCoursesQueryKey
} from "@workspace/api-client-react";
import { 
  Loader2, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  BookOpen, 
  Users, 
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Edit,
  KeyRound,
  Upload,
  Image as ImageIcon,
  X,
  GraduationCap,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function AdminTeacherDetail() {
  const { id } = useParams();
  const teacherId = id ? Number(id) : 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: teacher, isLoading: userLoading } = useGetUser(teacherId);
  
  // Fetch courses
  const { data: allCourses = [], isLoading: coursesLoading } = useListCourses({});
  const teacherCourses = allCourses.filter((c: any) => c.teacherId === teacherId);

  // Fetch branches
  const { data: branches = [] } = useListBranches({});

  // Fetch assignments
  const { data: allAssignments = [], isLoading: assignmentsLoading } = useListAssignments({});
  const teacherAssignments = allAssignments.filter((a: any) => 
    teacherCourses.some((c: any) => c.id === a.courseId)
  );

  // Mutations
  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(teacherId) });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "teacher" }) });
        setEditOpen(false);
        toast({ title: "Faculty profile updated successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to update profile", variant: "destructive" }),
    }
  });

  const resetPasswordMutation = useResetPassword({
    mutation: {
      onSuccess: () => {
        setResetOpen(false);
        setNewPassword("");
        toast({ title: "Password updated successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to reset password", variant: "destructive" }),
    }
  });

  const updateCourseMutation = useUpdateCourse({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({}) });
        toast({ title: "Course assignments updated successfully" });
        setIsAssignOpen(false);
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to assign course", variant: "destructive" })
    }
  });

  // Modal / Toggle visibility states
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [actioning, setActioning] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    cnic: "",
    branchId: "",
    isActive: true,
    qualification: "",
    specialization: "",
    experience: "",
    salary: "",
    address: "",
    designation: "",
    gender: "",
    joiningDate: "",
    avatar: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [selectedCourseToAssign, setSelectedCourseToAssign] = useState("");

  // Sync edit form with teacher data
  useEffect(() => {
    if (teacher) {
      setEditForm({
        name: teacher.name || "",
        phone: teacher.phone || "",
        cnic: teacher.cnic || "",
        branchId: teacher.branchId ? teacher.branchId.toString() : "",
        isActive: teacher.isActive ?? true,
        qualification: teacher.qualification || "",
        specialization: teacher.specialization || "",
        experience: teacher.experience || "",
        salary: teacher.salary ? teacher.salary.toString() : "",
        address: teacher.address || "",
        designation: teacher.designation || "",
        gender: teacher.gender || "",
        joiningDate: teacher.joiningDate ? new Date(teacher.joiningDate).toISOString().split('T')[0] : "",
        avatar: teacher.avatar || "",
      });
    }
  }, [teacher]);

  const toggleAccountStatus = async () => {
    if (!teacher) return;
    setActioning(true);
    const newStatus = !teacher.isActive;
    try {
      await updateMutation.mutateAsync({
        id: teacherId,
        data: { isActive: newStatus }
      });
      toast({
        title: newStatus ? "Instructor Account Activated" : "Instructor Account Deactivated",
        description: newStatus ? "Login credentials are now active." : "Access to the portal has been suspended."
      });
    } catch (err) {}
    setActioning(false);
  };

  // Image Upload State & Handler
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }

    const body = new FormData();
    body.append("avatar", file);

    try {
      setIsUploadingImage(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/users/upload-avatar", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || error?.error || "Image upload failed");
      }

      const uploaded = await response.json();
      setEditForm((current) => ({ ...current, avatar: uploaded.url }));
      toast({ title: "Teacher profile photo uploaded" });
    } catch (error: any) {
      toast({ title: error?.message || "Image upload failed", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: teacherId,
      data: {
        name: editForm.name,
        phone: editForm.phone || undefined,
        cnic: editForm.cnic || undefined,
        branchId: editForm.branchId ? Number(editForm.branchId) : undefined,
        isActive: editForm.isActive,
        qualification: editForm.qualification || undefined,
        specialization: editForm.specialization || undefined,
        experience: editForm.experience || undefined,
        salary: editForm.salary ? Number(editForm.salary) : undefined,
        address: editForm.address || undefined,
        designation: editForm.designation || undefined,
        gender: editForm.gender || undefined,
        joiningDate: editForm.joiningDate ? new Date(editForm.joiningDate).toISOString() : undefined,
        avatar: editForm.avatar || undefined,
      }
    });
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetPasswordMutation.mutate({
      id: teacherId,
      data: {
        password: newPassword
      }
    });
  };

  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseToAssign) return;
    updateCourseMutation.mutate({
      id: Number(selectedCourseToAssign),
      data: {
        teacherId: teacherId
      } as any
    });
  };

  const handleUnassignCourse = async (courseId: number) => {
    if (confirm("Are you sure you want to unassign this course?")) {
      updateCourseMutation.mutate({
        id: courseId,
        data: {
          teacherId: null
        } as any
      });
    }
  };

  if (userLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!teacher || teacher.role !== 'teacher') {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Teacher Not Found</h2>
          <p className="text-gray-500 mt-2">The teacher you are looking for does not exist or is not registered as faculty.</p>
          <Link href="/admin/teachers">
            <Button className="mt-6">Back to Teachers</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link href="/admin/teachers">
          <Button variant="ghost" className="mb-4 text-gray-500 hover:text-gray-900 dark:hover:text-white -ml-2 font-bold rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Faculty List
          </Button>
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            {teacher.avatar ? (
              <img
                src={teacher.avatar}
                alt={teacher.name}
                className="h-24 w-24 rounded-[32px] object-cover border-2 border-indigo-100 dark:border-indigo-950 shadow-inner shrink-0"
              />
            ) : (
              <div className="h-24 w-24 rounded-[32px] bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-4xl font-black shadow-inner shrink-0">
                {teacher.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">{teacher.name}</h1>
                <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-950 font-bold rounded-lg">
                  Teacher
                </Badge>
                {teacher.isActive ? (
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950 font-bold rounded-lg animate-pulse">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-400 dark:text-gray-600 rounded-lg font-bold">
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-2 mt-1">
                Faculty ID: #INST-{teacher.id} • Registered {new Date(teacher.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => setEditOpen(true)} className="rounded-xl font-bold flex items-center gap-1.5 dark:border-slate-800 dark:hover:bg-slate-800">
              <Edit className="h-4 w-4 text-slate-400" /> Edit Info
            </Button>
            <Button variant="outline" onClick={() => setResetOpen(true)} className="rounded-xl font-bold text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-950 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-indigo-400" /> Reset Password
            </Button>
            <Button 
              className={teacher.isActive ? "bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl border-none shadow-none" : "bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"} 
              onClick={toggleAccountStatus}
              disabled={actioning}
            >
              {actioning ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              {teacher.isActive ? "Deactivate Login" : "Activate Login"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-gray-100 dark:ring-slate-800 rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Faculty Statistics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-950/40">
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{teacherCourses.length}</p>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Courses Taught</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-950/40">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {teacherCourses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0)}
                </p>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">Total Students</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-100 dark:ring-slate-800 rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Faculty Bio-Data & Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category: Professional Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider border-b border-gray-50 dark:border-slate-800/60 pb-1.5">Academic & Career</h3>
                
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Designation</p>
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm">{teacher.designation || "Faculty Member"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Qualifications</p>
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm">{teacher.qualification || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Specialization</p>
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm">{teacher.specialization || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Teaching Experience</p>
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm">{teacher.experience || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Category: Personal Credentials */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider border-b border-gray-50 dark:border-slate-800/60 pb-1.5">Personal Credentials</h3>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">National ID / CNIC</p>
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm">{teacher.cnic || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Gender</p>
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm">{teacher.gender || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Category: Contact details */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider border-b border-gray-50 dark:border-slate-800/60 pb-1.5">Contact Info</h3>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Email Address</p>
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm">{teacher.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Phone Number</p>
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm">{teacher.phone || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Assigned Branch</p>
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm">{teacher.branchName || "Main Campus"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Residential Address</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{teacher.address || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Category: HR / Salary */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider border-b border-gray-50 dark:border-slate-800/60 pb-1.5">Employment & HR</h3>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Monthly Salary</p>
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm">{teacher.salary ? `PKR ${Number(teacher.salary).toLocaleString()}` : "Not declared"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Joining Date</p>
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm">{teacher.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString() : "Not declared"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Dynamic Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-slate-800 w-full justify-start h-14">
              <TabsTrigger value="courses" className="rounded-xl h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                <BookOpen className="h-4 w-4 mr-2" /> Courses Taught
              </TabsTrigger>
              <TabsTrigger value="assignments" className="rounded-xl h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" /> Assignments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-6">
              <Card className="border-none shadow-sm ring-1 ring-gray-100 dark:ring-slate-800 rounded-[24px] overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-gray-50 dark:border-slate-800 flex flex-row items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-xl font-black text-gray-900 dark:text-white">Assigned Courses</CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage class assignments and workloads for this instructor.</p>
                  </div>
                  <Button onClick={() => setIsAssignOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 h-10 px-4">
                    <Plus className="h-4 w-4" /> Assign Course
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-slate-900/50">
                      <TableRow>
                        <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest pl-6 text-gray-400">Course Details</TableHead>
                        <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Category</TableHead>
                        <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Students</TableHead>
                        <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Status</TableHead>
                        <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-right pr-6 text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coursesLoading ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
                      ) : teacherCourses.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-gray-500 font-medium">No courses assigned to this teacher.</TableCell></TableRow>
                      ) : (
                        teacherCourses.map((course: any) => (
                          <tr key={course.id} className="border-b dark:border-slate-800/60 last:border-0 hover:bg-gray-50/50 dark:hover:bg-slate-850/50 transition-colors">
                            <td className="px-6 py-4 pl-6">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                  <BookOpen className="h-5 w-5 text-slate-400" />
                                </div>
                                <span className="font-extrabold text-gray-900 dark:text-white">{course.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-500">{course.category}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300">
                                <Users className="h-3.5 w-3.5 text-gray-400" />
                                {course.enrolledCount || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={
                                course.status === 'live' ? "bg-emerald-50 text-emerald-700 border-emerald-100 font-bold" :
                                course.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-100 font-bold" :
                                "bg-gray-50 text-gray-500 border-gray-100 font-bold"
                              }>
                                {course.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right pr-6 space-x-2">
                              <Link href={`/admin/courses/${course.id}/edit`}>
                                <Button variant="ghost" size="sm" className="font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/20 rounded-xl">View Details</Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleUnassignCourse(course.id)} 
                                className="font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-450 dark:hover:bg-rose-950/20 rounded-xl"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments">
              <Card className="border-none shadow-sm ring-1 ring-gray-100 dark:ring-slate-800 rounded-[24px] overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-gray-50 dark:border-slate-800">
                  <CardTitle className="text-xl font-black text-gray-900 dark:text-white">Assignments Dashboard</CardTitle>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Assignments assigned to classes by this instructor.</p>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-slate-900/50">
                      <TableRow>
                        <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest pl-6 text-gray-400">Assignment Title</TableHead>
                        <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Course</TableHead>
                        <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Due Date</TableHead>
                        <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Total Marks</TableHead>
                        <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-right pr-6 text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignmentsLoading ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
                      ) : teacherAssignments.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-gray-500 font-medium">No assignments posted by this instructor.</TableCell></TableRow>
                      ) : (
                        teacherAssignments.map((assignment: any) => {
                          const associatedCourse = teacherCourses.find((c: any) => c.id === assignment.courseId);
                          return (
                            <tr key={assignment.id} className="border-b dark:border-slate-800/60 last:border-0 hover:bg-gray-50/50 dark:hover:bg-slate-850/50 transition-colors">
                              <td className="px-6 py-4 pl-6">
                                <span className="font-extrabold text-gray-900 dark:text-white">{assignment.title}</span>
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-500">
                                {associatedCourse ? associatedCourse.title : `Course #${assignment.courseId}`}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 font-semibold">
                                {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-black">
                                {assignment.totalMarks || 100} Marks
                              </td>
                              <td className="px-6 py-4 text-right pr-6">
                                <Link href={`/admin/courses/${assignment.courseId}/content`}>
                                  <Button variant="ghost" size="sm" className="font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/20 rounded-xl">Manage Content</Button>
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Assign Course Modal */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">Assign Course to Instructor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignCourse} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="font-bold">Select Course *</Label>
              <Select value={selectedCourseToAssign} onValueChange={setSelectedCourseToAssign} required>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {allCourses
                    .filter((c: any) => c.teacherId !== teacherId)
                    .map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title} ({course.category}) {course.teacherName ? ` - Current: ${course.teacherName}` : ' - Unassigned'}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setIsAssignOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold" disabled={updateCourseMutation.isPending}>
                {updateCourseMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Assign Course
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Faculty Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[750px] rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Edit className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Edit Faculty Profile
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
            <div className="max-h-[60vh] overflow-y-auto px-1 py-1 space-y-4 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Row 1: Name & Designation */}
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Full Name *</Label>
                  <Input 
                    required 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="e.g. Prof. Dr. Ahmed Khan" 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Academic/Faculty Designation</Label>
                  <Input 
                    value={editForm.designation} 
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    placeholder="e.g. Senior Professor / Lecturer" 
                    className="rounded-xl"
                  />
                </div>

                {/* Row 2: Campus & Phone */}
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Assigned Campus *</Label>
                  <Select 
                    value={editForm.branchId} 
                    onValueChange={(val) => setEditForm({ ...editForm, branchId: val })}
                    required
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select Campus" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {Array.isArray(branches) && branches.map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Phone Number</Label>
                  <Input 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="e.g. +92 321 1234567" 
                    className="rounded-xl"
                  />
                </div>

                {/* Row 3: CNIC & Gender */}
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">CNIC / National ID</Label>
                  <Input 
                    value={editForm.cnic} 
                    onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })}
                    placeholder="e.g. 37405-1234567-1" 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Gender</Label>
                  <Select 
                    value={editForm.gender} 
                    onValueChange={(val) => setEditForm({ ...editForm, gender: val })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 4: Qualification & Specialization */}
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Qualifications / Degree</Label>
                  <Input 
                    value={editForm.qualification} 
                    onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                    placeholder="e.g. PhD in Computer Science" 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Specialization / Expertise</Label>
                  <Input 
                    value={editForm.specialization} 
                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                    placeholder="e.g. Software Engineering / AI" 
                    className="rounded-xl"
                  />
                </div>

                {/* Row 5: Experience & Salary */}
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Years of Experience</Label>
                  <Input 
                    value={editForm.experience} 
                    onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                    placeholder="e.g. 8 Years" 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Monthly Salary (PKR)</Label>
                  <Input 
                    type="number"
                    value={editForm.salary} 
                    onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                    placeholder="e.g. 150000" 
                    className="rounded-xl"
                  />
                </div>

                {/* Row 6: Joining Date */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Joining Date</Label>
                  <Input 
                    type="date"
                    value={editForm.joiningDate} 
                    onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                {/* Row 7: Complete Residential Address */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Complete Residential Address</Label>
                  <Input 
                    value={editForm.address} 
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="e.g. House #123, Street 4, Sector G-11, Islamabad" 
                    className="rounded-xl"
                  />
                </div>

                {/* Row 8: Profile Photo */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Faculty Profile Photo</Label>
                  <div className="rounded-xl border border-dashed border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 p-4">
                    {editForm.avatar ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={editForm.avatar}
                          alt="Teacher avatar preview"
                          className="h-16 w-16 rounded-full object-cover border-2 border-indigo-600 bg-white"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Photo ready</p>
                          <p className="text-xs text-gray-500 truncate">{editForm.avatar}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                          onClick={() => setEditForm({ ...editForm, avatar: "" })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-800 flex items-center justify-center text-gray-400">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Upload teacher profile picture</p>
                          <p className="text-xs text-gray-500">JPG, PNG, or WEBP up to 10MB</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-3">
                      <Label className="flex items-center gap-2 cursor-pointer border border-input dark:border-slate-800 bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-xl w-fit font-bold text-xs">
                        {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <span>{isUploadingImage ? "Uploading..." : editForm.avatar ? "Replace Photo" : "Choose Photo"}</span>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={isUploadingImage}
                          onChange={(e) => {
                            handleImageUpload(e.target.files?.[0] || null);
                            e.target.value = "";
                          }}
                        />
                      </Label>
                      <Input
                        value={editForm.avatar}
                        onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                        placeholder="Or paste direct image URL"
                        className="flex-1 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 9: Account Status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 md:col-span-2">
                  <div className="flex flex-col">
                    <Label className="font-bold text-sm text-gray-900 dark:text-white">Account Status</Label>
                    <span className="text-xs text-gray-400">Toggle whether this teacher has system access</span>
                  </div>
                  <Switch 
                    checked={editForm.isActive}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-8 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">Reset Faculty Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1.5"><Lock className="h-4 w-4 text-indigo-500" /> New Password for {teacher.name}</Label>
              <Input 
                type="password"
                required 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter secure new password" 
                className="rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setResetOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-6 text-white rounded-xl font-bold" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
