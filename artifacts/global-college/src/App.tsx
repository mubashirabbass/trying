import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/AuthContext";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Register from "@/pages/register";
import Login from "@/pages/login";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import VerifyCertificate from "@/pages/verify-certificate";

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

import TeacherDashboard from "@/pages/teacher/dashboard";
import TeacherMessages from "@/pages/teacher/messages";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminCourses from "@/pages/admin/courses";
import AdminPayments from "@/pages/admin/payments";
import AdminBranches from "@/pages/admin/branches";
import AdminSuccessStories from "@/pages/admin/success-stories";
import AdminTestimonials from "@/pages/admin/testimonials";
import AdminSettings from "@/pages/admin/settings";
import AdminAnnouncements from "@/pages/admin/announcements";
import AdminIdentityVerifications from "@/pages/admin/identity-verifications";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/verify-certificate" component={VerifyCertificate} />

      {/* Student */}
      <Route path="/dashboard" component={StudentDashboard} />
      <Route path="/dashboard/courses" component={StudentCourses} />
      <Route path="/dashboard/lessons/:courseId" component={LessonPlayer} />
      <Route path="/dashboard/lessons/:courseId/:lessonId" component={LessonPlayer} />
      <Route path="/dashboard/assignments" component={StudentAssignments} />
      <Route path="/dashboard/quizzes" component={StudentQuizzes} />
      <Route path="/dashboard/certificates" component={StudentCertificates} />
      <Route path="/dashboard/messages" component={StudentMessages} />
      <Route path="/dashboard/forum" component={StudentForum} />
      <Route path="/dashboard/leaderboard" component={StudentLeaderboard} />
      <Route path="/dashboard/verify-identity" component={VerifyIdentity} />

      {/* Teacher */}
      <Route path="/teacher" component={TeacherDashboard} />
      <Route path="/teacher/messages" component={TeacherMessages} />

      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/courses" component={AdminCourses} />
      <Route path="/admin/payments" component={AdminPayments} />
      <Route path="/admin/branches" component={AdminBranches} />
      <Route path="/admin/success-stories" component={AdminSuccessStories} />
      <Route path="/admin/testimonials" component={AdminTestimonials} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/announcements" component={AdminAnnouncements} />
      <Route path="/admin/identity-verifications" component={AdminIdentityVerifications} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
