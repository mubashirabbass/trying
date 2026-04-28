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

import TeacherDashboard from "@/pages/teacher/dashboard";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminCourses from "@/pages/admin/courses";
import AdminPayments from "@/pages/admin/payments";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/verify-certificate" component={VerifyCertificate} />

      <Route path="/dashboard" component={StudentDashboard} />
      <Route path="/dashboard/courses" component={StudentCourses} />
      <Route path="/dashboard/lessons/:courseId" component={LessonPlayer} />
      <Route path="/dashboard/lessons/:courseId/:lessonId" component={LessonPlayer} />
      <Route path="/dashboard/assignments" component={StudentAssignments} />
      <Route path="/dashboard/quizzes" component={StudentQuizzes} />
      <Route path="/dashboard/certificates" component={StudentCertificates} />

      <Route path="/teacher" component={TeacherDashboard} />

      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/courses" component={AdminCourses} />
      <Route path="/admin/payments" component={AdminPayments} />

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
