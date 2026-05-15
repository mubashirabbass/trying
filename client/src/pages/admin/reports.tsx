import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useState } from "react";

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

// Mock preview data per report type
const MOCK_DATA: Record<ReportType, any[]> = {
  branch: [
    { name: "Lahore Main", city: "Lahore", students: 1842, active: 1720, courses: 12 },
    { name: "Karachi Hub", city: "Karachi", students: 1100, active: 980, courses: 10 },
    { name: "Islamabad Center", city: "Islamabad", students: 870, active: 810, courses: 8 },
    { name: "Faisalabad Branch", city: "Faisalabad", students: 688, active: 620, courses: 7 },
  ],
  students: [
    { name: "Ahmed Ali", branch: "Lahore", courses: 3, completion: "78%", quizAvg: "82%", assignAvg: "75%" },
    { name: "Sara Khan", branch: "Karachi", courses: 2, completion: "91%", quizAvg: "90%", assignAvg: "88%" },
    { name: "Bilal Hussain", branch: "Islamabad", courses: 1, completion: "45%", quizAvg: "60%", assignAvg: "55%" },
    { name: "Fatima Zahra", branch: "Lahore", courses: 4, completion: "100%", quizAvg: "95%", assignAvg: "92%" },
  ],
  enrollments: [
    { course: "eBay Business Course", enrolled: 920, completed: 680, active: 240, free: false },
    { course: "Amazon FBA Mastery", enrolled: 740, completed: 510, active: 230, free: false },
    { course: "Graphics & Logo Design", enrolled: 520, completed: 390, active: 130, free: true },
    { course: "Freelancing Bootcamp", enrolled: 610, completed: 420, active: 190, free: false },
  ],
  revenue: [
    { method: "EasyPaisa", transactions: 410, totalPKR: 2050000, approved: 390, pending: 20 },
    { method: "JazzCash", transactions: 280, totalPKR: 1400000, approved: 265, pending: 15 },
    { method: "Bank Transfer", transactions: 190, totalPKR: 950000, approved: 180, pending: 10 },
    { method: "Card", transactions: 120, totalPKR: 600000, approved: 115, pending: 5 },
  ],
  "full-list": [
    { name: "Ahmed Ali", email: "ahmed@example.com", branch: "Lahore", enrolled: 3, status: "Active", joined: "2026-01-15" },
    { name: "Sara Khan", email: "sara@example.com", branch: "Karachi", enrolled: 2, status: "Active", joined: "2026-02-20" },
    { name: "Bilal Hussain", email: "bilal@example.com", branch: "Islamabad", enrolled: 1, status: "Active", joined: "2026-03-05" },
    { name: "Fatima Zahra", email: "fatima@example.com", branch: "Lahore", enrolled: 4, status: "Inactive", joined: "2025-12-01" },
  ],
};

function PreviewTable({ type }: { type: ReportType }) {
  const data = MOCK_DATA[type];

  const renderHeaders = () => {
    switch (type) {
      case "branch":
        return ["Branch Name", "City", "Students", "Active", "Courses"];
      case "students":
        return ["Student", "Branch", "Courses", "Completion", "Quiz Avg", "Assignment Avg"];
      case "enrollments":
        return ["Course", "Enrolled", "Completed", "Active", "Type"];
      case "revenue":
        return ["Payment Method", "Transactions", "Total PKR", "Approved", "Pending"];
      case "full-list":
        return ["Name", "Email", "Branch", "Enrolled", "Status", "Joined"];
    }
  };

  const renderRow = (row: any, idx: number) => {
    switch (type) {
      case "branch":
        return (
          <tr key={idx} className="hover:bg-slate-50/50">
            <td className="px-5 py-3 font-bold text-gray-900">{row.name}</td>
            <td className="px-5 py-3 text-gray-500">{row.city}</td>
            <td className="px-5 py-3 font-bold">{row.students.toLocaleString()}</td>
            <td className="px-5 py-3 text-emerald-600 font-bold">{row.active.toLocaleString()}</td>
            <td className="px-5 py-3">{row.courses}</td>
          </tr>
        );
      case "students":
        return (
          <tr key={idx} className="hover:bg-slate-50/50">
            <td className="px-5 py-3 font-bold text-gray-900">{row.name}</td>
            <td className="px-5 py-3 text-gray-500">{row.branch}</td>
            <td className="px-5 py-3">{row.courses}</td>
            <td className="px-5 py-3"><Badge className="bg-blue-50 text-blue-700 font-bold">{row.completion}</Badge></td>
            <td className="px-5 py-3 text-gray-600">{row.quizAvg}</td>
            <td className="px-5 py-3 text-gray-600">{row.assignAvg}</td>
          </tr>
        );
      case "enrollments":
        return (
          <tr key={idx} className="hover:bg-slate-50/50">
            <td className="px-5 py-3 font-bold text-gray-900">{row.course}</td>
            <td className="px-5 py-3 font-bold">{row.enrolled}</td>
            <td className="px-5 py-3 text-emerald-600 font-bold">{row.completed}</td>
            <td className="px-5 py-3 text-blue-600 font-bold">{row.active}</td>
            <td className="px-5 py-3"><Badge className={row.free ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}>{row.free ? "Free" : "Paid"}</Badge></td>
          </tr>
        );
      case "revenue":
        return (
          <tr key={idx} className="hover:bg-slate-50/50">
            <td className="px-5 py-3 font-bold text-gray-900">{row.method}</td>
            <td className="px-5 py-3">{row.transactions}</td>
            <td className="px-5 py-3 font-black text-gray-900">Rs. {row.totalPKR.toLocaleString()}</td>
            <td className="px-5 py-3 text-emerald-600 font-bold">{row.approved}</td>
            <td className="px-5 py-3 text-amber-600 font-bold">{row.pending}</td>
          </tr>
        );
      case "full-list":
        return (
          <tr key={idx} className="hover:bg-slate-50/50">
            <td className="px-5 py-3 font-bold text-gray-900">{row.name}</td>
            <td className="px-5 py-3 text-gray-500 text-sm">{row.email}</td>
            <td className="px-5 py-3">{row.branch}</td>
            <td className="px-5 py-3">{row.enrolled}</td>
            <td className="px-5 py-3"><Badge className={row.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}>{row.status}</Badge></td>
            <td className="px-5 py-3 text-gray-500">{row.joined}</td>
          </tr>
        );
    }
  };

  const headers = renderHeaders();

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-gray-100">
            {headers.map((h) => (
              <th key={h} className="px-5 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row, idx) => renderRow(row, idx))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminReports() {
  const [activeReport, setActiveReport] = useState<ReportType>("branch");

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-900">Reports</h1>
          <p className="text-gray-500 font-medium mt-1">
            Preview and export platform data as PDF or Excel
          </p>
        </div>

        {/* Report Type Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {REPORT_TYPES.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveReport(id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all duration-200 cursor-pointer ${
                activeReport === id
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${activeReport === id ? "bg-primary text-white" : color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-black leading-tight ${activeReport === id ? "text-primary" : "text-gray-700"}`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Preview Card */}
        <Card className="border border-gray-100 rounded-2xl overflow-hidden">
          <CardHeader className="px-6 py-5 border-b border-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-black text-gray-900">
                  {REPORT_TYPES.find((r) => r.id === activeReport)?.label} Report
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1 font-medium">
                  {REPORT_TYPES.find((r) => r.id === activeReport)?.description}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="font-black gap-2 rounded-xl border-gray-200 h-10 text-sm"
                  onClick={() => alert("Excel export — connect to backend exceljs endpoint")}
                >
                  <Table className="h-4 w-4 text-emerald-600" />
                  Export Excel
                </Button>
                <Button
                  className="font-black gap-2 rounded-xl bg-primary hover:bg-primary/90 h-10 text-sm shadow-lg shadow-primary/20"
                  onClick={() => alert("PDF export — connect to backend Puppeteer endpoint")}
                >
                  <FileText className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <Filter className="h-3.5 w-3.5" />
              Preview (showing sample data — connect API for live data)
            </div>
            <PreviewTable type={activeReport} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
