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
  getListEnrollmentsQueryKey
} from "@workspace/api-client-react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlayCircle, Clock, CheckCircle2, GraduationCap, DollarSign, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const courseId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
        title: "Login Required",
        description: "Please login or register to enroll in this course.",
      });
      setLocation("/login");
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
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="text-center py-32">Course not found.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="secondary" className="mb-4 bg-primary/20 text-primary-foreground hover:bg-primary/30 border-none">
              {course.category}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{course.title}</h1>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              {course.description}
            </p>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span>{course.enrollmentCount} Students</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>{course.lessonCount} Lessons</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden border-4 border-gray-700 shadow-2xl relative group">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PlayCircle className="h-20 w-20 text-gray-600 group-hover:text-primary transition-colors cursor-pointer" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {course.syllabus && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Course Syllabus</h2>
              <div className="prose max-w-none text-gray-600">
                {course.syllabus}
              </div>
            </section>
          )}
          
          <section>
            <h2 className="text-2xl font-bold mb-6">Curriculum</h2>
            <div className="space-y-4">
              {lessons?.length ? (
                lessons.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-start gap-4 p-4 rounded-lg border bg-white hover:border-primary/50 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{lesson.title}</h3>
                      {lesson.description && <p className="text-gray-600 text-sm mt-1">{lesson.description}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">Curriculum details coming soon.</p>
              )}
            </div>
          </section>
        </div>

        <div>
          <Card className="sticky top-24 border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="text-3xl font-bold mb-6 flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-primary" />
                {course.isFree ? "Free" : `Rs. ${course.fee}`}
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle2 className="h-5 w-5 text-green-500" /> Full lifetime access
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle2 className="h-5 w-5 text-green-500" /> Access on mobile and TV
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle2 className="h-5 w-5 text-green-500" /> Certificate of completion
                </li>
              </ul>
              
              <Button 
                size="lg" 
                className="w-full text-lg h-14" 
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {isEnrolled ? (enrollmentStatus === 'active' ? 'Go to Course' : 'Approval Pending') : 'Enroll Now'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
