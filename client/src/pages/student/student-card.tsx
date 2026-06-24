import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
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
  Home,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  ChevronRight,
  Sparkles,
  Loader2,
} from "lucide-react";

const BASE = window.location.origin;

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

export default function StudentCard() {
  const { user, refreshUser, token } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [noticeSettings, setNoticeSettings] = useState({
    enabled: true,
    text: "Important Note: Attendance criteria for Spring, 2026 is 75%.",
  });

  // Fetch notice settings
  useEffect(() => {
    const fetchNoticeSettings = async () => {
      try {
        const response = await fetch(`${BASE}/api/settings`);
        if (response.ok) {
          const settings = await response.json();
          const enabled = settings.find((s: any) => s.key === "student_notice_enabled")?.value === "true";
          const text = settings.find((s: any) => s.key === "student_notice_text")?.value || "Important Note: Attendance criteria for Spring, 2026 is 75%.";
          setNoticeSettings({ enabled, text });
        }
      } catch (error) {
        console.error("Failed to fetch notice settings:", error);
      }
    };

    fetchNoticeSettings();
  }, []);

  // Fetch enrollments
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user?.id || !token) return;
      
      setLoadingEnrollments(true);
      try {
        const response = await fetch(`${BASE}/api/enrollments?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setEnrollments(data);
        }
      } catch (error) {
        console.error("Failed to fetch enrollments:", error);
      } finally {
        setLoadingEnrollments(false);
      }
    };

    fetchEnrollments();
  }, [user?.id, token]);

  // Always fetch the latest data from the server when this page loads,
  // so admin-updated fields (roll no, reg no, etc.) are immediately visible.
  useEffect(() => {
    refreshUser();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
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

  const formatDob = (dobString: any) => {
    if (!dobString) return "Not provided";
    try {
      const d = new Date(dobString);
      if (isNaN(d.getTime())) return dobString;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dobString;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Breadcrumb style navigation header */}
        <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold px-1">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors cursor-pointer">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline text-xs font-bold">Home</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="text-slate-800 font-bold">Profile</span>
        </div>

        {/* Welcome Notice alert */}
        <div className="bg-[#d9edf7] border border-[#bce8f1] text-[#31708f] rounded-lg p-4 text-sm font-semibold leading-relaxed shadow-sm">
          Welcome to the Global College Student Portal! Here, you can access detailed information about your enrolled degree, including course schedules, academic progress, and more.
        </div>

        {/* Attendance criteria red warning alert with marquee ticker */}
        {noticeSettings.enabled && (
          <div className="bg-[#c0392b] text-white rounded-lg overflow-hidden shadow-md flex items-center h-10">
            <span className="bg-[#922b21] px-4 h-full flex items-center text-xs font-black uppercase tracking-widest shrink-0 border-r border-[#7b241c]">
              📢 Notice
            </span>
            <div className="flex-1 overflow-hidden relative">
              <style>{`
                @keyframes marquee-scroll {
                  0%   { transform: translateX(100%); }
                  100% { transform: translateX(-100%); }
                }
                .marquee-text {
                  display: inline-block;
                  white-space: nowrap;
                  animation: marquee-scroll 18s linear infinite;
                }
              `}</style>
              <span className="marquee-text text-xs sm:text-sm font-bold">
                {noticeSettings.text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{noticeSettings.text}
              </span>
            </div>
          </div>
        )}

        {/* Main responsive grid columns layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Student Profile Details Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              
              {/* College brick architecture arches illustration */}
              <div className="h-28 sm:h-32 bg-gradient-to-r from-[#dfd2c0] to-[#c7b299] relative overflow-hidden">
                <svg className="absolute inset-0 w-full h-full opacity-20 text-slate-900" viewBox="0 0 500 150" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                  <path d="M 0,150 L 0,80 Q 20,60 40,80 L 40,150" fill="currentColor" />
                  <path d="M 60,150 L 60,70 Q 90,40 120,70 L 120,150" fill="currentColor" />
                  <path d="M 140,150 L 140,60 Q 180,20 220,60 L 220,150" fill="currentColor" />
                  <path d="M 240,150 L 240,70 Q 270,40 300,70 L 300,150" fill="currentColor" />
                  <path d="M 320,150 L 320,80 Q 340,60 360,80 L 360,150" fill="currentColor" />
                  <path d="M 380,150 L 380,50 Q 430,0 480,50 L 480,150" fill="currentColor" />
                </svg>
              </div>

              {/* Identity Header & Avatar Overlap */}
              <div className="px-6 pb-6 relative">
                
                {/* Photo box matching passport style blue bg and thick white border */}
                <div className="absolute -top-14 sm:-top-16 left-6 h-24 w-20 sm:h-28 sm:w-24 border-[3px] border-white rounded-lg overflow-hidden shadow-lg bg-[#d9e8fb] flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Student Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-[#31708f]" />
                  )}
                </div>

                {/* Name & Father Name aligned to the right of avatar */}
                <div className="pl-28 sm:pl-32 pt-3 min-h-[56px] flex flex-col justify-center">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                      {user?.name?.toUpperCase() || "STUDENT NAME"}
                    </h2>
                    {user?.nameUrdu && (
                      <span className="text-base sm:text-lg font-bold text-slate-600 font-urdu" dir="rtl">
                        ({user.nameUrdu})
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5">
                    S/O {user?.fatherName || "FATHER'S NAME"}
                  </p>
                </div>

                {/* Structured detailed profile information table/grid */}
                <div className="mt-8 border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-150 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-150">
                    <div className="p-3.5 flex items-center gap-3 bg-slate-50/50">
                      <CreditCard className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CNIC / ID No</div>
                        <div className="font-semibold text-slate-700 mt-0.5">{user?.cnic || "Not provided"}</div>
                      </div>
                    </div>
                    <div className="p-3.5 flex items-center gap-3 bg-slate-50/50">
                      <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</div>
                        <div className="font-semibold text-slate-700 mt-0.5 break-all">{user?.email || "Not provided"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-150">
                    <div className="p-3.5 flex items-center gap-3 bg-slate-50/50">
                      <User className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</div>
                        <div className="font-semibold text-slate-700 mt-0.5">{user?.gender || "Not provided"}</div>
                      </div>
                    </div>
                    <div className="p-3.5 flex items-center gap-3 bg-slate-50/50">
                      <CalendarDays className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</div>
                        <div className="font-semibold text-slate-700 mt-0.5">{formatDob(user?.dob)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-150">
                    <div className="p-3.5 flex items-center gap-3 bg-slate-50/50">
                      <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone / Mobile</div>
                        <div className="font-semibold text-slate-700 mt-0.5">{user?.phone || "Not provided"}</div>
                      </div>
                    </div>
                    <div className="p-3.5 flex items-center gap-3 bg-slate-50/50">
                      <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City / Campus</div>
                        <div className="font-semibold text-slate-700 mt-0.5">{user?.branchName || "Not provided"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 flex items-start gap-3 bg-slate-50/50">
                    <Home className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Home Address</div>
                      <div className="font-semibold text-slate-700 mt-0.5 leading-relaxed">{user?.address || "Not provided"}</div>
                    </div>
                  </div>
                </div>

                {/* Edit Profile Action Link Button */}
                <div className="mt-6">
                  <Link href="/dashboard/profile">
                    <Button className="w-full bg-[#5cb85c] hover:bg-[#4cae4c] border-none text-white font-bold h-11 rounded-xl shadow-sm hover:shadow transition-all duration-200 gap-2">
                      <FileText className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Profile incomplete warning alert box */}
            {missingFields.length > 0 && (
              <Card className="border border-amber-200 bg-amber-50/60 rounded-2xl overflow-hidden shadow-sm">
                <CardContent className="p-5 flex gap-3">
                  <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-amber-800 text-sm">Complete your profile for a full card</p>
                    <p className="text-xs text-amber-700 mt-1">
                      The following registration fields are missing. Contact your administrator to populate them:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {missingFields.map((f) => (
                        <Badge key={f.label} className="bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-200 text-xs font-semibold px-2 py-0.5">
                          {f.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Enrollment Programs & Registration Card Preview */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Degree Course Card */}
            <Card className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
              <div className="bg-[#dff0d8] border-b border-[#d6e9c6] text-[#3c763d] px-5 py-3 font-bold text-xs uppercase tracking-wider leading-relaxed">
                Courses You Are Enrolled In at Global College of Computer Science & Commerce
              </div>
              <CardContent className="p-5 space-y-6">
                {loadingEnrollments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : enrollments.length > 0 ? (
                  enrollments.map((enrollment, index) => (
                    <div key={enrollment.id} className={index > 0 ? "border-t border-slate-200 pt-6" : ""}>
                      <div className="flex gap-4 items-start">
                        <div className="h-12 w-12 rounded-full bg-[#337ab7]/10 flex items-center justify-center text-[#337ab7] shrink-0 shadow-inner">
                          <GraduationCap className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <h3 className="font-black text-slate-800 text-lg leading-tight">
                            {enrollment.courseName || `Course #${enrollment.courseId}`}
                          </h3>
                          <div className="text-xs text-slate-500 space-y-1 mt-2.5 font-semibold">
                            <div>
                              <span className="font-bold text-slate-400 uppercase tracking-wide">Session:</span>{" "}
                              <span className="text-slate-700 uppercase">
                                {user?.session || "2024-2028"}{user?.semesterTerm ? ` | ${user.semesterTerm}` : ""}{user?.shift ? ` | ${user.shift}` : ""}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase tracking-wide">Roll No:</span>{" "}
                              <span className="text-slate-700 font-mono">{user?.rollNo || "Not assigned"}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase tracking-wide">Reg No:</span>{" "}
                              <span className="text-slate-700 font-mono">{user?.regNo || "Not assigned"}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase tracking-wide">Progress:</span>{" "}
                              <span className="text-slate-700 font-mono">{enrollment.progress}%</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase tracking-wide">Status:</span>{" "}
                              <Badge className="ml-1 text-xs" variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                                {enrollment.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-4 items-start">
                    <div className="h-12 w-12 rounded-full bg-[#337ab7]/10 flex items-center justify-center text-[#337ab7] shrink-0 shadow-inner">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black text-slate-800 text-lg leading-tight">
                        {user?.qualification || user?.specialization || "No Courses Enrolled"}
                      </h3>
                      <div className="text-xs text-slate-500 space-y-1 mt-2.5 font-semibold">
                        <div>
                          <span className="font-bold text-slate-400 uppercase tracking-wide">Session:</span>{" "}
                          <span className="text-slate-700 uppercase">
                            {user?.session || "2024-2028"}{user?.semesterTerm ? ` | ${user.semesterTerm}` : ""}{user?.shift ? ` | ${user.shift}` : ""}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 uppercase tracking-wide">Roll No:</span>{" "}
                          <span className="text-slate-700 font-mono">{user?.rollNo || "Not assigned"}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 uppercase tracking-wide">Reg No:</span>{" "}
                          <span className="text-slate-700 font-mono">{user?.regNo || "Not assigned"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Print Detail & Registration Card side-by-side action buttons */}
                <div className="flex gap-2 items-center pt-2">
                  <Link href="/dashboard/print-details" className="flex-1">
                    <Button
                      className="w-full bg-[#337ab7] hover:bg-[#286090] border-none text-white font-bold h-10 rounded-lg text-xs sm:text-sm shadow-sm gap-1.5 transition-colors duration-200"
                    >
                      <Printer className="h-4 w-4" />
                      Print Detail
                    </Button>
                  </Link>
                  <span className="text-slate-300 font-medium">-</span>
                  <Button
                    onClick={handlePrint}
                    className="flex-1 bg-[#5cb85c] hover:bg-[#4cae4c] border-none text-white font-bold h-10 rounded-lg text-xs sm:text-sm shadow-sm gap-1.5 transition-colors duration-200"
                  >
                    <IdCard className="h-4 w-4" />
                    Registration Card
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Registration Card Visual Preview card */}
            <Card className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
              <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-[#c0392b]" />
                  Registration Card Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6 bg-slate-50/10">
                
                {/* Embedded dynamic replica of GCUF Student Card */}
                <div className="scale-[0.88] sm:scale-100 origin-center transition-transform py-2">
                  <GcufCard user={user} />
                </div>
                
                {/* Print and PNG download buttons for the Student Card */}
                <div className="w-full flex gap-3 mt-6 border-t border-slate-100 pt-5">
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="flex-1 gap-2 border-2 hover:bg-slate-50 h-10 font-bold text-xs"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    Print Card
                  </Button>
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex-1 gap-2 bg-[#c0392b] hover:bg-[#922b21] border-none text-white font-bold h-10 text-xs shadow-md shadow-red-100/50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloading ? "Generating…" : "Download PNG"}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
