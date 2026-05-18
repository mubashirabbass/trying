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
  Lock
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
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  
  // Registration Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher" as const,
    branchId: "",
    phone: "",
    cnic: "",
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    cnic: "",
    branchId: "",
    isActive: true,
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

  // API Mutations
  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "teacher" }) });
        setOpen(false);
        setForm({ name: "", email: "", password: "", role: "teacher", branchId: "", phone: "", cnic: "" });
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

  // Submit Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ 
      data: { 
        ...form, 
        branchId: form.branchId ? Number(form.branchId) : undefined 
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Faculty Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage teacher accounts, credentials, and campus assignments.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none text-white rounded-xl font-bold">
              <Plus className="h-4 w-4 mr-2" /> Add Instructor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">Register New Instructor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Full Name *</Label>
                  <Input 
                    required 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Prof. Ahmed Khan" 
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Email Address *</Label>
                    <Input 
                      type="email" 
                      required 
                      value={form.email} 
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="ahmed@college.edu" 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Password *</Label>
                    <Input 
                      type="password" 
                      required 
                      value={form.password} 
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••" 
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Assigned Campus *</Label>
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
                    <Label className="font-bold">Phone Number</Label>
                    <Input 
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+92 3..." 
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">National ID / CNIC (13 digits)</Label>
                  <Input 
                    value={form.cnic} 
                    onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                    placeholder="37405-XXXXXXX-X" 
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-8 text-white rounded-xl font-bold" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
              ) : teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-gray-500 font-bold">
                    No instructors found.
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((teacher: any) => (
                  <TableRow key={teacher.id} className="hover:bg-indigo-50/10 dark:hover:bg-slate-800/10 transition-colors border-b dark:border-slate-800/60 last:border-0">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shrink-0">
                          <GraduationCap className="h-5 w-5" />
                        </div>
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
                      {teacher.isActive ? (
                        <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-950 shadow-sm rounded-lg font-bold">
                          <UserCheck className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400 dark:text-gray-600 dark:border-slate-800 rounded-lg">Inactive</Badge>
                      )}
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
                            onClick={() => {
                              if (confirm(`Remove access and delete records for ${teacher.name}?`)) {
                                deleteMutation.mutate({ id: teacher.id });
                              }
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

      {/* Edit Instructor Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">Edit Faculty Profile</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
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
                      {Array.isArray(branches) && branches.map((branch: any) => (
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
    </DashboardLayout>
  );
}
