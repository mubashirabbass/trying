import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Printer,
  Download,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const BASE = window.location.origin;

interface Enrollment {
  id: number;
  courseId: number;
  courseName?: string;
  progress: number;
  status: string;
  enrolledAt: string;
  completedAt?: string;
  paymentStatus?: string;
}

interface Payment {
  id: number;
  userId: number;
  courseId?: number;
  courseName?: string;
  amount: number;
  method: string;
  status: string;
  receiptUrl?: string;
  createdAt: string;
  verifiedAt?: string;
}

export default function PrintDetails() {
  const { user, token } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !token) return;

      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch enrollments
        const enrollmentsRes = await fetch(`${BASE}/api/enrollments?userId=${user.id}`, { headers });
        if (enrollmentsRes.ok) {
          const enrollmentsData = await enrollmentsRes.json();
          setEnrollments(enrollmentsData);
        }

        // Fetch payments
        const paymentsRes = await fetch(`${BASE}/api/payments?userId=${user.id}`, { headers });
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPayments(paymentsData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, token]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatPrintDate = () => {
    const now = new Date();
    const months = [
      "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
      "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
  };

  const getAdmissionYear = () => {
    if (user?.session) {
      const match = user.session.match(/^\d{4}/);
      if (match) return match[0];
    }
    if (user?.createdAt) {
      return new Date(user.createdAt).getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  };

  const handlePrint = () => {
    setIsPrinting(true);

    const programText = enrollments.length > 0
      ? enrollments.map((e) => e.courseName || `Course #${e.courseId}`).join(", ")
      : "N/A";

    // Shrink font if multiple courses so it fits on one line cleanly
    const programFontSize = enrollments.length > 1 ? "9px" : "12px";

    const enrollmentRows = enrollments.length === 0
      ? `<tr><td colspan="5" style="padding:12px;text-align:center;font-style:italic;color:#555;">No enrollment records found.</td></tr>`
      : enrollments.map((e, i) => `
          <tr>
            <td style="text-align:center">${i + 1}</td>
            <td style="text-align:left;font-weight:bold">${(e.courseName || `Course #${e.courseId}`).toUpperCase()}</td>
            <td style="text-align:center">${e.progress}%</td>
            <td style="text-align:center">${formatDate(e.enrolledAt)}</td>
            <td style="text-align:center;font-weight:bold">${e.status === "active" ? "PROMOTED" : e.status.toUpperCase()}</td>
          </tr>`).join("");

    const paymentRows = payments.length === 0
      ? `<tr><td colspan="7" style="padding:12px;text-align:center;font-style:italic;color:#555;">No payment records found.</td></tr>`
      : payments.map((p, i) => `
          <tr>
            <td style="text-align:center">${i + 1}</td>
            <td style="text-align:left;font-weight:bold">${(p.courseName || `Course #${p.courseId}`).toUpperCase()}</td>
            <td style="text-align:center">GC-V${p.id}</td>
            <td style="text-align:center;font-weight:bold">Rs. ${p.amount.toLocaleString()}</td>
            <td style="text-align:center">${formatDate(p.createdAt)}</td>
            <td style="text-align:center">${p.method === "cash" ? "Bank of Punjab" : p.method}</td>
            <td style="text-align:center;font-weight:bold;color:#155724">${
              ["verified","approved","paid"].includes(p.status) ? "Fee Paid" : p.status.toUpperCase()
            }</td>
          </tr>`).join("");

    const avatarHtml = user?.avatar
      ? `<img src="${user.avatar}" style="width:90px;height:110px;object-fit:cover;border:1px solid #000;" />`
      : `<div style="width:90px;height:110px;border:1px solid #000;display:flex;align-items:center;justify-content:center;font-size:48px;color:#ccc;">👤</div>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { setIsPrinting(false); return; }

    win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Student Details - ${user?.name || ""}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: "Times New Roman", Times, serif; font-size: 13px; color: #000; background: #fff; padding: 20px 28px; }
    @page { size: A4; margin: 1.2cm; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 16px; }
    .header-logo { width: 90px; text-align: center; }
    .header-logo svg { width: 70px; height: 70px; }
    .header-center { flex: 1; text-align: center; padding: 0 12px; }
    .header-center h1 { font-size: 15px; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px; }
    .header-center h2 { font-size: 13px; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-top: 5px; }
    .header-center p  { font-size: 10px; text-transform: uppercase; margin-top: 6px; color: #333; letter-spacing: 0.3px; }
    .header-photo { width: 90px; height: 110px; border: 1px solid #000; overflow: hidden; display: flex; align-items: center; justify-content: center; }

    /* Info rows */
    .info-block { margin-bottom: 16px; }
    .info-row { display: flex; align-items: baseline; margin-bottom: 7px; gap: 0; }
    .info-label { font-weight: bold; text-transform: uppercase; white-space: nowrap; font-size: 12px; }
    .info-value { flex: 1; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-left: 4px; padding-left: 4px; padding-bottom: 1px; min-width: 0; font-size: 12px; }
    .info-spacer { width: 24px; flex-shrink: 0; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th, td { border: 1px solid #000; padding: 4px 6px; }
    .table-heading th { text-align: center; font-weight: bold; font-size: 13px; background: #fff; border-bottom: 2px solid #000; }
    thead tr:nth-child(2) th { text-align: center; font-weight: bold; font-size: 11px; text-transform: uppercase; background: #fafafa; }

    /* Footer */
    .print-footer { border-top: 1px solid #000; padding-top: 6px; margin-top: 12px; display: flex; justify-content: space-between; font-size: 9px; text-transform: uppercase; color: #555; letter-spacing: 0.3px; }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="header-logo">
      <svg fill="none" stroke="#1e293b" stroke-width="1" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
    </div>
    <div class="header-center">
      <h1>Global College of Computer Science &amp; Commerce</h1>
      <h2>Student Information Details</h2>
      <p>Printed Date : ${formatPrintDate()}</p>
    </div>
    <div class="header-photo">${avatarHtml}</div>
  </div>

  <!-- Personal Info -->
  <div class="info-block">
    <div class="info-row">
      <span class="info-label">Student Name :</span>
      <span class="info-value">${user?.name || "N/A"}</span>
      <span class="info-spacer"></span>
      <span class="info-label">Father Name :</span>
      <span class="info-value">${(user as any)?.fatherName || "N/A"}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Program :</span>
      <span class="info-value" style="flex:2;font-size:${programFontSize};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${programText}</span>
      <span class="info-spacer"></span>
      <span class="info-label">Roll #:</span>
      <span class="info-value">${(user as any)?.rollNo || "N/A"}</span>
      <span class="info-spacer"></span>
      <span class="info-label">Session :</span>
      <span class="info-value">${(user as any)?.session || "N/A"}</span>
    </div>
    <div class="info-row">
      <span class="info-label">CNIC #:</span>
      <span class="info-value">${(user as any)?.cnic || "N/A"}</span>
      <span class="info-spacer"></span>
      <span class="info-label">Registration #:</span>
      <span class="info-value" style="flex:1.8">${(user as any)?.regNo || "N/A"}</span>
      <span class="info-spacer"></span>
      <span class="info-label">Adm. Year :</span>
      <span class="info-value">${getAdmissionYear()}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Address :</span>
      <span class="info-value">${(user as any)?.address || "N/A"}</span>
    </div>
  </div>

  <!-- Academic Table -->
  <table>
    <thead>
      <tr class="table-heading"><th colspan="5">Academic Information for ${user?.name?.toUpperCase() || ""}</th></tr>
      <tr><th style="width:40px">SR #</th><th style="text-align:left">Course Details</th><th style="width:80px">Progress</th><th style="width:110px">Enrolled Date</th><th style="width:100px">Status</th></tr>
    </thead>
    <tbody>${enrollmentRows}</tbody>
  </table>

  <!-- Fee Table -->
  <table>
    <thead>
      <tr class="table-heading"><th colspan="7">Fee Information for ${user?.name?.toUpperCase() || ""}</th></tr>
      <tr><th style="width:40px">SR #</th><th style="text-align:left">Course / Semester Details</th><th style="width:80px">Voucher No</th><th style="width:90px">Paid Amount</th><th style="width:90px">Paid Date</th><th style="width:130px">Bank Name</th><th style="width:80px">Status</th></tr>
    </thead>
    <tbody>${paymentRows}</tbody>
  </table>

  <!-- Footer -->
  <div class="print-footer">
    <span>Global College of Computer Science &amp; Commerce</span>
    <span>This is an official computer-generated student report. No signature required.</span>
  </div>
</body>
</html>`);

    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
      setIsPrinting(false);
    }, 500);
  };

  const handleDownloadImage = async () => {
    try {
      const { default: html2canvas } = await import("html2canvas");

      const element = document.getElementById("print-details-content");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `student-details-${user?.name?.replace(/\s+/g, "-") || "report"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        
        {/* Actions bar - hidden during print */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Print Details</h1>
              <p className="text-xs text-slate-500">Official student details report replica</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              disabled={loading || isPrinting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 text-xs gap-1.5 shadow-sm rounded-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Printer className="h-3.5 w-3.5" />
                  Print Page
                </>
              )}
            </Button>
            <Button
              onClick={handleDownloadImage}
              variant="outline"
              disabled={loading}
              className="font-bold h-9 px-4 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              <Download className="h-3.5 w-3.5" />
              Download Image
            </Button>
          </div>
        </div>

        {/* Outer container to display A4 preview on screen */}
        <div className="w-full overflow-x-auto flex justify-center bg-slate-50 py-8 px-2 sm:px-6 rounded-2xl border border-slate-200 print:bg-white print:border-none print:p-0 print:m-0">
          
          {/* Printable sheet element */}
          <div
            id="print-details-content"
            className="w-[210mm] min-h-[297mm] bg-white text-black p-[15mm] sm:p-[20mm] font-serif shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 flex flex-col justify-between"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              boxSizing: "border-box"
            }}
          >
            <div>
              {/* Header section matching the university PDF */}
              <div className="flex justify-between items-start mb-8 pb-4" style={{ borderBottom: "2px solid #000" }}>
                {/* Logo Space - Left */}
                <div className="w-[100px] h-[100px] flex items-center justify-center border border-dashed border-slate-300 print:border-none">
                  {/* Since logo is skipped right now, we show a clean emblem placeholder */}
                  <svg className="w-16 h-16 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>

                {/* Central Titles */}
                <div className="flex-1 text-center px-4 mt-2">
                  <h1 className="text-xl font-bold tracking-wide uppercase leading-tight" style={{ textDecoration: "underline" }}>
                    GLOBAL COLLEGE OF COMPUTER SCIENCE &amp; COMMERCE
                  </h1>
                  <h2 className="text-base font-bold tracking-wide uppercase mt-1.5" style={{ textDecoration: "underline" }}>
                    STUDENT INFORMATION DETAILS
                  </h2>
                  <p className="text-xs uppercase mt-2 font-sans tracking-wider" style={{ color: "#333", fontSize: "11px" }}>
                    PRINTED DATE : {formatPrintDate()}
                  </p>
                </div>

                {/* Student Passport Photo - Right */}
                <div className="w-[90px] h-[110px] border border-black flex items-center justify-center overflow-hidden bg-white shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Personal Details Information Block */}
              <div className="space-y-3 mb-8" style={{ fontSize: "13px" }}>
                {/* Row 1 */}
                <div className="flex justify-between items-center w-full">
                  <div className="flex-1 flex items-center">
                    <span className="font-bold whitespace-nowrap uppercase tracking-tight">STUDENT NAME :</span>
                    <span className="flex-1 ml-2 font-bold uppercase border-b border-black pl-1 pb-0.5">
                      {user?.name || "N/A"}
                    </span>
                  </div>
                  <div className="w-8"></div>
                  <div className="flex-1 flex items-center">
                    <span className="font-bold whitespace-nowrap uppercase tracking-tight">FATHER NAME :</span>
                    <span className="flex-1 ml-2 font-bold uppercase border-b border-black pl-1 pb-0.5">
                      {user?.fatherName || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex justify-between items-center w-full">
                  <div className="flex-[2] flex items-center">
                    <span className="font-bold whitespace-nowrap uppercase tracking-tight">PROGRAM :</span>
                    <span className="flex-1 ml-2 font-bold uppercase border-b border-black pl-1 pb-0.5 min-h-[20px] flex items-center">
                      {loading ? (
                        <span className="h-3 bg-slate-200 animate-pulse rounded w-48 inline-block"></span>
                      ) : enrollments.length > 0 ? (
                        enrollments.map((e) => e.courseName || `Course #${e.courseId}`).join(", ")
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                  <div className="w-6"></div>
                  <div className="flex-[1] flex items-center">
                    <span className="font-bold whitespace-nowrap uppercase tracking-tight">ROLL #:</span>
                    <span className="flex-1 ml-2 font-bold border-b border-black pl-1 pb-0.5">
                      {user?.rollNo || "N/A"}
                    </span>
                  </div>
                  <div className="w-6"></div>
                  <div className="flex-[1.2] flex items-center">
                    <span className="font-bold whitespace-nowrap uppercase tracking-tight">SESSION :</span>
                    <span className="flex-1 ml-2 font-bold border-b border-black pl-1 pb-0.5">
                      {user?.session || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex justify-between items-center w-full">
                  <div className="flex-[1.2] flex items-center">
                    <span className="font-bold whitespace-nowrap uppercase tracking-tight">CNIC #:</span>
                    <span className="flex-1 ml-2 font-bold border-b border-black pl-1 pb-0.5">
                      {user?.cnic || "N/A"}
                    </span>
                  </div>
                  <div className="w-6"></div>
                  <div className="flex-[1.8] flex items-center">
                    <span className="font-bold whitespace-nowrap uppercase tracking-tight">REGISTRAION #:</span>
                    <span className="flex-1 ml-2 font-bold border-b border-black pl-1 pb-0.5">
                      {user?.regNo || "N/A"}
                    </span>
                  </div>
                  <div className="w-6"></div>
                  <div className="flex-[1] flex items-center">
                    <span className="font-bold whitespace-nowrap uppercase tracking-tight">ADM_YEAR :</span>
                    <span className="flex-1 ml-2 font-bold border-b border-black pl-1 pb-0.5">
                      {getAdmissionYear()}
                    </span>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="flex items-center w-full">
                  <span className="font-bold whitespace-nowrap uppercase tracking-tight">ADDRESS :</span>
                  <span className="flex-1 ml-2 font-bold uppercase border-b border-black pl-1 pb-0.5">
                    {user?.address || "N/A"}
                  </span>
                </div>
              </div>

              {/* Table 1: Academic Information Table */}
              <div className="mb-8">
                <table
                  className="w-full border-collapse border border-black text-center"
                  style={{ fontSize: "12px", border: "1px solid black" }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid black" }}>
                      <th
                        colSpan={5}
                        className="py-1.5 px-3 font-bold bg-white text-center uppercase tracking-wide"
                        style={{ borderBottom: "1.5px solid black", fontSize: "13px" }}
                      >
                        Academic Information for {user?.name?.toUpperCase()}
                      </th>
                    </tr>
                    <tr style={{ borderBottom: "1px solid black", background: "#fcfcfc" }}>
                      <th className="py-1 px-2 border-r border-black font-bold uppercase" style={{ width: "50px" }}>SR #</th>
                      <th className="py-1 px-3 border-r border-black font-bold uppercase text-left">Course Details</th>
                      <th className="py-1 px-2 border-r border-black font-bold uppercase" style={{ width: "90px" }}>Progress</th>
                      <th className="py-1 px-2 border-r border-black font-bold uppercase" style={{ width: "130px" }}>Enrolled Date</th>
                      <th className="py-1 px-2 font-bold uppercase" style={{ width: "120px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [1, 2].map((i) => (
                        <tr key={i} className="border-b border-black animate-pulse">
                          <td className="py-2 px-2 border-r border-black"><div className="h-3 bg-slate-200 rounded w-4 mx-auto"></div></td>
                          <td className="py-2 px-3 border-r border-black"><div className="h-3 bg-slate-200 rounded w-64"></div></td>
                          <td className="py-2 px-2 border-r border-black"><div className="h-3 bg-slate-200 rounded w-12 mx-auto"></div></td>
                          <td className="py-2 px-2 border-r border-black"><div className="h-3 bg-slate-200 rounded w-20 mx-auto"></div></td>
                          <td className="py-2 px-2"><div className="h-3 bg-slate-200 rounded w-16 mx-auto"></div></td>
                        </tr>
                      ))
                    ) : enrollments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 px-4 text-center italic font-semibold text-slate-500">
                          No active academic course enrollments found.
                        </td>
                      </tr>
                    ) : (
                      enrollments.map((enrollment, index) => (
                        <tr
                          key={enrollment.id}
                          className="border-b border-black last:border-none"
                        >
                          <td className="py-1 px-2 border-r border-black">{index + 1}</td>
                          <td className="py-1 px-3 border-r border-black font-semibold text-left uppercase">
                            {enrollment.courseName || `Course #${enrollment.courseId}`}
                          </td>
                          <td className="py-1 px-2 border-r border-black font-semibold">{enrollment.progress}%</td>
                          <td className="py-1 px-2 border-r border-black">{formatDate(enrollment.enrolledAt)}</td>
                          <td className="py-1 px-2 font-bold uppercase">
                            {enrollment.status === "active" ? "PROMOTED" : enrollment.status.toUpperCase()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table 2: Fee Information Table */}
              <div>
                <table
                  className="w-full border-collapse border border-black text-center"
                  style={{ fontSize: "12px", border: "1px solid black" }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid black" }}>
                      <th
                        colSpan={7}
                        className="py-1.5 px-3 font-bold bg-white text-center uppercase tracking-wide"
                        style={{ borderBottom: "1.5px solid black", fontSize: "13px" }}
                      >
                        Fee Information for {user?.name?.toUpperCase()}
                      </th>
                    </tr>
                    <tr style={{ borderBottom: "1px solid black", background: "#fcfcfc" }}>
                      <th className="py-1 px-2 border-r border-black font-bold uppercase" style={{ width: "50px" }}>SR #</th>
                      <th className="py-1 px-3 border-r border-black font-bold uppercase text-left">Course / Semester Details</th>
                      <th className="py-1 px-2 border-r border-black font-bold uppercase" style={{ width: "90px" }}>Voucher No</th>
                      <th className="py-1 px-2 border-r border-black font-bold uppercase" style={{ width: "100px" }}>Paid Amount</th>
                      <th className="py-1 px-2 border-r border-black font-bold uppercase" style={{ width: "100px" }}>Paid Date</th>
                      <th className="py-1 px-2 border-r border-black font-bold uppercase" style={{ width: "150px" }}>Bank Name</th>
                      <th className="py-1 px-2 font-bold uppercase" style={{ width: "90px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [1, 2].map((i) => (
                        <tr key={i} className="border-b border-black animate-pulse">
                          <td className="py-2 px-2 border-r border-black"><div className="h-3 bg-slate-200 rounded w-4 mx-auto"></div></td>
                          <td className="py-2 px-3 border-r border-black"><div className="h-3 bg-slate-200 rounded w-60"></div></td>
                          <td className="py-2 px-2 border-r border-black"><div className="h-3 bg-slate-200 rounded w-16 mx-auto"></div></td>
                          <td className="py-2 px-2 border-r border-black"><div className="h-3 bg-slate-200 rounded w-16 mx-auto"></div></td>
                          <td className="py-2 px-2 border-r border-black"><div className="h-3 bg-slate-200 rounded w-20 mx-auto"></div></td>
                          <td className="py-2 px-2 border-r border-black"><div className="h-3 bg-slate-200 rounded w-24 mx-auto"></div></td>
                          <td className="py-2 px-2"><div className="h-3 bg-slate-200 rounded w-12 mx-auto"></div></td>
                        </tr>
                      ))
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 px-4 text-center italic font-semibold text-slate-500">
                          No financial transaction records found.
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment, index) => (
                        <tr
                          key={payment.id}
                          className="border-b border-black last:border-none"
                        >
                          <td className="py-1 px-2 border-r border-black">{index + 1}</td>
                          <td className="py-1 px-3 border-r border-black font-semibold text-left uppercase">
                            {payment.courseName || `Course #${payment.courseId}`}
                          </td>
                          <td className="py-1 px-2 border-r border-black font-semibold font-mono">{`GC-V${payment.id}`}</td>
                          <td className="py-1 px-2 border-r border-black font-bold">Rs. {payment.amount.toLocaleString()}</td>
                          <td className="py-1 px-2 border-r border-black">{formatDate(payment.createdAt)}</td>
                          <td className="py-1 px-2 border-r border-black uppercase">
                            {payment.method === "cash" ? "Bank of Punjab" : payment.method}
                          </td>
                          <td className="py-1 px-2 font-bold uppercase text-emerald-800">
                            {payment.status === "verified" || payment.status === "approved" || payment.status === "paid"
                              ? "Fee Paid"
                              : payment.status.toUpperCase()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Footer */}
            <div className="border-t border-black pt-2 mt-8 flex justify-between items-center text-[10px] text-slate-600 font-sans tracking-wide uppercase">
              <span>Global College of Computer Science &amp; Commerce</span>
              <span>This is an official computer-generated student report. No signature required.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global CSS Print Styles */}
      <style>{`
        @media print {
          /* Hide everything except the print-details-content element */
          body > * {
            display: none !important;
          }
          
          body > div[id="root"] {
            display: block !important;
          }
          
          /* Hide sidebar, navigation, headers, wrappers */
          aside,
          nav,
          header,
          footer,
          [role="navigation"],
          [class*="sidebar"],
          [class*="Sidebar"],
          [class*="navbar"],
          [class*="Navbar"],
          button,
          .print\\:hidden {
            display: none !important;
          }
          
          /* Set printable sheet container full width, remove margins/shadows */
          .max-w-5xl, 
          .max-w-5xl * {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          .overflow-x-auto, 
          .bg-slate-50 {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          #print-details-content {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }

          /* Ensure table borders render correctly in print */
          table, th, td {
            border: 1px solid black !important;
          }

          .border-b {
            border-bottom: 1px solid black !important;
          }

          /* Page setup configuration */
          @page {
            size: A4;
            margin: 1.2cm;
          }
          
          /* Force colors to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
