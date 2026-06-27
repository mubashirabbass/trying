/**
 * exportStudentAttendance.ts
 * Professional Excel export for Student Attendance.
 * Generates custom multi-sheet workbooks with college branding,
 * summary dashboards, eligibility statuses, grid registers, and individual student logs.
 */
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Student {
  userId: number;
  name: string;
  email: string;
  rollNo?: string | null;
  regNo?: string | null;
}

export interface AttendanceRecord {
  userId: number;
  date?: string;
  status: "present" | "absent" | "late" | "leave";
  notes?: string | null;
}

export interface Course {
  id: number;
  title: string;
  minAttendancePercentage?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLEGE_NAME  = "Global College of Computer Science & Commerce";
const COLLEGE_SHORT = "GCCSC";

const C = {
  navy:      "1E3A8A",
  navyLight: "2563EB",
  navyFg:    "DBEAFE",
  present:   "D1FAE5",  // emerald-100
  absent:    "FEE2E2",  // red-100
  late:      "FEF3C7",  // amber-100
  leave:     "E0F2FE",  // sky-100
  presentTxt:"065F46",
  absentTxt: "991B1B",
  lateTxt:   "92400E",
  leaveTxt:  "0369A1",
  headerBg:  "1E40AF",  // blue-800
  headerFg:  "FFFFFF",
  altRow:    "F8FAFC",  // slate-50
  border:    "CBD5E1",  // slate-300
  darkBorder:"94A3B8",
  totalBg:   "EFF6FF",
  white:     "FFFFFF",
  black:     "0F172A",
  gray:      "64748B",
  lightGray: "F8FAFC",
  gold:      "D97706",
};

const STATUS_SHORT: Record<string, string> = {
  present:  "P",
  absent:   "A",
  late:     "L",
  leave:    "Lv",
};

const STATUS_FILL: Record<string, string> = {
  present:  C.present,
  absent:   C.absent,
  late:     C.late,
  leave:    C.leave,
};

const STATUS_TXT: Record<string, string> = {
  present:  C.presentTxt,
  absent:   C.absentTxt,
  late:     C.lateTxt,
  leave:    C.leaveTxt,
};

// ─── Styling Helpers ──────────────────────────────────────────────────────────

type CellStyle = Record<string, unknown>;

function cell(value: string | number | null | undefined, style: CellStyle = {}): XLSX.CellObject {
  return {
    v: value ?? "",
    t: typeof value === "number" ? "n" : "s",
    s: style,
  } as XLSX.CellObject;
}

function border(color = C.border, style: "thin" | "medium" = "thin") {
  return { style, color: { rgb: color } };
}

const allBorders = (col = C.border, style: "thin" | "medium" = "thin") => ({
  top:    border(col, style),
  bottom: border(col, style),
  left:   border(col, style),
  right:  border(col, style),
});

function fill(bgRgb: string): CellStyle {
  return { patternType: "solid", fgColor: { rgb: bgRgb } };
}

function collegeBannerCell(label: string): XLSX.CellObject {
  return cell(label, {
    font: { bold: true, sz: 18, color: { rgb: C.navyFg }, name: "Calibri" },
    fill: fill(C.navy),
    alignment: { horizontal: "center", vertical: "center" },
    border: allBorders(C.navyLight, "medium"),
  });
}

function subBannerCell(label: string): XLSX.CellObject {
  return cell(label, {
    font: { bold: false, sz: 11, color: { rgb: C.navyFg }, name: "Calibri" },
    fill: fill(C.navyLight),
    alignment: { horizontal: "center", vertical: "center" },
    border: allBorders(C.navyLight),
  });
}

function sectionLabelCell(label: string): XLSX.CellObject {
  return cell(label, {
    font: { bold: true, sz: 10, color: { rgb: C.white }, name: "Calibri" },
    fill: fill(C.gold),
    alignment: { horizontal: "left", vertical: "center" },
    border: allBorders(C.gold),
  });
}

function metaLabelCell(label: string): XLSX.CellObject {
  return cell(label, {
    font: { bold: true, sz: 10, color: { rgb: C.navy }, name: "Calibri" },
    fill: fill(C.navyFg),
    alignment: { horizontal: "left", vertical: "center" },
    border: allBorders(C.border),
  });
}

function metaValueCell(value: string): XLSX.CellObject {
  return cell(value, {
    font: { bold: false, sz: 10, color: { rgb: C.black }, name: "Calibri" },
    fill: fill(C.white),
    alignment: { horizontal: "left", vertical: "center" },
    border: allBorders(C.border),
  });
}

function tableHeaderCell(label: string): XLSX.CellObject {
  return cell(label, {
    font: { bold: true, sz: 10, color: { rgb: C.white }, name: "Calibri" },
    fill: fill(C.headerBg),
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: allBorders(C.navyLight),
  });
}

function dataCell(
  value: string | number | null | undefined,
  align: "left" | "center" | "right" = "center",
  bold = false,
  bg?: string,
  fg = C.black,
  alt = false
): XLSX.CellObject {
  return cell(value, {
    font: { bold, sz: 10, color: { rgb: fg }, name: "Calibri" },
    fill: fill(bg ?? (alt ? C.altRow : C.white)),
    alignment: { horizontal: align, vertical: "center", wrapText: true },
    border: allBorders(C.border),
  });
}

const STATUS_LABEL: Record<string, string> = {
  present:  "Present",
  absent:   "Absent",
  late:     "Late",
  leave:    "Leave",
};

function statusCell(status: string, alt = false): XLSX.CellObject {
  const bg  = STATUS_FILL[status] ?? C.white;
  const fg  = STATUS_TXT[status]  ?? C.gray;
  const lbl = STATUS_LABEL[status] ?? status;
  return cell(lbl, {
    font: { bold: true, sz: 10, color: { rgb: fg }, name: "Calibri" },
    fill: fill(alt ? bg : bg),
    alignment: { horizontal: "center", vertical: "center" },
    border: allBorders(C.border),
  });
}

function emptyCell(bg = C.white): XLSX.CellObject {
  return cell("", { fill: fill(bg), border: allBorders(C.white) });
}

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename, { compression: true });
}

// ─── Sheet Helpers ───────────────────────────────────────────────────────────

function setCell(ws: XLSX.WorkSheet, r: number, c: number, cellObj: XLSX.CellObject) {
  const ref = XLSX.utils.encode_cell({ r, c });
  ws[ref] = cellObj;
}

function mergeRange(ws: XLSX.WorkSheet, r1: number, c1: number, r2: number, c2: number) {
  if (!ws["!merges"]) ws["!merges"] = [];
  ws["!merges"].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map(w => ({ wch: w }));
}

function setRowHeights(ws: XLSX.WorkSheet, heights: Record<number, number>) {
  if (!ws["!rows"]) ws["!rows"] = [];
  Object.entries(heights).forEach(([row, hpt]) => {
    const r = Number(row);
    while ((ws["!rows"] as XLSX.RowInfo[]).length <= r) (ws["!rows"] as XLSX.RowInfo[]).push({});
    (ws["!rows"] as XLSX.RowInfo[])[r] = { hpt };
  });
}

function pct(num: number, denom: number) {
  if (denom === 0) return "0%";
  return `${Math.round((num / denom) * 105) > 100 ? 100 : Math.round((num / denom) * 100)}%`;
}

// ─── Build Student Attendance Stats ──────────────────────────────────────────

interface StudentStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  percentage: number;
}

function computeStudentStats(records: AttendanceRecord[], userId: number): StudentStats {
  const tRecs = records.filter(r => r.userId === userId);
  const stats = { total: 0, present: 0, absent: 0, late: 0, leave: 0 };
  tRecs.forEach(r => {
    stats.total++;
    if (r.status === "present") stats.present++;
    if (r.status === "absent") stats.absent++;
    if (r.status === "late") stats.late++;
    if (r.status === "leave") stats.leave++;
  });
  const attended = stats.present + stats.late;
  const percentage = stats.total > 0 ? Math.round((attended / stats.total) * 100) : 0;
  return { ...stats, percentage };
}

// ─── Sheet 1: Master Summary Dashboard ────────────────────────────────────────

function buildSummarySheet(
  course: Course,
  students: Student[],
  records: AttendanceRecord[]
): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const minAttendance = course.minAttendancePercentage ?? 75;

  setColWidths(ws, [5, 14, 25, 30, 11, 10, 10, 10, 10, 13, 14]);

  let r = 0;

  // Header banner
  for (let c = 0; c < 11; c++) setCell(ws, r, c, collegeBannerCell(COLLEGE_NAME));
  mergeRange(ws, r, 0, r, 10);
  r++;

  const sub = `STUDENT ATTENDANCE SUMMARY  ·  ${course.title.toUpperCase()}`;
  for (let c = 0; c < 11; c++) setCell(ws, r, c, subBannerCell(sub));
  mergeRange(ws, r, 0, r, 10);
  r++;

  for (let c = 0; c < 11; c++) setCell(ws, r, c, emptyCell(C.navyFg));
  mergeRange(ws, r, 0, r, 10);
  r++;

  // Metadata block
  const metas = [
    ["Academic Course", course.title],
    ["Required Minimum", `${minAttendance}% Attendance`],
    ["Total Students", `${students.length} Enrolled`],
    ["Generated On", new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })],
  ];
  for (const [lbl, val] of metas) {
    setCell(ws, r, 0, metaLabelCell(lbl));
    mergeRange(ws, r, 0, r, 1);
    setCell(ws, r, 2, metaValueCell(val));
    mergeRange(ws, r, 2, r, 10);
    for (let c = 3; c < 11; c++) setCell(ws, r, c, emptyCell(C.white));
    r++;
  }

  // Spacer
  for (let c = 0; c < 11; c++) setCell(ws, r, c, emptyCell(C.white));
  mergeRange(ws, r, 0, r, 10);
  r++;

  // Section heading
  for (let c = 0; c < 11; c++) setCell(ws, r, c, sectionLabelCell("  STUDENT ROSTER OVERVIEW"));
  mergeRange(ws, r, 0, r, 10);
  r++;

  // Table header
  const headers = [
    "#", "Student ID", "Student Name", "Email Address",
    "Sessions", "Present", "Absent", "Late", "Leave",
    "Attendance %", "Eligibility Status"
  ];
  headers.forEach((h, i) => setCell(ws, r, i, tableHeaderCell(h)));
  r++;

  let sumSessions = 0, sumPresent = 0, sumAbsent = 0, sumLate = 0, sumLeave = 0;

  // Student rows
  students.forEach((student, idx) => {
    const st = computeStudentStats(records, student.userId);
    const isAlt = idx % 2 === 1;

    sumSessions += st.total;
    sumPresent  += st.present;
    sumAbsent   += st.absent;
    sumLate     += st.late;
    sumLeave    += st.leave;

    const rate = pct(st.present + st.late, st.total);
    const isEligible = st.total === 0 || st.percentage >= minAttendance;
    const statusLabel = isEligible ? "Eligible" : "Restricted";
    const statusBg = isEligible ? C.present : C.absent;
    const statusFg = isEligible ? C.presentTxt : C.absentTxt;

    const studentIdStr = student.rollNo ?? `GC-${String(student.userId).padStart(2, "0")}`;
    const studentRegStr = student.regNo  ?? "—";

    setCell(ws, r, 0,  dataCell(idx + 1,      "center", false, undefined, undefined, isAlt));
    setCell(ws, r, 1,  dataCell(studentIdStr, "center", true,  undefined, undefined, isAlt));
    setCell(ws, r, 2,  dataCell(student.name, "left",   true,  undefined, undefined, isAlt));
    setCell(ws, r, 3,  dataCell(student.email,"left",   false, undefined, undefined, isAlt));
    setCell(ws, r, 4,  dataCell(st.total,     "center", false, undefined, undefined, isAlt));
    setCell(ws, r, 5,  dataCell(st.present,   "center", false, st.present > 0 ? C.present : undefined, st.present > 0 ? C.presentTxt : C.black, isAlt));
    setCell(ws, r, 6,  dataCell(st.absent,    "center", false, st.absent > 0 ? C.absent : undefined, st.absent > 0 ? C.absentTxt : C.black, isAlt));
    setCell(ws, r, 7,  dataCell(st.late,      "center", false, st.late > 0 ? C.late : undefined, st.late > 0 ? C.lateTxt : C.black, isAlt));
    setCell(ws, r, 8,  dataCell(st.leave,     "center", false, st.leave > 0 ? C.leave : undefined, st.leave > 0 ? C.leaveTxt : C.black, isAlt));
    setCell(ws, r, 9,  dataCell(rate,         "center", true,  undefined, undefined, isAlt));
    setCell(ws, r, 10, cell(statusLabel, {
      font: { bold: true, sz: 10, color: { rgb: statusFg }, name: "Calibri" },
      fill: fill(statusBg),
      alignment: { horizontal: "center", vertical: "center" },
      border: allBorders(C.border)
    }));
    r++;
  });

  // Grand totals footer
  const overallRate = pct(sumPresent + sumLate, sumSessions);
  const footerValues: (string | number)[] = [
    "", "TOTALS", "", "", sumSessions, sumPresent, sumAbsent, sumLate, sumLeave, overallRate, ""
  ];
  footerValues.forEach((val, i) => {
    setCell(ws, r, i, cell(val, {
      font: { bold: true, sz: 10, color: { rgb: C.white }, name: "Calibri" },
      fill: fill(C.navy),
      alignment: { horizontal: i === 1 ? "left" : "center", vertical: "center" },
      border: allBorders(C.navyLight),
    }));
  });
  r++;

  // Footer notes spacing
  for (let c = 0; c < 11; c++) setCell(ws, r, c, emptyCell(C.white));
  mergeRange(ws, r, 0, r, 10);
  r++;

  const footerNotes = `This roster is managed by ${COLLEGE_NAME} — Verified Student Registry`;
  for (let c = 0; c < 11; c++) {
    setCell(ws, r, c, cell(c === 0 ? footerNotes : "", {
      font: { italic: true, sz: 9, color: { rgb: C.gray }, name: "Calibri" },
      fill: fill(C.lightGray),
      alignment: { horizontal: "left", vertical: "center" }
    }));
  }
  mergeRange(ws, r, 0, r, 10);

  setRowHeights(ws, { 0: 42, 1: 24, 2: 8 });
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r, c: 10 } });

  return ws;
}

// ─── Sheet 2: Master Attendance Sheet (Matrix Grid) ─────────────────────────

function buildMatrixSheet(
  course: Course,
  students: Student[],
  records: AttendanceRecord[],
  uniqueDates: string[]
): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const dates = [...uniqueDates].sort((a, b) => a.localeCompare(b));

  // Determine column widths dynamically based on grid size
  const widths = [5, 14, 25, 12]; // #, ID, Name, Cumulative %
  for (let i = 0; i < dates.length; i++) {
    widths.push(10); // Date columns width
  }
  setColWidths(ws, widths);

  let r = 0;
  const colCount = 4 + dates.length;

  // College Banner
  for (let c = 0; c < colCount; c++) setCell(ws, r, c, collegeBannerCell(COLLEGE_NAME));
  mergeRange(ws, r, 0, r, colCount - 1);
  r++;

  const sub = `MASTER ATTENDANCE SHEET GRID  ·  ${course.title.toUpperCase()}`;
  for (let c = 0; c < colCount; c++) setCell(ws, r, c, subBannerCell(sub));
  mergeRange(ws, r, 0, r, colCount - 1);
  r++;

  // Spacer
  for (let c = 0; c < colCount; c++) setCell(ws, r, c, emptyCell(C.white));
  mergeRange(ws, r, 0, r, colCount - 1);
  r++;

  // Table Headers
  const gridHeaders = ["#", "Student ID", "Student Name", "Attend. %"];
  dates.forEach(d => {
    try {
      const parts = d.split("-");
      gridHeaders.push(`${parts[1]}/${parts[2]}`); // Short MM/DD header format
    } catch {
      gridHeaders.push(d);
    }
  });

  gridHeaders.forEach((h, i) => setCell(ws, r, i, tableHeaderCell(h)));
  r++;

  // Build matrix lookup maps
  const recordMap = new Map<string, string>();
  records.forEach(rec => {
    if (rec.date) {
      recordMap.set(`${rec.userId}_${rec.date}`, rec.status);
    }
  });

  // Student rows
  students.forEach((student, idx) => {
    const isAlt = idx % 2 === 1;
    const stats = computeStudentStats(records, student.userId);
    const rateStr = stats.total > 0 ? `${stats.percentage}%` : "-";
    const studentIdStr = student.rollNo ?? `GC-${String(student.userId).padStart(2, "0")}`;

    setCell(ws, r, 0, dataCell(idx + 1,      "center", false, undefined, undefined, isAlt));
    setCell(ws, r, 1, dataCell(studentIdStr, "center", true,  undefined, undefined, isAlt));
    setCell(ws, r, 2, dataCell(student.name, "left",   true,  undefined, undefined, isAlt));
    setCell(ws, r, 3, dataCell(rateStr,      "center", true,  undefined, undefined, isAlt));

    // Date cells
    dates.forEach((dateStr, dIdx) => {
      const status = recordMap.get(`${student.userId}_${dateStr}`);
      const cIdx = 4 + dIdx;

      if (!status) {
        setCell(ws, r, cIdx, dataCell("—", "center", false, undefined, C.gray, isAlt));
      } else {
        const bg = STATUS_FILL[status] ?? C.white;
        const fg = STATUS_TXT[status] ?? C.black;
        const short = STATUS_SHORT[status] ?? status;

        setCell(ws, r, cIdx, cell(short, {
          font: { bold: true, sz: 10, color: { rgb: fg }, name: "Calibri" },
          fill: fill(bg),
          alignment: { horizontal: "center", vertical: "center" },
          border: allBorders(C.border)
        }));
      }
    });

    r++;
  });

  // Footer notes block
  for (let c = 0; c < colCount; c++) setCell(ws, r, c, emptyCell(C.white));
  mergeRange(ws, r, 0, r, colCount - 1);
  r++;

  const footerText = "Status Legend: P = Present | A = Absent | L = Late | Lv = Leave  ·  GC-ST System Database";
  for (let c = 0; c < colCount; c++) {
    setCell(ws, r, c, cell(c === 0 ? footerText : "", {
      font: { italic: true, sz: 9, color: { rgb: C.gray }, name: "Calibri" },
      fill: fill(C.lightGray),
      alignment: { horizontal: "left", vertical: "center" }
    }));
  }
  mergeRange(ws, r, 0, r, colCount - 1);

  setRowHeights(ws, { 0: 42, 1: 24 });
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r, c: colCount - 1 } });

  return ws;
}

// ─── Sheet 3: Individual Student Sheet ───────────────────────────────────────

function buildStudentSheet(
  course: Course,
  student: Student,
  records: AttendanceRecord[]
): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const tRecs = records.filter(r => r.userId === student.userId);
  const sorted = [...tRecs].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const stats = computeStudentStats(records, student.userId);
  const minAttendance = course.minAttendancePercentage ?? 75;

  setColWidths(ws, [5, 18, 12, 12, 35]);

  let r = 0;

  // College Banner
  for (let c = 0; c < 5; c++) setCell(ws, r, c, collegeBannerCell(COLLEGE_NAME));
  mergeRange(ws, r, 0, r, 4);
  r++;

  const sub = `INDIVIDUAL ATTENDANCE FILE  ·  ${course.title.toUpperCase()}`;
  for (let c = 0; c < 5; c++) setCell(ws, r, c, subBannerCell(sub));
  mergeRange(ws, r, 0, r, 4);
  r++;

  // Metadata Card
  const metas = [
    ["Student Name",    student.name],
    ["Roll No",         student.rollNo ?? "Not Assigned"],
    ["Registration No", student.regNo  ?? "Not Assigned"],
    ["Student Email",   student.email],
    ["Course Title",    course.title],
    ["Minimum Target",  `${minAttendance}% Attendance`],
  ];
  for (const [lbl, val] of metas) {
    setCell(ws, r, 0, metaLabelCell(lbl));
    mergeRange(ws, r, 0, r, 1);
    setCell(ws, r, 2, metaValueCell(val));
    mergeRange(ws, r, 2, r, 4);
    for (let c = 3; c < 5; c++) setCell(ws, r, c, emptyCell(C.white));
    r++;
  }

  // Spacer
  for (let c = 0; c < 5; c++) setCell(ws, r, c, emptyCell(C.white));
  mergeRange(ws, r, 0, r, 4);
  r++;

  // Summary Metrics Section
  for (let c = 0; c < 5; c++) setCell(ws, r, c, sectionLabelCell("  METRIC DASHBOARD"));
  mergeRange(ws, r, 0, r, 4);
  r++;

  const metricHeaders = ["Total Sessions", "Present Days", "Absent Days", "Attendance Rate", "Eligibility"];
  metricHeaders.forEach((h, i) => {
    let bg = C.totalBg;
    let fg = C.navy;
    if (h === "Present Days") { bg = C.present; fg = C.presentTxt; }
    if (h === "Absent Days") { bg = C.absent; fg = C.absentTxt; }
    if (h === "Attendance Rate" || h === "Eligibility") { bg = C.navy; fg = C.white; }
    setCell(ws, r, i, cell(h, {
      font: { bold: true, sz: 10, color: { rgb: fg }, name: "Calibri" },
      fill: fill(bg),
      alignment: { horizontal: "center", vertical: "center" },
      border: allBorders(C.border)
    }));
  });
  r++;

  // Values row
  const attendRate = pct(stats.present + stats.late, stats.total);
  const isEligible = stats.total === 0 || stats.percentage >= minAttendance;
  const statusLabel = isEligible ? "ELIGIBLE" : "RESTRICTED";
  const statusBg = isEligible ? C.present : C.absent;
  const statusFg = isEligible ? C.presentTxt : C.absentTxt;

  const metricVals = [stats.total, stats.present + stats.late, stats.absent, attendRate, statusLabel];
  metricVals.forEach((v, i) => {
    let bg = C.white;
    let fg = C.black;
    if (i === 1) { bg = C.present; fg = C.presentTxt; }
    if (i === 2) { bg = C.absent; fg = C.absentTxt; }
    if (i === 3) { bg = C.navyFg; fg = C.navy; }
    if (i === 4) { bg = statusBg; fg = statusFg; }

    setCell(ws, r, i, cell(v, {
      font: { bold: true, sz: 11, color: { rgb: fg }, name: "Calibri" },
      fill: fill(bg),
      alignment: { horizontal: "center", vertical: "center" },
      border: allBorders(C.border)
    }));
  });
  r++;

  // Spacer
  for (let c = 0; c < 5; c++) setCell(ws, r, c, emptyCell(C.white));
  mergeRange(ws, r, 0, r, 4);
  r++;

  // Session Register Title
  for (let c = 0; c < 5; c++) setCell(ws, r, c, sectionLabelCell("  SESSION REGISTRATION RECORD"));
  mergeRange(ws, r, 0, r, 4);
  r++;

  // Table header
  const registerHeaders = ["#", "Session Date", "Day Name", "Status", "Notes / Lesson Notes"];
  registerHeaders.forEach((h, i) => setCell(ws, r, i, tableHeaderCell(h)));
  r++;

  // Daily records
  sorted.forEach((rec, idx) => {
    const isAlt = idx % 2 === 1;
    const d = new Date(rec.date ?? "");
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });

    setCell(ws, r, 0, dataCell(idx + 1,      "center", false, undefined, undefined, isAlt));
    setCell(ws, r, 1, dataCell(rec.date ?? "—", "center", false, undefined, undefined, isAlt));
    setCell(ws, r, 2, dataCell(dayName,       "left",   false, undefined, undefined, isAlt));
    setCell(ws, r, 3, statusCell(rec.status, isAlt));
    setCell(ws, r, 4, dataCell(rec.notes ?? "—", "left",   false, undefined, undefined, isAlt));
    r++;
  });

  // Footer notes block
  for (let c = 0; c < 5; c++) setCell(ws, r, c, emptyCell(C.white));
  mergeRange(ws, r, 0, r, 4);
  r++;

  const footnote = `Generated for student profile record - ${COLLEGE_SHORT} Registry Office`;
  for (let c = 0; c < 5; c++) {
    setCell(ws, r, c, cell(c === 0 ? footnote : "", {
      font: { italic: true, sz: 9, color: { rgb: C.gray }, name: "Calibri" },
      fill: fill(C.lightGray),
      alignment: { horizontal: "left", vertical: "center" }
    }));
  }
  mergeRange(ws, r, 0, r, 4);

  setRowHeights(ws, { 0: 42, 1: 24 });
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r, c: 4 } });

  return ws;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Exports a comprehensive Student Attendance Workbook containing:
 *  - Sheet 1: Roster Dashboard (Overview, Attendance Rate %, Eligibility)
 *  - Sheet 2: Matrix Grid (P, A, L, Lv calendar sheet)
 *  - Sheet 3+: Dynamic sheets for each individual student
 */
export function exportStudentAttendanceWorkbook(
  course: Course,
  students: Student[],
  records: AttendanceRecord[],
  uniqueDates: string[]
) {
  const wb = XLSX.utils.book_new();
  const filePeriod = new Date().toISOString().split("T")[0];

  // Sheet 1: Master Summary Dashboard
  XLSX.utils.book_append_sheet(wb, buildSummarySheet(course, students, records), "Dashboard Overview");

  // Sheet 2: Master Attendance Sheet Grid (Matrix)
  XLSX.utils.book_append_sheet(wb, buildMatrixSheet(course, students, records, uniqueDates), "Attendance Grid");

  // Sheets 3+: Individual Student Files (limit to first 100 students to avoid workbook bloat if needed)
  const slicedStudents = students.slice(0, 100);
  slicedStudents.forEach(student => {
    const studentSheet = buildStudentSheet(course, student, records);
    // Limit sheet names to 31 chars
    const sheetName = student.name.substring(0, 28).replace(/[\\/*?[\]]/g, "_");
    XLSX.utils.book_append_sheet(wb, studentSheet, sheetName);
  });

  const safeTitle = course.title.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/ /g, "_");
  downloadWorkbook(wb, `Student_Attendance_${safeTitle}_${filePeriod}.xlsx`);
}

/**
 * Exports a single student's attendance register for the course.
 */
export function exportSingleStudentWorkbook(
  course: Course,
  student: Student,
  records: AttendanceRecord[]
) {
  const wb = XLSX.utils.book_new();
  const filePeriod = new Date().toISOString().split("T")[0];
  const sheetName = student.name.substring(0, 28).replace(/[\\/*?[\]]/g, "_");

  XLSX.utils.book_append_sheet(wb, buildStudentSheet(course, student, records), sheetName);

  const safeTitle = course.title.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/ /g, "_");
  const safeName = student.name.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/ /g, "_");
  downloadWorkbook(wb, `${safeName}_${safeTitle}_Attendance_${filePeriod}.xlsx`);
}
