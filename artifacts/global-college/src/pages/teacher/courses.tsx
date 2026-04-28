import { DashboardLayout } from "@/components/DashboardLayout";
import { useListCourses, getListCoursesQueryKey } from "@workspace/api-client-react";
import { Loader2, Plus, BookOpen, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TeacherCourses() {
  const { data: courses, isLoading } = useListCourses({}, { query: { queryKey: getListCoursesQueryKey({}) } });

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-gray-500">Manage your assigned courses and lessons</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <Card key={course.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                  {course.category}
                </span>
                <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded-md">
                  {course.isFree ? "Free" : `Rs. ${course.fee}`}
                </span>
              </div>
              <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-gray-600 line-clamp-2 mb-4 text-sm">{course.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{course.enrollmentCount} Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.lessonCount} Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t gap-2 flex-col sm:flex-row">
              <Button variant="outline" className="w-full">Edit Details</Button>
              <Button className="w-full">Manage Lessons</Button>
            </CardFooter>
          </Card>
        ))}

        {courses?.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900">No courses assigned</h3>
            <p className="text-gray-500">You haven't been assigned to teach any courses yet.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
