import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  useListCourses, 
  useUpdateCourse, 
  getListCoursesQueryKey,
  useCreateCourse,
  useListUsers,
  getListUsersQueryKey
} from "@workspace/api-client-react";
import { Loader2, Plus, MoreHorizontal, CheckCircle, XCircle, Eye, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function AdminCourses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: courses, isLoading } = useListCourses({}, { query: { queryKey: getListCoursesQueryKey({}) } });
  const updateCourse = useUpdateCourse();
  const createCourse = useCreateCourse();

  // Fetch teachers for selection
  const { data: teachers } = useListUsers(
    { role: "teacher" },
    { query: { queryKey: getListUsersQueryKey({ role: "teacher" }) } }
  );

  const [reviewCourse, setReviewCourse] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Course Creator Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("MS Office");
  const [duration, setDuration] = useState("3 Months");
  const [fee, setFee] = useState("5000");
  const [isFree, setIsFree] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [thumbnail, setThumbnail] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [teacherId, setTeacherId] = useState<string>("");

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !duration) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      await createCourse.mutateAsync({
        data: {
          title,
          description,
          category,
          duration,
          fee: isFree ? 0 : Number(fee),
          isFree,
          isFeatured,
          thumbnail: thumbnail || undefined,
          syllabus: syllabus || undefined,
          teacherId: teacherId ? Number(teacherId) : undefined
        }
      });
      toast({ title: "Course created & published successfully!" });
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({}) });
      setIsCreateOpen(false);
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("MS Office");
      setDuration("3 Months");
      setFee("5000");
      setIsFree(false);
      setIsFeatured(false);
      setThumbnail("");
      setSyllabus("");
      setTeacherId("");
    } catch (error: any) {
      toast({ title: error?.response?.data?.message || "Failed to create course", variant: "destructive" });
    }
  };

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
        <Button onClick={() => setIsCreateOpen(true)}>
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

      {/* ── COURSE CREATOR DIALOG (ADMIN DESIGNER) ────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Design New Course</DialogTitle>
            <DialogDescription>
              Create a new course layout, set duration & fee details, and assign an instructor.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCourse} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="title">Course Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. MS Office Complete Course"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MS Office">MS Office</SelectItem>
                    <SelectItem value="Graphics">Graphic Design</SelectItem>
                    <SelectItem value="Freelancing">Freelancing Mastery</SelectItem>
                    <SelectItem value="AI">Artificial Intelligence (AI)</SelectItem>
                    <SelectItem value="Web">Web Development</SelectItem>
                    <SelectItem value="Computer Basic">Computer Basic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="duration">Duration <span className="text-red-500">*</span></Label>
                <Input
                  id="duration"
                  placeholder="e.g. 3 Months"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="fee">Fee (PKR)</Label>
                <Input
                  id="fee"
                  type="number"
                  placeholder="e.g. 5000"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  disabled={isFree}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="teacher">Assign Teacher</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger id="teacher">
                    <SelectValue placeholder="Select Instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Unassigned --</SelectItem>
                    {teachers?.map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name} ({t.specialization || "Faculty"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-6 items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => {
                    setIsFree(e.target.checked);
                    if (e.target.checked) setFee("0");
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                Is Free Course
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                Feature on Homepage
              </label>
            </div>

            <div className="space-y-1">
              <Label htmlFor="thumbnail">Thumbnail Image URL</Label>
              <Input
                id="thumbnail"
                placeholder="e.g. https://images.unsplash.com/photo-..."
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Short Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                placeholder="Briefly describe the course content & outcomes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="syllabus">Syllabus / Course Outline</Label>
              <Textarea
                id="syllabus"
                placeholder="Enter syllabus details or curriculum outline..."
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white">
                Create & Publish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
