import { useRef, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  IdCard,
  Printer,
  Info,
  User,
  Building2,
  Hash,
  CalendarDays,
  GraduationCap,
  Clock,
} from "lucide-react";

// ─── GCUF Student Card Component (visual replica) ──────────────────────────
export function GcufCard({ user }: { user: any }) {
  const isEmpty = (v: any) => !v || String(v).trim() === "";

  return (
    <div
      id="student-card-printable"
      style={{
        width: "340px",
        height: "213px",
        borderRadius: "12px",
        overflow: "hidden",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
        position: "relative",
        background: "#fff",
        flexShrink: 0,
        userSelect: "none",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* ── Header Band ─────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #c0392b 0%, #922b21 60%, #7b241c 100%)",
          padding: "8px 12px 24px",
          position: "relative",
          minHeight: "72px",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: "absolute",
            bottom: "-28px",
            left: "-16px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                color: "#fff",
                fontWeight: 800,
                fontSize: "11.5px",
                lineHeight: 1.2,
                letterSpacing: "0.02em",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              Global College
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                fontSize: "9px",
                marginTop: "1px",
                letterSpacing: "0.04em",
              }}
            >
              Learning Management System
            </div>
          </div>

          {/* Shield / Logo area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: "2px solid rgba(255,255,255,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GraduationCap size={16} color="#fff" />
            </div>
            <div
              style={{
                color: "#fff",
                fontSize: "8px",
                fontWeight: 700,
                fontStyle: "italic",
                textDecoration: "underline",
                letterSpacing: "0.04em",
              }}
            >
              Student Card
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "8px 12px 8px",
          display: "flex",
          gap: "10px",
          position: "relative",
          zIndex: 1,
          height: "calc(100% - 72px)",
        }}
      >
        {/* Watermark crest */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            opacity: 0.05,
            fontSize: "64px",
          }}
        >
          🎓
        </div>

        {/* Left column: details */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "3px" }}>
          <div style={{ fontWeight: 800, fontSize: "12px", color: "#1a1a1a", lineHeight: 1.2 }}>
            {user?.name?.toUpperCase() || "STUDENT NAME"}
          </div>
          {user?.nameUrdu && (
            <div style={{ fontSize: "9px", color: "#555", direction: "rtl", textAlign: "left" }}>
              {user.nameUrdu}
            </div>
          )}

          <div style={{ fontSize: "9.5px", color: "#333", marginTop: "1px" }}>
            {user?.qualification || user?.specialization || "Programme"}
          </div>

          {/* Session row */}
          {!isEmpty(user?.session) && (
            <div style={{ fontWeight: 700, fontSize: "9.5px", color: "#1a1a1a" }}>
              {user.session}
              {!isEmpty(user?.semesterTerm) ? ` - ${user.semesterTerm}` : ""}
              {!isEmpty(user?.shift) ? ` - ${user.shift}` : ""}
            </div>
          )}

          {/* Reg No */}
          {!isEmpty(user?.regNo) && (
            <div style={{ fontWeight: 700, fontSize: "9.5px", color: "#1a1a1a" }}>
              {user.regNo}
            </div>
          )}

          {/* Roll No */}
          {!isEmpty(user?.rollNo) && (
            <div style={{ fontSize: "9px", color: "#555" }}>
              Roll No: {user.rollNo}
            </div>
          )}

          {/* Department */}
          {!isEmpty(user?.department) && (
            <div style={{ fontSize: "9px", color: "#444", marginTop: "1px" }}>
              Department of {user.department}
            </div>
          )}

          {/* Father name */}
          {!isEmpty(user?.fatherName) && (
            <div style={{ fontSize: "8.5px", color: "#666" }}>
              S/O {user.fatherName}
            </div>
          )}
        </div>

        {/* Right column: photo + signature */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            width: "64px",
            flexShrink: 0,
          }}
        >
          {/* Photo box */}
          <div
            style={{
              width: "58px",
              height: "72px",
              border: "2px solid #c0392b",
              borderRadius: "4px",
              overflow: "hidden",
              background: "#e8eaf0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Student"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ color: "#aaa", fontSize: "24px" }}>👤</div>
            )}
          </div>

          {/* Signature line */}
          <div
            style={{
              borderTop: "1px solid #999",
              width: "100%",
              textAlign: "center",
              paddingTop: "2px",
            }}
          >
            <div style={{ fontSize: "7px", color: "#666" }}>Issuing Authority</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function StudentCard() {
  const { user, refreshUser } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Always fetch the latest data from the server when this page loads,
  // so admin-updated fields (roll no, reg no, etc.) are immediately visible.
  useEffect(() => {
    refreshUser();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Dynamically import html2canvas
      const { default: html2canvas } = await import("html2canvas");
      const el = document.getElementById("student-card-printable");
      if (!el) return;

      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `student-card-${user?.name?.replace(/\s+/g, "-") || "card"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const el = document.getElementById("student-card-printable");
    if (!el) return;
    const win = window.open("", "_blank", "width=500,height=400");
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Student Card</title>
        <style>
          html, body {
            color-scheme: light !important;
            background: #ffffff !important;
            margin: 0;
            padding: 0;
          }
          body { 
            margin: 20px; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
          }
          @media print { 
            body { 
              margin: 0; 
            } 
            #student-card-printable {
              box-shadow: none !important;
            }
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        ${el.outerHTML}
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const isEmpty = (v: any) => !v || String(v).trim() === "";
  const missingFields = [
    { label: "Registration No", missing: isEmpty(user?.regNo) },
    { label: "Roll No", missing: isEmpty(user?.rollNo) },
    { label: "Department", missing: isEmpty(user?.department) },
    { label: "Session", missing: isEmpty(user?.session) },
    { label: "Shift", missing: isEmpty(user?.shift) },
    { label: "Father's Name", missing: isEmpty(user?.fatherName) },
    { label: "Profile Photo", missing: isEmpty(user?.avatar) },
  ].filter((f) => f.missing);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <IdCard className="h-8 w-8 text-red-600" />
              Student Card
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Your official Global College student identification card.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2 border-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
            >
              <Download className="h-4 w-4" />
              {downloading ? "Generating…" : "Download PNG"}
            </Button>
          </div>
        </div>

        {/* Card Preview */}
        <Card className="border-2 border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-red-600 to-red-400" />
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-700">Card Preview</CardTitle>
            <CardDescription>This is how your student card will look when downloaded.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6 bg-slate-50 rounded-b-xl">
            <div ref={cardRef}>
              <GcufCard user={user} />
            </div>
          </CardContent>
        </Card>

        {/* Info & Missing Fields */}
        {missingFields.length > 0 && (
          <Card className="border-2 border-amber-100 bg-amber-50/60 rounded-2xl overflow-hidden">
            <CardContent className="p-5 flex gap-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-amber-800 text-sm">Complete your profile for a full card</p>
                <p className="text-xs text-amber-700 mt-1">
                  The following fields are missing. Contact your administrator to fill them in:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {missingFields.map((f) => (
                    <Badge key={f.label} className="bg-amber-200 text-amber-900 border-amber-300 text-xs">
                      {f.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full Student Details Panel */}
        <Card className="border-2 border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500" />
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: User, label: "Full Name", value: user?.name },
                { icon: User, label: "Name (Urdu)", value: user?.nameUrdu },
                { icon: User, label: "Father's Name", value: user?.fatherName },
                { icon: Hash, label: "Registration No", value: user?.regNo },
                { icon: Hash, label: "Roll No", value: user?.rollNo },
                { icon: Building2, label: "Department", value: user?.department },
                { icon: GraduationCap, label: "Programme", value: user?.qualification || user?.specialization },
                { icon: CalendarDays, label: "Session", value: user?.session },
                { icon: Clock, label: "Term / Semester", value: user?.semesterTerm },
                { icon: Clock, label: "Shift", value: user?.shift },
                { icon: Building2, label: "Branch", value: user?.branchName },
                { icon: User, label: "Gender", value: user?.gender },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Icon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5 break-words">
                      {value || <span className="text-slate-300 font-normal italic">Not provided</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
