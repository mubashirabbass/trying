import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  useListUsers, 
  getListUsersQueryKey, 
  useListBranches,
  getListBranchesQueryKey,
  useCreateUser,
  useUpdateUser,
  useDeleteUser
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
  GraduationCap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher",
    branchId: "",
    phone: "",
  });

  const { data: teachers = [], isLoading: usersLoading } = useListUsers({
    role: "teacher", 
    search: search || undefined 
  }, { 
    query: { queryKey: getListUsersQueryKey({ role: "teacher", search: search || undefined }) } 
  });

  const { data: branches = [] } = useListBranches({}, {
    query: { queryKey: getListBranchesQueryKey() }
  });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "teacher" }) });
        setOpen(false);
        setForm({ name: "", email: "", password: "", role: "teacher", branchId: "", phone: "" });
        toast({ title: "Teacher account created successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to create teacher", variant: "destructive" }),
    }
  });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "teacher" }) });
        toast({ title: "Teacher removed" });
      },
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ 
      data: { 
        ...form, 
        branchId: form.branchId ? Number(form.branchId) : undefined 
      } as any 
    });
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Faculty Management</h1>
          <p className="text-gray-500 mt-1">Manage teachers and instructors across all campuses.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
              <Plus className="h-4 w-4 mr-2" /> Add Instructor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Register New Instructor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input 
                    required 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Prof. Ahmed Khan" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Address *</Label>
                    <Input 
                      type="email" 
                      required 
                      value={form.email} 
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="ahmed@college.edu" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input 
                      type="password" 
                      required 
                      value={form.password} 
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assigned Branch *</Label>
                    <Select 
                      value={form.branchId} 
                      onValueChange={(val) => setForm({ ...form, branchId: val })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Campus" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch: any) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input 
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+92 3..." 
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-8" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-8 border-none shadow-sm ring-1 ring-gray-100">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search instructors by name or email..." 
              className="pl-10 max-w-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl ring-1 ring-gray-100 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="py-4 font-semibold">Instructor</TableHead>
                <TableHead className="py-4 font-semibold">Campus</TableHead>
                <TableHead className="py-4 font-semibold">Contact</TableHead>
                <TableHead className="py-4 font-semibold">Status</TableHead>
                <TableHead className="py-4 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto opacity-20" />
                  </TableCell>
                </TableRow>
              ) : teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-gray-500">
                    No instructors found.
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((teacher: any) => (
                  <TableRow key={teacher.id} className="hover:bg-indigo-50/10 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{teacher.name}</span>
                          <span className="text-xs text-gray-500 font-medium tracking-tight">ID: #INST-{teacher.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                        {teacher.branchName || "Global"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm flex items-center gap-1.5 text-gray-600">
                          <Mail className="h-3.5 w-3.5 text-gray-400" /> {teacher.email}
                        </span>
                        {teacher.phone && (
                          <span className="text-xs flex items-center gap-1.5 text-gray-500">
                            <Phone className="h-3.5 w-3.5 text-gray-400" /> {teacher.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {teacher.isActive ? (
                        <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-100 shadow-sm">
                          <UserCheck className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" /> Edit Instructor
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                            onClick={() => {
                              if (confirm(`Remove access for ${teacher.name}?`)) {
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
    </DashboardLayout>
  );
}
