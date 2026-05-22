import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  useListCourses, 
  getListCoursesQueryKey,
  useCreateCourse,
  useUpdateCourse
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Loader2, Plus, BookOpen, Clock, Users, Edit, GraduationCap, Sparkles, BookOpenCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";

export default function TeacherCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: courses, isLoading } = useListCourses(
    { teacherId: user?.id ?? undefined },
    { 
      query: { 
        queryKey: getListCoursesQueryKey({ teacherId: user?.id ?? undefined }),
        enabled: !!user?.id
      } 
    }
  );

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null); // null means create mode

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("MS Office");
  const [duration, setDuration] = useState("3 Months");
  const [fee, setFee] = useState("5000");
  const [isFree, setIsFree] = useState(false);
  const [thumbnail, setThumbnail] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [minAttendancePercentage, setMinAttendancePercentage] = useState("75");

  const openCreateDialog = () => {
    setEditingCourse(null);
    setTitle("");
    setDescription("");
    setCategory("MS Office");
    setDuration("3 Months");
    setFee("5000");
    setIsFree(false);
    setThumbnail("");
    setSyllabus("");
    setMinAttendancePercentage("75");
    setIsDialogOpen(true);
  };

  const openEditDialog = (course: any) => {
    setEditingCourse(course);
    setTitle(course.title || "");
    setDescription(course.description || "");
    setCategory(course.category || "MS Office");
    setDuration(course.duration || "3 Months");
    setFee((course.fee ?? 0).toString());
    setIsFree(!!course.isFree);
    setThumbnail(course.thumbnail || "");
    setSyllabus(course.syllabus || "");
    setMinAttendancePercentage((course.minAttendancePercentage ?? 75).toString());
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !duration) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      if (editingCourse) {
        // Edit mode
        await updateCourse.mutateAsync({
          id: editingCourse.id,
          data: {
            title,
            description,
            category,
            duration,
            fee: isFree ? 0 : Number(fee),
            isFree,
            thumbnail: thumbnail || null,
            syllabus: syllabus || null,
            minAttendancePercentage: Number(minAttendancePercentage),
          } as any
        });
        toast({ title: "Course details updated successfully!" });
      } else {
        // Create mode
        await createCourse.mutateAsync({
          data: {
            title,
            description,
            category,
            duration,
            fee: isFree ? 0 : Number(fee),
            isFree,
            thumbnail: thumbnail || undefined,
            syllabus: syllabus || undefined,
            minAttendancePercentage: Number(minAttendancePercentage),
          } as any
        });
        toast({ title: "Course created successfully as draft!" });
      }
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({ teacherId: user?.id ?? undefined }) });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Failed to save course details", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">Live</Badge>;
      case "pending": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200">Pending Review</Badge>;
      case "rejected": return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border border-rose-200">Rejected</Badge>;
      case "draft": return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border border-slate-200">Draft</Badge>;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" /> My Courses Studio
          </h1>
          <p className="text-gray-500 text-sm">Design curriculum, edit metadata, and publish courses</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-primary hover:bg-primary/95 text-white">
          <Plus className="h-4 w-4" />
          Create Course Studio
        </Button>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <Card key={course.id} className="flex flex-col hover:shadow-lg transition-all duration-300 border-slate-200/80">
            <CardHeader className="relative pb-4">
              {course.thumbnail ? (
                <div className="h-40 w-full rounded-t-lg overflow-hidden mb-3 border">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 w-full rounded-t-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center mb-3">
                  <BookOpen className="h-12 w-12 text-indigo-400 opacity-60" />
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {course.category}
                </span>
                {getStatusBadge((course as any).status)}
              </div>
              <CardTitle className="text-lg font-bold line-clamp-1 mt-1 text-slate-800">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <p className="text-slate-500 line-clamp-2 mb-4 text-xs leading-relaxed">{course.description}</p>
              
              <div className="grid grid-cols-3 gap-2 border-t pt-4 text-[11px] font-semibold text-slate-500">
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Users className="h-4 w-4 text-indigo-500 mb-1" />
                  <span>{course.enrollmentCount} Enrolled</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <BookOpenCheck className="h-4 w-4 text-emerald-500 mb-1" />
                  <span>{course.lessonCount} Lectures</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <Clock className="h-4 w-4 text-amber-500 mb-1" />
                  <span className="truncate w-full">{course.duration}</span>
                </div>
              </div>
              
              {(course as any).rejectionNote && (course as any).status === "rejected" && (
                <div className="mt-3 p-2 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-700">
                  <span className="font-bold">Reason for Rejection:</span> {(course as any).rejectionNote}
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-4 border-t gap-2 flex-col sm:flex-row bg-slate-50/50 rounded-b-lg">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full gap-1.5 text-xs font-semibold"
                onClick={() => openEditDialog(course)}
              >
                <Edit className="h-3.5 w-3.5" /> Edit Details
              </Button>
              <Link href={`/teacher/courses/${course.id}`} className="w-full">
                <Button size="sm" className="w-full gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Sparkles className="h-3.5 w-3.5" /> Curriculum Builder
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}

        {courses?.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Start Designing Your Courses</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">
              Create comprehensive structures, outlines, lessons, and quizzes for your students.
            </p>
            <Button onClick={openCreateDialog} className="mt-6 gap-2">
              <Plus className="h-4 w-4" /> Design Your First Course
            </Button>
          </div>
        )}
      </div>

      {/* Udemy-style Course designer dialog (Create & Edit) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
              {editingCourse ? "Update Course Design" : "Design New Course Outline"}
            </DialogTitle>
            <DialogDescription>
              Create or edit course metadata, duration plans, outlines, and detailed syllabus guidelines.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="title">Course Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. Masterclass in Advanced Frontend & React Architecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="duration">Syllabus Duration <span className="text-red-500">*</span></Label>
                <Input
                  id="duration"
                  placeholder="e.g. 12 Weeks (48 Hours)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="fee">Course Fee (PKR)</Label>
                <Input
                  id="fee"
                  type="number"
                  placeholder="e.g. 6000"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  disabled={isFree}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="minAttendancePercentage">Min Attendance Requirement (%)</Label>
                <Input
                  id="minAttendancePercentage"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 75"
                  value={minAttendancePercentage}
                  onChange={(e) => setMinAttendancePercentage(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-6 items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => {
                    setIsFree(e.target.checked);
                    if (e.target.checked) setFee("0");
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                This is a Free Course
              </label>
            </div>

            <div className="space-y-1">
              <Label htmlFor="thumbnail">Cover Thumbnail Image URL</Label>
              <Input
                id="thumbnail"
                placeholder="e.g. https://images.unsplash.com/photo-..."
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Short Description / Course Objectives <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                placeholder="Describe the course summary, who it's for, and the key target goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="syllabus">Detailed Course Outline & Lesson Plans</Label>
              <Textarea
                id="syllabus"
                placeholder="Module 1: Getting Started&#10;Module 2: Advanced Layouts&#10;Provide learning objectives, outlines, and lecture guidelines here..."
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                rows={5}
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white">
                {editingCourse ? "Save Changes" : "Create & Start Building"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
