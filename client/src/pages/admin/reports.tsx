import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type ReportType = "branch" | "students" | "enrollments" | "revenue" | "full-list";

const REPORT_TYPES: { id: ReportType; label: string; icon: any; description: string; color: string }[] = [
  {
    id: "branch",
    label: "Branch Overview",
    icon: Building2,
    description: "Student counts, enrollment rates, and activity per campus branch.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: "students",
    label: "Student Progress",
    icon: Users,
    description: "Completion rates, quiz scores, assignment marks per student.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "enrollments",
    label: "Enrollments",
    icon: BookOpen,
    description: "Course enrollment stats, new enrollments by date range.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    id: "revenue",
    label: "Revenue",
    icon: CreditCard,
    description: "Payment totals by method, status, and date range.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    id: "full-list",
    label: "Full Student List",
    icon: Table,
    description: "Complete student roster with branch, enrollment, and status data.",
    color: "bg-rose-50 text-rose-600",
  },
];

export default function AdminReports() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [activeReport, setActiveReport] = useState<ReportType>("branch");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const r = await fetch(`${BASE}/api/reports/${activeReport}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          setData(await r.json());
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Failed to fetch report data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [activeReport, token]);

  const getHeaders = (type: ReportType) => {
    switch (type) {
      case "branch": return ["Branch Name", "City", "Students", "Active", "Courses"];
      case "students": return ["Student", "Branch", "Courses", "Completion", "Quiz Avg", "Assignment Avg"];
      case "enrollments": return ["Course", "Enrolled", "Completed", "Active", "Type"];
      case "revenue": return ["Payment Method", "Transactions", "Total PKR", "Approved", "Pending"];
      case "full-list": return ["Name", "Email", "Branch", "Enrolled", "Status", "Joined"];
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const headers = getHeaders(activeReport);
      const rows = data.map(row => {
        switch (activeReport) {
          case "branch": return [row.name, row.city, row.students, row.active, row.courses];
          case "students": return [row.name, row.branch, row.courses, row.completion, row.quizAvg, row.assignAvg];
          case "enrollments": return [row.course, row.enrolled, row.completed, row.active, row.free ? "Free" : "Paid"];
          case "revenue": return [row.method, row.transactions, `Rs. ${row.totalPKR.toLocaleString()}`, row.approved, row.pending];
          case "full-list": return [row.name, row.email, row.branch, row.enrolled, row.status, row.joined];
        }
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
      } else {
        throw new Error("Export failed");
      }
    } catch (err) {
      toast({ title: "PDF Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Reports</h1>
          <p className="text-gray-500 font-medium mt-1">
            Real-time analytics and audit reports
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {REPORT_TYPES.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveReport(id)}
              className={`flex flex-col items-center gap-2 p-5 rounded-[24px] border-2 text-center transition-all duration-200 cursor-pointer ${
                activeReport === id
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-gray-50 bg-white hover:border-gray-200"
              }`}
            >
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${activeReport === id ? "bg-primary text-white shadow-lg shadow-primary/20" : color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className={`text-xs font-black leading-tight mt-1 ${activeReport === id ? "text-primary" : "text-gray-600"}`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        <Card className="border-none shadow-2xl ring-1 ring-gray-100 rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="px-8 py-8 border-b border-gray-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <CardTitle className="text-2xl font-black text-gray-900">
                  {REPORT_TYPES.find((r) => r.id === activeReport)?.label} Report
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1 font-medium">
                  {REPORT_TYPES.find((r) => r.id === activeReport)?.description}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="font-black gap-2 rounded-2xl border-gray-200 h-12 px-6 text-sm hover:bg-slate-50"
                  onClick={() => toast({ title: "Coming soon: Excel export" })}
                >
                  <Table className="h-4 w-4 text-emerald-600" />
                  Excel
                </Button>
                <Button
                  disabled={exporting || loading}
                  className="font-black gap-2 rounded-2xl bg-primary hover:bg-primary/90 h-12 px-6 text-sm shadow-xl shadow-primary/20 transition-all active:scale-95"
                  onClick={handleExportPdf}
                >
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-gray-50">
                      {getHeaders(activeReport).map((h) => (
                        <th key={h} className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                        {Object.values(row).map((val: any, vIdx) => (
                          <td key={vIdx} className={`px-8 py-5 ${vIdx === 0 ? "font-black text-gray-900" : "text-gray-500 font-medium"}`}>
                            {typeof val === "boolean" ? (
                              <Badge className={val ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}>{val ? "Free" : "Paid"}</Badge>
                            ) : (
                              val?.toLocaleString()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={getHeaders(activeReport).length} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                          No data found for this report
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
