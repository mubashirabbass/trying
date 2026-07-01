import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { SettingsProvider } from "@/lib/SettingsContext";
import { useEffect, lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Loader2 } from "lucide-react";

// ─── Lazy page imports ────────────────────────────────────────────────────────
// Public
const NotFound            = lazy(() => import("@/pages/not-found"));
const Home                = lazy(() => import("@/pages/home"));
const Register            = lazy(() => import("@/pages/register"));
const Login               = lazy(() => import("@/pages/login"));
const About               = lazy(() => import("@/pages/about"));
const Contact             = lazy(() => import("@/pages/contact"));
const Courses             = lazy(() => import("@/pages/courses"));
const CourseDetail        = lazy(() => import("@/pages/course-detail"));
const VerifyCertificate   = lazy(() => import("@/pages/verify-certificate"));
const Services            = lazy(() => import("@/pages/services"));
const SuccessStories      = lazy(() => import("@/pages/success-stories"));
const SuccessStoryDetail  = lazy(() => import("@/pages/success-story-detail"));
const Resources           = lazy(() => import("@/pages/resources"));
const ArticleDetail       = lazy(() => import("@/pages/article-detail"));
const Incubators          = lazy(() => import("@/pages/incubators"));
const Feedback            = lazy(() => import("@/pages/feedback"));
const ForgotPassword      = lazy(() => import("@/pages/forgot-password"));
const ResetPassword       = lazy(() => import("@/pages/reset-password"));
const PrivacyPolicy       = lazy(() => import("@/pages/privacy.tsx"));
const VerifyEmail         = lazy(() => import("@/pages/verify-email"));
const Branches            = lazy(() => import("@/pages/branches"));

// Student
const StudentDashboard    = lazy(() => import("@/pages/student/dashboard"));
const StudentCourses      = lazy(() => import("@/pages/student/courses-pro"));
const LessonPlayer        = lazy(() => import("@/pages/student/lesson-player-pro"));
const StudentAssignments  = lazy(() => import("@/pages/student/assignments"));
const StudentQuizzes      = lazy(() => import("@/pages/student/quizzes"));
const StudentCertificates = lazy(() => import("@/pages/student/certificates"));
const StudentMessages     = lazy(() => import("@/pages/student/messages"));
const StudentForum        = lazy(() => import("@/pages/student/forum"));
const StudentLeaderboard  = lazy(() => import("@/pages/student/leaderboard"));
const StudentPayment      = lazy(() => import("@/pages/student/payment"));
const StudentFees         = lazy(() => import("@/pages/student/fees"));
const QuizPlayer          = lazy(() => import("@/pages/student/quiz-player"));
const StudentProfile      = lazy(() => import("@/pages/student/profile"));
const StudentProgress     = lazy(() => import("@/pages/student/progress"));
const StudentBrowse       = lazy(() => import("@/pages/student/browse"));
const QuizResultPage      = lazy(() => import("@/pages/student/quiz-result"));
const StudentCard         = lazy(() => import("@/pages/student/student-card"));
const StudentPrintDetails = lazy(() => import("@/pages/student/print-details"));
const StudentCourseDetails = lazy(() => import("@/pages/student/course-details"));
const StudentAttendance   = lazy(() => import("@/pages/student/attendance"));
const StudentLiveClasses  = lazy(() => import("@/pages/student/live-classes"));

// Teacher
const TeacherDashboard    = lazy(() => import("@/pages/teacher/dashboard"));
const TeacherCourses      = lazy(() => import("@/pages/teacher/courses"));
const TeacherCourseBuilder = lazy(() => import("@/pages/teacher/course-builder"));
const TeacherGrading      = lazy(() => import("@/pages/teacher/grading"));
const TeacherAssignments  = lazy(() => import("@/pages/teacher/assignments"));
const TeacherQuizzes      = lazy(() => import("@/pages/teacher/quizzes"));
const TeacherMessages     = lazy(() => import("@/pages/teacher/messages"));
const TeacherProfile      = lazy(() => import("@/pages/teacher/profile"));
const TeacherStudents     = lazy(() => import("@/pages/teacher/students"));
const TeacherAttendance   = lazy(() => import("@/pages/teacher/attendance"));
const TeacherLiveClasses  = lazy(() => import("@/pages/teacher/live-classes"));

// Shared
const AttendanceManager   = lazy(() => import("@/pages/shared/attendance-manager"));
const LectureReviews      = lazy(() => import("@/pages/shared/reviews"));

// Admin
const AdminDashboard           = lazy(() => import("@/pages/admin/dashboard"));
const AdminUsers               = lazy(() => import("@/pages/admin/users"));
const AdminCourses             = lazy(() => import("@/pages/admin/courses"));
const AdminCourseCategories    = lazy(() => import("@/pages/admin/course-categories"));
const AdminPayments            = lazy(() => import("@/pages/admin/payments"));
const AdminBranches            = lazy(() => import("@/pages/admin/branches"));
const AdminSuccessStories      = lazy(() => import("@/pages/admin/success-stories"));
const AdminTeacherAttendance   = lazy(() => import("@/pages/admin/teacher-attendance"));
const AdminTestimonials        = lazy(() => import("@/pages/admin/testimonials"));
const AdminSettings            = lazy(() => import("@/pages/admin/settings"));
const AdminAnnouncements       = lazy(() => import("@/pages/admin/announcements"));
const AdminEnrollments         = lazy(() => import("@/pages/admin/enrollments"));
const AdminTeachers            = lazy(() => import("@/pages/admin/teachers"));
const AdminCertificates        = lazy(() => import("@/pages/admin/certificates"));
const AdminReports             = lazy(() => import("@/pages/admin/reports"));
const AdminStudentDetail       = lazy(() => import("@/pages/admin/student-detail"));
const AdminTeacherDetail       = lazy(() => import("@/pages/admin/teacher-detail"));
const AdminCourseReview        = lazy(() => import("@/pages/admin/course-review"));
const AdminCourseEdit          = lazy(() => import("@/pages/admin/course-edit"));
const AdminCourseContent       = lazy(() => import("@/pages/admin/course-content"));
const AdminForum               = lazy(() => import("@/pages/admin/forum"));
const AdminMessages            = lazy(() => import("@/pages/admin/messages"));
const AdminLeaderboard         = lazy(() => import("@/pages/admin/leaderboard"));
const AdminFeaturedCourses     = lazy(() => import("@/pages/admin/featured-courses"));
const AdminArticles            = lazy(() => import("@/pages/admin/articles"));
const AdminFAQs                = lazy(() => import("@/pages/admin/faqs"));
const AdminFranchiseApplications = lazy(() => import("@/pages/admin/franchise-applications"));
const AdminFees                = lazy(() => import("@/pages/admin/fees"));
const AdminPayroll             = lazy(() => import("@/pages/admin/payroll"));
const CashbookIncome           = lazy(() => import("@/pages/admin/cashbook-income"));
const CashbookExpenses         = lazy(() => import("@/pages/admin/cashbook-expenses"));
const AdminForms               = lazy(() => import("@/pages/admin/forms"));
const AdminEntryRecords        = lazy(() => import("@/pages/admin/entry-records"));
const AdminLiveClasses         = lazy(() => import("@/pages/admin/live-classes"));
// ─────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient();

/** Full-page spinner shown while a lazy chunk is being downloaded */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading page…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return null;
  return user ? <Component {...rest} /> : null;
}

function Router() {
  const baseUrl = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
  
  return (
    <div className="animate-in fade-in duration-500">
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Public Routes */}
          <Route path="/" component={Home} />
          <Route path="/register" component={Register} />
          <Route path="/login" component={Login} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/courses" component={Courses} />
          <Route path="/services" component={Services} />

          <Route path="/success-stories" component={SuccessStories} />
          <Route path="/success-stories/:id" component={SuccessStoryDetail} />
          <Route path="/resources" component={Resources} />
          <Route path="/resources/:slug" component={ArticleDetail} />
          <Route path="/incubators" component={Incubators} />
          <Route path="/courses/:id" component={CourseDetail} />
          <Route path="/verify-certificate" component={VerifyCertificate} />
          <Route path="/feedback" component={Feedback} />
          <Route path="/branches" component={Branches} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password/:token" component={ResetPassword} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/verify-email" component={VerifyEmail} />

          {/* Student Protected Routes */}
          <Route path="/dashboard">
            <ProtectedRoute component={StudentDashboard} />
          </Route>
          <Route path="/dashboard/courses">
            <ProtectedRoute component={StudentCourses} />
          </Route>
          <Route path="/dashboard/lessons/:courseId">
            <ProtectedRoute component={LessonPlayer} />
          </Route>
          <Route path="/dashboard/lessons/:courseId/:lessonId">
            <ProtectedRoute component={LessonPlayer} />
          </Route>
          <Route path="/dashboard/assignments">
            <ProtectedRoute component={StudentAssignments} />
          </Route>
          <Route path="/dashboard/quizzes">
            <ProtectedRoute component={StudentQuizzes} />
          </Route>
          <Route path="/dashboard/quizzes/:id">
            <ProtectedRoute component={QuizPlayer} />
          </Route>
          <Route path="/dashboard/quizzes/results/:id">
            <ProtectedRoute component={QuizResultPage} />
          </Route>
          <Route path="/dashboard/certificates">
            <ProtectedRoute component={StudentCertificates} />
          </Route>
          <Route path="/dashboard/messages">
            <ProtectedRoute component={StudentMessages} />
          </Route>
          <Route path="/dashboard/forum">
            <ProtectedRoute component={StudentForum} />
          </Route>
          <Route path="/dashboard/leaderboard">
            <ProtectedRoute component={StudentLeaderboard} />
          </Route>
          <Route path="/dashboard/payment/:courseId">
            <ProtectedRoute component={StudentPayment} />
          </Route>
          <Route path="/dashboard/fees">
            <ProtectedRoute component={StudentFees} />
          </Route>
          <Route path="/dashboard/profile">
            <ProtectedRoute component={StudentProfile} />
          </Route>
          <Route path="/dashboard/progress">
            <ProtectedRoute component={StudentProgress} />
          </Route>
          <Route path="/dashboard/browse">
            <ProtectedRoute component={StudentBrowse} />
          </Route>
          <Route path="/dashboard/attendance">
            <ProtectedRoute component={StudentAttendance} />
          </Route>
          <Route path="/dashboard/live-classes">
            <ProtectedRoute component={StudentLiveClasses} />
          </Route>
          <Route path="/dashboard/student-card">
            <ProtectedRoute component={StudentCard} />
          </Route>
          <Route path="/dashboard/print-details">
            <ProtectedRoute component={StudentPrintDetails} />
          </Route>
          <Route path="/dashboard/course-details/:id">
            <ProtectedRoute component={StudentCourseDetails} />
          </Route>

          {/* Teacher Protected Routes */}
          <Route path="/teacher">
            <ProtectedRoute component={TeacherDashboard} />
          </Route>
          <Route path="/teacher/messages">
            <ProtectedRoute component={TeacherMessages} />
          </Route>
          <Route path="/teacher/profile">
            <ProtectedRoute component={TeacherProfile} />
          </Route>
          <Route path="/teacher/students">
            <ProtectedRoute component={TeacherStudents} />
          </Route>
          <Route path="/teacher/courses">
            <ProtectedRoute component={TeacherCourses} />
          </Route>
          <Route path="/teacher/courses/:id">
            <ProtectedRoute component={TeacherCourseBuilder} />
          </Route>
          <Route path="/teacher/grading">
            <ProtectedRoute component={TeacherGrading} />
          </Route>
          <Route path="/teacher/assignments">
            <ProtectedRoute component={TeacherAssignments} />
          </Route>
          <Route path="/teacher/quizzes">
            <ProtectedRoute component={TeacherQuizzes} />
          </Route>
          <Route path="/teacher/forum">
            <ProtectedRoute component={StudentForum} />
          </Route>
          <Route path="/teacher/attendance">
            <ProtectedRoute component={AttendanceManager} />
          </Route>
          <Route path="/teacher/my-attendance">
            <ProtectedRoute component={TeacherAttendance} />
          </Route>
          <Route path="/teacher/live-classes">
            <ProtectedRoute component={TeacherLiveClasses} />
          </Route>
          <Route path="/teacher/reviews">
            <ProtectedRoute component={LectureReviews} />
          </Route>
          <Route path="/teacher/articles">
            <ProtectedRoute component={AdminArticles} allowedRoles={["admin", "teacher"]} />
          </Route>

          {/* Admin Protected Routes */}
          <Route path="/admin">
            <ProtectedRoute component={AdminDashboard} />
          </Route>
          <Route path="/admin/users">
            <ProtectedRoute component={AdminUsers} />
          </Route>
          <Route path="/admin/users/:id">
            <ProtectedRoute component={AdminStudentDetail} />
          </Route>
          <Route path="/admin/courses">
            <ProtectedRoute component={AdminCourses} />
          </Route>
          <Route path="/admin/courses/:id/review">
            <ProtectedRoute component={AdminCourseReview} />
          </Route>
          <Route path="/admin/courses/:id/edit">
            <ProtectedRoute component={AdminCourseEdit} />
          </Route>
          <Route path="/admin/courses/:id/content">
            <ProtectedRoute component={AdminCourseContent} />
          </Route>
          <Route path="/admin/course-categories">
            <ProtectedRoute component={AdminCourseCategories} />
          </Route>
          <Route path="/admin/payments">
            <ProtectedRoute component={AdminPayments} />
          </Route>
          <Route path="/admin/cashbook">
            <ProtectedRoute component={CashbookIncome} />
          </Route>
          <Route path="/admin/cashbook-income">
            <ProtectedRoute component={CashbookIncome} />
          </Route>
          <Route path="/admin/cashbook-expenses">
            <ProtectedRoute component={CashbookExpenses} />
          </Route>
          <Route path="/admin/forms">
            <ProtectedRoute component={AdminForms} />
          </Route>
          <Route path="/admin/entry-records">
            <ProtectedRoute component={AdminEntryRecords} />
          </Route>
          <Route path="/admin/fees">
            <ProtectedRoute component={AdminFees} />
          </Route>
          <Route path="/admin/payroll">
            <ProtectedRoute component={AdminPayroll} />
          </Route>
          <Route path="/admin/branches">
            <ProtectedRoute component={AdminBranches} />
          </Route>
          <Route path="/admin/success-stories">
            <ProtectedRoute component={AdminSuccessStories} />
          </Route>
          <Route path="/admin/testimonials">
            <ProtectedRoute component={AdminTestimonials} />
          </Route>
          <Route path="/admin/settings">
            <ProtectedRoute component={AdminSettings} />
          </Route>
          <Route path="/admin/announcements">
            <ProtectedRoute component={AdminAnnouncements} />
          </Route>
          <Route path="/admin/forum">
            <ProtectedRoute component={AdminForum} />
          </Route>
          <Route path="/admin/messages">
            <ProtectedRoute component={AdminMessages} />
          </Route>
          <Route path="/admin/enrollments">
            <ProtectedRoute component={AdminEnrollments} />
          </Route>
          <Route path="/admin/teachers">
            <ProtectedRoute component={AdminTeachers} />
          </Route>
          <Route path="/admin/teachers/:id">
            <ProtectedRoute component={AdminTeacherDetail} />
          </Route>
          <Route path="/admin/certificates">
            <ProtectedRoute component={AdminCertificates} />
          </Route>
          <Route path="/admin/reports">
            <ProtectedRoute component={AdminReports} />
          </Route>
          <Route path="/admin/leaderboard">
            <ProtectedRoute component={AdminLeaderboard} />
          </Route>
          <Route path="/admin/featured-courses">
            <ProtectedRoute component={AdminFeaturedCourses} />
          </Route>
          <Route path="/admin/articles">
            <ProtectedRoute component={AdminArticles} />
          </Route>
          <Route path="/admin/faqs">
            <ProtectedRoute component={AdminFAQs} />
          </Route>
          <Route path="/admin/attendance">
            <ProtectedRoute component={AttendanceManager} />
          </Route>
          <Route path="/admin/teacher-attendance">
            <ProtectedRoute component={AdminTeacherAttendance} />
          </Route>
          <Route path="/admin/live-classes">
            <ProtectedRoute component={AdminLiveClasses} />
          </Route>
          <Route path="/admin/reviews">
            <ProtectedRoute component={LectureReviews} />
          </Route>
          <Route path="/admin/franchise-applications">
            <ProtectedRoute component={AdminFranchiseApplications} />
          </Route>

          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </div>
  );
}

function App() {
  const base = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              <WouterRouter base={base}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
