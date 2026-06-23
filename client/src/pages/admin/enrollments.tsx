import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  useListEnrollments, 
  useCreateEnrollment, 
  useDeleteEnrollment,
  useListUsers,
  useListCourses,
  getListEnrollmentsQueryKey,
  useDeleteUser
} from "@workspace/api-client-react";
import { Loader2, Plus, Trash2, GraduationCap, User, BookOpen, Check, ShieldAlert, MoreVertical, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminEnrollments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: enrollments, isLoading } = useListEnrollments();
  const { data: users } = useListUsers({ role: "student" });
  const { data: courses } = useListCourses({ status: "live" });
  
  const createEnrollment = useCreateEnrollment();
  const deleteEnrollment = useDeleteEnrollment();
  const deleteUser = useDeleteUser();

  const [studentToDelete, setStudentToDelete] = useState<{ userId: number; userName: string } | null>(null);

  const handleDeleteStudentConfirm = async () => {
    if (!studentToDelete) return;
    try {
      await deleteUser.mutateAsync({ id: studentToDelete.userId });
      toast({ title: "Student and all associated data deleted permanently from LMS." });
      setStudentToDelete(null);
      queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) });
    } catch {
      toast({ title: "Error deleting student", variant: "destructive" });
    }
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const handleEnroll = async () => {
    if (!selectedUser || !selectedCourse) return;
    
    try {
      await createEnrollment.mutateAsync({
        data: {
          userId: Number(selectedUser),
          courseId: Number(selectedCourse)
        }
      });
      toast({ title: "Student enrolled successfully" });
      queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) });
      setIsAddOpen(false);
      setSelectedUser("");
      setSelectedCourse("");
    } catch (error: any) {
      toast({ 
        title: "Enrollment failed", 
        description: error.message || "Is the student already enrolled?",
        variant: "destructive" 
      });
    }
  };

  const [approvingId, setApprovingId] = useState<number | null>(null);

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`/api/enrollments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "active" })
      });

      if (!response.ok) throw new Error("Failed to approve enrollment");

      toast({ title: "Enrollment Approved Successfully" });
      queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) });
    } catch (error) {
      toast({ title: "Error approving enrollment", variant: "destructive" });
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This will remove the student's access to the course.")) return;
    try {
      await deleteEnrollment.mutateAsync({ id });
      toast({ title: "Enrollment removed" });
      queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({}) });
    } catch (error) {
      toast({ title: "Error removing enrollment", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manual Enrollments</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Bypass payment for specific students</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-2" />
          Enroll Student
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Student</TableHead>
                <TableHead className="font-semibold text-slate-700">Course</TableHead>
                <TableHead className="font-semibold text-slate-700">Date</TableHead>
                <TableHead className="font-semibold text-slate-700">Progress</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments?.map((enrollment) => (
                <TableRow key={enrollment.id} className="hover:bg-slate-50/30 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-slate-900">{enrollment.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span className="text-slate-700">{enrollment.courseName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 py-4">
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all" 
                          style={{ width: `${enrollment.progress}%` }} 
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{Math.round(enrollment.progress)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {enrollment.status === "pending" ? (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium">
                        <Loader2 className="h-3 w-3 animate-spin mr-1 text-amber-500" /> Pending Approval
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-medium capitalize">
                        {enrollment.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-4 pr-6">
                    <div className="flex justify-end items-center gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Delete Student from LMS"
                        className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                        onClick={() => setStudentToDelete({ userId: enrollment.userId, userName: enrollment.userName || "Unknown" })}
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
                          {enrollment.status === "pending" && (
                            <DropdownMenuItem 
                              className="rounded-xl font-bold text-xs gap-2 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" 
                              onClick={() => handleApprove(enrollment.id)}
                              disabled={approvingId === enrollment.id}
                            >
                              {approvingId === enrollment.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4" />} 
                              Approve Enrollment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="rounded-xl font-bold text-xs gap-2 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50" 
                            onClick={() => handleDelete(enrollment.id)}
                          >
                            <XCircle className="h-4 w-4" /> 
                            Remove Enrollment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {enrollments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <GraduationCap className="h-12 w-12" />
                      <p className="text-lg font-medium">No enrollments found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Manual Enrollment</DialogTitle>
            <DialogDescription className="text-slate-500">
              Add a student to a course manually. This will grant immediate access.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Select Student</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full h-11 border-slate-200">
                  <SelectValue placeholder="Search students..." />
                </SelectTrigger>
                <SelectContent>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Select Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-full h-11 border-slate-200">
                  <SelectValue placeholder="Choose a course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 flex gap-3">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="flex-1 font-semibold text-slate-600">
              Cancel
            </Button>
            <Button onClick={handleEnroll} disabled={!selectedUser || !selectedCourse} className="flex-1 bg-slate-900 hover:bg-slate-800 font-semibold h-11">
              Enroll Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!studentToDelete} onOpenChange={val => !val && setStudentToDelete(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-2"><ShieldAlert className="h-6 w-6" /></div>
            <DialogTitle>Are you sure you want to delete the student?</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete the student <strong>{studentToDelete?.userName}</strong>? This will permanently delete all of their data from the LMS.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-center sm:justify-center pt-2">
            <Button variant="outline" className="rounded-xl flex-1 text-xs" onClick={() => setStudentToDelete(null)}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex-1 text-xs" onClick={handleDeleteStudentConfirm} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? "Deleting..." : "Yes, Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
