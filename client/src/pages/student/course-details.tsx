import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  useGetCourse, 
  getGetCourseQueryKey, 
  useCreateEnrollment, 
  useListLessons, 
  getListLessonsQueryKey,
  useListEnrollments,
  getListEnrollmentsQueryKey
} from "@workspace/api-client-react";
import { useRoute, useLocation, Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, PlayCircle, Clock, CheckCircle2, GraduationCap, 
  DollarSign, FileText, ArrowLeft, Star, Users, Check, Award, 
  BookOpen, ShieldCheck, HelpCircle, Download, ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

// Dynamic Category Colors mapping
const CATEGORY_STYLES: Record<string, { gradient: string; color: string }> = {
  IT: { gradient: "from-blue-600 to-indigo-500", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  Graphics: { gradient: "from-purple-600 to-pink-500", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  Freelancing: { gradient: "from-emerald-600 to-teal-500", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  AI: { gradient: "from-orange-500 to-amber-400", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  "MS Office": { gradient: "from-cyan-600 to-sky-400", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  Default: { gradient: "from-indigo-600 to-violet-400", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
};

export default function StudentCourseDetail() {
  const [, params] = useRoute("/dashboard/course-details/:id");
  const courseId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useGetCourse(courseId, { 
    query: { enabled: !!courseId, queryKey: getGetCourseQueryKey(courseId) } 
  });

  const { data: lessons } = useListLessons(
    { courseId },
    { query: { enabled: !!courseId, queryKey: getListLessonsQueryKey({ courseId }) } }
  );

  const { data: enrollments } = useListEnrollments(
    { userId: user?.id, courseId },
    { query: { enabled: !!user && !!courseId } }
  );

  const isEnrolled = enrollments && enrollments.length > 0;
  const enrollmentStatus = isEnrolled ? enrollments[0].status : null;

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

  const handleEnroll = () => {
    if (isEnrolled) {
      if (enrollmentStatus === "active") {
        setLocation(`/dashboard/lessons/${courseId}`);
      } else {
        toast({ 
          title: "Enrollment Pending Approval", 
          description: "Your admission request for this course has been submitted and is pending administrator approval.",
        });
      }
      return;
    }

    if (!course.isFree) {
      setLocation(`/dashboard/payment/${courseId}`);
      return;
    }

    enrollMutation.mutate({ data: { userId: user?.id, courseId } as any });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col justify-center items-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <span className="text-sm text-slate-500 font-bold tracking-wide">Loading Course Details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto text-center py-32 px-4">
          <HelpCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Course not found</h2>
          <p className="text-slate-500 text-sm mb-6">The course you are looking for does not exist or may have been archived by the administrator.</p>
          <Link href="/dashboard/browse">
            <Button className="rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white">Back to Browse Courses</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const categoryStyles = CATEGORY_STYLES[course.category ?? ""] ?? CATEGORY_STYLES.Default;
  const ratingValue = (4.5 + (course.id % 6) * 0.1).toFixed(1);
  const totalReviews = course.id * 14 + 18;
  const passingCriteria = course.minAttendancePercentage ?? 75;

  // Dynamically parse syllabus for Outcomes and Syllabus sections
  let outcomes = [
    "Acquire professional workflows vetted by industry leaders.",
    "Build industry-grade portfolio items for job readiness.", 
    "Gain lifetime access to structured worksheets and materials.",
    "Receive verifiable Completion Credentials to share on LinkedIn."
  ];
  let syllabusText = course.syllabus || "";

  if (course.syllabus && course.syllabus.includes("---")) {
    const parts = course.syllabus.split("---");
    const outcomesSection = parts[0].trim();
    syllabusText = parts.slice(1).join("---").trim();
    
    if (outcomesSection) {
      const parsedOutcomes = outcomesSection
        .split(/\r?\n/)
        .map(line => line.replace(/^-\s*/, "").replace(/^•\s*/, "").trim())
        .filter(line => line.length > 0);
      
      if (parsedOutcomes.length > 0) {
        outcomes = parsedOutcomes;
      }
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/browse">
          <span className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 mb-4 cursor-pointer transition-colors group">
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
            Back to Browse Courses
          </span>
        </Link>
      </div>

      {/* Course Hero Section */}
      <div className="relative overflow-hidden bg-slate-950 text-white py-12 px-6 rounded-2xl border border-slate-900 mb-8">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 grid lg:grid-cols-3 gap-8 items-center">
          {/* Left Content */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <Badge variant="outline" className={`font-bold text-[10px] tracking-wide px-3 py-1 rounded-md uppercase border ${categoryStyles.color}`}>
                {course.category}
              </Badge>
              {course.isFeatured && (
                <Badge className="bg-orange-500 text-white font-extrabold px-3 py-1 text-[10px] uppercase">
                  ⭐ Featured
                </Badge>
              )}
              {isEnrolled && (
                <Badge className="bg-emerald-500 text-white font-extrabold px-3 py-1 text-[10px] uppercase">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Enrolled
                </Badge>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 leading-tight">
              {course.title}
            </h1>
            
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              {course.description}
            </p>

            {/* Course Stats */}
            <div className="flex flex-wrap items-center gap-6 text-slate-300">
              <div className="flex items-center gap-1 text-sm font-bold">
                <span className="text-amber-400 flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(parseFloat(ratingValue)) ? 'fill-current' : 'opacity-30'}`} />
                  ))}
                </span>
                <span className="text-white ml-1">{ratingValue}</span>
                <span className="text-slate-500 font-semibold">({totalReviews})</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>{course.duration}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-indigo-400" />
                <span>{course.enrollmentCount || 0} Students</span>
              </div>
            </div>
          </div>
          
          {/* Right Visual */}
          <div className="relative">
            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${categoryStyles.gradient} flex items-center justify-center`}>
                  <PlayCircle className="h-16 w-16 text-white/40" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Side Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* What You Will Learn */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" /> What You Will Master
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {outcomes.map((outcome, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="h-5 w-5 bg-indigo-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-indigo-600 font-extrabold" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    {outcome}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Syllabus */}
          {syllabusText && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" /> Course Syllabus
              </h2>
              <div className="text-xs leading-relaxed text-slate-600 whitespace-pre-line font-medium">
                {syllabusText}
              </div>
            </section>
          )}
          
          {/* Course Curriculum */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" /> Course Curriculum
              </h2>
              <Badge className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 text-xs">
                {lessons?.length || 0} Lessons
              </Badge>
            </div>

            <div className="space-y-3">
              {lessons?.length ? (
                lessons.map((lesson, index) => (
                  <div 
                    key={lesson.id} 
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all"
                  >
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
                      {(index + 1).toString().padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-slate-800 leading-snug">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      Lesson
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-500 text-sm font-semibold">Curriculum details coming soon</p>
                </div>
              )}
            </div>
          </section>

          {/* Instructor */}
          <section className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Your Instructor</h3>
            <div className="flex gap-4 items-start">
              <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center">
                {course.teacherName ? course.teacherName.split(' ').map(n=>n.charAt(0)).join('') : "T"}
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800">
                  {course.teacherName || "Expert Instructor"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Experienced professional dedicated to providing modern, practical learning frameworks.
                </p>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mt-2">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-current text-amber-500" /> 4.9 Rating</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 1,200+ Students</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Side - Enrollment Card */}
        <div className="sticky top-28">
          <Card className="border-2 border-slate-200 shadow-lg bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              
              {/* Price */}
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block mb-1">Course Fee</span>
              <div className="text-3xl font-black mb-6 text-slate-900 flex items-center gap-1">
                {course.isFree ? (
                  <span className="text-emerald-600 font-black flex items-center gap-1.5">
                    <CheckCircle2 className="h-6 w-6" /> Free
                  </span>
                ) : (
                  <>
                    <DollarSign className="h-6 w-6 text-slate-400 -mr-1" />
                    <span>Rs. {course.fee?.toLocaleString()}</span>
                  </>
                )}
              </div>
              
              {/* Course Includes */}
              <div className="space-y-4 mb-6">
                <div className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                  This Course Includes
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> 
                    Lifetime access to course materials
                  </li>
                  <li className="flex items-start gap-3 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> 
                    Certificate of completion
                  </li>
                  <li className="flex items-start gap-3 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> 
                    Access to course forum
                  </li>
                  <li className="flex items-start gap-3 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> 
                    Required attendance: <span className="text-indigo-600 font-extrabold">{passingCriteria}%</span>
                  </li>
                </ul>
              </div>
              
              {/* Action Button */}
              <Button 
                size="lg" 
                className="w-full text-sm font-black h-12 rounded-xl shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all" 
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isEnrolled ? (
                  enrollmentStatus === 'active' ? (
                    <>
                      Continue Learning <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    'Awaiting Approval'
                  )
                ) : (
                  course.isFree ? 'Enroll for Free' : 'Enroll Now'
                )}
              </Button>

              {/* Security Badge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure Enrollment
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}