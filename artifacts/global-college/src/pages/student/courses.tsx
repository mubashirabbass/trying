import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useListEnrollments, getListEnrollmentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, PlayCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function StudentCourses() {
  const { user } = useAuth();
  
  const { data: enrollments, isLoading } = useListEnrollments(
    { userId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListEnrollmentsQueryKey({ userId: user?.id }) } }
  );

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-gray-500">Continue learning and track your progress</p>
      </div>
      
      {enrollments?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <PlayCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No active courses</h3>
            <p className="text-gray-500 mb-6">You haven't enrolled in any courses yet.</p>
            <Link href="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments?.map((enrollment) => (
            <Card key={enrollment.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl line-clamp-2">{enrollment.courseName}</CardTitle>
                <div className="mt-2 flex justify-between items-center text-sm">
                  <span className={`${enrollment.status === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
                    {enrollment.status === 'completed' ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Completed</span>
                    ) : (
                      "In Progress"
                    )}
                  </span>
                  <span className="font-medium text-primary">{enrollment.progress}%</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <Progress value={enrollment.progress} className="h-2 mb-4" />
                <p className="text-xs text-gray-500">
                  Enrolled on: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <Link href={`/dashboard/lessons/${enrollment.courseId}`} className="w-full">
                  <Button className="w-full" variant={enrollment.status === 'completed' ? 'outline' : 'default'}>
                    {enrollment.status === 'completed' ? 'Review Course' : 'Continue Learning'}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
