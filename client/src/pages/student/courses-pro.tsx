import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useListEnrollments } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, PlayCircle, CheckCircle2, BookOpen, ArrowRight, 
  Clock, Award, TrendingUp, Filter, Search, Grid, List
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CoursesPro() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: enrollments, isLoading } = useListEnrollments(
    { userId: user?.id },
    { query: { enabled: !!user?.id } }
  );

  // Filter enrollments
  const filteredEnrollments = enrollments?.filter(enrollment => {
    const matchesSearch = enrollment.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "in-progress" && enrollment.status === "active" && (enrollment.progress ?? 0) < 100) ||
      (filterStatus === "completed" && enrollment.status === "completed") ||
      (filterStatus === "pending" && enrollment.status === "pending");
    
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const totalCourses = enrollments?.length || 0;
  const completedCourses = enrollments?.filter(e => e.status === "completed").length || 0;
  const inProgressCourses = enrollments?.filter(e => e.status === "active" && (e.progress ?? 0) < 100).length || 0;
  const avgProgress = enrollments?.length 
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress ?? 0), 0) / enrollments.length)
    : 0;

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
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
              My Learning
            </h1>
            <p className="text-slate-600 font-medium">
              Track your progress and continue your learning journey
            </p>
          </div>
          <Link href="/dashboard/browse">
            <Button size="lg" className="rounded-xl font-semibold shadow-lg shadow-primary/20">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Courses
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-1">Total Courses</p>
                  <p className="text-3xl font-black text-blue-900">{totalCourses}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-600 mb-1">Completed</p>
                  <p className="text-3xl font-black text-emerald-900">{completedCourses}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-600 mb-1">In Progress</p>
                  <p className="text-3xl font-black text-amber-900">{inProgressCourses}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-600 mb-1">Avg Progress</p>
                  <p className="text-3xl font-black text-purple-900">{avgProgress}%</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg border-slate-200"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] rounded-lg border-slate-200">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-lg"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-lg"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Courses Grid/List */}
      {filteredEnrollments?.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="h-20 w-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-300">
            <BookOpen className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">
            {searchQuery || filterStatus !== "all" ? "No courses found" : "No enrolled courses"}
          </h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto mb-6">
            {searchQuery || filterStatus !== "all" 
              ? "Try adjusting your filters or search query"
              : "Start your learning journey by enrolling in a course"
            }
          </p>
          {!searchQuery && filterStatus === "all" && (
            <Link href="/dashboard/browse">
              <Button size="lg" className="rounded-xl font-semibold shadow-lg shadow-primary/20">
                <BookOpen className="h-4 w-4 mr-2" />
                Explore Courses
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments?.map((enrollment) => {
            const isComplete = enrollment.status === "completed";
            const isPending = enrollment.status === "pending";
            const progress = enrollment.progress ?? 0;
            
            return (
              <Card 
                key={enrollment.id} 
                className="group border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                  {enrollment.courseThumbnail ? (
                    <img 
                      src={enrollment.courseThumbnail} 
                      alt={enrollment.courseName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                  
                  {/* Progress Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
                    <div 
                      className={`h-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className={
                      isComplete 
                        ? 'bg-emerald-500 text-white border-0 shadow-lg' 
                        : isPending
                        ? 'bg-amber-500 text-white border-0 shadow-lg animate-pulse'
                        : 'bg-primary text-white border-0 shadow-lg'
                    }>
                      {isComplete ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</>
                      ) : isPending ? (
                        <><Clock className="h-3 w-3 mr-1" /> Pending</>
                      ) : (
                        <><PlayCircle className="h-3 w-3 mr-1" /> In Progress</>
                      )}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {enrollment.courseName}
                  </h3>

                  {!isPending && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-medium">Progress</span>
                        <span className="font-bold text-primary">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {isPending && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <p className="text-xs font-semibold text-amber-800 flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Awaiting admin approval
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span>Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                    {enrollment.courseCategory && (
                      <Badge variant="outline" className="text-xs">
                        {enrollment.courseCategory}
                      </Badge>
                    )}
                  </div>

                  <Link href={isPending ? "#" : `/dashboard/lessons/${enrollment.courseId}`}>
                    <Button 
                      className="w-full rounded-xl font-semibold group-hover:shadow-lg transition-all"
                      disabled={isPending}
                      variant={isComplete ? "outline" : "default"}
                    >
                      {isPending ? (
                        "Pending Approval"
                      ) : isComplete ? (
                        <>Review Course <ArrowRight className="h-4 w-4 ml-2" /></>
                      ) : (
                        <>Continue Learning <ArrowRight className="h-4 w-4 ml-2" /></>
                      )}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {filteredEnrollments?.map((enrollment) => {
            const isComplete = enrollment.status === "completed";
            const isPending = enrollment.status === "pending";
            const progress = enrollment.progress ?? 0;
            
            return (
              <Card 
                key={enrollment.id}
                className="border-none shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Thumbnail */}
                    <div className="w-48 h-28 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 overflow-hidden">
                      {enrollment.courseThumbnail ? (
                        <img 
                          src={enrollment.courseThumbnail} 
                          alt={enrollment.courseName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-10 w-10 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-slate-900 mb-1">
                            {enrollment.courseName}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={
                          isComplete 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                            : isPending
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }>
                          {isComplete ? "Completed" : isPending ? "Pending" : "In Progress"}
                        </Badge>
                      </div>

                      {!isPending && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-600 font-medium">Course Progress</span>
                            <span className="font-bold text-primary">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}

                      <Link href={isPending ? "#" : `/dashboard/lessons/${enrollment.courseId}`}>
                        <Button 
                          disabled={isPending}
                          variant={isComplete ? "outline" : "default"}
                          className="rounded-lg"
                        >
                          {isPending ? (
                            "Awaiting Approval"
                          ) : isComplete ? (
                            <>Review Course <ArrowRight className="h-4 w-4 ml-2" /></>
                          ) : (
                            <>Continue Learning <ArrowRight className="h-4 w-4 ml-2" /></>
                          )}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
