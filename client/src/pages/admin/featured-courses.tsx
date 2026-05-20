import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, Star, Loader2, Award, Eye, EyeOff, 
  RotateCcw, User, Calendar, CheckCircle2, XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Course {
  id: number;
  title: string;
  category: string;
  duration: string;
  fee: number;
  thumbnail: string | null;
  status: string; // "live" | "draft" | "pending" etc.
  isFeatured: boolean;
  teacherName: string | null;
  createdAt: string;
}

export default function AdminFeaturedCourses() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/courses?_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (res.ok) {
        setCourses(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const toggleCourseFeatured = async (id: number, currentFeatured: boolean) => {
    try {
      const res = await fetch(`${BASE_URL}/api/courses/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ isFeatured: !currentFeatured })
      });
      if (res.ok) {
        toast({ 
          title: !currentFeatured ? "Course Featured!" : "Course Unfeatured",
          description: `Successfully updated the featured status of course ID: ${id}`
        });
        fetchCourses();
      } else {
        toast({ title: "Failed to update featured status", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error occurred", variant: "destructive" });
    }
  };

  const toggleCourseVisibility = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "live" ? "draft" : "live";
    try {
      const res = await fetch(`${BASE_URL}/api/courses/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast({ 
          title: newStatus === "live" ? "Course is now Visible (Live)" : "Course is now Hidden (Draft)",
          description: `Successfully updated course status to ${newStatus}.`
        });
        fetchCourses();
      } else {
        toast({ title: "Failed to update visibility", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error occurred", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Star className="h-8 w-8 text-amber-500 fill-amber-500" /> Catalog Visibility & Featured Courses
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              List and manage all courses in the system. Toggle featured status and student visibility (show/hide) in real-time.
            </p>
          </div>
          <Button onClick={fetchCourses} variant="outline" className="rounded-xl font-bold gap-2">
            <RotateCcw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Courses Table Card */}
        <Card className="border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 rounded-[32px] overflow-hidden bg-white dark:bg-slate-950">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850">
            <CardTitle className="text-xl font-bold">Course Catalog Control Board</CardTitle>
            <CardDescription>Configure show/hide and landing page hero featuring settings.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : courses.length === 0 ? (
              <div className="py-16 text-center">
                <BookOpen className="h-12 w-12 text-slate-350 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Courses Registered</h4>
                <p className="text-sm text-slate-400 mt-1">Courses created by admin or teachers will show up here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/40 dark:bg-slate-900/20">
                    <TableRow>
                      <TableHead className="font-black text-slate-500 py-4 pl-6 w-[8%]">Sr. No.</TableHead>
                      <TableHead className="font-black text-slate-500 py-4 w-[35%]">Course Details</TableHead>
                      <TableHead className="font-black text-slate-500 py-4">Category</TableHead>
                      <TableHead className="font-black text-slate-500 py-4">Assigned Teacher</TableHead>
                      <TableHead className="font-black text-slate-500 py-4 text-center">Visible (Show/Hide)</TableHead>
                      <TableHead className="font-black text-slate-500 py-4 text-center">Featured Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course, index) => (
                      <TableRow key={course.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                        {/* Serial Number */}
                        <TableCell className="py-5 pl-6 font-bold text-slate-500">
                          {index + 1}
                        </TableCell>

                        {/* Course Info */}
                        <TableCell className="py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 overflow-hidden flex items-center justify-center shrink-0">
                              {course.thumbnail ? (
                                <img src={course.thumbnail} className="h-full w-full object-cover" />
                              ) : (
                                <BookOpen className="h-5 w-5 text-slate-300 dark:text-slate-700" />
                              )}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white leading-tight">{course.title}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Created: {new Date(course.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell className="py-5 font-semibold text-slate-600 dark:text-slate-400">
                          <Badge variant="secondary" className="rounded-lg px-2.5 py-0.5">
                            {course.category}
                          </Badge>
                        </TableCell>

                        {/* Teacher */}
                        <TableCell className="py-5">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-350 text-sm font-semibold">
                            <User className="h-4 w-4 text-slate-450 shrink-0" />
                            {course.teacherName || "Unassigned"}
                          </div>
                        </TableCell>

                        {/* Visibility (Show/Hide) Toggle */}
                        <TableCell className="py-5 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <Switch 
                              checked={course.status === "live"} 
                              onCheckedChange={() => toggleCourseVisibility(course.id, course.status)}
                            />
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider mt-0.5">
                              {course.status === "live" ? (
                                <span className="text-emerald-500 flex items-center gap-1">
                                  <Eye className="h-3 w-3" /> Live (Visible)
                                </span>
                              ) : (
                                <span className="text-slate-400 flex items-center gap-1">
                                  <EyeOff className="h-3 w-3" /> Hidden (Draft)
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>

                        {/* Featured Switch Toggle */}
                        <TableCell className="py-5 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <Switch 
                              checked={course.isFeatured} 
                              onCheckedChange={() => toggleCourseFeatured(course.id, course.isFeatured)}
                              className="data-[state=checked]:bg-amber-500"
                            />
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider mt-0.5">
                              {course.isFeatured ? (
                                <span className="text-amber-500 flex items-center gap-0.5">
                                  <Star className="h-3 w-3 fill-amber-500" /> Featured
                                </span>
                              ) : (
                                <span className="text-slate-400">Regular</span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
