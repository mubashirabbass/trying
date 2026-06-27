import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useListQuizzes, useListQuizResults, useListEnrollments } from "@workspace/api-client-react";
import { useAuth } from "@/lib/AuthContext";
import { 
  Loader2, 
  HelpCircle, 
  Clock, 
  Play, 
  Trophy,
  CheckCircle2,
  XCircle,
  BarChart3,
  ChevronRight,
  Search,
  FileDown,
  ArrowUpDown,
  Filter,
  TableProperties,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  Info,
  Calendar,
  Award,
  Star,
  TrendingUp,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export default function StudentQuizzes() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: quizzes, isLoading: quizzesLoading } = useListQuizzes();
  const { data: results = [], isLoading: resultsLoading } = useListQuizResults();
  const { data: enrollments = [] } = useListEnrollments(
    { userId: user?.id },
    { query: { enabled: !!user?.id } }
  );
  // Only show courses the student is actively enrolled in
  const enrolledCourses = (enrollments as any[]).filter(
    (e) => e.status === "active" || e.status === "completed"
  );
  // Set of courseIds the student is enrolled in — used for total abstraction
  const enrolledCourseIds = new Set(enrolledCourses.map((e: any) => e.courseId));

  // Excel View Filters & Interactive States
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"excel" | "card">("excel");
  const [sortField, setSortField] = useState<string>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const getCourseName = (courseId: number) => {
    const courseList = Array.isArray(enrolledCourses) ? enrolledCourses : [];
    const enrolled = courseList.find(c => c.courseId === courseId);
    return enrolled?.courseName || `Course #${courseId}`;
  };

  const getQuizStatus = (quizId: number) => {
    const result = results.find((r: any) => r.quizId === quizId) as any;
    if (result) {
      return result.passed ? "passed" : "failed";
    }
    return "not_attempted";
  };

  const getStatusInfo = (quizId: number) => {
    const status = getQuizStatus(quizId);
    switch (status) {
      case "passed":
        return {
          color: "bg-emerald-500",
          textColor: "text-emerald-700",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          badgeColor: "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-250",
          label: "Passed",
          icon: CheckCircle2
        };
      case "failed":
        return {
          color: "bg-rose-500",
          textColor: "text-rose-700",
          bgColor: "bg-rose-50",
          borderColor: "border-rose-200",
          badgeColor: "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-250",
          label: "Failed",
          icon: XCircle
        };
      default:
        return {
          color: "bg-blue-500",
          textColor: "text-blue-700",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          badgeColor: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-250",
          label: "Not Attempted",
          icon: Play
        };
    }
  };

  // Sort Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Export to CSV Functionality
  const exportToCSV = () => {
    if (!quizzes || quizzes.length === 0) {
      toast({
        title: "No Data Available",
        description: "There are no quizzes available to export.",
        variant: "destructive"
      });
      return;
    }

    const headers = ["ID", "Quiz Title", "Course", "Questions Count", "Total Marks", "Time Limit (Min)", "Status", "Obtained Score", "Date Attempted"];
    
    const rows = filteredAndSortedQuizzes.map((q, index) => {
      const result = results.find((r: any) => r.quizId === q.id) as any;
      const statusLabel = result 
        ? (result.passed ? "Passed" : "Failed")
        : "Not Attempted";
      
      const courseName = getCourseName(q.courseId);
      const obtained = result ? `${result.score}/${result.totalMarks} (${result.percentage}%)` : "—";
      const attemptedDateStr = result?.submittedAt ? new Date(result.submittedAt).toLocaleDateString() : "—";
      
      return [
        index + 1,
        `"${q.title.replace(/"/g, '""')}"`,
        `"${courseName.replace(/"/g, '""')}"`,
        q.questions.length,
        q.totalMarks,
        q.timeLimit || 0,
        `"${statusLabel}"`,
        `"${obtained}"`,
        `"${attemptedDateStr}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GC_LMS_Quizzes_${user?.name.replace(/\s+/g, '_') || 'Report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Completed",
      description: `Successfully exported ${filteredAndSortedQuizzes.length} quiz records to CSV.`
    });
  };

  // Filter & Search Logic — ONLY quizzes from courses the student is enrolled in
  const filteredAndSortedQuizzes = (quizzes || [])
    .filter(quiz => {
      // Total abstraction: hide quizzes from non-enrolled courses
      if (!enrolledCourseIds.has(quiz.courseId)) return false;

      const status = getQuizStatus(quiz.id);
      const courseName = getCourseName(quiz.courseId);
      
      const matchesSearch = 
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        courseName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCourse = courseFilter === "all" || quiz.courseId === Number(courseFilter);
      const matchesStatus = 
        statusFilter === "all" || 
        status === statusFilter ||
        (statusFilter === "passed" && status === "passed") ||
        (statusFilter === "failed" && status === "failed");

      return matchesSearch && matchesCourse && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: any = a[sortField as keyof typeof a];
      let bVal: any = b[sortField as keyof typeof b];

      if (sortField === "course") {
        aVal = getCourseName(a.courseId);
        bVal = getCourseName(b.courseId);
      } else if (sortField === "status") {
        aVal = getQuizStatus(a.id);
        bVal = getQuizStatus(b.id);
      } else if (sortField === "score") {
        const resA = results.find((r: any) => r.quizId === a.id) as any;
        const resB = results.find((r: any) => r.quizId === b.id) as any;
        aVal = resA?.percentage ?? -1;
        bVal = resB?.percentage ?? -1;
      } else if (sortField === "questions") {
        aVal = a.questions.length;
        bVal = b.questions.length;
      }

      if (aVal === null || aVal === undefined) return sortDirection === "asc" ? 1 : -1;
      if (bVal === null || bVal === undefined) return sortDirection === "asc" ? -1 : 1;

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Calculate Statistics based only on enrolled-course quizzes
  const enrolledQuizzes = (quizzes || []).filter(q => enrolledCourseIds.has(q.courseId));
  const totalCount = enrolledQuizzes.length;
  const attemptedCount = results.filter((r: any) => enrolledCourseIds.has(
    enrolledQuizzes.find(q => q.id === r.quizId)?.courseId ?? -1
  )).length;
  const incompleteCount = Math.max(0, totalCount - attemptedCount);
  const passedAttemptsCount = results.filter((r: any) => r.passed && enrolledCourseIds.has(
    enrolledQuizzes.find(q => q.id === r.quizId)?.courseId ?? -1
  )).length;
  const passRate = attemptedCount > 0 ? Math.round((passedAttemptsCount / attemptedCount) * 100) : 0;
  const averageScore = attemptedCount > 0 
    ? Math.round(results
        .filter((r: any) => enrolledCourseIds.has(enrolledQuizzes.find(q => q.id === r.quizId)?.courseId ?? -1))
        .reduce((sum: number, r: any) => sum + r.percentage, 0) / attemptedCount)
    : 0;

  const renderColumnHeader = (field: string, label: string, alignment: "left" | "center" | "right" = "left") => {
    const isSorted = sortField === field;
    return (
      <th 
        onClick={() => handleSort(field)} 
        className={`px-3 py-3.5 text-[10px] font-black text-slate-550 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800 transition-colors ${
          alignment === "center" ? "text-center" : alignment === "right" ? "text-right" : "text-left"
        }`}
      >
        <div className={`flex items-center gap-1 ${alignment === "center" ? "justify-center" : alignment === "right" ? "justify-end" : "justify-start"}`}>
          {label}
          {isSorted ? (
            sortDirection === "asc" ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
          ) : (
            <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-40 hover:opacity-100" />
          )}
        </div>
      </th>
    );
  };

  const renderCardView = (quiz: any) => {
    const result = results.find((r: any) => r.quizId === quiz.id) as any;
    const statusInfo = getStatusInfo(quiz.id);
    const StatusIcon = statusInfo.icon;

    return (
      <Card 
        key={quiz.id} 
        className={`overflow-hidden border-2 transition-all hover:shadow-lg hover:scale-[1.01] cursor-pointer ${statusInfo.borderColor}`}
        onClick={() => {
          if (result) {
            setLocation(`/dashboard/quizzes/results/${result.id}`);
          } else {
            setLocation(`/dashboard/quizzes/${quiz.id}`);
          }
        }}
      >
        <div className={`h-2.5 ${statusInfo.color}`}></div>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-10 w-10 rounded-xl ${statusInfo.bgColor} flex items-center justify-center`}>
                  <StatusIcon className={`h-5 w-5 ${statusInfo.textColor}`} />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 leading-tight">{quiz.title}</CardTitle>
                  <Badge variant="outline" className={`${statusInfo.badgeColor} mt-1 font-bold`}>{statusInfo.label}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-650">
                <span className="flex items-center gap-1.5 font-bold">
                  <Award className="h-3.5 w-3.5 text-slate-400" />
                  {quiz.questions.length} Questions
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {quiz.timeLimit} Minutes
                </span>
                <span className="flex items-center gap-1.5 font-bold text-primary">
                  <Trophy className="h-3.5 w-3.5 text-primary/70" />
                  {quiz.totalMarks} Marks
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-6">
          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100/80 mb-4 flex items-center justify-between">
            <span className="text-slate-650 text-xs font-bold">{getCourseName(quiz.courseId)}</span>
            {result && (
              <span className={`text-xs font-black ${result.passed ? "text-emerald-600" : "text-rose-600"}`}>
                Score: {result.score}/{quiz.totalMarks} ({result.percentage}%)
              </span>
            )}
          </div>
          
          <Button 
            className="w-full font-bold h-10 text-xs shadow-sm hover:shadow transition-all" 
            variant={result ? "outline" : "default"}
          >
            {result ? (
              <>
                <BarChart3 className="h-4 w-4 mr-1.5" />
                View Results Analysis
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1.5" />
                Start Quiz Attempt
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white shadow-md">
                <Trophy className="h-6 w-6" />
              </div>
              Quizzes Hub
            </h1>
            <p className="text-slate-500 mt-2 font-semibold text-lg">
              Test your knowledge, review scores, and track your academic assessment performance
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button 
              onClick={exportToCSV}
              variant="outline"
              className="h-11 px-5 border-2 border-emerald-500/30 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-500 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <FileDown className="h-4 w-4 text-emerald-600" />
              Export to Excel/CSV
            </Button>
          </div>
        </div>

        {/* Stats Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Passing Rate</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{passRate}%</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold">{passedAttemptsCount} of {attemptedCount} passed</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
                <Target className="h-6 w-6" />
              </div>
            </CardContent>
            <div className="px-5 pb-4">
              <Progress value={passRate} className="h-1.5 bg-slate-100" />
            </div>
          </Card>

          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Average Grade</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{averageScore}%</h3>
                <p className="text-[10px] text-emerald-600 mt-0.5 font-bold flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" /> Premium Score
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Attempted Quizzes</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{attemptedCount}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold">Graded solutions</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-650">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Incomplete</p>
                <h3 className={`text-3xl font-black mt-1 ${incompleteCount > 0 ? "text-amber-600 animate-pulse" : "text-slate-800"}`}>
                  {incompleteCount}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold">Needs attention</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${incompleteCount > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Spreadsheet Control bar */}
      <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search quiz titles..."
              className="pl-10 h-10 border-slate-200 rounded-xl text-sm font-semibold focus-visible:ring-primary/20 bg-slate-50/50"
            />
          </div>

          {/* Filter Course — only enrolled courses */}
          <div className="w-full sm:w-48">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-250 bg-white text-xs font-black text-slate-650 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
            >
              <option value="all">📚 All Courses</option>
              {enrolledCourses.map((e: any) => (
                <option key={e.courseId} value={e.courseId}>
                  {e.courseName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-250 bg-white text-xs font-black text-slate-650 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
            >
              <option value="all">🏷 All Statuses</option>
              <option value="not_attempted">⏳ Not Attempted</option>
              <option value="passed">✅ Passed Attempts</option>
              <option value="failed">❌ Failed Attempts</option>
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-150 shrink-0">
          <Button
            size="sm"
            variant={viewMode === "excel" ? "secondary" : "ghost"}
            onClick={() => setViewMode("excel")}
            className="h-8 px-3.5 rounded-lg font-bold text-xs"
          >
            <TableProperties className="h-3.5 w-3.5 mr-1" />
            Excel Grid
          </Button>
          <Button
            size="sm"
            variant={viewMode === "card" ? "secondary" : "ghost"}
            onClick={() => setViewMode("card")}
            className="h-8 px-3.5 rounded-lg font-bold text-xs"
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1" />
            Card View
          </Button>
        </div>
      </div>

      {/* Main View Render */}
      {viewMode === "excel" ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200">
                  {renderColumnHeader("index", "#", "center")}
                  {renderColumnHeader("title", "Title")}
                  {renderColumnHeader("course", "Course")}
                  {renderColumnHeader("questions", "Questions", "center")}
                  {renderColumnHeader("totalMarks", "Marks", "center")}
                  {renderColumnHeader("timeLimit", "Time Limit", "center")}
                  {renderColumnHeader("status", "Status")}
                  {renderColumnHeader("score", "Grade", "center")}
                  <th className="px-3 py-3.5 text-center text-xs font-black text-slate-500 uppercase tracking-widest select-none">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAndSortedQuizzes.map((quiz, index) => {
                  const result = results.find((r: any) => r.quizId === quiz.id) as any;
                  const statusInfo = getStatusInfo(quiz.id);
                  const StatusIcon = statusInfo.icon;
                  const courseName = getCourseName(quiz.courseId);
                  
                  return (
                    <tr 
                      key={quiz.id} 
                      onClick={() => {
                        if (result) {
                          setLocation(`/dashboard/quizzes/results/${result.id}`);
                        } else {
                          setLocation(`/dashboard/quizzes/${quiz.id}`);
                        }
                      }}
                      className={`hover:bg-slate-50/50 transition-all cursor-pointer group ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/20"
                      }`}
                    >
                      {/* Row index */}
                      <td className="px-3 py-3.5 text-center text-slate-400 font-bold">
                        {index + 1}
                      </td>

                      {/* Title */}
                      <td className="px-3 py-3.5 max-w-[180px] truncate" title={quiz.title}>
                        <div className="font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug truncate">
                          {quiz.title}
                        </div>
                      </td>

                      {/* Course */}
                      <td className="px-3 py-3.5 font-bold text-slate-650 max-w-[150px] truncate" title={courseName}>
                        {courseName}
                      </td>

                      {/* Questions count */}
                      <td className="px-3 py-3.5 text-center font-bold text-slate-700">
                        {quiz.questions.length}
                      </td>

                      {/* Total marks */}
                      <td className="px-3 py-3.5 text-center font-bold text-slate-700">
                        {quiz.totalMarks}
                      </td>

                      {/* Time Limit */}
                      <td className="px-3 py-3.5 text-center">
                        <Badge variant="outline" className="font-bold text-xs bg-white text-slate-700 border-slate-200">
                          <Clock className="h-3 w-3 mr-1 text-slate-400" />
                          {quiz.timeLimit} Min
                        </Badge>
                      </td>

                      {/* Status badge */}
                      <td className="px-3 py-3.5">
                        <Badge 
                          variant="outline" 
                          className={`font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5 w-fit border shadow-none ${statusInfo.badgeColor}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                          {statusInfo.label}
                        </Badge>
                      </td>

                      {/* Score */}
                      <td className="px-3 py-3.5 text-center">
                        {result ? (
                          <div className="flex flex-col items-center">
                            <span className="font-black text-emerald-600 text-sm">
                              {result.score} <span className="text-[10px] text-slate-400">/ {quiz.totalMarks}</span>
                            </span>
                            <span className={`text-[10px] font-black px-1.5 py-0.25 rounded border ${
                              result.passed 
                                ? "text-emerald-500 bg-emerald-50 border-emerald-100" 
                                : "text-rose-500 bg-rose-50 border-rose-100"
                            }`}>
                              {result.percentage}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-350 font-medium text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant={result ? "secondary" : "default"}
                          className="font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 mx-auto"
                          onClick={() => {
                            if (result) {
                              setLocation(`/dashboard/quizzes/results/${result.id}`);
                            } else {
                              setLocation(`/dashboard/quizzes/${quiz.id}`);
                            }
                          }}
                        >
                          {result ? (
                            <>
                              <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                              Results
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 text-primary-foreground fill-primary-foreground" />
                              Start
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAndSortedQuizzes.length === 0 && (
            <div className="py-24 text-center bg-slate-50/50">
              <div className="h-20 w-20 rounded-[30px] bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Quizzes Match Filters</h3>
              <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto px-6">
                Adjust your search queries or course filters to locate missing quizzes.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedQuizzes.map(renderCardView)}
          {filteredAndSortedQuizzes.length === 0 && (
            <div className="col-span-full py-24 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="h-20 w-20 rounded-[30px] bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Quizzes Found</h3>
              <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto px-6">
                Adjust your search queries or course filters to locate missing quizzes.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State - No Quizzes at All in Entire LMS */}
      {quizzes?.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="bg-white h-20 w-20 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-300">
            <HelpCircle className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">No Quizzes Available</h3>
          <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">
            There are currently no quizzes assigned to your profile. Check back later!
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
