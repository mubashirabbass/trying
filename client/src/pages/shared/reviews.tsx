import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PaginationControls, paginateItems } from "@/components/PaginationControls";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Star, Search, Loader2, BookOpen, User, MessageSquare, 
  TrendingUp, Calendar, RotateCcw, AlertCircle,
  GraduationCap, BookMarked, FileDown, Trash2, Eye
} from "lucide-react";

interface Review {
  reviewId: number;
  rating: number;
  comment: string | null;
  completedAt: string;
  studentName: string;
  lessonTitle: string;
  courseTitle: string;
  courseId: number;
  teacherName?: string;
}

interface CourseItem {
  id: number;
  title: string;
}

interface UserItem {
  id: number;
  name: string;
}

const PAGE_SIZE = 8;

export default function LectureReviews() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coursesList, setCoursesList] = useState<CourseItem[]>([]);
  const [teachersList, setTeachersList] = useState<UserItem[]>([]);
  const [studentsList, setStudentsList] = useState<UserItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewingReview, setViewingReview] = useState<Review | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  
  // Date Filters
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm("Are you sure you want to delete this lecture review?")) return;
    setDeletingId(reviewId);
    try {
      const response = await fetch(`/api/courses/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Server error ${response.status}`);
      }
      toast({ title: "✅ Review Deleted", description: "The lecture review has been removed successfully." });
      setReviews(prev => prev.filter(r => r.reviewId !== reviewId));
    } catch (err: any) {
      toast({ title: err.message || "Failed to delete review", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/courses/reviews?_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch lecture reviews");
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setReviews(data);
        const courses = Array.from(new Set(data.map((r) => r.courseTitle)))
          .map((title, idx) => ({ id: idx, title }));
        const teachers = Array.from(new Set(data.map((r) => r.teacherName || "Unassigned")))
          .map((name, idx) => ({ id: idx, name }));
        const students = Array.from(new Set(data.map((r) => r.studentName)))
          .map((name, idx) => ({ id: idx, name }));
          
        setCoursesList(courses);
        setTeachersList(teachers);
        setStudentsList(students);
      } else {
        setReviews(data.reviews || []);
        setCoursesList(data.courses || []);
        setTeachersList(data.teachers || []);
        setStudentsList(data.students || []);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while fetching reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReviews();
    }
  }, [token]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCourse, selectedTeacher, selectedStudent, selectedRating, selectedDateFilter, startDate, endDate]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCourse("all");
    setSelectedTeacher("all");
    setSelectedStudent("all");
    setSelectedRating("all");
    setSelectedDateFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Filter & Search Logic
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      review.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.comment && review.comment.toLowerCase().includes(searchQuery.toLowerCase())) ||
      review.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.teacherName && review.teacherName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCourse = selectedCourse === "all" || review.courseTitle === selectedCourse;
    const matchesTeacher = selectedTeacher === "all" || review.teacherName === selectedTeacher;
    const matchesStudent = selectedStudent === "all" || review.studentName === selectedStudent;
    const matchesRating = selectedRating === "all" || review.rating === Number(selectedRating);

    // Date Filtering Logic
    const matchesDate = () => {
      if (selectedDateFilter === "all") return true;
      const reviewDate = new Date(review.completedAt);
      reviewDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDateFilter === "today") {
        return reviewDate.getTime() === today.getTime();
      }
      if (selectedDateFilter === "yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return reviewDate.getTime() === yesterday.getTime();
      }
      if (selectedDateFilter === "7days") {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return reviewDate.getTime() >= sevenDaysAgo.getTime();
      }
      if (selectedDateFilter === "30days") {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return reviewDate.getTime() >= thirtyDaysAgo.getTime();
      }
      if (selectedDateFilter === "custom") {
        if (!startDate && !endDate) return true;
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        if (start && reviewDate.getTime() < start.getTime()) return false;
        if (end && reviewDate.getTime() > end.getTime()) return false;
        return true;
      }
      return true;
    };

    return matchesSearch && matchesCourse && matchesTeacher && matchesStudent && matchesRating && matchesDate();
  });

  // Unique listings for Dropdown filters
  const dropdownCourses = [...coursesList].map(c => c.title).sort();
  const dropdownTeachers = [...teachersList].map(t => t.name).sort();
  const dropdownStudents = [...studentsList].map(s => s.name).sort();

  // Export to Excel (CSV with BOM bytes for direct Microsoft Excel double-click support)
  const handleDownloadExcel = () => {
    const headers = ["Student Name", "Course Title", "Lecture Title", "Teacher Name", "Rating", "Feedback Comment", "Date Completed"];
    
    const rows = filteredReviews.map((r) => [
      r.studentName,
      r.courseTitle,
      r.lessonTitle,
      r.teacherName || "Unassigned",
      `${r.rating} / 5`,
      r.comment ? r.comment : "",
      new Date(r.completedAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => {
        const strVal = String(val);
        if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(","))
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Lecture_Reviews_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Metrics based on reviews
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0";
  
  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  const renderStars = (rating: number, size = "h-4 w-4") => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`${size} ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-800"}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Star className="h-8 w-8 text-amber-500 fill-amber-500" /> Student Lecture Reviews
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {user?.role === "admin" 
                ? "Monitor and filter video lecture reviews by student, course, teacher, and date."
                : "View and filter student reviews left on your course lectures."
              }
            </p>
          </div>
          <Button onClick={fetchReviews} variant="outline" className="rounded-xl font-bold gap-2">
            <RotateCcw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error loading reviews</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Metrics Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total reviews */}
          <Card className="border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 rounded-[24px]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Reviews</p>
                {isLoading ? (
                  <div className="h-10 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse mt-2" />
                ) : (
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-2">{totalReviews}</h3>
                )}
                <p className="text-xs text-slate-500 mt-1">All-time reviews collected</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <MessageSquare className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Average Rating */}
          <Card className="border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 rounded-[24px]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Average Rating</p>
                {isLoading ? (
                  <div className="space-y-2 mt-2">
                    <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mt-2">
                      <h3 className="text-4xl font-black text-slate-900 dark:text-white">{averageRating}</h3>
                      <span className="text-sm text-slate-400">/ 5.0</span>
                    </div>
                    <div className="mt-1.5">{renderStars(Math.round(Number(averageRating)), "h-3.5 w-3.5")}</div>
                  </>
                )}
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Star Breakdown */}
          <Card className="border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 rounded-[24px]">
            <CardContent className="p-6">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Rating Breakdown</p>
              {isLoading ? (
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((ratingVal) => (
                    <div key={ratingVal} className="flex items-center gap-3">
                      <span className="w-6 h-3 bg-slate-100 dark:bg-slate-850 rounded animate-pulse text-transparent">5★</span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full animate-pulse" />
                      <span className="w-6 h-3 bg-slate-100 dark:bg-slate-850 rounded animate-pulse text-transparent">0</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map((ratingVal) => {
                    const count = ratingDistribution[ratingVal as keyof typeof ratingDistribution] || 0;
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={ratingVal} className="flex items-center gap-3 text-xs">
                        <span className="w-3 font-bold text-slate-600 dark:text-slate-400">{ratingVal}★</span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-slate-400">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Single-Line Filter Controls */}
        <Card className="border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 rounded-[24px] overflow-hidden bg-slate-50/40 dark:bg-slate-900/10">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3 w-full">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search reviews..." 
                  className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Rating Filter */}
              <div className="w-[140px] shrink-0">
                <Select value={selectedRating} onValueChange={setSelectedRating}>
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white">
                    <SelectValue placeholder="All Ratings" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars ★★★★★</SelectItem>
                    <SelectItem value="4">4 Stars ★★★★</SelectItem>
                    <SelectItem value="3">3 Stars ★★★</SelectItem>
                    <SelectItem value="2">2 Stars ★★</SelectItem>
                    <SelectItem value="1">1 Star ★</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Course Filter */}
              <div className="w-[160px] shrink-0">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Courses ({dropdownCourses.length})</SelectItem>
                    {dropdownCourses.map((course) => (
                      <SelectItem key={course} value={course}>{course}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Teacher Filter - Dynamic for Admin */}
              {user?.role === "admin" && (
                <div className="w-[160px] shrink-0">
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white">
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Teachers ({dropdownTeachers.length})</SelectItem>
                      {dropdownTeachers.map((teacher) => (
                        <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Student Filter */}
              <div className="w-[150px] shrink-0">
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white">
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Students ({dropdownStudents.length})</SelectItem>
                    {dropdownStudents.map((student) => (
                      <SelectItem key={student} value={student}>{student}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Wise Filter */}
              <div className="w-[150px] shrink-0">
                <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-white">
                    <SelectValue placeholder="Date Wise" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Excel Download Button */}
              <Button 
                onClick={handleDownloadExcel} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-2 shrink-0"
              >
                <FileDown className="h-4 w-4" /> Export Excel
              </Button>

              {/* Clear Button */}
              {(searchQuery || selectedCourse !== "all" || selectedTeacher !== "all" || selectedStudent !== "all" || selectedRating !== "all" || selectedDateFilter !== "all") && (
                <Button 
                  onClick={handleResetFilters} 
                  variant="ghost" 
                  className="rounded-xl font-bold hover:bg-slate-100 hover:text-slate-900 shrink-0"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Custom Date Range Row */}
            {selectedDateFilter === "custom" && (
              <div className="flex items-center gap-2 pt-2 animate-in slide-in-from-top-1 duration-200 w-full max-w-md">
                <div className="flex-1">
                  <Input 
                    type="date" 
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white text-xs" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <span className="text-slate-400 text-xs font-bold shrink-0">to</span>
                <div className="flex-1">
                  <Input 
                    type="date" 
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white text-xs" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card className="border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 rounded-[24px] overflow-hidden bg-white dark:bg-slate-950">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-24 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto opacity-50 mb-3" />
                <h3 className="text-sm font-bold text-slate-650 dark:text-slate-350">Loading Lecture Reviews</h3>
                <p className="text-xs text-slate-400 mt-1">Please wait while the feedback is fetched...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="py-16 text-center">
                <Star className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Matching Reviews</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  No records match your selected filters. Try broadening your criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/70 dark:bg-slate-900/40">
                    <TableRow>
                      <TableHead className="font-black text-slate-500 py-4 pl-6">Student</TableHead>
                      <TableHead className="font-black text-slate-500 py-4">Course & Lesson</TableHead>
                      {user?.role === "admin" && (
                        <TableHead className="font-black text-slate-500 py-4">Teacher</TableHead>
                      )}
                      <TableHead className="font-black text-slate-500 py-4">Rating</TableHead>
                      <TableHead className="font-black text-slate-500 py-4 w-[35%]">Feedback Comment</TableHead>
                      <TableHead className="font-black text-slate-500 py-4 pr-6">Date</TableHead>
                      {user?.role === "admin" && (
                        <TableHead className="font-black text-slate-500 py-4 pr-6 text-right">Action</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginateItems(filteredReviews, page, PAGE_SIZE).map((review) => (
                      <TableRow key={review.reviewId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        {/* Student Info */}
                        <TableCell className="py-4 pl-6 font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                              {review.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{review.studentName}</p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <GraduationCap className="h-3.5 w-3.5 text-slate-400" /> Student
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Course & Lesson */}
                        <TableCell className="py-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{review.courseTitle}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <BookMarked className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {review.lessonTitle}
                            </p>
                          </div>
                        </TableCell>

                        {/* Teacher Name */}
                        {user?.role === "admin" && (
                          <TableCell className="py-4">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full dark:bg-slate-800 dark:text-slate-350">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              {review.teacherName || "Unassigned"}
                            </span>
                          </TableCell>
                        )}

                        {/* Rating */}
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            {renderStars(review.rating)}
                            <span className="text-[10px] font-black text-slate-400">({review.rating} / 5.0)</span>
                          </div>
                        </TableCell>

                        {/* Comment */}
                        <TableCell className="py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                          {review.comment ? (
                            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850 px-3.5 py-2 rounded-2xl relative text-xs">
                              <span className="absolute -left-1.5 top-3 border-y-4 border-y-transparent border-r-4 border-r-slate-50 dark:border-r-slate-900" />
                              "{review.comment}"
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 italic text-xs">No text comment provided.</span>
                          )}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="py-4 pr-6 text-xs text-slate-400 font-bold shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {new Date(review.completedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </div>
                        </TableCell>

                        {/* Admin Actions: View + Delete */}
                        {user?.role === "admin" && (
                          <TableCell className="py-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                onClick={() => setViewingReview(review)}
                                title="View Full Review"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={deletingId === review.reviewId}
                                className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                onClick={() => handleDeleteReview(review.reviewId)}
                                title="Delete Review"
                              >
                                {deletingId === review.reviewId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        <PaginationControls 
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={filteredReviews.length}
          onPageChange={setPage}
          label="reviews"
        />
      </div>

      {/* Review Detail Dialog */}
      <Dialog open={!!viewingReview} onOpenChange={(open) => { if (!open) setViewingReview(null); }}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Lecture Review Detail
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Full review submitted by the student for this lecture.
            </DialogDescription>
          </DialogHeader>

          {viewingReview && (
            <div className="space-y-5 pt-1">
              {/* Student + Course Info */}
              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="h-11 w-11 rounded-full bg-indigo-100 text-indigo-700 font-black text-lg flex items-center justify-center shrink-0">
                  {viewingReview.studentName.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="font-black text-slate-900 dark:text-white">{viewingReview.studentName}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span className="font-bold truncate">{viewingReview.courseTitle}</span>
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                    <BookMarked className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{viewingReview.lessonTitle}</span>
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-1.5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Star Rating</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-6 w-6 ${s <= viewingReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                    ))}
                  </div>
                  <Badge className={`text-xs font-black px-2.5 py-0.5 ${
                    viewingReview.rating >= 4 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    viewingReview.rating === 3 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    'bg-rose-100 text-rose-700 border-rose-200'
                  }`}>
                    {viewingReview.rating} / 5
                  </Badge>
                </div>
              </div>

              {/* Full Comment */}
              <div className="space-y-1.5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Feedback Comment</p>
                {viewingReview.comment ? (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    "{viewingReview.comment}"
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm">No written comment was provided for this review.</p>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(viewingReview.completedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </span>
                {viewingReview.teacherName && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {viewingReview.teacherName}
                  </span>
                )}
              </div>

              {/* Delete from Dialog */}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-xl"
                disabled={deletingId === viewingReview.reviewId}
                onClick={() => {
                  setViewingReview(null);
                  handleDeleteReview(viewingReview.reviewId);
                }}
              >
                {deletingId === viewingReview.reviewId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete This Review
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
