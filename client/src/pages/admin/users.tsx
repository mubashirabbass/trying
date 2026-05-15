import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  useListUsers, 
  getListUsersQueryKey, 
  useListBranches,
  getListBranchesQueryKey,
  useUpdateUser,
  useDeleteUser
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
  Edit 
} from "lucide-react";
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
import { useState } from "react";
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
  const [roleFilter, setRoleFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

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

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/users/${resetPasswordUser.id}/reset-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
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

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Control access, reset passwords, and manage students across all branches.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 shadow-lg transition-all">
          <UserPlus className="h-4 w-4 mr-2" /> Add New User
        </Button>
      </div>

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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-gray-500">
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user: any) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <Link href={`/admin/users/${user.id}`}>
                            <span className="font-bold text-gray-900 hover:text-primary cursor-pointer transition-colors">{user.name}</span>
                          </Link>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
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
                            className="cursor-pointer"
                            onClick={() => toggleStatusMutation.mutate({ id: user.id, data: { isActive: !user.isActive } })}
                          >
                            {user.isActive ? (
                              <><XCircle className="h-4 w-4 mr-2" /> Deactivate Account</>
                            ) : (
                              <><CheckCircle2 className="h-4 w-4 mr-2" /> Activate Account</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                                deleteMutation.mutate({ id: user.id });
                              }
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
      </Card>

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
    </DashboardLayout>
  );
}
