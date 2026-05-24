import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  useGetCourse, 
  getGetCourseQueryKey, 
  useCreateEnrollment, 
  useListLessons, 
  getListLessonsQueryKey,
  useListEnrollments,
} from "@workspace/api-client-react";
import { useRoute, useLocation, Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, PlayCircle, Clock, CheckCircle2, GraduationCap, 
  DollarSign, FileText, ArrowLeft, Star, Users, Check, Award, 
  BookOpen, ShieldCheck, HelpCircle, Download
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

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
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

  const enrollMutation = useCreateEnrollment();

  const handleEnroll = () => {
    if (!user) {
      toast({
        title: "Create a Free Account",
        description: "Sign up in seconds to enroll in this course and start learning!",
      });
      setLocation("/register");
      return;
    }

    if (isEnrolled) {
      if (enrollmentStatus === "active") {
        setLocation(`/dashboard/lessons/${courseId}`);
      } else {
        toast({ 
          title: "Enrollment Pending Approval", 
          description: "Your admission request for this course has been submitted and is pending administrator approval. We will notify you once verified.",
        });
      }
      return;
    }

    if (!course.isFree) {
      setLocation(`/dashboard/payment/${courseId}`);
      return;
    }

    enrollMutation.mutate(
      { data: { userId: user.id, courseId } },
      {
        onSuccess: () => {
          toast({
            title: "Admission Request Submitted",
            description: "Your request to enroll in this free course has been submitted and is pending administrator review.",
          });
          // Invalidate query to update enrollments
          queryClient.invalidateQueries({ queryKey: ["enrollments"] });
          setLocation("/dashboard/courses");
        },
        onError: (error: any) => {
          toast({
            title: "Request Failed",
            description: error.response?.data?.message || error.message || "Failed to submit admission request.",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col justify-center items-center py-40 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-650" />
          <span className="text-sm text-slate-500 font-bold tracking-wide">Syncing Course Blueprint...</span>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto text-center py-32 px-4">
          <HelpCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Course not found</h2>
          <p className="text-slate-500 text-sm mb-6">The course you are looking for does not exist or may have been archived by the administrator.</p>
          <Link href="/courses">
            <Button className="rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white">Back to Courses</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const categoryStyles = CATEGORY_STYLES[course.category ?? ""] ?? CATEGORY_STYLES.Default;
  const ratingValue = (4.5 + (course.id % 6) * 0.1).toFixed(1);
  const totalReviews = course.id * 14 + 18;
  const passingCriteria = course.minAttendancePercentage ?? 75;

  // Dynamically parse syllabus for Outcomes and Syllabus sections
  // If syllabus contains '---', we split it:
  // Section 1: Outcomes (newline-separated)
  // Section 2: Syllabus Description
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
        .map(line => line.replace(/^-\s*/, "").replace(/^•\s*/, "").trim()) // remove leading dashes or bullets
        .filter(line => line.length > 0);
      
      if (parsedOutcomes.length > 0) {
        outcomes = parsedOutcomes;
      }
    }
  }

  return (
    <MainLayout>
      {/* Immersive Dark Banner Hero */}
      <div className="relative overflow-hidden bg-slate-950 text-white py-16 border-b border-slate-900">
        
        {/* Background Gradients & Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] opacity-40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          
          {/* Back button */}
          <Link href="/courses">
            <span className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-white mb-8 cursor-pointer transition-colors group">
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
              Back to Catalog
            </span>
          </Link>

          <div className="grid lg:grid-cols-3 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2.5 mb-5 items-center">
                <Badge variant="outline" className={`font-black text-[10px] tracking-widest px-3 py-1 rounded-md uppercase border ${categoryStyles.color}`}>
                  {course.category}
                </Badge>
                {course.isFeatured && (
                  <Badge className="bg-orange-500 text-white font-extrabold px-3 py-1 text-[10px] uppercase border-none">
                    ⭐ Featured Track
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-150 bg-clip-text text-transparent">
                {course.title}
              </h1>
              
              <p className="text-base sm:text-lg text-slate-355 mb-8 leading-relaxed font-normal max-w-3xl">
                {course.description}
              </p>

              {/* Dynamic trust signals row */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-slate-300 border-t border-slate-900 pt-6">
                
                {/* Rating */}
                <div className="flex items-center gap-1 text-sm font-bold">
                  <span className="text-amber-400 flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4.5 w-4.5 ${i < Math.floor(parseFloat(ratingValue)) ? 'fill-current' : 'opacity-30'}`} />
                    ))}
                  </span>
                  <span className="text-white ml-1.5">{ratingValue}</span>
                  <span className="text-slate-500 font-semibold">({totalReviews} reviews)</span>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="h-4.5 w-4.5 text-indigo-400" />
                  <span>{course.duration} Duration</span>
                </div>

                {/* Enrolled students */}
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4.5 w-4.5 text-indigo-400" />
                  <span>{course.enrollmentCount || 0} Registered Students</span>
                </div>
              </div>
            </div>
            
            {/* Hero Right Visual Column */}
            <div className="relative">
              <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl relative group">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${categoryStyles.gradient} flex items-center justify-center`}>
                    <PlayCircle className="h-20 w-20 text-white/40 group-hover:text-white/60 transition-colors cursor-pointer" />
                  </div>
                )}
                
                {/* Overlay shadow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Details Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-3 gap-12 items-start">
        
        {/* Left Side: Program Content & outcomes */}
        <div className="lg:col-span-2 space-y-12">
                   {/* Section: What you will learn */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-sm">
            <h2 className="text-xl font-black text-slate-850 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Award className="h-5.5 w-5.5 text-indigo-600" /> What You Will Master
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {outcomes.map((outcome, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="h-5 w-5 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400 font-extrabold" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-350">
                    {outcome}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Course Syllabus Description */}
          {syllabusText && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7 shadow-sm">
              <h2 className="text-xl font-black text-slate-850 dark:text-slate-100 mb-4 flex items-center gap-2">
                <FileText className="h-5.5 w-5.5 text-indigo-600" /> Syllabus Blueprint
              </h2>
              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 text-xs leading-relaxed whitespace-pre-line font-medium">
                {syllabusText}
              </div>
            </section>
          )}
          
          {/* Section: Structured Lectures Curriculum */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="h-5.5 w-5.5 text-indigo-600" /> Lectures & Curriculum
              </h2>
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2.5 py-1 text-xs">
                {lessons?.length || 0} Modules
              </Badge>
            </div>

            <div className="space-y-4">
              {lessons?.length ? (
                lessons.map((lesson, index) => (
                  <div 
                    key={lesson.id} 
                    className="group/item flex items-start gap-4 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-200"
                  >
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-sm shrink-0">
                      {(index + 1).toString().padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                        <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-100 leading-snug group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">
                          {lesson.title}
                        </h3>
                        <Badge className="w-fit bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold px-2 py-0.5 text-[10px] uppercase border border-slate-100 dark:border-slate-900">
                          Lecture
                        </Badge>
                      </div>
                      
                      {lesson.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-3">
                          {lesson.description}
                        </p>
                      )}

                      {/* Small tags indicating materials */}
                      <div className="flex flex-wrap gap-2 text-xxs font-bold uppercase tracking-wider text-slate-400">
                        {lesson.pdfUrl && (
                          <span className="flex items-center gap-1 bg-red-50 dark:bg-red-950/20 text-red-600 px-2 py-0.5 rounded border border-red-100 dark:border-red-950/40">
                            📎 Reference Slide PDF
                          </span>
                        )}
                        {lesson.resources && (
                          <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/20 text-blue-650 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-950/40">
                            🔗 Web Lab Resources
                          </span>
                        )}
                        {!lesson.pdfUrl && !lesson.resources && (
                          <span className="text-[10px] lowercase italic font-normal text-slate-400">Standard lecture notes included</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-slate-500 text-sm font-semibold italic">Curriculum details and weekly syllabus maps coming soon.</p>
                </div>
              )}
            </div>
          </section>

          {/* Section: Instructor Information */}
          <section className="bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-7">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-4">Academic Instructors</h3>
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              
              {/* Profile avatar */}
              <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/10">
                {course.teacherName ? course.teacherName.split(' ').map(n=>n.charAt(0)).join('') : "TE"}
              </div>

              {/* Bio details */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-black text-slate-850 dark:text-slate-100 leading-none">
                    {course.teacherName || "Academy Expert"}
                  </h4>
                  <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 font-bold text-[9px] uppercase border-indigo-250 py-0 px-2 leading-none h-5">
                    Professor
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Experienced practitioner and academic scholar dedicated to providing modern, step-by-step practical frameworks. Focused on equipping alumni with verified credentials and job-ready technical capacity.
                </p>
                <div className="flex items-center gap-4 text-xxs font-black uppercase text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-current text-amber-500" /> 4.9 Rating</span>
                  <span className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-indigo-500" /> 1,200+ Students</span>
                  <span className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-indigo-500" /> 4 Courses</span>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Right Side: Sticky Checkout Card Panel */}
        <div className="sticky top-28">
          <Card className="border-2 dark:border-slate-800/80 shadow-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <CardContent className="p-7">
              
              {/* Fee Breakdown header */}
              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-1">Billable Tuition Balance</span>
              <div className="text-3xl font-black mb-6 text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {course.isFree ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1.5">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" /> Free Admission
                  </span>
                ) : (
                  <>
                    <DollarSign className="h-7 w-7 text-slate-400 -mr-1" />
                    <span className="font-extrabold text-[28px] tracking-tight">{course.fee?.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 font-semibold self-end pb-1.5">PKR</span>
                  </>
                )}
              </div>
              
              {/* Key program offerings */}
              <div className="space-y-4 mb-8">
                <div className="text-xs font-black text-slate-450 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                  Program Offerings
                </div>
                <ul className="space-y-3.5">
                  <li className="flex items-start gap-3 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" /> 
                    <span>Lifetime dashboard & lessons access</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" /> 
                    <span>Handouts & reference materials included</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" /> 
                    <span>Verifiable certificate of completion</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" /> 
                    <span>Required passing attendance: <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">{passingCriteria}%</span></span>
                  </li>
                </ul>
              </div>
              
              {/* CTA Action button */}
              <Button 
                size="lg" 
                className="w-full text-sm font-black h-12.5 rounded-xl shadow-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white transition-all duration-200" 
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {isEnrolled ? (enrollmentStatus === 'active' ? 'Resume Program' : 'Awaiting Approval') : 'Submit Admission Request'}
              </Button>

              {/* PDF Outline Download — always shown if available */}
              {(course as any).outlinePdfUrl && (
                <a
                  href={(course as any).outlinePdfUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-3 flex items-center justify-center gap-2 w-full h-11 rounded-xl border-2 font-black text-xs transition-all duration-200 ${
                    isEnrolled && enrollmentStatus === 'active'
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  {isEnrolled && enrollmentStatus === 'active'
                    ? 'Download Course Outline PDF'
                    : 'Preview Course Outline (Enroll to Download)'}
                </a>
              )}

              {/* Security indicator tag */}
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure Academic Enrolment
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
