import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { useEffect } from "react";

// Page Imports
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Register from "@/pages/register";
import Login from "@/pages/login";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import VerifyCertificate from "@/pages/verify-certificate";
import Trainings from "@/pages/trainings";
import Services from "@/pages/services";
import SuccessStories from "@/pages/success-stories";
import Resources from "@/pages/resources";
import Incubators from "@/pages/incubators";

// Student Pages
import StudentDashboard from "@/pages/student/dashboard";
import StudentCourses from "@/pages/student/courses";
import LessonPlayer from "@/pages/student/lesson-player";
import StudentAssignments from "@/pages/student/assignments";
import StudentQuizzes from "@/pages/student/quizzes";
import StudentCertificates from "@/pages/student/certificates";
import StudentMessages from "@/pages/student/messages";
import StudentForum from "@/pages/student/forum";
import StudentLeaderboard from "@/pages/student/leaderboard";
import VerifyIdentity from "@/pages/student/verify-identity";
import StudentPayment from "@/pages/student/payment";
import QuizPlayer from "@/pages/student/quiz-player";

// Teacher Pages
import TeacherDashboard from "@/pages/teacher/dashboard";
import TeacherCourses from "@/pages/teacher/courses";
import TeacherCourseBuilder from "@/pages/teacher/course-builder";
import TeacherGrading from "@/pages/teacher/grading";
import TeacherAssignments from "@/pages/teacher/assignments";
import TeacherQuizzes from "@/pages/teacher/quizzes";
import TeacherMessages from "@/pages/teacher/messages";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminCourses from "@/pages/admin/courses";
import AdminPayments from "@/pages/admin/payments";
import AdminBranches from "@/pages/admin/branches";
import AdminSuccessStories from "@/pages/admin/success-stories";
import AdminTestimonials from "@/pages/admin/testimonials";
import AdminSettings from "@/pages/admin/settings";
import AdminAnnouncements from "@/pages/admin/announcements";
import AdminEnrollments from "@/pages/admin/enrollments";
import AdminIdentityVerifications from "@/pages/admin/identity-verifications";

const queryClient = new QueryClient();

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
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Home} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/courses" component={Courses} />
        <Route path="/trainings" component={Trainings} />
        <Route path="/services" component={Services} />
        <Route path="/success-stories" component={SuccessStories} />
        <Route path="/resources" component={Resources} />
        <Route path="/incubators" component={Incubators} />
        <Route path="/courses/:id" component={CourseDetail} />
        <Route path="/verify-certificate" component={VerifyCertificate} />

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
        <Route path="/dashboard/verify-identity">
          <ProtectedRoute component={VerifyIdentity} />
        </Route>
        <Route path="/dashboard/payment/:courseId">
          <ProtectedRoute component={StudentPayment} />
        </Route>

        {/* Teacher Protected Routes */}
        <Route path="/teacher">
          <ProtectedRoute component={TeacherDashboard} />
        </Route>
        <Route path="/teacher/messages">
          <ProtectedRoute component={TeacherMessages} />
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

        {/* Admin Protected Routes */}
        <Route path="/admin">
          <ProtectedRoute component={AdminDashboard} />
        </Route>
        <Route path="/admin/users">
          <ProtectedRoute component={AdminUsers} />
        </Route>
        <Route path="/admin/courses">
          <ProtectedRoute component={AdminCourses} />
        </Route>
        <Route path="/admin/payments">
          <ProtectedRoute component={AdminPayments} />
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
        <Route path="/admin/identity-verifications">
          <ProtectedRoute component={AdminIdentityVerifications} />
        </Route>
        <Route path="/admin/enrollments">
          <ProtectedRoute component={AdminEnrollments} />
        </Route>

        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  const base = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={base}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
