import { DashboardLayout } from "@/components/DashboardLayout";
import { useListAssignments, useListCourses } from "@workspace/api-client-react";
import { 
  Loader2, 
  ClipboardList, 
  Calendar, 
  GraduationCap, 
  ChevronRight,
  Plus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLocation } from "wouter";

export default function TeacherAssignments() {
  const [, setLocation] = useLocation();
  const [courseFilter, setCourseFilter] = useState("all");

  const { data: courses } = useListCourses();
  const { data: assignments, isLoading } = useListAssignments({
    courseId: courseFilter === "all" ? undefined : Number(courseFilter)
  });

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
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Assignments</h1>
          <p className="text-slate-500 font-medium mt-1">Manage evaluations across all your courses</p>
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
        {assignments?.map((assignment) => {
          const course = courses?.find(c => c.id === assignment.courseId);
          return (
            <Card key={assignment.id} className="border-2 border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all rounded-[28px] bg-white group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div className="h-12 w-12 rounded-2xl bg-primary/8 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="font-black text-[10px] uppercase tracking-widest">
                    {assignment.totalMarks} Marks
                  </Badge>
                </div>

                <h3 className="font-black text-lg text-slate-900 leading-tight mb-1">{assignment.title}</h3>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">
                  {course?.title ?? `Course #${assignment.courseId}`}
                </p>

                <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-5">
                  {assignment.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400 font-bold">
                    <Calendar className="h-3.5 w-3.5" />
                    {assignment.dueDate
                      ? new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : "No deadline"}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary font-bold hover:bg-primary/5 rounded-xl"
                    onClick={() => setLocation("/teacher/grading")}
                  >
                    Submissions <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {assignments?.length === 0 && (
          <div className="col-span-full py-24 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <div className="h-20 w-20 rounded-[30px] bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-200">
              <ClipboardList className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">No assignments yet</h3>
            <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">
              Go to a Course Builder to create assignments for your students.
            </p>
            <Button className="mt-6 rounded-2xl font-bold shadow-lg shadow-primary/20" onClick={() => setLocation("/teacher/courses")}>
              <Plus className="h-4 w-4 mr-2" /> Go to Courses
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
