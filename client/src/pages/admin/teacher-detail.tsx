import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, Link } from "wouter";
import { 
  useGetUser, 
  useListCourses,
  useUpdateUser,
  useResetPassword,
  useListBranches,
  getGetUserQueryKey,
  getListUsersQueryKey
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
  KeyRound
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  
  // Filter courses by teacherId
  const { data: allCourses = [], isLoading: coursesLoading } = useListCourses({});
  const teacherCourses = allCourses.filter((c: any) => c.teacherId === teacherId);

  const { data: branches = [] } = useListBranches({});

  // Form states
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    cnic: "",
    branchId: "",
    isActive: true,
  });

  const [newPassword, setNewPassword] = useState("");

  // Sync edit form with teacher data
  useEffect(() => {
    if (teacher) {
      setEditForm({
        name: teacher.name || "",
        phone: teacher.phone || "",
        cnic: teacher.cnic || "",
        branchId: teacher.branchId ? teacher.branchId.toString() : "",
        isActive: teacher.isActive ?? true,
      });
    }
  }, [teacher]);

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

  if (userLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <div className="h-24 w-24 rounded-[32px] bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-4xl font-black shadow-inner shrink-0">
              {teacher.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">{teacher.name}</h1>
                <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-950 font-bold rounded-lg">
                  Teacher
                </Badge>
                {teacher.isActive ? (
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950 font-bold rounded-lg">
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
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEditOpen(true)} className="rounded-xl font-bold flex items-center gap-1.5 dark:border-slate-800 dark:hover:bg-slate-800">
              <Edit className="h-4 w-4 text-slate-400" /> Edit Info
            </Button>
            <Button variant="outline" onClick={() => setResetOpen(true)} className="rounded-xl font-bold text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-950 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-indigo-400" /> Reset Password
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
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <p className="text-2xl font-black text-gray-900 dark:text-white">{teacherCourses.length}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Courses Taught</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {teacherCourses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0)}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Students</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-100 dark:ring-slate-800 rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Bio-Data & Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Email Address</p>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{teacher.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Phone Number</p>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{teacher.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">National ID / CNIC</p>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{teacher.cnic || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Assigned Branch</p>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{teacher.branchName || "Main Campus"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Assigned Courses */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm ring-1 ring-gray-100 dark:ring-slate-800 rounded-[24px] overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-gray-50 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-black text-gray-900 dark:text-white">Assigned Courses</CardTitle>
              <Badge className="bg-primary/10 text-primary dark:bg-indigo-950 dark:text-indigo-400 font-bold rounded-lg px-2.5 py-1">{teacherCourses.length} Courses</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest pl-6 text-gray-400">Course Details</TableHead>
                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Category</TableHead>
                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Students</TableHead>
                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Status</TableHead>
                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-right pr-6 text-gray-400">Action</TableHead>
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
                        <td className="px-6 py-4 text-right pr-6">
                          <Link href={`/admin/courses/${course.id}/edit`}>
                            <Button variant="ghost" size="sm" className="font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/20 rounded-xl">View Details</Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Faculty Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">Edit Faculty Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="font-bold">Full Name *</Label>
                <Input 
                  required 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Phone Number</Label>
                  <Input 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+92 3..." 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">National ID / CNIC</Label>
                  <Input 
                    value={editForm.cnic} 
                    onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })}
                    placeholder="37405-XXXXXXX-X" 
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Campus / Branch Assignment *</Label>
                <Select 
                  value={editForm.branchId} 
                  onValueChange={(val) => setEditForm({ ...editForm, branchId: val })}
                  required
                >
                  <SelectTrigger className="rounded-xl">
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
              
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
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
            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-8 text-white rounded-xl font-bold" disabled={updateMutation.isPending}>
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
