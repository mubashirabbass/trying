import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  useListCourses, 
  useUpdateCourse, 
  getListCoursesQueryKey,
  useCreateCourse,
  useListUsers,
  getListUsersQueryKey,
  useDeleteCourse
} from "@workspace/api-client-react";
import { 
  Loader2, Plus, MoreHorizontal, CheckCircle, XCircle, Eye, 
  ExternalLink, Video, Search, Filter, BookOpen, Clock, AlertCircle, 
  Users, Award, ShieldCheck, Edit, Trash2, Check, Sparkles, Laptop, 
  Palette, Briefcase, Brain, FileSpreadsheet, GraduationCap, DollarSign, ListTodo, Download, FileText
} from "lucide-react";
import { FileUploadButton } from "@/components/FileUploadButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";

// Dynamic Category Mapping
const CATEGORY_DETAILS: Record<string, { label: string; icon: React.ComponentType<any>; color: string; gradient: string }> = {
  IT: { 
    label: "IT Specialization", 
    icon: Laptop, 
    color: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40", 
    gradient: "from-blue-600 to-indigo-400" 
  },
  Graphics: { 
    label: "Graphics Design", 
    icon: Palette, 
    color: "text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/40", 
    gradient: "from-purple-600 to-pink-500" 
  },
  Freelancing: { 
    label: "Freelancing Mastery", 
    icon: Briefcase, 
    color: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40", 
    gradient: "from-emerald-600 to-teal-500" 
  },
  AI: { 
    label: "AI Engineering", 
    icon: Brain, 
    color: "text-orange-605 bg-orange-50 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40", 
    gradient: "from-orange-500 to-amber-400" 
  },
  "MS Office": { 
    label: "MS Office Suite", 
    icon: FileSpreadsheet, 
    color: "text-cyan-600 bg-cyan-50 border-cyan-100 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/40", 
    gradient: "from-cyan-600 to-sky-400" 
  },
  Web: { 
    label: "Web Dev", 
    icon: Laptop, 
    color: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40", 
    gradient: "from-indigo-600 to-violet-400" 
  },
  "Computer Basic": { 
    label: "Computer Basic", 
    icon: Laptop, 
    color: "text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-900/40", 
    gradient: "from-slate-600 to-slate-400" 
  },
  Default: { 
    label: "Professional Course", 
    icon: GraduationCap, 
    color: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40", 
    gradient: "from-indigo-600 to-violet-400" 
  }
};

const MetricCardSkeleton = () => (
  <Card className="border border-slate-150/80 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden animate-pulse">
    <CardContent className="p-5 flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="h-11 w-11 rounded-xl bg-slate-150 dark:bg-slate-850 shrink-0" />
    </CardContent>
  </Card>
);

const TableRowSkeleton = () => (
  <TableRow className="border-b border-slate-100 dark:border-slate-800 animate-pulse">
    <TableCell className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-14 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-40" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
        </div>
      </div>
    </TableCell>
    <TableCell className="px-6 py-4">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-24" />
    </TableCell>
    <TableCell className="px-6 py-4">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
    </TableCell>
    <TableCell className="px-6 py-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12" />
    </TableCell>
    <TableCell className="px-6 py-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
    </TableCell>
    <TableCell className="px-6 py-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-10" />
    </TableCell>
    <TableCell className="px-6 py-4 text-right">
      <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg ml-auto" />
    </TableCell>
  </TableRow>
);

export default function AdminCourses() {
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: courses, isLoading } = useListCourses(
    { limit: 1000 } as any,
    {
      query: {
        queryKey: getListCoursesQueryKey({ limit: 1000 } as any),
        staleTime: 60000, // Cache for 60 seconds
        refetchOnWindowFocus: false,
      },
    }
  );
  const updateCourse = useUpdateCourse();
  const createCourse = useCreateCourse();
  const deleteCourseMutation = useDeleteCourse();
  const { token } = useAuth();

  // Fetch teachers for selection
  const { data: teachers } = useListUsers(
    { role: "teacher" },
    {
      query: {
        queryKey: getListUsersQueryKey({ role: "teacher" }),
        staleTime: 120000, // Teachers list changes infrequently, cache for 2 minutes
        refetchOnWindowFocus: false,
      },
    }
  );

  // Dynamic Course Categories Queries & Mutations
  const { data: dbCategories = [], refetch: refetchCategories } = useQuery<any[]>({
    queryKey: ["course-categories"],
    staleTime: 120000, // Cache categories list for 2 minutes
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/course-categories", { headers });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    }
  });

  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const handleNameChange = (val: string) => {
    setCategoryName(val);
    if (!editingCategory) {
      setCategorySlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName || !categorySlug) {
      toast({
        title: "Validation Error",
        description: "Name and Slug are required",
        variant: "destructive",
      });
      return;
    }
    try {
      const url = editingCategory ? `/api/course-categories/${editingCategory.id}` : "/api/course-categories";
      const method = editingCategory ? "PUT" : "POST";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({ name: categoryName, slug: categorySlug, description: categoryDesc })
      });
      if (!res.ok) throw new Error("Failed to save category");
      toast({
        title: editingCategory ? "Category Updated" : "Category Created",
        description: editingCategory ? "Category updated successfully!" : "Category created successfully!",
        variant: "success",
      });
      setCategoryName("");
      setCategorySlug("");
      setCategoryDesc("");
      setEditingCategory(null);
      refetchCategories();
    } catch (err) {
      toast({
        title: "Save Failed",
        description: "Error saving category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/course-categories/${id}`, { 
        method: "DELETE",
        headers
      });
      if (!res.ok) throw new Error("Failed to delete category");
      toast({
        title: "Category Deleted",
        description: "Category deleted successfully!",
        variant: "destructive",
      });
      refetchCategories();
    } catch (err) {
      toast({
        title: "Delete Failed",
        description: "Error deleting category",
        variant: "destructive",
      });
    }
  };

  // Dynamic Category details lookup
  const getCategoryDetails = (catName: string) => {
    const normalized = (catName || "").toLowerCase();
    if (normalized.includes("web")) return CATEGORY_DETAILS.Web;
    if (normalized.includes("ai") || normalized.includes("artificial")) return CATEGORY_DETAILS.AI;
    if (normalized.includes("graphic") || normalized.includes("design")) return CATEGORY_DETAILS.Graphics;
    if (normalized.includes("freelance") || normalized.includes("upwork")) return CATEGORY_DETAILS.Freelancing;
    if (normalized.includes("office") || normalized.includes("excel") || normalized.includes("word")) return CATEGORY_DETAILS["MS Office"];
    if (normalized.includes("it") || normalized.includes("network") || normalized.includes("server")) return CATEGORY_DETAILS.IT;
    if (normalized.includes("computer") || normalized.includes("basic")) return CATEGORY_DETAILS["Computer Basic"];
    return CATEGORY_DETAILS.Default;
  };

  // Client-Side Searching & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Course Creator Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("3 Months");
  const [fee, setFee] = useState("5000");
  const [isFree, setIsFree] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [thumbnail, setThumbnail] = useState("");
  const [outlinePdfUrl, setOutlinePdfUrl] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [minAttendancePercentage, setMinAttendancePercentage] = useState("75");
  const [totalDurationHours, setTotalDurationHours] = useState("40");

  // Set default category when categories load
  useEffect(() => {
    if (dbCategories.length > 0 && !category) {
      setCategory(dbCategories[0].name);
    }
  }, [dbCategories]);

  // Filter dynamic course listing on Client
  const filteredCourses = courses?.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.teacherName || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || c.category === filterCategory;
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate high-fidelity metrics
  const totalCourses = courses?.length || 0;
  const pendingReviews = courses?.filter(c => c.status === "pending").length || 0;
  const liveTracks = courses?.filter(c => c.status === "live").length || 0;
  const countLive = liveTracks;
  const countDraft = courses?.filter(c => c.status === "draft").length || 0;
  const countArchived = courses?.filter(c => c.status === "archived").length || 0;
  const countPending = pendingReviews;
  const totalStudentsEnrolled = courses?.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0) || 0;

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !duration) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      await createCourse.mutateAsync({
        data: {
          title,
          description,
          category,
          duration,
          fee: isFree ? 0 : Number(fee),
          isFree,
          isFeatured,
          thumbnail: thumbnail || undefined,
          syllabus: syllabus || undefined,
          teacherId: teacherId && teacherId !== "none" ? Number(teacherId) : undefined,
          minAttendancePercentage: Number(minAttendancePercentage),
          outlinePdfUrl: outlinePdfUrl || undefined,
          totalDurationHours: Number(totalDurationHours),
        } as any
      });
      toast({
        title: "Course Created",
        description: "Course created & published successfully!",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setIsCreateOpen(false);
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("MS Office");
      setDuration("3 Months");
      setFee("5000");
      setIsFree(false);
      setIsFeatured(false);
      setThumbnail("");
      setOutlinePdfUrl("");
      setSyllabus("");
      setTeacherId("");
      setMinAttendancePercentage("75");
      setTotalDurationHours("40");
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error?.response?.data?.message || "Failed to create course",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (id: number) => {
    try {
      await deleteCourseMutation.mutateAsync({ id });
      toast({
        title: "Course Deleted",
        description: "The course has been successfully removed.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await updateCourse.mutateAsync({
        id,
        data: { status } as any
      });
      toast({
        title: "Status Updated",
        description: `Course status successfully set to ${status.toUpperCase()}.`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Status Badge with pulse dot
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live": 
        return (
          <Badge className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center w-fit gap-1.5 shadow-none">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            Live
          </Badge>
        );
      case "pending": 
        return (
          <Badge className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center w-fit gap-1.5 shadow-none">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            Review Pending
          </Badge>
        );
      case "rejected": 
        return (
          <Badge className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/40 font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center w-fit gap-1.5 shadow-none">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
            Rejected
          </Badge>
        );
      case "draft": 
        return (
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center w-fit gap-1.5 shadow-none">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
            Draft
          </Badge>
        );
      default: 
        return <Badge variant="outline" className="font-bold text-xs">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      {/* Header section with Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Curriculum Management</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Approve draft programs, manage live syllabi, and coordinate academic teachers.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setIsCategoriesOpen(true)}
            variant="outline"
            className="rounded-xl font-bold border-slate-250 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <ListTodo className="h-4.5 w-4.5 mr-1.5 text-indigo-500" />
            Manage Categories
          </Button>
          <Button 
            onClick={() => {
              if (dbCategories.length > 0) {
                setCategory(dbCategories[0].name);
              }
              setIsCreateOpen(true);
            }}
            className="rounded-xl font-bold bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white shadow-lg shadow-slate-900/10 dark:shadow-indigo-500/10"
          >
            <Plus className="h-4.5 w-4.5 mr-1.5" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Metrics overview bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            {/* Total Courses Card */}
            <Card className="border border-slate-150/80 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden relative">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xxs font-black text-slate-450 uppercase tracking-widest block">Total Curriculum</span>
                  <span className="text-3xl font-black text-slate-850 dark:text-white block">{totalCourses}</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <BookOpen className="h-5.5 w-5.5" />
                </div>
              </CardContent>
            </Card>

            {/* Pending Review Card with blink glow */}
            <Card className={`border rounded-2xl overflow-hidden relative shadow-sm transition-all ${
              pendingReviews > 0 
                ? "border-amber-250 bg-amber-50/20 dark:bg-amber-950/5 animate-[pulse_3s_infinite]" 
                : "border-slate-150/80 bg-white dark:bg-slate-900"
            }`}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xxs font-black text-slate-450 uppercase tracking-widest block">Pending Reviews</span>
                  <span className="text-3xl font-black text-slate-850 dark:text-white block">{pendingReviews}</span>
                </div>
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                  pendingReviews > 0 ? "bg-amber-500/20 text-amber-600" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                }`}>
                  {pendingReviews > 0 ? <AlertCircle className="h-5.5 w-5.5" /> : <Clock className="h-5.5 w-5.5" />}
                </div>
              </CardContent>
            </Card>

            {/* Live Courses Card */}
            <Card className="border border-slate-150/80 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden relative">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xxs font-black text-slate-450 uppercase tracking-widest block">Live Programs</span>
                  <span className="text-3xl font-black text-slate-850 dark:text-white block">{liveTracks}</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-5.5 w-5.5" />
                </div>
              </CardContent>
            </Card>

            {/* Registrations count Card */}
            <Card className="border border-slate-150/80 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden relative">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xxs font-black text-slate-450 uppercase tracking-widest block">Global Enrolments</span>
                  <span className="text-3xl font-black text-slate-850 dark:text-white block">{totalStudentsEnrolled.toLocaleString()}</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Users className="h-5.5 w-5.5" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Dynamic Curriculum Sections Tab Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto select-none gap-1">
        {[
          { id: "all", label: "All Programs", count: totalCourses, icon: BookOpen },
          { id: "live", label: "Live Courses", count: countLive, icon: CheckCircle, color: "text-emerald-600" },
          { id: "draft", label: "Draft Courses", count: countDraft, icon: Clock, color: "text-amber-600" },
          { id: "archived", label: "Hidden / Archive", count: countArchived, icon: XCircle, color: "text-slate-500" },
          { id: "pending", label: "Review Pending", count: countPending, icon: AlertCircle, color: "text-purple-600" },
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setFilterStatus(t.id)}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black tracking-wider uppercase border-b-2 transition-all shrink-0 ${
              filterStatus === t.id 
                ? "border-indigo-600 text-indigo-700 dark:text-indigo-400 font-black" 
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300"
            }`}
          >
            <t.icon className={`h-4 w-4 ${t.color || ""}`} />
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ml-1 ${
                filterStatus === t.id 
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter and Search toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm mb-6">
        
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <Input 
            placeholder="Search by program name or lecturer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium"
          />
        </div>

        {/* Category & Status Select filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-450 shrink-0" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px] h-10.5 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs bg-slate-50/50 dark:bg-slate-950">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {dbCategories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Clear Filter indicator */}
          {(searchTerm || filterCategory !== "all" || filterStatus !== "all") && (
            <Button 
              variant="ghost" 
              onClick={() => { setSearchTerm(""); setFilterCategory("all"); setFilterStatus("all"); }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 h-10.5 px-3 rounded-xl shrink-0"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Upgraded Administrative Table */}
      <Card className="border border-slate-150/85 dark:border-slate-800/80 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          {isLoading ? (
            <Table>
              <TableHeader className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4">Title & Faculty</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4">Specialization</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4">Status</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4">Tuition Fee</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4">Lectures</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4">Enrolled Students</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </TableBody>
            </Table>
          ) : filteredCourses?.length === 0 ? (
            <div className="text-center py-20 px-4">
              <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No courses match criteria</h3>
              <p className="text-slate-500 text-xs mt-1">Try adapting your search text or removing selected category filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4">Title & Faculty</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4">Specialization</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4">Status</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4">Tuition Fee</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4">Lectures</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4">Enrolled Students</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 text-xs px-6 py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses?.map((course) => {
                  const details = getCategoryDetails(course.category ?? "");
                  const CategoryIcon = details.icon;

                  return (
                    <TableRow key={course.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 transition-colors">
                      
                      {/* Title, avatar & Lecturer Info */}
                      <TableCell className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          
                          {/* Mini visual avatar */}
                          <div className="h-10 w-14 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
                            {course.thumbnail ? (
                              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${details.gradient} flex items-center justify-center`}>
                                <CategoryIcon className="h-5 w-5 text-white/40" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <Link href={`/admin/courses/${course.id}/review`}>
                              <span className="font-bold text-sm text-slate-850 dark:text-slate-150 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors line-clamp-1">
                                {course.title}
                              </span>
                            </Link>
                            <p className="text-xxs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                              by {course.teacherName || "Unassigned Academic"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Specialized Category Pill */}
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className={`font-bold text-[10px] tracking-wide rounded-md px-2.5 py-0.5 border ${details.color} shadow-none`}>
                          <CategoryIcon className="h-3 w-3 mr-1 inline shrink-0" />
                          {course.category}
                        </Badge>
                      </TableCell>

                      {/* Status indicator badge */}
                      <TableCell className="px-6 py-4">
                        {getStatusBadge(course.status)}
                      </TableCell>

                      {/* Fee indicators */}
                      <TableCell className="px-6 py-4 font-bold text-xs text-slate-700 dark:text-slate-300">
                        {course.isFree ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            Free
                          </span>
                        ) : (
                          <span className="font-black text-slate-850 dark:text-slate-200">
                            Rs. {course.fee?.toLocaleString()}
                          </span>
                        )}
                      </TableCell>

                      {/* Lectures Count */}
                      <TableCell className="px-6 py-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                          <Video className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          {course.lessonCount || 0} Modules
                        </span>
                      </TableCell>

                      {/* Registered count */}
                      <TableCell className="px-6 py-4">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          {course.enrollmentCount || 0}
                        </span>
                      </TableCell>

                      {/* Action Menu */}
                      <TableCell className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border-slate-200 hover:bg-slate-100">
                              <MoreHorizontal className="h-4.5 w-4.5 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 rounded-xl p-1 bg-white border border-slate-200 shadow-xl">
                            
                            <Link href={`/admin/courses/${course.id}/review`}>
                              <DropdownMenuItem className="cursor-pointer font-bold text-xs rounded-lg">
                                <Eye className="h-4 w-4 mr-2 text-slate-400" /> Full Review & Details
                              </DropdownMenuItem>
                            </Link>

                            <DropdownMenuItem asChild className="cursor-pointer font-bold text-xs rounded-lg">
                              <Link href={`/courses/${course.id}`} target="_blank">
                                <div className="flex items-center w-full">
                                  <ExternalLink className="h-4 w-4 mr-2 text-slate-400" /> View Public Page
                                </div>
                              </Link>
                            </DropdownMenuItem>

                            {course.status === "pending" && (
                              <Link href={`/admin/courses/${course.id}/review`}>
                                <DropdownMenuItem className="cursor-pointer font-bold text-xs text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 rounded-lg">
                                  <Check className="h-4 w-4 mr-2 text-emerald-600" /> Review & Approve
                                </DropdownMenuItem>
                              </Link>
                            )}

                            <div className="h-px bg-slate-100 my-1" />

                            <Link href={`/admin/courses/${course.id}/edit`}>
                              <DropdownMenuItem className="cursor-pointer font-bold text-xs rounded-lg">
                                <Edit className="h-4 w-4 mr-2 text-slate-400" /> Edit Course Details
                              </DropdownMenuItem>
                            </Link>

                            <Link href={`/admin/courses/${course.id}/content`}>
                              <DropdownMenuItem className="cursor-pointer font-bold text-xs rounded-lg">
                                <Video className="h-4 w-4 mr-2 text-blue-600" /> Manage Lectures
                              </DropdownMenuItem>
                            </Link>

                            <div className="h-px bg-slate-100 my-1" />

                            {course.status !== "live" ? (
                              <DropdownMenuItem 
                                className="cursor-pointer font-bold text-xs rounded-lg text-emerald-600 hover:bg-emerald-50/55"
                                onClick={() => handleUpdateStatus(course.id, "live")}
                              >
                                <Check className="h-4 w-4 mr-2 text-emerald-600" /> Make Course Live
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                className="cursor-pointer font-bold text-xs rounded-lg text-amber-600 hover:bg-amber-50/55"
                                onClick={() => handleUpdateStatus(course.id, "draft")}
                              >
                                <Clock className="h-4 w-4 mr-2 text-amber-600" /> Revert to Draft
                              </DropdownMenuItem>
                            )}

                            {course.status !== "archived" ? (
                              <DropdownMenuItem 
                                className="cursor-pointer font-bold text-xs rounded-lg text-slate-600 hover:bg-slate-50"
                                onClick={() => handleUpdateStatus(course.id, "archived")}
                              >
                                <XCircle className="h-4 w-4 mr-2 text-slate-400" /> Archive (Hide)
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                className="cursor-pointer font-bold text-xs rounded-lg text-slate-600 hover:bg-slate-50"
                                onClick={() => handleUpdateStatus(course.id, "draft")}
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-slate-400" /> Restore from Archive
                              </DropdownMenuItem>
                            )}

                            <div className="h-px bg-slate-100 my-1" />

                            <DropdownMenuItem 
                              className="text-red-650 cursor-pointer font-bold text-xs rounded-lg hover:bg-red-50"
                              onClick={() => setCourseToDelete(course.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2 text-red-650" /> Delete Course
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

        </CardContent>
      </Card>

      {/* ── COURSE CREATOR DIALOG (ADMIN DESIGNER) ────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-[24px] shadow-2xl p-6">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-50 text-indigo-650 border border-indigo-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Curriculum Hub
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight mt-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-600" />
              Design New Course
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs font-semibold mt-1">
              Create a new program syllabus layout, set billable tuition rates, and assign course supervisors.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCourse} className="space-y-5 pt-4">
            
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-black uppercase text-slate-500 tracking-wider">Course Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. Graphic Design Masterclass"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500 text-sm font-medium"
                required
              />
            </div>

            {/* Specialty category & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-black uppercase text-slate-500 tracking-wider">Category <span className="text-red-500">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="h-11 rounded-xl border-slate-200 text-sm font-semibold">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-slate-200 shadow-lg">
                    {dbCategories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.name} className="text-sm font-medium">{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="duration" className="text-xs font-black uppercase text-slate-500 tracking-wider">Duration <span className="text-red-500">*</span></Label>
                <Input
                  id="duration"
                  placeholder="e.g. 3 Months"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500 text-sm font-semibold"
                  required
                />
              </div>
            </div>

            {/* Tuition Rate & Teacher selector */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fee" className="text-xs font-black uppercase text-slate-500 tracking-wider">Tuition Fee (PKR)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="fee"
                    type="number"
                    placeholder="e.g. 5000"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    disabled={isFree}
                    className="pl-9 h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500 text-sm font-bold disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="teacher" className="text-xs font-black uppercase text-slate-500 tracking-wider">Assign Teacher / Faculty</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger id="teacher" className="h-11 rounded-xl border-slate-200 text-sm font-semibold">
                    <SelectValue placeholder="Select Instructor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-slate-200 shadow-lg">
                    <SelectItem value="none" className="text-sm font-medium text-slate-400">-- Keep Unassigned --</SelectItem>
                    {teachers?.map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()} className="text-sm font-medium">
                        {t.name} ({t.specialization || "Faculty Scholar"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Minimum attendance & Total Credit Hours/Lectures */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="minAttendancePercentage" className="text-xs font-black uppercase text-slate-500 tracking-wider">Min Attendance Threshold (%)</Label>
                <div className="relative">
                  <ListTodo className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <Input
                    id="minAttendancePercentage"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 75"
                    value={minAttendancePercentage}
                    onChange={(e) => setMinAttendancePercentage(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="totalDurationHours" className="text-xs font-black uppercase text-slate-500 tracking-wider">Total Lectures / Credit Hours</Label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <Input
                    id="totalDurationHours"
                    type="number"
                    min="0"
                    placeholder="e.g. 40"
                    value={totalDurationHours}
                    onChange={(e) => setTotalDurationHours(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500 text-sm font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Switch badges */}
            <div className="flex flex-wrap gap-6 items-center py-2 border-y border-slate-100 my-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-600">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => {
                    setIsFree(e.target.checked);
                    if (e.target.checked) setFee("0");
                  }}
                  className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                />
                Is Free Course
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-600">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                />
                Feature on Homepage
              </label>
            </div>

            {/* Thumbnail Image Upload */}
            <div className="space-y-1.5">
              <FileUploadButton
                type="image"
                label="Course Thumbnail Image"
                currentUrl={thumbnail || null}
                onUploaded={(url) => setThumbnail(url)}
                onClear={() => setThumbnail("")}
                showDownload={true}
              />
            </div>

            {/* Short description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-black uppercase text-slate-500 tracking-wider">Short Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                placeholder="Provide a brief summary of what the course covers and its professional outcomes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500 text-sm font-medium"
                required
              />
            </div>

            {/* Detailed Outline / Syllabus */}
            <div className="space-y-1.5">
              <Label htmlFor="syllabus" className="text-xs font-black uppercase text-slate-500 tracking-wider">Detailed Syllabus Outline</Label>
              <Textarea
                id="syllabus"
                placeholder="Enter detailed outline topics, prerequisites, breakdowns..."
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                rows={4}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500 text-sm font-medium"
              />
            </div>

            {/* Course Outline PDF Upload */}
            <div className="space-y-1.5">
              <FileUploadButton
                type="pdf"
                label="Course Outline PDF (Downloadable by enrolled students)"
                currentUrl={outlinePdfUrl || null}
                onUploaded={(url) => setOutlinePdfUrl(url)}
                onClear={() => setOutlinePdfUrl("")}
                showDownload={true}
              />
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Enrolled students will see a download button for this PDF on the course page. Max 5 MB.
              </p>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateOpen(false)}
                className="h-11 rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="h-11 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white"
              >
                Create & Publish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── COURSE CATEGORY MANAGER DIALOG ────────────────────────────── */}
      <Dialog open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-[24px] shadow-2xl p-6">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-50 text-indigo-650 border border-indigo-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Syllabi Taxonomy
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight mt-2 flex items-center gap-2">
              <ListTodo className="h-6 w-6 text-indigo-600" />
              Manage Course Categories
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs font-semibold mt-1">
              Add new academic classifications, customize course taxonomy slugs, or remove unused categories.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Category Form */}
            <form onSubmit={handleSaveCategory} className="space-y-4 border-r border-slate-100 pr-0 md:pr-6">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              
              <div className="space-y-1.5">
                <Label htmlFor="catName" className="text-xs font-black uppercase text-slate-500 tracking-wider">Category Name <span className="text-red-500">*</span></Label>
                <Input
                  id="catName"
                  placeholder="e.g. Cybersecurity Specialization"
                  value={categoryName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 text-sm font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catSlug" className="text-xs font-black uppercase text-slate-500 tracking-wider">Slug (Unique identifier) <span className="text-red-500">*</span></Label>
                <Input
                  id="catSlug"
                  placeholder="e.g. cybersecurity"
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 text-sm font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catDesc" className="text-xs font-black uppercase text-slate-500 tracking-wider">Description</Label>
                <Textarea
                  id="catDesc"
                  placeholder="Briefly describe the topics covered in this track..."
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  rows={3}
                  className="rounded-xl border-slate-200 text-sm font-medium"
                />
              </div>

              <div className="flex gap-2 justify-end">
                {editingCategory && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setCategoryName("");
                      setCategorySlug("");
                      setCategoryDesc("");
                      setEditingCategory(null);
                    }}
                    className="h-11 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="h-11 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {editingCategory ? "Update Category" : "Add Category"}
                </Button>
              </div>
            </form>

            {/* Category List */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
                Existing Classifications ({dbCategories.length})
              </h3>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {dbCategories.map((cat: any) => {
                  const details = getCategoryDetails(cat.name);
                  const Icon = details.icon;
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200`}>
                          <Icon className="h-4.5 w-4.5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-slate-800">{cat.name}</p>
                          <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">slug: {cat.slug}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryName(cat.name);
                            setCategorySlug(cat.slug);
                            setCategoryDesc(cat.description || "");
                          }}
                          className="h-7 w-7 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 animate-none shrink-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          type="button"
                          variant="ghost"
                          onClick={() => setCategoryToDelete(cat.id)}
                          className="h-7 w-7 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 animate-none shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Deletion Confirmation Dialog */}
      <AlertDialog open={courseToDelete !== null} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent className="rounded-[24px] bg-white border border-slate-100 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-800">Delete Course</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-semibold text-xs mt-2">
              Are you sure you want to delete this course? This action cannot be undone and will delete all associated lessons and assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl font-bold h-11 border border-slate-200 hover:bg-slate-50 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (courseToDelete) {
                  handleDeleteCourse(courseToDelete);
                  setCourseToDelete(null);
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold h-11 text-xs px-6"
            >
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Deletion Confirmation Dialog */}
      <AlertDialog open={categoryToDelete !== null} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent className="rounded-[24px] bg-white border border-slate-100 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-800">Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-semibold text-xs mt-2">
              Are you sure you want to delete this category? This action cannot be undone and courses using this category may need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl font-bold h-11 border border-slate-200 hover:bg-slate-50 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (categoryToDelete) {
                  handleDeleteCategory(categoryToDelete);
                  setCategoryToDelete(null);
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold h-11 text-xs px-6"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
