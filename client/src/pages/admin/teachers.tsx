import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  useListUsers, 
  getListUsersQueryKey, 
  useListBranches,
  getListBranchesQueryKey,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useResetPassword
} from "@workspace/api-client-react";
import { 
  Loader2, 
  UserCheck, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Search,
  GraduationCap,
  UserCircle,
  KeyRound,
  FileText,
  Lock,
  Upload,
  Image as ImageIcon,
  X,
  Users,
  Clock,
  CreditCard
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function AdminTeachers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Dialog visibility states
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  
  const [search, setSearch] = useState("");
  const [teacherTab, setTeacherTab] = useState<"all" | "active" | "inactive" | "payroll">("all");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<any>(null);
  
  // Registration Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher" as const,
    branchId: "",
    phone: "",
    cnic: "",
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

  // Edit Form State
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

  // Reset Password State
  const [newPassword, setNewPassword] = useState("");

  const { data: teachers = [], isLoading: usersLoading } = useListUsers({
    role: "teacher", 
    search: search || undefined 
  }, { 
    query: { queryKey: getListUsersQueryKey({ role: "teacher", search: search || undefined }) } 
  });

  const { data: branches = [] } = useListBranches();

  // --- Pipeline Computations & Filters ---
  const teacherList = Array.isArray(teachers) ? teachers : ((teachers as any)?.data || []);
  const countTotal = teacherList.length;
  const countActive = teacherList.filter((t: any) => t.isActive).length;
  const countWithSalary = teacherList.filter((t: any) => t.salary && t.salary > 0).length;

  const filteredTeachers = teacherList.filter((t: any) => {
    if (teacherTab === "active" && !t.isActive) return false;
    if (teacherTab === "payroll" && (!t.salary || t.salary <= 0)) return false;
    return true;
  });

  // API Mutations
  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "teacher" }) });
        setOpen(false);
        setForm({
          name: "",
          email: "",
          password: "",
          role: "teacher",
          branchId: "",
          phone: "",
          cnic: "",
          qualification: "",
          specialization: "",
          experience: "",
          salary: "",
          address: "",
          designation: "",
          gender: "",
          joiningDate: "",
        });
        toast({ title: "Teacher account created successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to create teacher", variant: "destructive" }),
    }
  });

  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "teacher" }) });
        setEditOpen(false);
        setSelectedTeacher(null);
        toast({ title: "Faculty profile updated successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to update teacher", variant: "destructive" }),
    }
  });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "teacher" }) });
        setTeacherToDelete(null);
        toast({ title: "Teacher removed successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to remove teacher", variant: "destructive" }),
    }
  });

  const resetPasswordMutation = useResetPassword({
    mutation: {
      onSuccess: () => {
        setResetOpen(false);
        setNewPassword("");
        setSelectedTeacher(null);
        toast({ title: "Password updated successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to reset password", variant: "destructive" }),
    }
  });

  // Image Upload State & Handler
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const handleImageUpload = async (file: File | null, isEdit: boolean) => {
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
      if (isEdit) {
        setEditForm((current) => ({ ...current, avatar: uploaded.url }));
      } else {
        setForm((current) => ({ ...current, avatar: uploaded.url }));
      }
      toast({ title: "Teacher profile photo uploaded" });
    } catch (error: any) {
      toast({ title: error?.message || "Image upload failed", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Submit Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ 
      data: { 
        ...form, 
        branchId: form.branchId ? Number(form.branchId) : undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        joiningDate: form.joiningDate ? new Date(form.joiningDate).toISOString() : undefined,
      } as any 
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    updateMutation.mutate({
      id: selectedTeacher.id,
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
    if (!selectedTeacher) return;
    resetPasswordMutation.mutate({
      id: selectedTeacher.id,
      data: {
        password: newPassword
      }
    });
  };

  const openEditModal = (teacher: any) => {
    setSelectedTeacher(teacher);
    setEditForm({
      name: teacher.name,
      phone: teacher.phone || "",
      cnic: teacher.cnic || "",
      branchId: teacher.branchId ? teacher.branchId.toString() : "",
      isActive: teacher.isActive,
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
    setEditOpen(true);
  };

  const openResetModal = (teacher: any) => {
    setSelectedTeacher(teacher);
    setNewPassword("");
    setResetOpen(true);
  };

  return (
    <DashboardLayout>
      {/* Visual Faculty Lifecycle & Operations Banner */}
      <div className="mb-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute left-1/3 bottom-0 w-96 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-black text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full border border-indigo-400/20">Faculty Pipeline</span>
              <h2 className="text-2xl font-black tracking-tight mt-2 text-white">Faculty Lifecycle & Operations</h2>
              <p className="text-white/60 text-xs mt-0.5">Real-time tracker for teacher assignments, status, and payroll onboarding.</p>
            </div>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs gap-2 shadow-lg shadow-indigo-900/30 border border-indigo-500/30">
                  <Plus className="h-4 w-4" /> Add Instructor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[750px] rounded-2xl p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <DialogTitle className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Register New Instructor
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="max-h-[60vh] overflow-y-auto px-1 py-1 space-y-4 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Row 1: Name & Designation */}
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Full Name *</Label>
                        <Input 
                          required 
                          value={form.name} 
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="e.g. Prof. Dr. Ahmed Khan" 
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Academic/Faculty Designation</Label>
                        <Input 
                          value={form.designation} 
                          onChange={(e) => setForm({ ...form, designation: e.target.value })}
                          placeholder="e.g. Senior Professor / Lecturer" 
                          className="rounded-xl"
                        />
                      </div>

                      {/* Row 2: Email & Password */}
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Email Address *</Label>
                        <Input 
                          type="email" 
                          required 
                          value={form.email} 
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="ahmed.khan@college.edu" 
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Account Password *</Label>
                        <Input 
                          type="password" 
                          required 
                          value={form.password} 
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="••••••••" 
                          className="rounded-xl"
                        />
                      </div>

                      {/* Row 3: Campus & Phone */}
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Assigned Campus *</Label>
                        <Select 
                          value={form.branchId} 
                          onValueChange={(val) => setForm({ ...form, branchId: val })}
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
                          value={form.phone} 
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="e.g. +92 321 1234567" 
                          className="rounded-xl"
                        />
                      </div>

                      {/* Row 4: CNIC & Gender */}
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">CNIC / National ID</Label>
                        <Input 
                          value={form.cnic} 
                          onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                          placeholder="e.g. 37405-1234567-1" 
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Gender</Label>
                        <Select 
                          value={form.gender} 
                          onValueChange={(val) => setForm({ ...form, gender: val })}
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

                      {/* Row 5: Qualification & Specialization */}
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Qualifications / Degree</Label>
                        <Input 
                          value={form.qualification} 
                          onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                          placeholder="e.g. PhD in Computer Science" 
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Specialization / Expertise</Label>
                        <Input 
                          value={form.specialization} 
                          onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                          placeholder="e.g. Software Engineering / AI" 
                          className="rounded-xl"
                        />
                      </div>

                      {/* Row 6: Experience & Salary */}
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Years of Experience</Label>
                        <Input 
                          value={form.experience} 
                          onChange={(e) => setForm({ ...form, experience: e.target.value })}
                          placeholder="e.g. 8 Years" 
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Monthly Salary (PKR)</Label>
                        <Input 
                          type="number"
                          value={form.salary} 
                          onChange={(e) => setForm({ ...form, salary: e.target.value })}
                          placeholder="e.g. 150000" 
                          className="rounded-xl"
                        />
                      </div>

                      {/* Row 7: Joining Date */}
                      <div className="space-y-2 md:col-span-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Joining Date</Label>
                        <Input 
                          type="date"
                          value={form.joiningDate} 
                          onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>

                      {/* Row 8: Complete Residential Address */}
                      <div className="space-y-2 md:col-span-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Complete Residential Address</Label>
                        <Input 
                          value={form.address} 
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          placeholder="e.g. House #123, Street 4, Sector G-11, Islamabad" 
                          className="rounded-xl"
                        />
                      </div>

                      {/* Row 9: Profile Photo */}
                      <div className="space-y-2 md:col-span-2">
                        <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Faculty Profile Photo</Label>
                        <div className="rounded-xl border border-dashed border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 p-4">
                          {form.avatar ? (
                            <div className="flex items-center gap-3">
                              <img
                                src={form.avatar}
                                alt="Teacher avatar preview"
                                className="h-16 w-16 rounded-full object-cover border-2 border-indigo-600 bg-white"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Photo ready</p>
                                <p className="text-xs text-gray-500 truncate">{form.avatar}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                onClick={() => setForm({ ...form, avatar: "" })}
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
                              <span>{isUploadingImage ? "Uploading..." : form.avatar ? "Replace Photo" : "Choose Photo"}</span>
                              <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                disabled={isUploadingImage}
                                onChange={(e) => {
                                  handleImageUpload(e.target.files?.[0] || null, false);
                                  e.target.value = "";
                                }}
                              />
                            </Label>
                            <Input
                              value={form.avatar}
                              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                              placeholder="Or paste direct image URL"
                              className="flex-1 rounded-xl"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-8 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Register Faculty Account
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Flow Tracker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4 relative">
            {[
              { step: "1", title: "Total Faculty Registered", count: countTotal, desc: "Total academic accounts", color: "from-blue-500/20 to-blue-600/30 border-blue-500/30 text-blue-300" },
              { step: "2", title: "Active Instructors", count: countActive, desc: "Currently active & teaching", color: "from-emerald-500/20 to-emerald-600/30 border-emerald-500/30 text-emerald-300" },
              { step: "3", title: "Payroll Configured", count: countWithSalary, desc: "Approved monthly salaries", color: "from-indigo-500/20 to-indigo-600/30 border-indigo-500/30 text-indigo-300" }
            ].map((s) => (
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

      {/* Chrome Style Tab Bar / Sub Filters */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto select-none">
        {[
          { id: "all", label: "All Faculty", count: countTotal, icon: Users },
          { id: "active", label: "Active Instructors", count: countActive, icon: UserCheck },
          { id: "payroll", label: "Payroll Active", count: countWithSalary, icon: CreditCard }
        ].map(t => (
          <button key={t.id} onClick={() => setTeacherTab(t.id as any)}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black tracking-wider uppercase border-b-2 transition-all shrink-0 ${teacherTab === t.id ? "border-indigo-600 text-indigo-700 font-black" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ml-1 ${teacherTab === t.id ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-slate-100 text-slate-500"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card className="mb-8 border-none shadow-sm ring-1 ring-gray-100 dark:ring-slate-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search instructors by name or email..." 
              className="pl-10 max-w-md rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl ring-1 ring-gray-100 dark:ring-slate-800 overflow-hidden rounded-[24px]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="py-4 font-bold text-gray-400 pl-6">Instructor</TableHead>
                <TableHead className="py-4 font-bold text-gray-400">Campus</TableHead>
                <TableHead className="py-4 font-bold text-gray-400">Contact</TableHead>
                <TableHead className="py-4 font-bold text-gray-400">CNIC / ID Card</TableHead>
                <TableHead className="py-4 font-bold text-gray-400">Status</TableHead>
                <TableHead className="py-4 font-bold text-gray-400 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto opacity-20" />
                  </TableCell>
                </TableRow>
              ) : filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-gray-500 font-bold">
                    No instructors found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher: any) => (
                  <TableRow key={teacher.id} className="hover:bg-indigo-50/10 dark:hover:bg-slate-800/10 transition-colors border-b dark:border-slate-800/60 last:border-0">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-4">
                        {teacher.avatar ? (
                          <img
                            src={teacher.avatar}
                            alt={teacher.name}
                            className="h-10 w-10 rounded-xl object-cover border border-indigo-100 dark:border-indigo-950/40 shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shrink-0">
                            <GraduationCap className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <Link href={`/admin/teachers/${teacher.id}`}>
                            <span className="font-extrabold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors">{teacher.name}</span>
                          </Link>
                          <span className="text-xs text-gray-400 font-medium mt-0.5">Faculty ID: #INST-{teacher.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300">
                        <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                        {teacher.branchName || "Global"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-semibold">
                          <Mail className="h-3.5 w-3.5 text-gray-400" /> {teacher.email}
                        </span>
                        {teacher.phone && (
                          <span className="text-xs flex items-center gap-1.5 text-gray-500 font-medium">
                            <Phone className="h-3.5 w-3.5 text-gray-400" /> {teacher.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        {teacher.cnic || <span className="text-gray-400 font-medium italic">Not Filled</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={teacher.isActive}
                          disabled={updateMutation.isPending && selectedTeacher?.id === teacher.id}
                          onCheckedChange={() => {
                            setSelectedTeacher(teacher);
                            updateMutation.mutate({
                              id: teacher.id,
                              data: {
                                isActive: !teacher.isActive
                              }
                            });
                          }}
                        />
                        <span className={`text-xs font-bold ${teacher.isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`}>
                          {teacher.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl min-w-[170px] shadow-xl">
                          <Link href={`/admin/teachers/${teacher.id}`}>
                            <DropdownMenuItem className="cursor-pointer font-semibold rounded-lg">
                              <UserCircle className="h-4 w-4 mr-2 text-slate-400" /> View Profile
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem className="cursor-pointer font-semibold rounded-lg" onClick={() => openEditModal(teacher)}>
                            <Edit className="h-4 w-4 mr-2 text-slate-400" /> Edit Info
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-semibold rounded-lg" onClick={() => openResetModal(teacher)}>
                            <KeyRound className="h-4 w-4 mr-2 text-slate-400" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-rose-600 font-semibold cursor-pointer rounded-lg focus:bg-rose-50 dark:focus:bg-rose-950/20 focus:text-rose-600"
                            onSelect={(e) => {
                              e.preventDefault();
                              setTeacherToDelete(teacher);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Remove Faculty
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
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[750px] rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Edit className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Edit Faculty Profile
            </DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
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

                  {/* Row 7: Residential Address */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Complete Residential Address</Label>
                    <Input 
                      value={editForm.address} 
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="e.g. House #123, Street 4, Sector G-11, Islamabad" 
                      className="rounded-xl"
                    />
                  </div>

                  {/* Row 7.5: Profile Photo */}
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
                              handleImageUpload(e.target.files?.[0] || null, true);
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

                  {/* Row 8: Account Status */}
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
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">Reset Faculty Password</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <form onSubmit={handleResetSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-1.5"><Lock className="h-4 w-4 text-indigo-500" /> New Password for {selectedTeacher.name}</Label>
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
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!teacherToDelete} onOpenChange={(val) => !val && setTeacherToDelete(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Remove Faculty Member
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to completely remove <strong>{teacherToDelete?.name}</strong> from the system?
              <br/><br/>
              This will safely detach them from any courses they were assigned to and clean up their records. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" className="rounded-xl font-bold" onClick={() => setTeacherToDelete(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              className="rounded-xl font-bold"
              disabled={deleteMutation.isPending}
              onClick={() => {
                deleteMutation.mutate({ id: teacherToDelete.id });
              }}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Yes, Delete Instructor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
