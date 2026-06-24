import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useListEnrollments, useListCourses, useListLessons, useListPayments } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, PlayCircle, CheckCircle2, BookOpen, ArrowRight, 
  Clock, Award, TrendingUp, Filter, Search, Grid, List,
  Layers, BookMarked, Sparkles, ShieldCheck, DollarSign, 
  CheckSquare, FileText, Download, Info, Calendar, ArrowUpRight,
  Ban
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function CoursesPro() {
  const { user } = userAuthWrap();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for Handbook modal
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);

  const { data: enrollments, isLoading: enrollmentsLoading } = useListEnrollments(
    { userId: user?.id },
    { query: { enabled: !!user?.id } }
  );

  const { data: courses, isLoading: coursesLoading } = useListCourses();

  // Helper to wrap Auth hook safely
  function userAuthWrap() {
    return useAuth();
  }

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

  const isLoading = enrollmentsLoading || coursesLoading;

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
              <SelectTrigger className="w-[180px] rounded-lg border-slate-200 font-bold">
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
            const isBlocked = enrollment.status === "blocked";
            const progress = enrollment.progress ?? 0;
            const matchedCourse = courses?.find(c => c.id === enrollment.courseId);
            
            return (
              <Card 
                key={enrollment.id} 
                className="group border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white flex flex-col justify-between"
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
                        : isBlocked
                        ? 'bg-rose-600 text-white border-0 shadow-lg'
                        : 'bg-primary text-white border-0 shadow-lg'
                    }>
                      {isComplete ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</>
                      ) : isPending ? (
                        <><Clock className="h-3 w-3 mr-1" /> Pending</>
                      ) : isBlocked ? (
                        <><Ban className="h-3 w-3 mr-1" /> Blocked</>
                      ) : (
                        <><PlayCircle className="h-3 w-3 mr-1" /> In Progress</>
                      )}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col justify-between">
                  <div>
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

                    {isBlocked && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
                        <p className="text-xs font-bold text-rose-800 flex items-center gap-2">
                          <Ban className="h-4 w-4 text-rose-600" />
                          Course access blocked due to outstanding fees. Contact admin.
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
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link href={isPending || isBlocked ? "#" : `/dashboard/lessons/${enrollment.courseId}`} className="w-full">
                      <Button 
                        className="w-full h-10 rounded-xl font-bold text-xs shadow-none transition-all"
                        disabled={isPending || isBlocked}
                        variant={isBlocked ? "destructive" : isComplete ? "outline" : "default"}
                      >
                        {isPending ? (
                          "Pending"
                        ) : isBlocked ? (
                          <><Ban className="h-3.5 w-3.5 mr-1" /> Blocked</>
                        ) : isComplete ? (
                          <>Review</>
                        ) : (
                          <>Learn <ArrowRight className="h-3.5 w-3.5 ml-1" /></>
                        )}
                      </Button>
                    </Link>

                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSelectedCourse(matchedCourse);
                        setSelectedEnrollment(enrollment);
                        setIsHandbookOpen(true);
                      }}
                      className="w-full h-10 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1"
                    >
                      <Layers className="h-3.5 w-3.5 text-slate-450" />
                      Handbook
                    </Button>
                  </div>
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
            const isBlocked = enrollment.status === "blocked";
            const progress = enrollment.progress ?? 0;
            const matchedCourse = courses?.find(c => c.id === enrollment.courseId);
            
            return (
              <Card 
                key={enrollment.id}
                className="border-none shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden bg-white"
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
                            : isBlocked
                            ? 'bg-rose-100 text-rose-700 border-rose-200 font-bold'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }>
                          {isComplete ? "Completed" : isPending ? "Pending" : isBlocked ? "Blocked" : "In Progress"}
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

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Link href={isPending || isBlocked ? "#" : `/dashboard/lessons/${enrollment.courseId}`} className="flex-1">
                          <Button 
                            disabled={isPending || isBlocked}
                            variant={isBlocked ? "destructive" : isComplete ? "outline" : "default"}
                            className="w-full h-10 rounded-xl font-bold text-xs shadow-none transition-all"
                          >
                            {isPending ? (
                              "Awaiting Approval"
                            ) : isBlocked ? (
                              <><Ban className="h-4 w-4 mr-2" /> Access Blocked</>
                            ) : isComplete ? (
                              <>Review Course <ArrowRight className="h-4 w-4 ml-2" /></>
                            ) : (
                              <>Continue Learning <ArrowRight className="h-4 w-4 ml-2" /></>
                            )}
                          </Button>
                        </Link>
                        
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSelectedCourse(matchedCourse);
                            setSelectedEnrollment(enrollment);
                            setIsHandbookOpen(true);
                          }}
                          className="h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 px-4"
                        >
                          <Layers className="h-3.5 w-3.5 text-slate-400" />
                          Handbook & Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Official Course Handbook Modal */}
      {selectedCourse && (
        <HandbookModal 
          isOpen={isHandbookOpen} 
          onOpenChange={setIsHandbookOpen} 
          course={selectedCourse} 
          enrollment={selectedEnrollment} 
        />
      )}
    </DashboardLayout>
  );
}

interface HandbookModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  course: any;
  enrollment: any;
}

function HandbookModal({ isOpen, onOpenChange, course, enrollment }: HandbookModalProps) {
  const { data: lessons, isLoading: lessonsLoading } = useListLessons(
    { courseId: course.id },
    { query: { enabled: !!course.id } } as any
  );

  // Fetch payments for the user to display dynamic fee records
  const { data: payments, isLoading: paymentsLoading } = useListPayments(
    { userId: enrollment?.userId },
    { query: { enabled: !!enrollment?.userId } }
  );

  const coursePayments = payments?.filter((p: any) => p.courseId === course.id) || [];
  const verifiedPayments = coursePayments.filter((p: any) => p.status === "verified");
  const pendingPayments = coursePayments.filter((p: any) => p.status === "pending");
  const hasPending = pendingPayments.length > 0;
  
  const totalPaid = verifiedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const totalCourseFee = course.fee || 0;
  const remainingFee = Math.max(0, totalCourseFee - totalPaid);
  
  const paymentPlan = coursePayments[0]?.paymentPlan || "full";
  const installmentMonths = coursePayments[0]?.installmentMonths || 3;

  // Aggregate teacher-uploaded materials
  const getSyllabusMaterials = () => {
    const list: any[] = [];
    lessons?.forEach((les, idx) => {
      if (les.pdfUrl) {
        list.push({
          id: `pdf-${les.id}`,
          title: `Lecture ${idx + 1} Reference PDF`,
          type: "PDF Slide / Worksheet",
          url: les.pdfUrl,
          lessonName: les.title,
          size: "2.5 MB"
        });
      }
      if (les.resources) {
        list.push({
          id: `res-${les.id}`,
          title: `Module ${idx + 1} Resource Sheet`,
          type: "External Web Resource",
          url: les.resources,
          lessonName: les.title,
          size: "Reference Link"
        });
      }
      if (les.notes) {
        list.push({
          id: `note-${les.id}`,
          title: `Lesson ${idx + 1} Supplementary Handout`,
          type: "Written Guides",
          content: les.notes,
          lessonName: les.title,
          size: "Text Notes"
        });
      }
    });

    if (list.length === 0) {
      return [
        {
          id: "sys-1",
          title: "Academic Curriculum Blueprint",
          type: "PDF Document",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          lessonName: "Syllabus Blueprint",
          size: "1.4 MB"
        },
        {
          id: "sys-2",
          title: "Comprehensive Student Onboarding Manual",
          type: "PDF Document",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          lessonName: "Onboarding Manual",
          size: "2.8 MB"
        }
      ];
    }
    return list;
  };

  const materials = getSyllabusMaterials();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white border border-slate-200 rounded-[24px] shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
              Official Course Handbook
            </Badge>
            <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Academic Year {new Date().getFullYear()}
            </div>
          </div>
          <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight mt-2 flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-primary shrink-0" />
            {course.title}
          </DialogTitle>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Dynamic academic guidebook containing official syllabus, fee records, teacher handouts, and graduation workflows.
          </p>
        </DialogHeader>

        <Tabs defaultValue="handbook" className="flex-1 overflow-hidden flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-5 bg-slate-50 border border-slate-150 p-1 rounded-xl shrink-0">
            <TabsTrigger value="handbook" className="font-bold text-[10px] sm:text-xs rounded-lg py-2">
              Overview
            </TabsTrigger>
            <TabsTrigger value="fee" className="font-bold text-[10px] sm:text-xs rounded-lg py-2">
              Fee & Billing
            </TabsTrigger>
            <TabsTrigger value="outline" className="font-bold text-[10px] sm:text-xs rounded-lg py-2">
              Syllabus Map
            </TabsTrigger>
            <TabsTrigger value="materials" className="font-bold text-[10px] sm:text-xs rounded-lg py-2 flex items-center gap-1 justify-center">
              Materials
              {materials.length > 0 && (
                <span className="h-4 px-1 bg-primary/10 text-primary text-[8px] font-bold rounded-full">
                  {materials.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="working" className="font-bold text-[10px] sm:text-xs rounded-lg py-2 flex items-center gap-1 justify-center text-emerald-650">
              <Sparkles className="h-3 w-3" /> Step-by-Step
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pt-6 pr-1">
            {/* TAB 1: OVERVIEW */}
            <TabsContent value="handbook" className="space-y-5 focus-visible:outline-none">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border border-slate-100 shadow-none bg-slate-50/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-xs mb-1">
                    <Clock className="h-4 w-4 text-primary" />
                    Course Duration
                  </div>
                  <p className="text-sm font-black text-slate-800">{course.duration}</p>
                </Card>
                <Card className="border border-slate-100 shadow-none bg-slate-50/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-xs mb-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-650" />
                    Passing Threshold
                  </div>
                  <p className="text-sm font-black text-slate-800">{course.minAttendancePercentage}% Attendance</p>
                </Card>
                <Card className="border border-slate-100 shadow-none bg-slate-50/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-xs mb-1">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    Course Pricing
                  </div>
                  <p className="text-sm font-black text-slate-800">{course.isFree ? "Free Course" : `Rs. ${course.fee}`}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-slate-400" /> Dynamic Course Profile
                </h4>
                <div className="p-5 rounded-2xl border border-slate-100 bg-white leading-relaxed text-xs text-slate-600 font-medium space-y-3">
                  <p className="whitespace-pre-wrap">{course.description}</p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: FEE STRUCTURE */}
            <TabsContent value="fee" className="space-y-5 focus-visible:outline-none">
              <div className="p-6 rounded-2xl border border-slate-150 bg-gradient-to-br from-indigo-50/20 to-purple-50/20 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-indigo-650 uppercase tracking-widest block">Tuition Ledger Overview</span>
                  <h4 className="text-2xl font-black text-slate-800">
                    {course.isFree ? "Free Academic Course" : `Rs. ${totalCourseFee.toLocaleString()} Total Tuition`}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {course.isFree ? "No tuition fee is required." : `Payment Plan: ${paymentPlan === "monthly" ? `Monthly Installment (${installmentMonths} months)` : "Full Payment"}`}
                  </p>
                </div>
                <Badge className={
                  remainingFee === 0 
                    ? "bg-emerald-100 text-emerald-805 border-emerald-200 text-xs font-bold px-3 py-1 rounded-full shrink-0" 
                    : "bg-amber-100 text-amber-805 border-amber-200 text-xs font-bold px-3 py-1 rounded-full shrink-0"
                }>
                  {course.isFree ? "Free Access" : remainingFee === 0 ? "Ledger Cleared" : "Balance Remaining"}
                </Badge>
              </div>

              {/* Installment Actions */}
              {!course.isFree && remainingFee > 0 && (
                <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h5 className="font-black text-slate-800 text-sm">Fulfill Tuition Fee Balance</h5>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Remaining balance: <strong className="text-indigo-700">Rs. {remainingFee.toLocaleString()}</strong>.
                      {hasPending && " You have a payment pending verification."}
                    </p>
                  </div>
                  <Link href={`/dashboard/payment/${course.id}`}>
                    <Button 
                      disabled={hasPending} 
                      className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {hasPending ? (
                        <>Verification Pending...</>
                      ) : (
                        <>Pay Next Amount <ArrowUpRight className="h-4 w-4 ml-1.5" /></>
                      )}
                    </Button>
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tuition Ledger Card */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Financial Summary</h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white text-xs divide-y divide-slate-100">
                    <div className="p-3.5 flex justify-between font-bold text-slate-650">
                      <span>Total Course Fee</span>
                      <span className="text-slate-850">Rs. {totalCourseFee.toLocaleString()}</span>
                    </div>
                    <div className="p-3.5 flex justify-between font-bold text-slate-650 bg-emerald-50/20">
                      <span>Total Paid to Date</span>
                      <span className="text-emerald-700 font-black">Rs. {totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="p-3.5 flex justify-between font-black text-slate-800 bg-slate-50 text-sm">
                      <span>Outstanding Balance</span>
                      <span className="text-primary">Rs. {remainingFee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Receipts Tracker List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Submitted Receipts</h4>
                  <div className="border border-slate-100 rounded-xl bg-white text-xs divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {paymentsLoading ? (
                      <div className="p-6 text-center text-slate-450 font-medium">Loading receipts ledger...</div>
                    ) : coursePayments.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 font-bold">No receipts submitted yet.</div>
                    ) : (
                      coursePayments.map((pay: any) => (
                        <div key={pay.id} className="p-3 flex justify-between items-center gap-2 hover:bg-slate-50/50">
                          <div>
                            <div className="font-bold text-slate-800">
                              Rs. {(pay.amount || 0).toLocaleString()}
                              {pay.paymentPlan === "monthly" && (
                                <span className="text-[10px] text-slate-400 ml-1.5 font-medium">Month #{pay.installmentNumber}</span>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-450 mt-0.5">
                              {new Date(pay.createdAt).toLocaleDateString()} via {pay.method.toUpperCase()}
                            </div>
                          </div>
                          <div>
                            {pay.status === "verified" ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-250 font-bold hover:bg-emerald-50">Verified</Badge>
                            ) : pay.status === "rejected" ? (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-250 font-bold hover:bg-rose-50">Rejected</Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-250 font-bold hover:bg-amber-50 animate-pulse">Pending</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: COURSE OUTLINE & SYLLABUS */}
            <TabsContent value="outline" className="space-y-5 focus-visible:outline-none">
              <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-150 bg-slate-50/50 justify-between items-start sm:items-center">
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 bg-red-50 rounded-xl border border-red-100 flex items-center justify-center text-red-650 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Official Syllabus Blueprint</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Approved academic PDF guide</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const link = course.syllabus || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
                    window.open(link, "_blank");
                  }}
                  className="h-8 font-bold text-[10px] bg-slate-700 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 shrink-0"
                >
                  <Download className="h-3 w-3" /> Get Outline
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Curriculum Section List</h4>
                <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white max-h-64 overflow-y-auto">
                  {lessonsLoading ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" /> Loading syllabus...
                    </div>
                  ) : lessons && lessons.length > 0 ? (
                    lessons.map((les, idx) => (
                      <div key={les.id} className="p-3.5 hover:bg-slate-50 transition-colors flex gap-3 text-xs leading-snug items-start">
                        <span className="font-black text-primary shrink-0">L{idx + 1}</span>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">{les.title}</span>
                          {les.description && (
                            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block leading-relaxed line-clamp-2">
                              {les.description}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                      No dynamic syllabus lessons structured yet by the teacher.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: STUDY MATERIALS */}
            <TabsContent value="materials" className="space-y-4 focus-visible:outline-none">
              <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 bg-white max-h-96 overflow-y-auto">
                {lessonsLoading ? (
                  <div className="p-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                    <span className="text-xs text-slate-500 font-medium">Indexing lecture assets...</span>
                  </div>
                ) : materials.length > 0 ? (
                  materials.map((m) => (
                    <div key={m.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center gap-4">
                      <div className="flex gap-3 items-start min-w-0">
                        <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${
                          m.type.includes("PDF") 
                            ? "bg-red-50 text-red-550 border-red-100" 
                            : "bg-blue-50 text-blue-650 border-blue-100"
                        }`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <span className="font-bold text-slate-800 text-xs block leading-snug line-clamp-1">
                            {m.title}
                          </span>
                          <span className="text-[9px] text-slate-450 font-semibold block">
                            Topic: {m.lessonName} • {m.type} ({m.size})
                          </span>
                        </div>
                      </div>

                      {m.content ? (
                        <Button 
                          onClick={() => alert(`Syllabus hand-out summary:\n\n${m.content}`)}
                          className="h-8 font-bold text-[10px] bg-slate-105 hover:bg-slate-200 text-slate-705 rounded-lg shrink-0 cursor-pointer shadow-none"
                        >
                          View Handout
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => window.open(m.url, "_blank")}
                          className="h-8 font-bold text-[10px] bg-blue-55 hover:bg-blue-100 text-blue-650 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer border border-blue-150 shadow-none"
                        >
                          <Download className="h-3 w-3" /> Get File
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                    No reference files structured yet by your teacher.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 5: STEP-BY-STEP WORKING TIMELINE */}
            <TabsContent value="working" className="space-y-6 focus-visible:outline-none">
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-start">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-black text-emerald-800 text-xs leading-none">Interactive Compliance Path</h4>
                  <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
                    This dynamic tracker shows exactly what requirements you must fulfill step-by-step to successfully complete this course and claim your certification.
                  </p>
                </div>
              </div>

              {/* TIMELINE LIST */}
              <div className="space-y-5 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-150">
                {/* STEP 1 */}
                <div className="relative space-y-1">
                  <div className={`absolute -left-6 h-5.5 w-5.5 rounded-full flex items-center justify-center border font-black text-[9px] ${
                    enrollment?.status === "active" || enrollment?.status === "completed"
                      ? "bg-emerald-500 text-white border-emerald-600"
                      : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}>
                    1
                  </div>
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    Enrolled & Payment Verified
                    {enrollment?.status === "active" || enrollment?.status === "completed" ? (
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-black h-4 py-0">Completed</Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[8px] font-black h-4 py-0">Awaiting</Badge>
                    )}
                  </h5>
                  <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                    Course fee ledger is cleared, and admin approves student access to video player.
                  </p>
                </div>

                {/* STEP 2 */}
                <div className="relative space-y-1">
                  <div className={`absolute -left-6 h-5.5 w-5.5 rounded-full flex items-center justify-center border font-black text-[9px] ${
                    (enrollment?.progress ?? 0) > 0
                      ? "bg-emerald-500 text-white border-emerald-600"
                      : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}>
                    2
                  </div>
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    Attend Syllabus Lectures
                    <span className="text-primary text-[10px] font-black">({enrollment?.progress ?? 0}% Done)</span>
                  </h5>
                  <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                    Watch the lecture videos, access study materials, and read supplementary guides within the lesson player.
                  </p>
                </div>

                {/* STEP 3 */}
                <div className="relative space-y-1">
                  <div className={`absolute -left-6 h-5.5 w-5.5 rounded-full flex items-center justify-center border font-black text-[9px] ${
                    enrollment?.status === "completed"
                      ? "bg-emerald-500 text-white border-emerald-600"
                      : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}>
                    3
                  </div>
                  <h5 className="font-bold text-slate-800 text-xs">
                    Satisfy Attendance Criteria
                  </h5>
                  <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                    Keep your minimum attendance above <span className="font-black text-slate-700">{course.minAttendancePercentage}%</span> throughout the course modules.
                  </p>
                </div>

                {/* STEP 4 */}
                <div className="relative space-y-1">
                  <div className={`absolute -left-6 h-5.5 w-5.5 rounded-full flex items-center justify-center border font-black text-[9px] ${
                    enrollment?.status === "completed"
                      ? "bg-emerald-500 text-white border-emerald-600"
                      : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}>
                    4
                  </div>
                  <h5 className="font-bold text-slate-800 text-xs">
                    Complete Homework Assignments & Quizzes
                  </h5>
                  <p className="text-[10px] text-slate-550 leading-normal font-semibold">
                    Submit all teacher-designed assignments and pass module quizzes to qualify for course completion.
                  </p>
                </div>

                {/* STEP 5 */}
                <div className="relative space-y-1">
                  <div className={`absolute -left-6 h-5.5 w-5.5 rounded-full flex items-center justify-center border font-black text-[9px] ${
                    enrollment?.status === "completed"
                      ? "bg-emerald-500 text-white border-emerald-600 animate-pulse"
                      : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}>
                    5
                  </div>
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    Claim Verified Graduation Certificate
                    {enrollment?.status === "completed" && (
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-black h-4 py-0">Unlocked</Badge>
                    )}
                  </h5>
                  <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                    Generate your academic certificate of excellence, signed by your teacher and school principal.
                  </p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
