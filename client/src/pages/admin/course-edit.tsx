import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetCourse, 
  useUpdateCourse,
  useListUsers,
  getListCoursesQueryKey
} from "@workspace/api-client-react";
import { 
  Loader2, 
  ArrowLeft, 
  Save,
  User,
  BookOpen,
  DollarSign,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminCourseEdit() {
  const { id } = useParams();
  const courseId = id ? Number(id) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading } = useGetCourse(courseId);
  const { data: teachers = [], isLoading: teachersLoading } = useListUsers({ role: "teacher" });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    duration: "",
    fee: 0,
    teacherId: 0,
    status: "draft",
    isFeatured: false,
    isFree: false,
    thumbnail: "",
    syllabus: ""
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        category: course.category || "",
        duration: course.duration || "",
        fee: course.fee || 0,
        teacherId: course.teacherId || 0,
        status: course.status || "draft",
        isFeatured: !!course.isFeatured,
        isFree: !!course.isFree,
        thumbnail: course.thumbnail || "",
        syllabus: course.syllabus || ""
      });
    }
  }, [course]);

  const updateMutation = useUpdateCourse();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id: courseId,
        data: formData as any
      });
      toast({ title: "Course Updated", description: "All changes have been saved successfully." });
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({}) });
      setLocation("/admin/courses");
    } catch (error) {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  if (courseLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const categories = ["IT", "Graphics", "Freelancing", "AI", "MS Office", "Web"];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link href="/admin/courses">
          <Button variant="ghost" className="mb-4 text-gray-500 hover:text-gray-900 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Edit Course</h1>
            <p className="text-gray-500 font-medium mt-1">Refine metadata, pricing, and instructor assignments.</p>
          </div>
          <div className="flex gap-3">
             <Badge className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest ${
               formData.status === 'live' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
               formData.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
               'bg-slate-100 text-slate-600'
             }`}>
               Current Status: {formData.status}
             </Badge>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-bold">Course Title</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="rounded-xl bg-slate-50 border-gray-100 focus:bg-white h-12 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="font-bold">Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="rounded-xl bg-slate-50 border-gray-100 focus:bg-white min-h-[150px] font-medium"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="font-bold">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={v => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger className="rounded-xl bg-slate-50 border-gray-100 h-12">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="font-bold">Duration (e.g. 3 Months)</Label>
                  <Input 
                    id="duration" 
                    value={formData.duration} 
                    onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="rounded-xl bg-slate-50 border-gray-100 h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Visibility */}
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" /> Pricing & Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="space-y-0.5">
                      <Label className="font-bold">Free Course</Label>
                      <p className="text-xs text-gray-500">Make this course free for all</p>
                    </div>
                    <Switch 
                      checked={formData.isFree} 
                      onCheckedChange={v => setFormData(prev => ({ ...prev, isFree: v, fee: v ? 0 : prev.fee }))} 
                    />
                  </div>
                  {!formData.isFree && (
                    <div className="space-y-2">
                      <Label htmlFor="fee" className="font-bold">Course Fee (PKR)</Label>
                      <Input 
                        id="fee" 
                        type="number"
                        value={formData.fee} 
                        onChange={e => setFormData(prev => ({ ...prev, fee: Number(e.target.value) }))}
                        className="rounded-xl bg-slate-50 border-gray-100 h-12 font-black text-primary"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="space-y-0.5">
                      <Label className="font-bold text-orange-600">⭐ Featured</Label>
                      <p className="text-xs text-gray-500">Show on homepage hero</p>
                    </div>
                    <Switch 
                      checked={formData.isFeatured} 
                      onCheckedChange={v => setFormData(prev => ({ ...prev, isFeatured: v }))} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Admin Status Controls */}
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Publishing Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/10 text-white rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="live">Live (Published)</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white font-black h-12 rounded-xl shadow-lg shadow-primary/20"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5 mr-2" /> Save Changes</>}
              </Button>
            </CardContent>
          </Card>

          {/* Instructor Assignment */}
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Instructor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacher" className="text-xs font-bold">Assigned Teacher</Label>
                <Select 
                  value={formData.teacherId.toString()} 
                  onValueChange={v => setFormData(prev => ({ ...prev, teacherId: Number(v) }))}
                >
                  <SelectTrigger className="rounded-xl bg-slate-50 border-gray-100 h-11">
                    <SelectValue placeholder="Assign Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Unassigned</SelectItem>
                    {teachers.map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.teacherId === 0 && (
                <div className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-[10px] leading-relaxed">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p className="font-bold">No teacher assigned. This course will not be visible in any teacher portal dashboards.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Media Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="thumbnail" className="text-xs font-bold">Thumbnail URL</Label>
                <Input 
                  id="thumbnail" 
                  value={formData.thumbnail} 
                  onChange={e => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                  className="rounded-xl bg-slate-50 border-gray-100 text-xs"
                  placeholder="https://..."
                />
              </div>
              {formData.thumbnail && (
                <div className="aspect-video rounded-xl overflow-hidden border border-gray-100">
                  <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </DashboardLayout>
  );
}
