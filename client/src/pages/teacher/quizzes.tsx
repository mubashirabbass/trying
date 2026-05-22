import { DashboardLayout } from "@/components/DashboardLayout";
import { useListQuizzes, useListCourses, getListCoursesQueryKey } from "@workspace/api-client-react";
import { 
  Loader2, 
  HelpCircle, 
  Clock, 
  Trophy, 
  ChevronRight,
  Plus,
  BarChart3
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { PaginationControls, getTotalPages, paginateItems } from "@/components/PaginationControls";

const PAGE_SIZE = 6;

export default function TeacherQuizzes() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [courseFilter, setCourseFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: courses } = useListCourses(
    { teacherId: user?.id ?? undefined, limit: 100 } as any,
    { query: { queryKey: getListCoursesQueryKey({ teacherId: user?.id ?? undefined } as any), enabled: !!user?.id } }
  );
  const { data: quizzes, isLoading } = useListQuizzes({
    courseId: courseFilter === "all" ? undefined : Number(courseFilter)
  });
  const courseIds = new Set((courses ?? []).map((course: any) => course.id));
  const teacherQuizzes = (quizzes ?? []).filter((quiz: any) => courseFilter !== "all" || courseIds.has(quiz.courseId));
  const visibleQuizzes = paginateItems(teacherQuizzes, page, PAGE_SIZE);
  const totalPages = getTotalPages(teacherQuizzes.length, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [courseFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Quizzes</h1>
          <p className="text-slate-500 font-medium mt-1">Manage assessments across all your courses</p>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm font-bold text-slate-500 shrink-0">Filter:</Label>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-56 bg-white border-slate-200">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses?.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleQuizzes.map((quiz) => {
          const course = courses?.find(c => c.id === quiz.courseId);
          return (
            <Card key={quiz.id} className="border-2 border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all rounded-[28px] bg-white group overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="font-black text-[10px] uppercase bg-white">
                      {(quiz.questions ?? []).length} Qs
                    </Badge>
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[10px] uppercase">
                      {quiz.totalMarks} Marks
                    </Badge>
                  </div>
                </div>

                <h3 className="font-black text-lg text-slate-900 leading-tight mb-1">{quiz.title}</h3>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-5">
                  {course?.title ?? `Course #${quiz.courseId}`}
                </p>

                <div className="flex flex-col gap-2 mb-5">
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Time Limit: {quiz.timeLimit ?? 30} minutes
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                    <Trophy className="h-3.5 w-3.5 text-slate-400" />
                    Pass Score: {Math.ceil(quiz.totalMarks * 0.5)} / {quiz.totalMarks}
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-4 flex justify-between items-center">
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {(quiz.questions ?? []).length} questions
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl"
                    onClick={() => setLocation(`/teacher/courses/${quiz.courseId}`)}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" /> Edit in Builder
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {teacherQuizzes.length === 0 && (
          <div className="col-span-full py-24 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <div className="h-20 w-20 rounded-[30px] bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-200">
              <HelpCircle className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">No quizzes created</h3>
            <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">
              Open the Course Builder to create quizzes and test student knowledge.
            </p>
            <Button className="mt-6 rounded-2xl font-bold shadow-lg shadow-primary/20" onClick={() => setLocation("/teacher/courses")}>
              <Plus className="h-4 w-4 mr-2" /> Go to Courses
            </Button>
          </div>
        )}
      </div>
      <PaginationControls
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={teacherQuizzes.length}
        onPageChange={setPage}
        label="quizzes"
      />
    </DashboardLayout>
  );
}
