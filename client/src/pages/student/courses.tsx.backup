import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useListEnrollments, getListEnrollmentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, PlayCircle, CheckCircle2, BookOpen, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">My Courses</h1>
          <p className="text-slate-500 font-medium mt-1">Continue learning and track your progress</p>
        </div>
        <Link href="/courses">
          <Button variant="outline" className="rounded-2xl font-bold border-slate-200">
            Browse More <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
      
      {enrollments?.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
          <div className="h-20 w-20 rounded-[30px] bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-200">
            <BookOpen className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">No enrolled courses</h3>
          <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">
            You haven't joined any courses yet. Explore our catalog to find your next learning journey.
          </p>
          <Link href="/courses">
            <Button className="mt-6 rounded-2xl font-bold shadow-lg shadow-primary/20 px-8">
              Explore Courses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enrollments?.map((enrollment) => {
            const isComplete = enrollment.status === 'completed';
            const progress = enrollment.progress ?? 0;
            return (
              <Card key={enrollment.id} className="group flex flex-col border-2 border-slate-100 hover:border-primary/20 transition-all hover:shadow-xl hover:shadow-primary/5 rounded-[28px] overflow-hidden bg-white">
                {/* Progress accent line */}
                <div className="h-1.5 bg-slate-50">
                  <div 
                    className={`h-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <CardContent className="p-7 flex-1">
                  <div className="flex justify-between items-start mb-5">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${isComplete ? 'bg-emerald-50 text-emerald-600' : enrollment.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-primary/8 text-primary'}`}>
                      {isComplete ? <CheckCircle2 className="h-6 w-6" /> : enrollment.status === 'pending' ? <Loader2 className="h-6 w-6 animate-spin text-amber-500" /> : <PlayCircle className="h-6 w-6" />}
                    </div>
                    <Badge className={isComplete 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 font-black text-[10px] uppercase tracking-wider' 
                      : enrollment.status === 'pending'
                      ? 'bg-amber-100 text-amber-700 border-amber-200 font-black text-[10px] uppercase tracking-wider animate-pulse'
                      : 'bg-blue-100 text-blue-700 border-blue-200 font-black text-[10px] uppercase tracking-wider'
                    }>
                      {isComplete ? 'Completed' : enrollment.status === 'pending' ? 'Pending Approval' : 'In Progress'}
                    </Badge>
                  </div>

                  <h3 className="font-black text-xl text-slate-900 leading-tight mb-6 line-clamp-2">
                    {enrollment.courseName}
                  </h3>

                  {enrollment.status !== 'pending' ? (
                    <div className="space-y-3">
                      <div className="flex items-end justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                        <span className={`text-lg font-black ${isComplete ? 'text-emerald-600' : 'text-primary'}`}>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2.5 bg-slate-100 rounded-full" />
                    </div>
                  ) : (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-xs font-semibold text-amber-800 flex gap-2">
                      <Loader2 className="h-4 w-4 shrink-0 text-amber-500 animate-spin mt-0.5" />
                      <p>Your admission request is awaiting review by Global College administration. You'll gain access once verified.</p>
                    </div>
                  )}

                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-4">
                    Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </CardContent>

                <CardFooter className="p-7 pt-0">
                  {enrollment.status === 'pending' ? (
                    <Button 
                      className="w-full h-12 font-bold text-md rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-100 cursor-not-allowed" 
                      disabled
                    >
                      Awaiting Admin Approval
                    </Button>
                  ) : (
                    <Link href={`/dashboard/lessons/${enrollment.courseId}`} className="w-full">
                      <Button 
                        className="w-full h-12 font-bold text-md rounded-2xl shadow-lg shadow-primary/10" 
                        variant={isComplete ? 'outline' : 'default'}
                      >
                        {isComplete ? 'Review Course' : 'Continue Learning'}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
