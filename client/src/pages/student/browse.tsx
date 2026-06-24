import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useListCourses, useListEnrollments, useCreateEnrollment, getListEnrollmentsQueryKey, getListCoursesQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import {
  Loader2,
  Search,
  BookOpen,
  Clock,
  Users,
  Star,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  GraduationCap,
  DollarSign,
  Laptop,
  Palette,
  Briefcase,
  Brain,
  FileSpreadsheet,
  Award,
} from "lucide-react";

// Dynamic Category Mapping - same as main site
const CATEGORY_DETAILS: Record<string, { gradient: string; icon: React.ComponentType<any>; color: string; label: string }> = {
  IT: { 
    gradient: "from-blue-600 to-indigo-400", 
    icon: Laptop, 
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    label: "Information Technology"
  },
  Graphics: { 
    gradient: "from-purple-600 to-pink-500", 
    icon: Palette, 
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    label: "Graphics Design"
  },
  Freelancing: { 
    gradient: "from-emerald-600 to-teal-500", 
    icon: Briefcase, 
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    label: "Freelancing & Copy"
  },
  AI: { 
    gradient: "from-orange-500 to-amber-400", 
    icon: Brain, 
    color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    label: "Artificial Intelligence"
  },
  "MS Office": { 
    gradient: "from-cyan-600 to-sky-400", 
    icon: FileSpreadsheet, 
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    label: "Productivity Office"
  },
  Default: { 
    gradient: "from-indigo-600 to-violet-400", 
    icon: GraduationCap, 
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    label: "Specialization Track"
  },
};

// Fetch CATEGORIES dynamically from the server inside the component

export default function StudentBrowse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data: dbCategories = [] } = useQuery<any[]>({
    queryKey: ["course-categories"],
    queryFn: async () => {
      const res = await fetch("/api/course-categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    }
  });

  const { data: courses = [], isLoading: coursesLoading } = useListCourses(
    { search: search || undefined, category },
    { query: { queryKey: getListCoursesQueryKey({ search: search || undefined, category }) } }
  );
  const { data: myEnrollments = [], isLoading: enrollLoading } = useListEnrollments({ userId: user?.id });

  const enrollMutation = useCreateEnrollment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({ userId: user?.id }) });
        toast({ title: "Enrolled successfully! 🎉" });
      },
      onError: (err: any) => {
        toast({ title: err?.response?.data?.message || "Enrollment failed", variant: "destructive" });
      },
    },
  });

  const enrolledCourseIds = new Set(myEnrollments.map((e: any) => e.courseId));

  // Filter for live courses only
  const liveCourses = courses.filter((c: any) => c.status === "live");

  const isLoading = coursesLoading || enrollLoading;

  const getCategoryDetails = (catName: string) => {
    const normalized = (catName || "").toLowerCase();
    if (normalized.includes("web")) return CATEGORY_DETAILS.Web || CATEGORY_DETAILS.IT;
    if (normalized.includes("ai") || normalized.includes("artificial")) return CATEGORY_DETAILS.AI;
    if (normalized.includes("graphic") || normalized.includes("design")) return CATEGORY_DETAILS.Graphics;
    if (normalized.includes("freelance") || normalized.includes("copy")) return CATEGORY_DETAILS.Freelancing;
    if (normalized.includes("office") || normalized.includes("excel") || normalized.includes("word")) return CATEGORY_DETAILS["MS Office"];
    if (normalized.includes("it") || normalized.includes("network") || normalized.includes("server")) return CATEGORY_DETAILS.IT;
    return CATEGORY_DETAILS.Default;
  };

  return (
    <DashboardLayout>
      {/* Premium Hero Banner Section */}
      <div className="relative overflow-hidden bg-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-900 rounded-2xl mb-8">
        {/* Background Gradients & Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        {/* Decorative Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] opacity-60" />

        <div className="relative max-w-7xl mx-auto text-center z-10">
          <Badge className="mb-4 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3.5 py-1 text-xs uppercase tracking-wider rounded-full font-bold shadow-lg shadow-indigo-500/5">
            ✨ Student Portal - Course Selection
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent mb-4">
            Choose Your Learning Journey
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Select and enroll in courses that match your career goals. Study at your pace with expert guidance and earn globally recognized certifications.
          </p>

          {/* Quick Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 text-center shadow-2xl">
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-white mb-0.5">{liveCourses.length}</div>
              <div className="text-xxs sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Available Courses</div>
            </div>
            <div className="border-l border-slate-800/80">
              <div className="text-xl sm:text-2xl font-extrabold text-indigo-400 mb-0.5">{myEnrollments.length}</div>
              <div className="text-xxs sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Your Enrollments</div>
            </div>
            <div className="border-l border-slate-800/80 col-span-2 md:col-span-1">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mb-0.5">4.9 ★</div>
              <div className="text-xxs sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Course Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Search & Category Navigation Panel */}
      <div className="flex flex-col gap-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Search Input Container */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Search courses to enroll..." 
              className="pl-11 h-12 bg-slate-50/50 border-slate-200 rounded-xl focus-visible:ring-indigo-500 text-sm font-medium transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sub-label showing courses found */}
          <div className="text-sm font-semibold text-slate-500">
            {liveCourses ? `${liveCourses.length} courses available for enrollment` : "Loading catalog..."}
          </div>
        </div>

        {/* Category Quick Filters */}
        <div>
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            Filter by Category
          </div>
          <div className="flex flex-wrap gap-2.5 pb-2 overflow-x-auto">
            <Button 
              variant={category === undefined ? "default" : "outline"}
              onClick={() => setCategory(undefined)}
              className={`h-11 rounded-xl px-5 text-xs font-bold transition-all shadow-none ${
                category === undefined 
                  ? "bg-slate-900 hover:bg-slate-800 text-white" 
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              All Courses
            </Button>

            {dbCategories.map(cat => {
              const details = getCategoryDetails(cat.name);
              const IconComponent = details.icon;
              
              return (
                <Button 
                  key={cat.id}
                  variant={category === cat.name ? "default" : "outline"}
                  onClick={() => setCategory(cat.name)}
                  className={`h-11 rounded-xl px-5 text-xs font-bold transition-all shadow-none ${
                    category === cat.name 
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-500/20"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Courses Listing Grid */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <span className="text-sm text-slate-500 font-bold tracking-wide">Loading Available Courses...</span>
        </div>
      ) : liveCourses?.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200">
          <GraduationCap className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-850 mb-1">No courses found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            We couldn't find any courses matching "{search}". Try searching for another category or clearing filters.
          </p>
          <Button 
            variant="outline" 
            onClick={() => { setSearch(""); setCategory(undefined); }}
            className="rounded-xl border-slate-200 font-bold"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {liveCourses?.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const details = getCategoryDetails(course.category ?? "");
            const IconComponent = details.icon;
            
            // Simulating realistic metadata based on course ID for enriched look
            const courseRating = (4.5 + (course.id % 6) * 0.1).toFixed(1);
            const reviewsCount = course.id * 14 + 18;
            const courseLevel = course.id % 2 === 0 ? "Intermediate Track" : "Beginner Friendly";
            
            return (
              <Card 
                key={course.id} 
                className="group flex flex-col overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Thumbnail / Header Gradient Area */}
                <div className="aspect-video relative overflow-hidden bg-slate-950">
                  {course.thumbnailUrl ? (
                    <img 
                      src={course.thumbnailUrl} 
                      alt={course.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${details.gradient} relative flex items-center justify-center`}>
                      {/* Decorative floating ring pattern inside fallback */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,black/10)]" />
                      <IconComponent className="h-16 w-16 text-white/35 relative z-10" />
                    </div>
                  )}

                  {/* Top badging */}
                  <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
                    {course.isFeatured && (
                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-2.5 py-1 text-[10px] uppercase border-none shadow-lg shadow-orange-500/20">
                        ⭐ Featured
                      </Badge>
                    )}
                    {isEnrolled && (
                      <Badge className="bg-emerald-500 text-white font-extrabold px-2.5 py-1 text-[10px] uppercase border-none shadow-lg">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Enrolled
                      </Badge>
                    )}
                    <Badge className="bg-slate-950/80 hover:bg-slate-950 text-white backdrop-blur-md font-bold px-2.5 py-1 text-[10px] border border-white/10">
                      {courseLevel}
                    </Badge>
                  </div>
                </div>
                
                {/* Card Header details */}
                <CardHeader className="pb-3 pt-5 px-6">
                  <div className="flex justify-between items-center mb-2.5">
                    {/* Mini Category tag */}
                    <Badge variant="outline" className={`font-bold text-[10px] tracking-wide px-2.5 py-0.5 rounded-md border ${details.color}`}>
                      <IconComponent className="h-3 w-3 mr-1 inline" />
                      {course.category}
                    </Badge>

                    {/* Dynamic Rating indicator */}
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{courseRating}</span>
                      <span className="text-slate-400 font-semibold">({reviewsCount})</span>
                    </div>
                  </div>

                  <CardTitle className="text-lg font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                
                {/* Card Content body */}
                <CardContent className="flex-1 pb-4 px-6">
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-6">
                    {course.description}
                  </p>
                  
                  {/* Course Stats Ledger */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mb-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="h-4 w-4 text-indigo-500" />
                      <span className="text-xs font-bold">{course.totalDurationHours}h</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      <span className="text-xs font-bold">{course.lessonCount || 0} Lectures</span>
                    </div>
                  </div>

                  {/* Teacher profile section */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {course.teacherName ? course.teacherName.charAt(0) : "T"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Lecturer</p>
                      <p className="text-xs font-bold text-slate-700 truncate mt-0.5">
                        {course.teacherName || "Academy Expert"}
                      </p>
                    </div>
                  </div>
                </CardContent>
                
                {/* Card Footer details */}
                <CardFooter className="pt-4 pb-5 px-6 border-t border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Course Fee</span>
                    <div className="text-lg font-black text-slate-800 flex items-center">
                      {course.isFree ? (
                        <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Free
                        </span>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4 text-slate-500 -mr-0.5" />
                          <span className="font-extrabold text-[16px]">Rs. {course.fee?.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/course-details/${course.id}`}>
                      <Button variant="outline" className="h-10 px-3 rounded-xl text-xs font-bold">
                        Details
                      </Button>
                    </Link>

                    {isEnrolled ? (
                      <Link href={`/dashboard/lessons/${course.id}`}>
                        <Button className="h-10 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center gap-1">
                          Continue
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : course.isFree ? (
                      <Button
                        className="h-10 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={enrollMutation.isPending}
                        onClick={() => enrollMutation.mutate({ data: { courseId: course.id, userId: user?.id } as any })}
                      >
                        {enrollMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Enroll Free"
                        )}
                      </Button>
                    ) : (
                      <Link href={`/dashboard/payment/${course.id}`}>
                        <Button className="h-10 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
                          Enroll Now
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
