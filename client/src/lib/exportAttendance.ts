/**
 * exportAttendance.ts
 * Professional Excel export for the Teacher Attendance System.
 * Produces fully-styled workbooks with college branding, color-coded
 * status cells, bordered tables, summary dashboards, and per-teacher sheets.
 *
 * Uses SheetJS Community Edition (xlsx).
 */
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AttendanceHistoryRecord {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingHours: string | null;
  notes: string | null;
  leaveType: string | null;
  isApproved: boolean;
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLEGE_NAME  = "Global College of Computer Science & Commerce";
const COLLEGE_SHORT = "GCCSC";

/** Hex colour palette */
const C = {
  // Header / branding
  navy:      "1E3A8A",
  navyLight: "2563EB",
  navyFg:    "DBEAFE",
  // Status fills (light)
  present:   "D1FAE5",  // emerald-100
  absent:    "FEE2E2",  // red-100
  late:      "FEF3C7",  // amber-100
  halfDay:   "DBEAFE",  // blue-100
  leave:     "EDE9FE",  // violet-100
  weekend:   "F1F5F9",  // slate-100
  // Status text (dark)
  presentTxt:"065F46",
  absentTxt: "991B1B",
  lateTxt:   "92400E",
  halfTxt:   "1E40AF",
  leaveTxt:  "4C1D95",
  // Table
  headerBg:  "1E40AF",  // blue-800
  headerFg:  "FFFFFF",
  altRow:    "F8FAFC",  // slate-50
  border:    "CBD5E1",  // slate-300
  darkBorder:"94A3B8",  // slate-400
  // Summary card fills
  totalBg:   "EFF6FF",
  summaryBg: "F0FDF4",
  // Misc
  white:     "FFFFFF",
  black:     "0F172A",
  gray:      "64748B",
  lightGray: "F8FAFC",
  gold:      "D97706",  // amber-600
};

const STATUS_LABEL: Record<string, string> = {
  present:  "Present",
  absent:   "Absent",
  late:     "Late",
  half_day: "Half Day",
  leave:    "Leave",
  weekend:  "Weekend",
};

const STATUS_FILL: Record<string, string> = {
  present:  C.present,
  absent:   C.absent,
  late:     C.late,
  half_day: C.halfDay,
  leave:    C.leave,
  weekend:  C.weekend,
};

const STATUS_TXT: Record<string, string> = {
  present:  C.presentTxt,
  absent:   C.absentTxt,
  late:     C.lateTxt,
  half_day: C.halfTxt,
  leave:    C.leaveTxt,
  weekend:  C.gray,
};

// ─── Cell builder helpers ─────────────────────────────────────────────────────

type CellStyle = Record<string, unknown>;

function cell(
  value: string | number | null | undefined,
  style: CellStyle = {},
  type: "s" | "n" = typeof value === "number" ? "n" : "s"
): XLSX.CellObject {
  return { v: value ?? "", t: type, s: style } as XLSX.CellObject;
}

function border(color = C.border, style: "thin" | "medium" | "thick" = "thin") {
  return { style, color: { rgb: color } };
}

const allBorders = (col = C.border, style: "thin" | "medium" | "thick" = "thin") => ({
  top:    border(col, style),
  bottom: border(col, style),
  left:   border(col, style),
  right:  border(col, style),
});

const bottomBorder = (col = C.darkBorder) => ({
  bottom: border(col, "medium"),
});

/** Full-bleed solid fill style */
function fill(bgRgb: string): CellStyle {
  return { patternType: "solid", fgColor: { rgb: bgRgb } };
}

/** College banner cell – massive, centered */
function collegeBannerCell(label: string): XLSX.CellObject {
  return cell(label, {
    font: { bold: true, sz: 18, color: { rgb: C.navyFg }, name: "Calibri" },
    fill: fill(C.navy),
    alignment: { horizontal: "center", vertical: "center", wrapText: false },
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

function reportTitleCell(label: string): XLSX.CellObject {
  return cell(label, {
    font: { bold: true, sz: 14, color: { rgb: C.navy }, name: "Calibri" },
    fill: fill(C.navyFg),
    alignment: { horizontal: "center", vertical: "center" },
    border: { ...allBorders(C.navyLight, "medium"), bottom: border(C.navy, "medium") },
  });
}

function tableHeaderCell(label: string): XLSX.CellObject {
  return cell(label, {
    font: { bold: true, sz: 10, color: { rgb: C.headerFg }, name: "Calibri" },
    fill: fill(C.headerBg),
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: allBorders(C.navyLight, "thin"),
  });
}

function dataCell(
  value: string | number | null | undefined,
  options: {
    bold?: boolean;
    align?: "left" | "center" | "right";
    bg?: string;
    fg?: string;
    sz?: number;
    italic?: boolean;
    altRow?: boolean;
  } = {}
): XLSX.CellObject {
  const { bold = false, align = "center", bg, fg = C.black, sz = 10, italic = false, altRow: alt = false } = options;
  return cell(value, {
    font: { bold, sz, color: { rgb: fg }, italic, name: "Calibri" },
    fill: fill(bg ?? (alt ? C.altRow : C.white)),
    alignment: { horizontal: align, vertical: "center", wrapText: true },
    border: allBorders(C.border, "thin"),
  });
}

function statusCell(status: string, alt = false): XLSX.CellObject {
  const bg  = STATUS_FILL[status] ?? C.altRow;
  const fg  = STATUS_TXT[status]  ?? C.gray;
  const lbl = STATUS_LABEL[status] ?? status;
  return cell(lbl, {
    font: { bold: true, sz: 10, color: { rgb: fg }, name: "Calibri" },
    fill: fill(alt ? bg : bg),
    alignment: { horizontal: "center", vertical: "center" },
    border: allBorders(C.border, "thin"),
  });
}

function sectionLabelCell(label: string): XLSX.CellObject {
  return cell(label, {
    font: { bold: true, sz: 10, color: { rgb: C.white }, name: "Calibri" },
    fill: fill(C.gold),
    alignment: { horizontal: "left", vertical: "center" },
    border: { ...allBorders(C.gold), left: border(C.gold, "thick") },
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

function statLabelCell(label: string, bg: string, fg: string): XLSX.CellObject {
  return cell(label, {
    font: { bold: true, sz: 10, color: { rgb: fg }, name: "Calibri" },
    fill: fill(bg),
    alignment: { horizontal: "center", vertical: "center" },
    border: allBorders(C.border),
  });
}

function statValueCell(value: string | number, bg: string, fg: string, sz = 14): XLSX.CellObject {
  return cell(value, {
    font: { bold: true, sz, color: { rgb: fg }, name: "Calibri" },
    fill: fill(bg),
    alignment: { horizontal: "center", vertical: "center" },
    border: allBorders(C.border),
  });
}

function emptyCell(bg = C.white): XLSX.CellObject {
  return cell("", { fill: fill(bg), border: allBorders(C.white) });
}

// ─── Worksheet utilities ──────────────────────────────────────────────────────

function setCell(ws: XLSX.WorkSheet, row: number, col: number, c: XLSX.CellObject) {
  const ref = XLSX.utils.encode_cell({ r: row, c: col });
  ws[ref] = c;
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

function pct(num: number, denom: number): string {
  if (denom === 0) return "0%";
  return `${Math.round((num / denom) * 100)}%`;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
}

function monthName(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename, { compression: true });
}

// ─── Build attendance stats ───────────────────────────────────────────────────

interface Stats {
  total: number; present: number; absent: number;
  late: number; half_day: number; leave: number;
}

function buildStats(records: AttendanceHistoryRecord[]): Stats {
  return records.reduce(
    (acc, r) => {
      acc.total += 1;
      if (r.status in acc) (acc as Record<string, number>)[r.status] += 1;
      return acc;
    },
    { total: 0, present: 0, absent: 0, late: 0, half_day: 0, leave: 0 }
  );
}

// ─── Sheet 1: Per-teacher detailed daily log ──────────────────────────────────

function buildTeacherSheet(
  records: AttendanceHistoryRecord[],
  teacherName: string,
  teacherEmail: string,
  month: number,
  year: number
): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const period = monthName(month, year);
  const stats  = buildStats(records);
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  // Column widths: #, Date, Day, Status, Check-In, Check-Out, Hours, Notes, Leave
  setColWidths(ws, [5, 16, 12, 12, 11, 11, 10, 28, 14]);

  let r = 0;

  // ── Row 0: College banner (spans all 9 cols) ─────────────────────────────
  for (let c = 0; c < 9; c++) setCell(ws, r, c, collegeBannerCell(COLLEGE_NAME));
  mergeRange(ws, r, 0, r, 8);
  r++;

  // ── Row 1: Sub-banner ────────────────────────────────────────────────────
  const sub = `TEACHER ATTENDANCE REGISTER  ·  ${period}`;
  for (let c = 0; c < 9; c++) setCell(ws, r, c, subBannerCell(sub));
  mergeRange(ws, r, 0, r, 8);
  r++;

  // ── Row 2: Empty spacer ──────────────────────────────────────────────────
  for (let c = 0; c < 9; c++) setCell(ws, r, c, emptyCell(C.navyFg));
  mergeRange(ws, r, 0, r, 8);
  r++;

  // ── Rows 3-5: Meta info table (2 cols wide) ──────────────────────────────
  const metaRows: [string, string][] = [
    ["Teacher Name",   teacherName],
    ["Email Address",  teacherEmail],
    ["Report Period",  period],
    ["Generated On",   new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })],
    ["Prepared By",    `${COLLEGE_SHORT} Administration`],
  ];
  for (const [lbl, val] of metaRows) {
    setCell(ws, r, 0, metaLabelCell(lbl));
    mergeRange(ws, r, 0, r, 1);
    setCell(ws, r, 2, metaValueCell(val));
    mergeRange(ws, r, 2, r, 8);
    for (let c = 1; c < 2; c++) setCell(ws, r, c, emptyCell(C.navyFg));
    for (let c = 3; c < 9; c++) setCell(ws, r, c, emptyCell(C.white));
    r++;
  }

  // ── Row blank ────────────────────────────────────────────────────────────
  for (let c = 0; c < 9; c++) setCell(ws, r, c, emptyCell(C.white));
  mergeRange(ws, r, 0, r, 8);
  r++;

  // ── Section: Statistics Dashboard ───────────────────────────────────────
  for (let c = 0; c < 9; c++) setCell(ws, r, c, sectionLabelCell("  ATTENDANCE STATISTICS"));
  mergeRange(ws, r, 0, r, 8);
  r++;

  // Stat header row
  const statHeaders = ["Working Days", "Present", "Absent", "Late", "Half Day", "Leave", "Attend. %", "Punctual. %", "Status"];
  const statBgs = [C.totalBg, C.present, C.absent, C.late, C.halfDay, C.leave, C.navy, C.navy, C.navyFg];
  const statFgs = [C.navy, C.presentTxt, C.absentTxt, C.lateTxt, C.halfTxt, C.leaveTxt, C.white, C.white, C.navy];
  statHeaders.forEach((h, i) => setCell(ws, r, i, statLabelCell(h, statBgs[i], statFgs[i])));
  r++;

  // Stat value row
  const attendPct  = pct(stats.present + stats.late, stats.total);
  const punctPct   = pct(stats.present, stats.total);
  const pctNum     = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;
  const gradeLabel = pctNum >= 90 ? "Excellent" : pctNum >= 75 ? "Good" : pctNum >= 60 ? "Average" : "Poor";
  const gradeFg    = pctNum >= 90 ? C.presentTxt : pctNum >= 75 ? C.lateTxt : pctNum >= 60 ? C.halfTxt : C.absentTxt;
  const gradeBg    = pctNum >= 90 ? C.present : pctNum >= 75 ? C.late : pctNum >= 60 ? C.halfDay : C.absent;

  const statVals = [stats.total, stats.present, stats.absent, stats.late, stats.half_day, stats.leave, attendPct, punctPct, gradeLabel];
  const statVBgs = [C.totalBg, C.present, C.absent, C.late, C.halfDay, C.leave, C.navyLight, C.navyLight, gradeBg];
  const statVFgs = [C.navy, C.presentTxt, C.absentTxt, C.lateTxt, C.halfTxt, C.leaveTxt, C.white, C.white, gradeFg];
  statVals.forEach((v, i) => setCell(ws, r, i, statValueCell(v, statVBgs[i], statVFgs[i])));
  r++;

  // ── Row blank ────────────────────────────────────────────────────────────
  for (let c = 0; c < 9; c++) setCell(ws, r, c, emptyCell(C.white));
  mergeRange(ws, r, 0, r, 8);
  r++;

  // ── Section: Daily Log ───────────────────────────────────────────────────
  for (let c = 0; c < 9; c++) setCell(ws, r, c, sectionLabelCell("  DAILY ATTENDANCE LOG"));
  mergeRange(ws, r, 0, r, 8);
  r++;

  // Table header
  const logHeaders = ["#", "Date", "Day", "Status", "Check In", "Check Out", "Hrs Worked", "Notes / Remarks", "Leave Type"];
  logHeaders.forEach((h, i) => setCell(ws, r, i, tableHeaderCell(h)));
  r++;

  // Data rows
  sorted.forEach((rec, idx) => {
    const isAlt = idx % 2 === 1;
    const d = new Date(rec.date);
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });

    setCell(ws, r, 0, dataCell(idx + 1,      { align: "center", bold: false, altRow: isAlt }));
    setCell(ws, r, 1, dataCell(fmtDate(rec.date), { align: "left",   altRow: isAlt }));
    setCell(ws, r, 2, dataCell(dayName,       { align: "left",   altRow: isAlt }));
    setCell(ws, r, 3, statusCell(rec.status,  isAlt));
    setCell(ws, r, 4, dataCell(rec.checkInTime  ?? "—", { align: "center", altRow: isAlt }));
    setCell(ws, r, 5, dataCell(rec.checkOutTime ?? "—", { align: "center", altRow: isAlt }));
    setCell(ws, r, 6, dataCell(rec.workingHours ?? "—", { align: "center", bold: true, altRow: isAlt }));
    setCell(ws, r, 7, dataCell(rec.notes       ?? "—", { align: "left",   altRow: isAlt }));
    setCell(ws, r, 8, dataCell(rec.leaveType   ?? "—", { align: "center", altRow: isAlt }));
    r++;
  });

  // Totals footer row
  const footerLabels: (string | number)[] = [
    "", "TOTAL", "",
    `P:${stats.present}  A:${stats.absent}  L:${stats.late}  H:${stats.half_day}  Lv:${stats.leave}`,
    "", "", "", "", "",
  ];
  footerLabels.forEach((v, i) => {
    setCell(ws, r, i, cell(v, {
      font: { bold: true, sz: 10, color: { rgb: C.white }, name: "Calibri" },
      fill: fill(C.navy),
      alignment: { horizontal: i === 3 ? "center" : "center", vertical: "center" },
      border: allBorders(C.navyLight, "medium"),
    }));
  });
  mergeRange(ws, r, 3, r, 8);
  r++;

  // ── Row blank + footer note ──────────────────────────────────────────────
  for (let c = 0; c < 9; c++) setCell(ws, r, c, emptyCell(C.white));
  mergeRange(ws, r, 0, r, 8);
  r++;

  const footNote = `This report is generated by ${COLLEGE_NAME} — Attendance Management System`;
  for (let c = 0; c < 9; c++) {
    setCell(ws, r, c, cell(c === 0 ? footNote : "", {
      font: { italic: true, sz: 9, color: { rgb: C.gray }, name: "Calibri" },
      fill: fill(C.lightGray),
      alignment: { horizontal: "left", vertical: "center" },
    }));
  }
  mergeRange(ws, r, 0, r, 8);

  // Row heights
  setRowHeights(ws, { 0: 42, 1: 24, 2: 8, 10: 8 });

  // Worksheet range
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r, c: 8 } });

  return ws;
}

// ─── Master Summary Sheet ─────────────────────────────────────────────────────

function buildSummarySheet(
  records: AttendanceHistoryRecord[],
  teachers: Teacher[],
  month: number,
  year: number
): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const period = monthName(month, year);

  // Columns: #, Name, Email, Days, Present, Absent, Late, HalfDay, Leave, AttRate, PunctRate, Grade
  setColWidths(ws, [5, 24, 30, 11, 10, 10, 10, 10, 10, 12, 12, 12]);

  let r = 0;

  // Banner
  for (let c = 0; c < 12; c++) setCell(ws, r, c, collegeBannerCell(COLLEGE_NAME));
  mergeRange(ws, r, 0, r, 11);
  r++;

  const sub = `ALL TEACHERS ATTENDANCE SUMMARY  ·  ${period}`;
  for (let c = 0; c < 12; c++) setCell(ws, r, c, subBannerCell(sub));
  mergeRange(ws, r, 0, r, 11);
  r++;

  for (let c = 0; c < 12; c++) setCell(ws, r, c, emptyCell(C.navyFg));
  mergeRange(ws, r, 0, r, 11);
  r++;

  // Meta row
  const metas: [string, string][] = [
    ["Report Period", period],
    ["Total Teachers", String(teachers.length)],
    ["Generated", new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })],
    ["Prepared By", `${COLLEGE_SHORT} Administration`],
  ];
  for (const [lbl, val] of metas) {
    setCell(ws, r, 0, metaLabelCell(lbl));
    mergeRange(ws, r, 0, r, 1);
    setCell(ws, r, 2, metaValueCell(val));
    mergeRange(ws, r, 2, r, 11);
    for (let c = 3; c < 12; c++) setCell(ws, r, c, emptyCell(C.white));
    r++;
  }

  // Spacer
  for (let c = 0; c < 12; c++) setCell(ws, r, c, emptyCell(C.white));
  mergeRange(ws, r, 0, r, 11);
  r++;

  // Section label
  for (let c = 0; c < 12; c++) setCell(ws, r, c, sectionLabelCell("  TEACHER-WISE ATTENDANCE SUMMARY"));
  mergeRange(ws, r, 0, r, 11);
  r++;

  // Table header
  const headers = [
    "#", "Teacher Name", "Email",
    "Working\nDays", "Present", "Absent", "Late", "Half\nDay", "Leave",
    "Attendance\nRate", "Punctuality\nRate", "Grade",
  ];
  headers.forEach((h, i) => setCell(ws, r, i, tableHeaderCell(h)));
  r++;

  // Per-teacher stats
  let totDays = 0, totPresent = 0, totAbsent = 0, totLate = 0, totHalf = 0, totLeave = 0;

  teachers.forEach((t, idx) => {
    const tRecs  = records.filter(rec => rec.teacherId === t.id);
    const st     = buildStats(tRecs);
    const isAlt  = idx % 2 === 1;
    const ap     = pct(st.present + st.late, st.total);
    const pp     = pct(st.present, st.total);
    const pn     = st.total > 0 ? Math.round(((st.present + st.late) / st.total) * 100) : 0;
    const gLbl   = pn >= 90 ? "Excellent" : pn >= 75 ? "Good" : pn >= 60 ? "Average" : "Poor";
    const gFg    = pn >= 90 ? C.presentTxt : pn >= 75 ? C.lateTxt : pn >= 60 ? C.halfTxt : C.absentTxt;
    const gBg    = pn >= 90 ? C.present : pn >= 75 ? C.late : pn >= 60 ? C.halfDay : C.absent;

    totDays += st.total; totPresent += st.present; totAbsent += st.absent;
    totLate += st.late;  totHalf += st.half_day;   totLeave += st.leave;

    setCell(ws, r, 0,  dataCell(idx + 1,    { align: "center", altRow: isAlt }));
    setCell(ws, r, 1,  dataCell(t.name,     { align: "left", bold: true, altRow: isAlt }));
    setCell(ws, r, 2,  dataCell(t.email,    { align: "left", altRow: isAlt }));
    setCell(ws, r, 3,  dataCell(st.total,   { align: "center", altRow: isAlt }));
    setCell(ws, r, 4,  dataCell(st.present, { align: "center", bg: st.total > 0 ? C.present : undefined, fg: C.presentTxt, bold: true }));
    setCell(ws, r, 5,  dataCell(st.absent,  { align: "center", bg: st.absent > 0 ? C.absent : undefined, fg: st.absent > 0 ? C.absentTxt : C.black }));
    setCell(ws, r, 6,  dataCell(st.late,    { align: "center", bg: st.late > 0 ? C.late : undefined, fg: st.late > 0 ? C.lateTxt : C.black }));
    setCell(ws, r, 7,  dataCell(st.half_day,{ align: "center", bg: st.half_day > 0 ? C.halfDay : undefined, fg: st.half_day > 0 ? C.halfTxt : C.black }));
    setCell(ws, r, 8,  dataCell(st.leave,   { align: "center", bg: st.leave > 0 ? C.leave : undefined, fg: st.leave > 0 ? C.leaveTxt : C.black }));
    setCell(ws, r, 9,  dataCell(ap,         { align: "center", bold: true, altRow: isAlt }));
    setCell(ws, r, 10, dataCell(pp,         { align: "center", altRow: isAlt }));
    setCell(ws, r, 11, cell(gLbl, {
      font: { bold: true, sz: 10, color: { rgb: gFg }, name: "Calibri" },
      fill: fill(gBg),
      alignment: { horizontal: "center", vertical: "center" },
      border: allBorders(C.border),
    }));
    r++;
  });

  // Grand totals footer
  const grandPct  = pct(totPresent + totLate, totDays);
  const grandPpct = pct(totPresent, totDays);
  const footerVals: (string | number)[] = [
    "", "GRAND TOTAL", "", totDays, totPresent, totAbsent, totLate, totHalf, totLeave, grandPct, grandPpct, "",
  ];
  footerVals.forEach((v, i) => {
    setCell(ws, r, i, cell(v, {
      font: { bold: true, sz: 10, color: { rgb: C.white }, name: "Calibri" },
      fill: fill(C.navy),
      alignment: { horizontal: i === 1 ? "left" : "center", vertical: "center" },
      border: allBorders(C.navyLight, "medium"),
    }));
  });
  r++;

  // Footer note
  for (let c = 0; c < 12; c++) setCell(ws, r, c, emptyCell(C.white));
  mergeRange(ws, r, 0, r, 11);
  r++;

  const footNote = `${COLLEGE_NAME}  ·  This document is system-generated and is valid without a signature.`;
  for (let c = 0; c < 12; c++) {
    setCell(ws, r, c, cell(c === 0 ? footNote : "", {
      font: { italic: true, sz: 9, color: { rgb: C.gray }, name: "Calibri" },
      fill: fill(C.lightGray),
      alignment: { horizontal: "left", vertical: "center" },
    }));
  }
  mergeRange(ws, r, 0, r, 11);

  setRowHeights(ws, { 0: 42, 1: 24, 2: 8 });
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r, c: 11 } });

  return ws;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Exports a full workbook:
 *  - Sheet 1: Summary of all teachers
 *  - Sheet 2+: One dedicated sheet per teacher with daily log
 */
export function exportAllTeachersSummary(
  records: AttendanceHistoryRecord[],
  teachers: Teacher[],
  month: number,
  year: number
) {
  const period = monthName(month, year).replace(" ", "_");
  const wb = XLSX.utils.book_new();

  // Summary first
  XLSX.utils.book_append_sheet(wb, buildSummarySheet(records, teachers, month, year), "Summary");

  // One sheet per teacher
  teachers.forEach(t => {
    const tRecs  = records.filter(r => r.teacherId === t.id);
    const email  = tRecs[0]?.teacherEmail ?? t.email;
    // Sheet names max 31 chars
    const sheetName = t.name.substring(0, 28).replace(/[\\/*?[\]]/g, "_");
    XLSX.utils.book_append_sheet(wb, buildTeacherSheet(tRecs, t.name, email, month, year), sheetName);
  });

  downloadWorkbook(wb, `All_Teachers_Attendance_${period}.xlsx`);
}

/**
 * Exports a single teacher report:
 *  - Sheet 1: Detailed daily log with stats dashboard
 */
export function exportSingleTeacherReport(
  teacherRecords: AttendanceHistoryRecord[],
  teacherName: string,
  teacherEmail: string,
  month: number,
  year: number
) {
  const period    = monthName(month, year).replace(" ", "_");
  const safeName  = teacherName.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/ /g, "_");
  const wb        = XLSX.utils.book_new();
  const sheetName = teacherName.substring(0, 28).replace(/[\\/*?[\]]/g, "_");

  XLSX.utils.book_append_sheet(
    wb,
    buildTeacherSheet(teacherRecords, teacherName, teacherEmail, month, year),
    sheetName
  );

  downloadWorkbook(wb, `${safeName}_Attendance_${period}.xlsx`);
}
