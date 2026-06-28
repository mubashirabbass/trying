import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import {
  FileBarChart,
  Download,
  Users,
  BookOpen,
  CreditCard,
  Building2,
  TrendingUp,
  Filter,
  FileText,
  Table,
  Loader2,
  Calendar,
  Search,
  BarChart3,
  Printer,
  RefreshCw,
  DollarSign,
  GraduationCap,
  UserCheck,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingDown
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type ReportType =
  | "branch"
  | "students"
  | "enrollments"
  | "revenue"
  | "full-list"
  | "teacher-attendance"
  | "fee-installments"
  | "course-revenue"
  | "student-performance"
  | "monthly-trends";

const REPORT_TYPES: {
  id: ReportType;
  label: string;
  icon: any;
  description: string;
  color: string;
  category: "overview" | "academic" | "financial" | "analytics";
}[] = [
  // Overview Reports
  {
    id: "branch",
    label: "Branch Overview",
    icon: Building2,
    description: "Student counts, enrollment rates, and activity per campus branch.",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    category: "overview",
  },
  {
    id: "full-list",
    label: "Full Student List",
    icon: Table,
    description: "Complete student roster with branch, enrollment, and status data.",
    color: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
    category: "overview",
  },
  // Academic Reports
  {
    id: "students",
    label: "Student Progress",
    icon: Users,
    description: "Completion rates, quiz scores, assignment marks per student.",
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    category: "academic",
  },
  {
    id: "enrollments",
    label: "Enrollments",
    icon: BookOpen,
    description: "Course enrollment stats, new enrollments by date range.",
    color: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
    category: "academic",
  },
  {
    id: "student-performance",
    label: "Performance Analysis",
    icon: Award,
    description: "Detailed student performance by course with grades and rankings.",
    color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400",
    category: "academic",
  },
  {
    id: "teacher-attendance",
    label: "Teacher Attendance",
    icon: UserCheck,
    description: "Teacher attendance records, monthly summary, and working hours.",
    color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400",
    category: "academic",
  },
  // Financial Reports
  {
    id: "revenue",
    label: "Revenue Summary",
    icon: CreditCard,
    description: "Payment totals by method, status, and transaction count.",
    color: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
    category: "financial",
  },
  {
    id: "fee-installments",
    label: "Fee Installments",
    icon: DollarSign,
    description: "Installment tracking, pending fees, and payment schedules.",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    category: "financial",
  },
  {
    id: "course-revenue",
    label: "Course Revenue",
    icon: GraduationCap,
    description: "Revenue breakdown by course with expected vs collected payments.",
    color: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
    category: "financial",
  },
  // Analytics Reports
  {
    id: "monthly-trends",
    label: "Monthly Trends",
    icon: TrendingUp,
    description: "Month-over-month trends for enrollments, revenue, and activity.",
    color: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",
    category: "analytics",
  },
];

const COLUMNS_CONFIG: Record<ReportType, { key: string; label: string; align?: "left" | "right" | "center" }[]> = {
  "branch": [
    { key: "name", label: "Branch Name" },
    { key: "city", label: "City" },
    { key: "students", label: "Students Count", align: "right" },
    { key: "active", label: "Active Enrollments", align: "right" },
    { key: "courses", label: "Courses Count", align: "right" },
  ],
  "full-list": [
    { key: "name", label: "Student Name" },
    { key: "email", label: "Email Address" },
    { key: "branch", label: "Branch" },
    { key: "enrolled", label: "Courses Enrolled", align: "right" },
    { key: "status", label: "Status", align: "center" },
    { key: "joined", label: "Joined Date" },
  ],
  "students": [
    { key: "name", label: "Student Name" },
    { key: "branch", label: "Branch" },
    { key: "courses", label: "Courses Enrolled", align: "right" },
    { key: "completion", label: "Completion Rate", align: "center" },
    { key: "quizAvg", label: "Quiz Average", align: "center" },
    { key: "assignAvg", label: "Assignment Average", align: "center" },
  ],
  "enrollments": [
    { key: "course", label: "Course Title" },
    { key: "enrolled", label: "Total Enrolled", align: "right" },
    { key: "completed", label: "Completed Count", align: "right" },
    { key: "active", label: "In Progress Count", align: "right" },
    { key: "free", label: "Course Type", align: "center" },
  ],
  "student-performance": [
    { key: "name", label: "Student Name" },
    { key: "branch", label: "Branch" },
    { key: "courses", label: "Courses Enrolled", align: "right" },
    { key: "quizAvg", label: "Quiz Average", align: "center" },
    { key: "assignAvg", label: "Assignment Average", align: "center" },
    { key: "completion", label: "Completion Rate", align: "center" },
  ],
  "teacher-attendance": [
    { key: "name", label: "Teacher Name" },
    { key: "branch", label: "Branch" },
    { key: "totalDays", label: "Working Days", align: "right" },
    { key: "present", label: "Present Days", align: "right" },
    { key: "absent", label: "Absent Days", align: "right" },
    { key: "rate", label: "Attendance Rate", align: "center" },
  ],
  "revenue": [
    { key: "method", label: "Payment Method" },
    { key: "transactions", label: "Transactions", align: "right" },
    { key: "totalPKR", label: "Total PKR Amount", align: "right" },
    { key: "approved", label: "Approved Trans.", align: "right" },
    { key: "pending", label: "Pending Trans.", align: "right" },
  ],
  "fee-installments": [
    { key: "studentName", label: "Student Name" },
    { key: "courseName", label: "Course Name" },
    { key: "month", label: "Month", align: "center" },
    { key: "amount", label: "Installment Amount", align: "right" },
    { key: "paid", label: "Total Paid", align: "right" },
    { key: "remaining", label: "Remaining Balance", align: "right" },
    { key: "status", label: "Status", align: "center" },
  ],
  "course-revenue": [
    { key: "course", label: "Course Title" },
    { key: "enrolled", label: "Enrolled Count", align: "right" },
    { key: "fee", label: "Course Fee", align: "right" },
    { key: "expected", label: "Expected Revenue", align: "right" },
    { key: "collected", label: "Collected Revenue", align: "right" },
    { key: "pending", label: "Pending Revenue", align: "right" },
  ],
  "monthly-trends": [
    { key: "month", label: "Month" },
    { key: "enrollments", label: "Enrollments Count", align: "right" },
    { key: "transactions", label: "Payment Transactions", align: "right" },
    { key: "revenue", label: "Revenue Collected", align: "right" },
  ],
};

export default function AdminReports() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [activeReport, setActiveReport] = useState<ReportType>("branch");
  const [activeCategory, setActiveCategory] = useState<"all" | "overview" | "academic" | "financial" | "analytics">("all");

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters and Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter reports by category
  const filteredReportsList = useMemo(() => {
    if (activeCategory === "all") return REPORT_TYPES;
    return REPORT_TYPES.filter(r => r.category === activeCategory);
  }, [activeCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/reports/${activeReport}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        setData(await r.json());
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to fetch report data", variant: "destructive" });
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      setCurrentPage(1);
    }
  }, [activeReport, token]);

  const columns = COLUMNS_CONFIG[activeReport] || [];

  // Filter local data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = row[col.key];
        return String(val ?? "").toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, columns]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  const formatCellValue = (key: string, value: any) => {
    if (value === null || value === undefined) return "—";

    if (key === "free") {
      const isFree = value === true || value === 1 || String(value).toLowerCase() === "free";
      return isFree ? (
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-sm transition-colors text-[11px] font-bold">Free</Badge>
      ) : (
        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-sm transition-colors text-[11px] font-bold">Paid</Badge>
      );
    }

    if (key === "status") {
      const statusLower = String(value).toLowerCase();
      if (statusLower === "active" || statusLower === "paid" || statusLower === "approved" || statusLower === "verified") {
        return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-sm transition-colors text-[11px] font-bold">{String(value)}</Badge>;
      }
      if (statusLower === "pending" || statusLower === "partial") {
        return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 shadow-sm transition-colors text-[11px] font-bold">{String(value)}</Badge>;
      }
      return <Badge className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 shadow-sm transition-colors text-[11px] font-bold">{String(value)}</Badge>;
    }

    if (["totalPKR", "amount", "paid", "remaining", "expected", "collected", "pending", "revenue", "fee"].includes(key)) {
      if (value === 0 || value === "0") return <span className="font-semibold text-slate-400">Rs. 0</span>;
      const num = Number(value);
      if (isNaN(num)) return <span className="font-semibold text-slate-800">{value}</span>;
      return <span className="font-semibold text-slate-800 tabular-nums">Rs. {num.toLocaleString()}</span>;
    }

    if (key === "completion" || key === "rate") {
      const numericVal = parseFloat(String(value));
      const displayVal = isNaN(numericVal) ? value : `${numericVal}%`;
      const finalVal = typeof value === "string" && value.endsWith("%") ? numericVal : numericVal;
      const widthVal = isNaN(finalVal) ? 0 : Math.min(finalVal, 100);

      return (
        <div className="flex items-center gap-2.5">
          <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner border border-slate-200/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${widthVal >= 80 ? 'bg-emerald-500' : widthVal >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${widthVal}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">{displayVal}</span>
        </div>
      );
    }

    if (key === "quizAvg" || key === "assignAvg") {
      const numericVal = parseFloat(String(value));
      if (isNaN(numericVal)) return String(value);
      return (
        <span className={`font-bold tabular-nums ${numericVal >= 85 ? "text-emerald-600" : numericVal >= 60 ? "text-amber-600" : "text-rose-500"}`}>
          {value}
        </span>
      );
    }

    if (typeof value === "number") {
      return <span className="tabular-nums font-semibold">{value.toLocaleString()}</span>;
    }

    return String(value);
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const headers = columns.map(c => c.label);
      const rows = filteredData.map(row => {
        return columns.map(c => {
          const val = row[c.key];
          if (c.key === "free") return val ? "Free" : "Paid";
          if (["totalPKR", "amount", "paid", "remaining", "expected", "collected", "pending", "revenue", "fee"].includes(c.key)) {
            return val !== null && val !== undefined ? `Rs. ${Number(val).toLocaleString()}` : "—";
          }
          return val !== null && val !== undefined ? String(val) : "—";
        });
      });

      const r = await fetch(`${BASE}/api/reports/export-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: REPORT_TYPES.find(t => t.id === activeReport)?.label,
          headers,
          rows
        })
      });

      if (r.ok) {
        const blob = await r.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeReport}-report.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast({ title: "PDF Report downloaded successfully!" });
      } else {
        throw new Error("Export failed");
      }
    } catch (err) {
      toast({ title: "PDF Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const headers = columns.map(c => c.label);
      const rows = filteredData.map(row => {
        return columns.map(c => {
          const val = row[c.key];
          if (c.key === "free") return val ? "Free" : "Paid";
          return val !== null && val !== undefined ? val : "—";
        });
      });

      const r = await fetch(`${BASE}/api/reports/export-excel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: REPORT_TYPES.find(t => t.id === activeReport)?.label,
          headers,
          rows
        })
      });

      if (r.ok) {
        const blob = await r.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeReport}-report.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast({ title: "Excel Spreadsheet downloaded successfully!" });
      } else {
        throw new Error("Export failed");
      }
    } catch (err) {
      toast({ title: "Excel Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto px-1 sm:px-4 py-2">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <FileBarChart className="h-8 w-8 text-primary" />
              Reports Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              Global College analytical spreadsheets and custom filters.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-slate-200 h-10 px-4 font-bold text-xs"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
              Sync Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={exporting || loading}
              className="font-bold gap-2 rounded-xl border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 h-10 px-4 text-xs"
              onClick={handleExportExcel}
            >
              <Table className="h-4 w-4 text-emerald-600" />
              Excel Export
            </Button>
            <Button
              disabled={exporting || loading}
              className="font-bold gap-2 rounded-xl bg-primary hover:bg-primary/95 text-white h-10 px-4 text-xs shadow-md"
              onClick={handleExportPdf}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              PDF Download
            </Button>
          </div>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-1 select-none">
          {(["all", "overview", "academic", "financial", "analytics"] as const).map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                const list = cat === "all" ? REPORT_TYPES : REPORT_TYPES.filter(r => r.category === cat);
                if (list.length > 0 && !list.some(r => r.id === activeReport)) {
                  setActiveReport(list[0].id);
                }
              }}
              className={`px-4 py-2 text-xs font-extrabold capitalize tracking-wide transition-all border-b-2 rounded-t-lg ${
                activeCategory === cat
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sidebar selector */}
          <div className="lg:col-span-1 flex flex-col gap-2 max-h-[550px] overflow-y-auto pr-1">
            {filteredReportsList.map(({ id, label, icon: Icon, description }) => {
              const isActive = activeReport === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveReport(id)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? "bg-primary/5 text-primary border-primary/45 shadow-sm shadow-primary/5"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700 bg-white"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center ${isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold leading-tight">{label}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Grid View */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <Card className="border border-slate-200/80 shadow-md rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              {/* Report Meta Info */}
              <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                  <CardTitle className="text-xl font-black text-slate-800 dark:text-white">
                    {REPORT_TYPES.find(r => r.id === activeReport)?.label}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1 font-medium">
                    {REPORT_TYPES.find(r => r.id === activeReport)?.description}
                  </CardDescription>
                </div>

                {/* Local search & filters */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Find in sheet..."
                      value={searchQuery}
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-9 h-9 rounded-xl text-xs bg-white border-slate-200"
                    />
                  </div>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={val => {
                      setItemsPerPage(Number(val));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20 h-9 rounded-xl text-xs border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sheet Body Container */}
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-28 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-60" />
                    <span className="text-xs font-bold text-slate-400">Fetching live database stats...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto select-text">
                    <table className="w-full text-xs text-left border-collapse">
                      {/* Excel Letter Indexes */}
                      <thead>
                        <tr className="bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200/60 select-none">
                          <th className="w-12 text-center py-1.5 text-[9px] font-black text-slate-400 border-r border-slate-200/60 bg-slate-100/40">#</th>
                          {columns.map((col, index) => (
                            <th
                              key={col.key}
                              className={`py-1.5 px-4 text-[9px] font-black text-slate-400 tracking-wider border-r border-slate-200/60 uppercase ${
                                col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                              }`}
                            >
                              {String.fromCharCode(65 + index)}
                            </th>
                          ))}
                        </tr>

                        {/* Column Header Titles */}
                        <tr className="bg-slate-50 dark:bg-slate-800/20 border-b-2 border-slate-200">
                          <th className="w-12 text-center py-3 font-extrabold text-slate-500 border-r border-slate-200">ROW</th>
                          {columns.map(col => (
                            <th
                              key={col.key}
                              className={`py-3 px-4 font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 whitespace-nowrap ${
                                col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                              }`}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedData.map((row, idx) => {
                          const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                          return (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800"
                            >
                              {/* Row index number */}
                              <td className="w-12 text-center py-2.5 font-bold text-slate-400 bg-slate-50/40 dark:bg-slate-800/10 border-r border-slate-100 dark:border-slate-800 select-none">
                                {rowNumber}
                              </td>

                              {columns.map(col => (
                                <td
                                  key={col.key}
                                  className={`py-2.5 px-4 border-r border-slate-100 dark:border-slate-800 font-medium ${
                                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                                  }`}
                                >
                                  {formatCellValue(col.key, row[col.key])}
                                </td>
                              ))}
                            </tr>
                          );
                        })}

                        {paginatedData.length === 0 && (
                          <tr>
                            <td
                              colSpan={columns.length + 1}
                              className="py-16 text-center text-slate-400 font-bold text-xs bg-slate-50/10"
                            >
                              No records match the active search filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>

              {/* Sheet Pagination Footer */}
              {!loading && filteredData.length > 0 && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <span className="text-[11px] font-bold text-slate-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-slate-200"
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      if (totalPages > 5 && Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                        if (pageNum === 2 || pageNum === totalPages - 1) {
                          return <span key={pageNum} className="text-slate-400 px-1 text-[11px] font-bold">...</span>;
                        }
                        return null;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="icon"
                          className={`h-8 w-8 rounded-lg text-xs font-black ${
                            currentPage === pageNum ? "bg-primary text-white" : "border-slate-200 text-slate-600"
                          }`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-slate-200"
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Quick summary stats strip */}
            {!loading && filteredData.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Rows", value: data.length, icon: FileText, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Filtered Rows", value: filteredData.length, icon: Filter, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Active Report Columns", value: columns.length, icon: Table, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" },
                  { label: "Active Page", value: `${currentPage} / ${totalPages}`, icon: Calendar, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20" },
                ].map((stat, i) => (
                  <Card key={i} className="border border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    <CardContent className="p-4 flex items-center gap-3.5">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                        <stat.icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-base font-black text-slate-800 dark:text-white tabular-nums mt-0.5">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
