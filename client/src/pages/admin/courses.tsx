import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useListCourses, useUpdateCourse, getListCoursesQueryKey } from "@workspace/api-client-react";
import { Loader2, Plus, MoreHorizontal, CheckCircle, XCircle, Eye, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function AdminCourses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: courses, isLoading } = useListCourses({}, { query: { queryKey: getListCoursesQueryKey({}) } });
  const updateCourse = useUpdateCourse();

  const [reviewCourse, setReviewCourse] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const handleStatusUpdate = async (id: number, status: string, note?: string) => {
    try {
      await updateCourse.mutateAsync({
        id,
        data: { status, rejectionNote: note || null } as any
      });
      toast({ title: `Course ${status === 'live' ? 'Approved' : 'Rejected'}` });
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({}) });
      setIsReviewOpen(false);
      setReviewCourse(null);
      setRejectionNote("");
    } catch (error) {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Live</Badge>;
      case "pending": return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
      case "draft": return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Draft</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
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
          <h1 className="text-2xl font-bold">Manage Courses</h1>
          <p className="text-gray-500">Approve, reject, and monitor all courses</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses?.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/courses/${course.id}/review`}>
                      <div className="cursor-pointer hover:text-primary transition-colors">
                        {course.title}
                        <p className="text-xs text-muted-foreground font-normal">by {course.teacherName || "Unknown"}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{course.category}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(course.status)}</TableCell>
                  <TableCell>{course.isFree ? "Free" : `Rs. ${course.fee}`}</TableCell>
                  <TableCell>{course.enrollmentCount}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/admin/courses/${course.id}/review`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" /> Full Review
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem asChild>
                          <Link href={`/courses/${course.id}`} target="_blank">
                            <div className="flex items-center w-full">
                              <ExternalLink className="h-4 w-4 mr-2" /> View Public Page
                            </div>
                          </Link>
                        </DropdownMenuItem>
                        {course.status === "pending" && (
                          <Link href={`/admin/courses/${course.id}/review`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" /> Review & Approve
                            </DropdownMenuItem>
                          </Link>
                        )}
                        <DropdownMenuItem>Edit Metadata</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete Course</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
