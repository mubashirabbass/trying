import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useListEnrollments, useListCourses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  Loader2,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  ChevronRight,
  BarChart3,
  Trophy,
  Target,
  Zap,
} from "lucide-react";

export default function StudentProgress() {
  const { user } = useAuth();

  const { data: enrollments = [], isLoading: enrollLoading } = useListEnrollments(
    { userId: user?.id }
  );
  const { data: allCourses = [], isLoading: coursesLoading } = useListCourses();

  const isLoading = enrollLoading || coursesLoading;

  // Merge enrollment data with course data
  const progressData = enrollments.map((enr: any) => {
    const course = allCourses.find((c: any) => c.id === enr.courseId);
    return {
      ...enr,
      courseTitle: course?.title || `Course #${enr.courseId}`,
      category: course?.category || "General",
      thumbnailUrl: course?.thumbnailUrl,
      teacherName: course?.teacherName,
      totalLessons: course?.lessonCount || 0,
    };
  });

  const totalEnrolled = progressData.length;
  const completed = progressData.filter((e: any) => e.isCompleted).length;
  const inProgress = totalEnrolled - completed;
  const avgProgress = totalEnrolled > 0
    ? Math.round(progressData.reduce((acc: number, e: any) => acc + (e.progress || 0), 0) / totalEnrolled)
    : 0;

  const CATEGORY_COLORS: Record<string, string> = {
    "Computer Basics": "bg-blue-50 text-blue-700",
    "Graphic Design": "bg-purple-50 text-purple-700",
    "Freelancing": "bg-orange-50 text-orange-700",
    "Web Development": "bg-emerald-50 text-emerald-700",
    "Digital Marketing": "bg-pink-50 text-pink-700",
    "MS Office": "bg-indigo-50 text-indigo-700",
    "AI Tools": "bg-amber-50 text-amber-700",
  };

  const [isExporting, setIsExporting] = useState(false);
  const downloadReport = async () => {
    if (!user?.id) return;
    setIsExporting(true);
    try {
      const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const response = await fetch(`${BASE}/api/reports/students/${user.id}/progress`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `progress-report-${user.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Learning Progress</h1>
          <p className="text-gray-500 mt-1">Your comprehensive learning analytics and course completion status.</p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-xl font-bold gap-2 shrink-0"
          onClick={downloadReport}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isExporting ? "Generating..." : "Download Report"}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Enrolled", value: totalEnrolled, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Completed", value: completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "In Progress", value: inProgress, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Avg. Progress", value: `${avgProgress}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm ring-1 ring-gray-100 rounded-[20px]">
            <CardContent className="p-5">
              <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Progress Bar */}
      <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] mb-8 overflow-hidden">
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-primary transition-all duration-700" style={{ width: `${avgProgress}%` }} />
        </div>
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Overall Curriculum Completion</p>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black text-gray-900">{avgProgress}%</span>
              <div className="flex-1">
                <Progress value={avgProgress} className="h-3 bg-gray-100 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 md:border-l md:pl-6 border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-black text-gray-900">{completed}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Done</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-gray-900">{inProgress}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Course Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Per-Course Breakdown
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
          </div>
        ) : progressData.length === 0 ? (
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardContent className="py-16 text-center">
              <Target className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="font-bold text-gray-400">You haven't enrolled in any courses yet.</p>
              <Link href="/dashboard/browse">
                <Button className="mt-4 rounded-xl font-bold">
                  Browse Courses <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          progressData.map((enr: any) => {
            const progress = enr.progress || 0;
            const categoryColor = CATEGORY_COLORS[enr.category] || "bg-gray-100 text-gray-600";

            return (
              <Card key={enr.id} className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] hover:ring-primary/20 transition-all overflow-hidden group">
                <CardContent className="p-0">
                  <div className="h-1 bg-gray-50">
                    <div
                      className={`h-full transition-all duration-700 ${enr.isCompleted ? "bg-emerald-500" : "bg-primary"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                    {/* Course thumbnail */}
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                      {enr.thumbnailUrl ? (
                        <img src={enr.thumbnailUrl} alt={enr.courseTitle} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="h-7 w-7 text-gray-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`text-[10px] font-black ${categoryColor} border-none`}>
                          {enr.category}
                        </Badge>
                        {enr.isCompleted && (
                          <Badge className="text-[10px] font-black bg-emerald-50 text-emerald-700 border-none gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-black text-gray-900 truncate group-hover:text-primary transition-colors">
                        {enr.courseTitle}
                      </h3>
                      {enr.teacherName && (
                        <p className="text-xs text-gray-400 font-bold mt-0.5">by {enr.teacherName}</p>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="md:w-48 shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Progress</span>
                        <span className={`text-lg font-black ${enr.isCompleted ? "text-emerald-600" : "text-primary"}`}>
                          {progress}%
                        </span>
                      </div>
                      <Progress
                        value={progress}
                        className={`h-2 rounded-full ${enr.isCompleted ? "[&>div]:bg-emerald-500" : ""}`}
                      />
                      {enr.enrolledAt && (
                        <p className="text-[10px] text-gray-400 font-bold mt-1.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Enrolled {new Date(enr.enrolledAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      <Link href={`/dashboard/lessons/${enr.courseId}`}>
                        <Button
                          size="sm"
                          variant={enr.isCompleted ? "outline" : "default"}
                          className="rounded-xl font-bold"
                        >
                          {enr.isCompleted ? "Review" : "Continue"}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
