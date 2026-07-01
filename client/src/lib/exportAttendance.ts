/**
 * exportAttendance.ts
 * Professional Excel export for the Teacher Attendance System.
 * Produces fully-styled workbooks with college branding, color-coded
 * status cells, bordered tables, summary dashboards, and per-teacher sheets.
 *
 * Uses ExcelJS for advanced formatting and styling.
 */
import ExcelJS from "exceljs";

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

export interface TeacherSummary {
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  leave: number;
  presentRate: number;
  avgCheckIn: string;
  avgCheckOut: string;
  formattedHours: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLEGE_NAME  = "Global College of Computer Science & Commerce";
const COLLEGE_SHORT = "GCCSC";

// Status colors (ARGB format)
const STATUS_FILL: Record<string, string> = {
  present:  "FFD1FAE5", // light emerald
  absent:   "FFFEE2E2", // light red
  late:     "FFFEF3C7", // light amber
  half_day: "FFDBEAFE", // light blue
  leave:    "FFEDE9FE", // light violet
  weekend:  "FFF1F5F9", // light slate
};

const STATUS_TXT: Record<string, string> = {
  present:  "FF065F46", // dark emerald
  absent:   "FF991B1B", // dark red
  late:     "FF92400E", // dark amber
  half_day: "FF1E40AF", // dark blue
  leave:    "FF4C1D95", // dark violet
  weekend:  "FF64748B", // slate
};

const STATUS_LABEL: Record<string, string> = {
  present:  "Present",
  absent:   "Absent",
  late:     "Late",
  half_day: "Half Day",
  leave:    "Leave",
  weekend:  "Weekend",
};

const STATUS_SHORT: Record<string, string> = {
  present:  "P",
  absent:   "A",
  late:     "L",
  half_day: "H",
  leave:    "Lv",
  weekend:  "—",
};

// ─── Helper Functions for Styling ─────────────────────────────────────────────

function styleCell(
  cell: ExcelJS.Cell,
  options: {
    value?: ExcelJS.CellValue;
    bold?: boolean;
    align?: "left" | "center" | "right";
    bg?: string;
    fg?: string;
    sz?: number;
    italic?: boolean;
    borderStyle?: "thin" | "medium" | "thick";
    borderColor?: string;
    wrapText?: boolean;
    altRow?: boolean;
  }
) {
  const {
    value,
    bold = false,
    align = "center",
    bg,
    fg = "FF0F172A",
    sz = 10,
    italic = false,
    borderStyle = "thin",
    borderColor = "FFCBD5E1",
    wrapText = true,
    altRow = false,
  } = options;

  if (value !== undefined) {
    cell.value = value;
  }

  cell.font = {
    name: "Calibri",
    size: sz,
    bold,
    italic,
    color: { argb: fg },
  };

  const finalBg = bg ?? (altRow ? "FFF8FAFC" : "FFFFFFFF");
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: finalBg },
  };

  cell.border = {
    top: { style: borderStyle, color: { argb: borderColor } },
    bottom: { style: borderStyle, color: { argb: borderColor } },
    left: { style: borderStyle, color: { argb: borderColor } },
    right: { style: borderStyle, color: { argb: borderColor } },
  };

  cell.alignment = {
    horizontal: align,
    vertical: "middle",
    wrapText,
  };
}

function mergeAndStyle(
  worksheet: ExcelJS.Worksheet,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  value: ExcelJS.CellValue,
  style: {
    font?: Partial<ExcelJS.Font>;
    fill?: ExcelJS.Fill;
    alignment?: Partial<ExcelJS.Alignment>;
    border?: Partial<ExcelJS.Borders>;
  }
) {
  worksheet.mergeCells(r1, c1, r2, c2);
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const cell = worksheet.getCell(r, c);
      if (style.font) cell.font = style.font;
      if (style.fill) cell.fill = style.fill;
      if (style.border) cell.border = style.border;
      if (style.alignment) cell.alignment = style.alignment;
    }
  }
  worksheet.getCell(r1, c1).value = value;
}

// Banner helper — writes a 3-row college header
function writeBanner(worksheet: ExcelJS.Worksheet, startRow: number, cols: number, subTitle: string): number {
  let r = startRow;
  
  // Row 1: Brand Title Banner
  worksheet.getRow(r).height = 42;
  mergeAndStyle(worksheet, r, 1, r, cols, COLLEGE_NAME, {
    font: { bold: true, size: 18, color: { argb: "FFDBEAFE" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } },
    alignment: { horizontal: "center", vertical: "middle" },
    border: {
      top: { style: "medium", color: { argb: "FF2563EB" } },
      bottom: { style: "medium", color: { argb: "FF2563EB" } },
      left: { style: "medium", color: { argb: "FF2563EB" } },
      right: { style: "medium", color: { argb: "FF2563EB" } }
    }
  });
  r++;

  // Row 2: Subtitle Banner
  worksheet.getRow(r).height = 24;
  mergeAndStyle(worksheet, r, 1, r, cols, subTitle, {
    font: { bold: false, size: 11, color: { argb: "FFDBEAFE" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } },
    alignment: { horizontal: "center", vertical: "middle" },
    border: {
      top: { style: "thin", color: { argb: "FF2563EB" } },
      bottom: { style: "thin", color: { argb: "FF2563EB" } },
      left: { style: "thin", color: { argb: "FF2563EB" } },
      right: { style: "thin", color: { argb: "FF2563EB" } }
    }
  });
  r++;

  // Row 3: Thin separator row
  worksheet.getRow(r).height = 8;
  mergeAndStyle(worksheet, r, 1, r, cols, "", {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } }
  });
  r++;

  return r;
}

// Meta info block — writes key-value block
function writeMeta(worksheet: ExcelJS.Worksheet, startRow: number, cols: number, metas: [string, string][]): number {
  let r = startRow;
  for (const [lbl, val] of metas) {
    worksheet.getRow(r).height = 20;

    // Label cols (1 to 2)
    mergeAndStyle(worksheet, r, 1, r, 2, lbl, {
      font: { bold: true, size: 10, color: { argb: "FF1E3A8A" }, name: "Calibri" },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } },
      alignment: { horizontal: "left", vertical: "middle" },
      border: {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } }
      }
    });

    // Value cols (3 to cols)
    mergeAndStyle(worksheet, r, 3, r, cols, val, {
      font: { bold: false, size: 10, color: { argb: "FF0F172A" }, name: "Calibri" },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } },
      alignment: { horizontal: "left", vertical: "middle" },
      border: {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } }
      }
    });

    r++;
  }

  // Row blank spacer
  worksheet.getRow(r).height = 10;
  mergeAndStyle(worksheet, r, 1, r, cols, "", {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } }
  });
  r++;

  return r;
}

// Section Header Row
function writeSectionLabel(worksheet: ExcelJS.Worksheet, r: number, cols: number, label: string): number {
  worksheet.getRow(r).height = 22;
  mergeAndStyle(worksheet, r, 1, r, cols, label, {
    font: { bold: true, size: 10, color: { argb: "FFFFFFFF" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD97706" } }, // Gold Accent
    alignment: { horizontal: "left", vertical: "middle" },
    border: {
      top: { style: "thin", color: { argb: "FFD97706" } },
      bottom: { style: "thin", color: { argb: "FFD97706" } },
      left: { style: "medium", color: { argb: "FFD97706" } },
      right: { style: "thin", color: { argb: "FFD97706" } }
    }
  });
  return r + 1;
}

// Footer note row
function writeFootNote(worksheet: ExcelJS.Worksheet, r: number, cols: number): number {
  worksheet.getRow(r).height = 20;
  const note = `${COLLEGE_NAME}  ·  This document is system-generated and is valid without a signature.`;
  mergeAndStyle(worksheet, r, 1, r, cols, note, {
    font: { italic: true, size: 9, color: { argb: "FF64748B" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } },
    alignment: { horizontal: "left", vertical: "middle" }
  });
  return r + 1;
}

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

function writeStatsDashboard(worksheet: ExcelJS.Worksheet, startRow: number, stats: Stats): number {
  let r = startRow;
  r = writeSectionLabel(worksheet, r, 9, "  ATTENDANCE STATISTICS");

  // Headers
  worksheet.getRow(r).height = 20;
  const statHeaders = ["Working Days", "Present", "Absent", "Late", "Half Day", "Leave", "Attend. %", "Punctual. %", "Grade"];
  const statBgs = ["FFEFF6FF", "FFD1FAE5", "FFFEE2E2", "FFFEF3C7", "FFDBEAFE", "FFEDE9FE", "FF1E3A8A", "FF1E3A8A", "FFDBEAFE"];
  const statFgs = ["FF1E3A8A", "FF065F46", "FF991B1B", "FF92400E", "FF1E40AF", "FF4C1D95", "FFFFFFFF", "FFFFFFFF", "FF1E3A8A"];
  
  statHeaders.forEach((h, i) => {
    styleCell(worksheet.getCell(r, i + 1), {
      value: h,
      bold: true,
      bg: statBgs[i],
      fg: statFgs[i],
      sz: 10
    });
  });
  r++;

  // Values
  worksheet.getRow(r).height = 28;
  const attendPct  = pct(stats.present + stats.late, stats.total);
  const punctPct   = pct(stats.present, stats.total);
  const pctNum     = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;
  
  const gradeLabel = pctNum >= 90 ? "Excellent" : pctNum >= 75 ? "Good" : pctNum >= 60 ? "Average" : "Poor";
  const gradeFg    = pctNum >= 90 ? "FF065F46" : pctNum >= 75 ? "FF92400E" : pctNum >= 60 ? "FF1E40AF" : "FF991B1B";
  const gradeBg    = pctNum >= 90 ? "FFD1FAE5" : pctNum >= 75 ? "FFFEF3C7" : pctNum >= 60 ? "FFDBEAFE" : "FFFEE2E2";

  const statVals = [stats.total, stats.present, stats.absent, stats.late, stats.half_day, stats.leave, attendPct, punctPct, gradeLabel];
  const statVBgs = ["FFEFF6FF", "FFD1FAE5", "FFFEE2E2", "FFFEF3C7", "FFDBEAFE", "FFEDE9FE", "FF2563EB", "FF2563EB", gradeBg];
  const statVFgs = ["FF1E3A8A", "FF065F46", "FF991B1B", "FF92400E", "FF1E40AF", "FF4C1D95", "FFFFFFFF", "FFFFFFFF", gradeFg];

  statVals.forEach((v, i) => {
    styleCell(worksheet.getCell(r, i + 1), {
      value: v,
      bold: true,
      bg: statVBgs[i],
      fg: statVFgs[i],
      sz: i === 8 ? 11 : 14
    });
  });
  r++;

  // Spacer
  worksheet.getRow(r).height = 10;
  mergeAndStyle(worksheet, r, 1, r, 9, "", {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } }
  });
  r++;

  return r;
}

function writeLegend(worksheet: ExcelJS.Worksheet, startRow: number, totalCols: number): number {
  let r = startRow;
  r = writeSectionLabel(worksheet, r, totalCols, "  LEGEND");

  worksheet.getRow(r).height = 20;
  const legendItems: [string, string, string, string][] = [
    ["P", "Present",  "FFD1FAE5", "FF065F46"],
    ["A", "Absent",   "FFFEE2E2", "FF991B1B"],
    ["L", "Late",     "FFFEF3C7", "FF92400E"],
    ["H", "Half Day", "FFDBEAFE", "FF1E40AF"],
    ["Lv", "Leave",   "FFEDE9FE", "FF4C1D95"],
    ["—", "Weekend",  "FFF1F5F9", "FF64748B"],
  ];

  legendItems.forEach(([code, label, bg, fg], i) => {
    const col = i * 2 + 1;
    styleCell(worksheet.getCell(r, col), {
      value: code,
      bold: true,
      bg,
      fg,
      sz: 10
    });
    styleCell(worksheet.getCell(r, col + 1), {
      value: `= ${label}`,
      align: "left",
      bg: "FFF8FAFC",
      sz: 10
    });
  });
  r++;

  // Spacer
  worksheet.getRow(r).height = 10;
  mergeAndStyle(worksheet, r, 1, r, totalCols, "", {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } }
  });
  r++;

  return r;
}

// ─── Format Utilities ─────────────────────────────────────────────────────────

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

async function saveWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sheet Builders ──────────────────────────────────────────────────────────

function buildTeacherSheet(
  worksheet: ExcelJS.Worksheet,
  records: AttendanceHistoryRecord[],
  teacherName: string,
  teacherEmail: string,
  periodLabel: string
) {
  const stats  = buildStats(records);
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const COLS = 9;

  const widths = [5, 16, 12, 12, 11, 11, 10, 28, 14];
  widths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w;
  });

  let r = 1;
  r = writeBanner(worksheet, r, COLS, `TEACHER ATTENDANCE REGISTER  ·  ${periodLabel}`);

  const metas: [string, string][] = [
    ["Teacher Name",  teacherName],
    ["Email Address", teacherEmail],
    ["Report Period", periodLabel],
    ["Generated On",  new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })],
    ["Prepared By",   `${COLLEGE_SHORT} Administration`],
  ];
  r = writeMeta(worksheet, r, COLS, metas);
  r = writeStatsDashboard(worksheet, r, stats);
  r = writeSectionLabel(worksheet, r, COLS, "  DAILY ATTENDANCE LOG");

  // Table header
  worksheet.getRow(r).height = 24;
  const logHeaders = ["#", "Date", "Day", "Status", "Check In", "Check Out", "Hrs Worked", "Notes / Remarks", "Leave Type"];
  logHeaders.forEach((h, i) => {
    styleCell(worksheet.getCell(r, i + 1), {
      value: h,
      bold: true,
      bg: "FF1E40AF",
      fg: "FFFFFFFF",
      sz: 10
    });
  });
  r++;

  // Data rows
  sorted.forEach((rec, idx) => {
    worksheet.getRow(r).height = 20;
    const isAlt = idx % 2 === 1;
    const d = new Date(rec.date);
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });

    styleCell(worksheet.getCell(r, 1), { value: idx + 1, align: "center", altRow: isAlt });
    styleCell(worksheet.getCell(r, 2), { value: fmtDate(rec.date), align: "left", altRow: isAlt });
    styleCell(worksheet.getCell(r, 3), { value: dayName, align: "left", altRow: isAlt });
    
    // Status
    styleCell(worksheet.getCell(r, 4), {
      value: STATUS_LABEL[rec.status] ?? rec.status,
      bold: true,
      bg: STATUS_FILL[rec.status] ?? "FFF1F5F9",
      fg: STATUS_TXT[rec.status] ?? "FF64748B"
    });

    styleCell(worksheet.getCell(r, 5), { value: rec.checkInTime ?? "—", align: "center", altRow: isAlt });
    styleCell(worksheet.getCell(r, 6), { value: rec.checkOutTime ?? "—", align: "center", altRow: isAlt });
    styleCell(worksheet.getCell(r, 7), { value: rec.workingHours ?? "—", align: "center", bold: true, altRow: isAlt });
    styleCell(worksheet.getCell(r, 8), { value: rec.notes ?? "—", align: "left", altRow: isAlt });
    styleCell(worksheet.getCell(r, 9), { value: rec.leaveType ?? "—", align: "center", altRow: isAlt });
    r++;
  });

  // Footer Totals row
  worksheet.getRow(r).height = 22;
  const footerCells: (string | number)[] = [
    "", "TOTAL", "",
    `P:${stats.present}  A:${stats.absent}  L:${stats.late}  H:${stats.half_day}  Lv:${stats.leave}`,
    "", "", "", "", "",
  ];

  footerCells.forEach((v, i) => {
    styleCell(worksheet.getCell(r, i + 1), {
      bold: true,
      bg: "FF1E3A8A",
      fg: "FFFFFFFF",
      sz: 10
    });
  });
  mergeAndStyle(worksheet, r, 4, r, 9, footerCells[3], {
    font: { bold: true, size: 10, color: { argb: "FFFFFFFF" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } },
    alignment: { horizontal: "center", vertical: "middle" }
  });
  worksheet.getCell(r, 2).value = "TOTAL";
  r++;

  // Spacer
  worksheet.getRow(r).height = 10;
  mergeAndStyle(worksheet, r, 1, r, COLS, "", {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } }
  });
  r++;

  r = writeFootNote(worksheet, r, COLS);
}

function buildSummarySheet(
  worksheet: ExcelJS.Worksheet,
  records: AttendanceHistoryRecord[],
  teachers: Teacher[],
  periodLabel: string
) {
  const COLS = 12;
  const widths = [5, 24, 30, 11, 10, 10, 10, 10, 10, 12, 12, 12];
  widths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w;
  });

  let r = 1;
  r = writeBanner(worksheet, r, COLS, `ALL TEACHERS ATTENDANCE SUMMARY  ·  ${periodLabel}`);

  const metas: [string, string][] = [
    ["Report Period",  periodLabel],
    ["Total Teachers", String(teachers.length)],
    ["Generated",      new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })],
    ["Prepared By",    `${COLLEGE_SHORT} Administration`],
  ];
  r = writeMeta(worksheet, r, COLS, metas);
  r = writeSectionLabel(worksheet, r, COLS, "  TEACHER-WISE ATTENDANCE SUMMARY");

  // Headers
  worksheet.getRow(r).height = 26;
  const headers = [
    "#", "Teacher Name", "Email",
    "Working\nDays", "Present", "Absent", "Late", "Half\nDay", "Leave",
    "Attendance\nRate", "Punctuality\nRate", "Grade",
  ];
  headers.forEach((h, i) => {
    styleCell(worksheet.getCell(r, i + 1), {
      value: h,
      bold: true,
      bg: "FF1E40AF",
      fg: "FFFFFFFF",
      sz: 10
    });
  });
  r++;

  let totDays = 0, totPresent = 0, totAbsent = 0, totLate = 0, totHalf = 0, totLeave = 0;

  teachers.forEach((t, idx) => {
    worksheet.getRow(r).height = 20;
    const tRecs = records.filter(rec => rec.teacherId === t.id);
    const st    = buildStats(tRecs);
    const isAlt = idx % 2 === 1;
    const ap    = pct(st.present + st.late, st.total);
    const pp    = pct(st.present, st.total);
    const pn    = st.total > 0 ? Math.round(((st.present + st.late) / st.total) * 100) : 0;

    totDays += st.total; totPresent += st.present; totAbsent += st.absent;
    totLate += st.late;  totHalf += st.half_day;   totLeave += st.leave;

    styleCell(worksheet.getCell(r, 1), { value: idx + 1, align: "center", altRow: isAlt });
    styleCell(worksheet.getCell(r, 2), { value: t.name, align: "left", bold: true, altRow: isAlt });
    styleCell(worksheet.getCell(r, 3), { value: t.email, align: "left", altRow: isAlt });
    styleCell(worksheet.getCell(r, 4), { value: st.total, align: "center", altRow: isAlt });
    
    styleCell(worksheet.getCell(r, 5), { value: st.present, align: "center", bg: "FFD1FAE5", fg: "FF065F46", bold: true });
    styleCell(worksheet.getCell(r, 6), { value: st.absent, align: "center", bg: st.absent > 0 ? "FFFEE2E2" : undefined, fg: st.absent > 0 ? "FF991B1B" : "FF0F172A", bold: st.absent > 0 });
    styleCell(worksheet.getCell(r, 7), { value: st.late, align: "center", bg: st.late > 0 ? "FFFEF3C7" : undefined, fg: st.late > 0 ? "FF92400E" : "FF0F172A", bold: st.late > 0 });
    styleCell(worksheet.getCell(r, 8), { value: st.half_day, align: "center", bg: st.half_day > 0 ? "FFDBEAFE" : undefined, fg: st.half_day > 0 ? "FF1E40AF" : "FF0F172A", bold: st.half_day > 0 });
    styleCell(worksheet.getCell(r, 9), { value: st.leave, align: "center", bg: st.leave > 0 ? "FFEDE9FE" : undefined, fg: st.leave > 0 ? "FF4C1D95" : "FF0F172A", bold: st.leave > 0 });

    styleCell(worksheet.getCell(r, 10), { value: ap, align: "center", bold: true, altRow: isAlt });
    styleCell(worksheet.getCell(r, 11), { value: pp, align: "center", altRow: isAlt });
    
    // Grade
    const cellGrade = worksheet.getCell(r, 12);
    const gradeLabel = pn >= 90 ? "Excellent" : pn >= 75 ? "Good" : pn >= 60 ? "Average" : "Poor";
    const gradeFg    = pn >= 90 ? "FF065F46" : pn >= 75 ? "FF92400E" : pn >= 60 ? "FF1E40AF" : "FF991B1B";
    const gradeBg    = pn >= 90 ? "FFD1FAE5" : pn >= 75 ? "FFFEF3C7" : pn >= 60 ? "FFDBEAFE" : "FFFEE2E2";
    styleCell(cellGrade, {
      value: gradeLabel,
      bold: true,
      bg: gradeBg,
      fg: gradeFg
    });

    r++;
  });

  // Footer Grand totals
  worksheet.getRow(r).height = 22;
  const grandPct  = pct(totPresent + totLate, totDays);
  const grandPpct = pct(totPresent, totDays);
  const footerVals = [
    "", "GRAND TOTAL", "", totDays, totPresent, totAbsent, totLate, totHalf, totLeave, grandPct, grandPpct, ""
  ];

  footerVals.forEach((v, i) => {
    styleCell(worksheet.getCell(r, i + 1), {
      value: v,
      bold: true,
      bg: "FF1E3A8A",
      fg: "FFFFFFFF",
      align: i === 1 ? "left" : "center",
      sz: 10
    });
  });
  r++;

  // Spacer
  worksheet.getRow(r).height = 10;
  mergeAndStyle(worksheet, r, 1, r, COLS, "", {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } }
  });
  r++;

  r = writeFootNote(worksheet, r, COLS);
}

function buildMonthlyMatrixSheet(
  worksheet: ExcelJS.Worksheet,
  records: AttendanceHistoryRecord[],
  teachers: Teacher[],
  month: number,
  year: number
) {
  const periodLabel = monthName(month, year);
  const daysInMonth = new Date(year, month, 0).getDate();
  const FIXED_LEFT = 2; // #, Name
  const FIXED_RIGHT = 7; // Present, Absent, Late, Half, Leave, Rate%, Grade
  const COLS = FIXED_LEFT + daysInMonth + FIXED_RIGHT;

  worksheet.getColumn(1).width = 4;
  worksheet.getColumn(2).width = 22;
  for (let d = 1; d <= daysInMonth; d++) {
    worksheet.getColumn(FIXED_LEFT + d).width = 4;
  }
  const rightWidths = [8, 7, 6, 6, 6, 8, 11];
  rightWidths.forEach((w, i) => {
    worksheet.getColumn(FIXED_LEFT + daysInMonth + i + 1).width = w;
  });

  let r = 1;
  r = writeBanner(worksheet, r, COLS, `ATTENDANCE REGISTER  ·  ${periodLabel}`);

  const metas: [string, string][] = [
    ["Report Period",  periodLabel],
    ["Total Teachers", String(teachers.length)],
    ["Generated On",   new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })],
    ["Prepared By",    `${COLLEGE_SHORT} Administration`],
  ];
  r = writeMeta(worksheet, r, COLS, metas);
  r = writeLegend(worksheet, r, COLS);
  r = writeSectionLabel(worksheet, r, COLS, "  MONTHLY ATTENDANCE REGISTER");

  // Header row
  worksheet.getRow(r).height = 28;
  styleCell(worksheet.getCell(r, 1), { value: "#", bold: true, bg: "FF1E40AF", fg: "FFFFFFFF" });
  styleCell(worksheet.getCell(r, 2), { value: "Teacher Name", bold: true, bg: "FF1E40AF", fg: "FFFFFFFF", align: "left" });

  for (let d = 1; d <= daysInMonth; d++) {
    const col = FIXED_LEFT + d;
    const dayOfWeek = new Date(year, month - 1, d).toLocaleDateString("en-US", { weekday: "narrow" });
    const isWeekend = [0, 6].includes(new Date(year, month - 1, d).getDay());
    styleCell(worksheet.getCell(r, col), {
      value: `${d}\n${dayOfWeek}`,
      bold: true,
      bg: isWeekend ? "FFF1F5F9" : "FF1E40AF",
      fg: isWeekend ? "FF64748B" : "FFFFFFFF"
    });
  }

  const rightHeaders = ["Present", "Absent", "Late", "Half\nDay", "Leave", "Att.\nRate %", "Grade"];
  const rightBgs     = ["FFD1FAE5", "FFFEE2E2", "FFFEF3C7", "FFDBEAFE", "FFEDE9FE", "FF1E3A8A", "FFDBEAFE"];
  const rightFgs     = ["FF065F46", "FF991B1B", "FF92400E", "FF1E40AF", "FF4C1D95", "FFFFFFFF", "FF1E3A8A"];
  rightHeaders.forEach((h, i) => {
    const col = FIXED_LEFT + daysInMonth + i + 1;
    styleCell(worksheet.getCell(r, col), {
      value: h,
      bold: true,
      bg: rightBgs[i],
      fg: rightFgs[i],
      sz: 9
    });
  });
  r++;

  // Accumulate day totals
  const dayTotals: Record<number, { present: number; absent: number; late: number; half_day: number; leave: number; total: number }> = {};
  for (let d = 1; d <= daysInMonth; d++) dayTotals[d] = { present: 0, absent: 0, late: 0, half_day: 0, leave: 0, total: 0 };

  teachers.forEach((t, idx) => {
    worksheet.getRow(r).height = 20;
    const isAlt = idx % 2 === 1;
    const tRecs = records.filter(rec => rec.teacherId === t.id);

    const dayStatusMap: Record<number, string> = {};
    tRecs.forEach(rec => {
      const d = new Date(rec.date).getDate();
      dayStatusMap[d] = rec.status;
    });

    styleCell(worksheet.getCell(r, 1), { value: idx + 1, align: "center", altRow: isAlt });
    styleCell(worksheet.getCell(r, 2), { value: t.name, align: "left", bold: true, altRow: isAlt });

    let present = 0, absent = 0, late = 0, half_day = 0, leave = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const col = FIXED_LEFT + d;
      const status = dayStatusMap[d];
      const isWeekend = [0, 6].includes(new Date(year, month - 1, d).getDay());

      if (status) {
        styleCell(worksheet.getCell(r, col), {
          value: STATUS_SHORT[status] ?? "?",
          bold: true,
          bg: STATUS_FILL[status] ?? "FFFFFFFF",
          fg: STATUS_TXT[status] ?? "FF64748B",
          sz: 9
        });
        
        if (status === "present") { present++; dayTotals[d].present++; }
        else if (status === "absent") { absent++; dayTotals[d].absent++; }
        else if (status === "late") { late++; dayTotals[d].late++; }
        else if (status === "half_day") { half_day++; dayTotals[d].half_day++; }
        else if (status === "leave") { leave++; dayTotals[d].leave++; }
        dayTotals[d].total++;
      } else if (isWeekend) {
        styleCell(worksheet.getCell(r, col), { value: "—", bold: true, bg: "FFF1F5F9", fg: "FF64748B", sz: 9 });
      } else {
        styleCell(worksheet.getCell(r, col), { bg: "FFF8FAFC" });
      }
    }

    const total = present + absent + late + half_day + leave;
    const attPct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    const rightCols = FIXED_LEFT + daysInMonth + 1;

    styleCell(worksheet.getCell(r, rightCols + 0), { value: present, bg: "FFD1FAE5", fg: "FF065F46", bold: true });
    styleCell(worksheet.getCell(r, rightCols + 1), { value: absent, bg: absent > 0 ? "FFFEE2E2" : undefined, fg: absent > 0 ? "FF991B1B" : "FF0F172A", bold: absent > 0 });
    styleCell(worksheet.getCell(r, rightCols + 2), { value: late, bg: late > 0 ? "FFFEF3C7" : undefined, fg: late > 0 ? "FF92400E" : "FF0F172A", bold: late > 0 });
    styleCell(worksheet.getCell(r, rightCols + 3), { value: half_day, bg: half_day > 0 ? "FFDBEAFE" : undefined, fg: half_day > 0 ? "FF1E40AF" : "FF0F172A", bold: half_day > 0 });
    styleCell(worksheet.getCell(r, rightCols + 4), { value: leave, bg: leave > 0 ? "FFEDE9FE" : undefined, fg: leave > 0 ? "FF4C1D95" : "FF0F172A", bold: leave > 0 });

    const attPctStr = `${attPct}%`;
    const attBg = attPct >= 90 ? "FFD1FAE5" : attPct >= 75 ? "FFFEF3C7" : "FFFEE2E2";
    const attFg = attPct >= 90 ? "FF065F46" : attPct >= 75 ? "FF92400E" : "FF991B1B";
    styleCell(worksheet.getCell(r, rightCols + 5), { value: attPctStr, bold: true, bg: attBg, fg: attFg });
    
    // Grade
    const cellGrade = worksheet.getCell(r, rightCols + 6);
    const gradeLabel = attPct >= 90 ? "Excellent" : attPct >= 75 ? "Good" : attPct >= 60 ? "Average" : "Poor";
    const gradeFg    = attPct >= 90 ? "FF065F46" : attPct >= 75 ? "FF92400E" : attPct >= 60 ? "FF1E40AF" : "FF991B1B";
    const gradeBg    = attPct >= 90 ? "FFD1FAE5" : attPct >= 75 ? "FFFEF3C7" : attPct >= 60 ? "FFDBEAFE" : "FFFEE2E2";
    styleCell(cellGrade, { value: gradeLabel, bold: true, bg: gradeBg, fg: gradeFg });

    r++;
  });

  // Day totals footer row
  worksheet.getRow(r).height = 24;
  styleCell(worksheet.getCell(r, 1), { bg: "FF1E3A8A", fg: "FFFFFFFF" });
  styleCell(worksheet.getCell(r, 2), { value: "Day Totals", bold: true, bg: "FF1E3A8A", fg: "FFFFFFFF", align: "left" });

  for (let d = 1; d <= daysInMonth; d++) {
    const col = FIXED_LEFT + d;
    const dt = dayTotals[d];
    const dayPct = dt.total > 0 ? Math.round(((dt.present + dt.late) / dt.total) * 100) : 0;
    const summary = dt.total > 0 ? `${dt.present + dt.late}/${dt.total}\n${dayPct}%` : "";
    styleCell(worksheet.getCell(r, col), {
      value: summary,
      bold: true,
      bg: "FF1E3A8A",
      fg: "FFFFFFFF",
      sz: 8
    });
  }

  const totP = teachers.reduce((s, t) => s + buildStats(records.filter(r2 => r2.teacherId === t.id)).present, 0);
  const totA = teachers.reduce((s, t) => s + buildStats(records.filter(r2 => r2.teacherId === t.id)).absent, 0);
  const totL = teachers.reduce((s, t) => s + buildStats(records.filter(r2 => r2.teacherId === t.id)).late, 0);
  const totH = teachers.reduce((s, t) => s + buildStats(records.filter(r2 => r2.teacherId === t.id)).half_day, 0);
  const totLv = teachers.reduce((s, t) => s + buildStats(records.filter(r2 => r2.teacherId === t.id)).leave, 0);
  const totAll = totP + totA + totL + totH + totLv;
  const grandRate = totAll > 0 ? Math.round(((totP + totL) / totAll) * 100) : 0;
  const rightCols = FIXED_LEFT + daysInMonth + 1;

  [totP, totA, totL, totH, totLv, `${grandRate}%`, ""].forEach((v, i) => {
    styleCell(worksheet.getCell(r, rightCols + i), {
      value: v,
      bold: true,
      bg: "FF1E3A8A",
      fg: "FFFFFFFF",
      sz: 9
    });
  });
  r++;

  // Spacer
  worksheet.getRow(r).height = 10;
  mergeAndStyle(worksheet, r, 1, r, COLS, "", {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } }
  });
  r++;

  r = writeFootNote(worksheet, r, COLS);
}

function buildMonthlySummarySheet(
  worksheet: ExcelJS.Worksheet,
  summaries: TeacherSummary[],
  periodLabel: string
) {
  const COLS = 13;
  const widths = [4, 24, 28, 11, 10, 10, 8, 8, 8, 12, 13, 12, 11];
  widths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w;
  });

  let r = 1;
  r = writeBanner(worksheet, r, COLS, `MONTHLY ATTENDANCE SUMMARY  ·  ${periodLabel}`);

  const metas: [string, string][] = [
    ["Report Period",  periodLabel],
    ["Total Teachers", String(summaries.length)],
    ["Generated On",   new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })],
    ["Prepared By",    `${COLLEGE_SHORT} Administration`],
  ];
  r = writeMeta(worksheet, r, COLS, metas);
  r = writeSectionLabel(worksheet, r, COLS, "  TEACHER ATTENDANCE SUMMARY TABLE");

  // Headers
  worksheet.getRow(r).height = 26;
  const headers = [
    "#", "Teacher Name", "Email",
    "Total\nDays", "Present", "Absent", "Late", "Half\nDay", "Leave",
    "Attendance\nRate %", "Punctuality\nRate %", "Hrs\nWorked", "Grade",
  ];
  headers.forEach((h, i) => {
    styleCell(worksheet.getCell(r, i + 1), {
      value: h,
      bold: true,
      bg: "FF1E40AF",
      fg: "FFFFFFFF",
      sz: 10
    });
  });
  r++;

  let totDays = 0, totPresent = 0, totAbsent = 0, totLate = 0, totHalf = 0, totLeave = 0;

  summaries.forEach((s, idx) => {
    worksheet.getRow(r).height = 20;
    const isAlt = idx % 2 === 1;
    const pp = s.total > 0 ? `${Math.round((s.present / s.total) * 100)}%` : "0%";
    const ap = `${s.presentRate}%`;

    totDays    += s.total;
    totPresent += s.present;
    totAbsent  += s.absent;
    totLate    += s.late;
    totHalf    += s.half_day;
    totLeave   += s.leave;

    styleCell(worksheet.getCell(r, 1), { value: idx + 1, align: "center", altRow: isAlt });
    styleCell(worksheet.getCell(r, 2), { value: s.teacherName, align: "left", bold: true, altRow: isAlt });
    styleCell(worksheet.getCell(r, 3), { value: s.teacherEmail, align: "left", altRow: isAlt });
    styleCell(worksheet.getCell(r, 4), { value: s.total, align: "center", altRow: isAlt });

    styleCell(worksheet.getCell(r, 5), { value: s.present, align: "center", bg: "FFD1FAE5", fg: "FF065F46", bold: true });
    styleCell(worksheet.getCell(r, 6), { value: s.absent, align: "center", bg: s.absent > 0 ? "FFFEE2E2" : undefined, fg: s.absent > 0 ? "FF991B1B" : "FF0F172A", bold: s.absent > 0 });
    styleCell(worksheet.getCell(r, 7), { value: s.late, align: "center", bg: s.late > 0 ? "FFFEF3C7" : undefined, fg: s.late > 0 ? "FF92400E" : "FF0F172A", bold: s.late > 0 });
    styleCell(worksheet.getCell(r, 8), { value: s.half_day, align: "center", bg: s.half_day > 0 ? "FFDBEAFE" : undefined, fg: s.half_day > 0 ? "FF1E40AF" : "FF0F172A", bold: s.half_day > 0 });
    styleCell(worksheet.getCell(r, 9), { value: s.leave, align: "center", bg: s.leave > 0 ? "FFEDE9FE" : undefined, fg: s.leave > 0 ? "FF4C1D95" : "FF0F172A", bold: s.leave > 0 });

    styleCell(worksheet.getCell(r, 10), {
      value: ap,
      bold: true,
      bg: s.presentRate >= 90 ? "FFD1FAE5" : s.presentRate >= 75 ? "FFFEF3C7" : "FFFEE2E2",
      fg: s.presentRate >= 90 ? "FF065F46" : s.presentRate >= 75 ? "FF92400E" : "FF991B1B",
      sz: 11
    });

    styleCell(worksheet.getCell(r, 11), { value: pp, align: "center", altRow: isAlt });
    styleCell(worksheet.getCell(r, 12), { value: `${s.formattedHours} hrs`, align: "center", bold: true, altRow: isAlt });
    
    // Grade cell
    const cellGrade = worksheet.getCell(r, 13);
    const gradeLabel = s.presentRate >= 90 ? "Excellent" : s.presentRate >= 75 ? "Good" : s.presentRate >= 60 ? "Average" : "Poor";
    const gradeFg    = s.presentRate >= 90 ? "FF065F46" : s.presentRate >= 75 ? "FF92400E" : s.presentRate >= 60 ? "FF1E40AF" : "FF991B1B";
    const gradeBg    = s.presentRate >= 90 ? "FFD1FAE5" : s.presentRate >= 75 ? "FFFEF3C7" : s.presentRate >= 60 ? "FFDBEAFE" : "FFFEE2E2";
    styleCell(cellGrade, { value: gradeLabel, bold: true, bg: gradeBg, fg: gradeFg });

    r++;
  });

  const grandRate  = totDays > 0 ? `${Math.round(((totPresent + totLate) / totDays) * 100)}%` : "0%";
  const grandPunct = totDays > 0 ? `${Math.round((totPresent / totDays) * 100)}%` : "0%";
  const footerVals = [
    "", "GRAND TOTAL", "", totDays, totPresent, totAbsent, totLate, totHalf, totLeave, grandRate, grandPunct, "", ""
  ];

  footerVals.forEach((v, i) => {
    styleCell(worksheet.getCell(r, i + 1), {
      value: v,
      bold: true,
      bg: "FF1E3A8A",
      fg: "FFFFFFFF",
      align: i === 1 ? "left" : "center",
      sz: 10
    });
  });
  r++;

  // Spacer
  worksheet.getRow(r).height = 10;
  mergeAndStyle(worksheet, r, 1, r, COLS, "", {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } }
  });
  r++;

  r = writeFootNote(worksheet, r, COLS);
}

function buildRankingsSheet(
  worksheet: ExcelJS.Worksheet,
  summaries: TeacherSummary[],
  periodLabel: string
) {
  const COLS = 13;
  const widths = [6, 24, 28, 11, 9, 9, 7, 7, 7, 12, 12, 12, 11];
  widths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w;
  });

  let r = 1;
  r = writeBanner(worksheet, r, COLS, `ALL-TIME ATTENDANCE RANKINGS  ·  ${periodLabel}`);

  const metas: [string, string][] = [
    ["Report Period",  periodLabel],
    ["Total Teachers", String(summaries.length)],
    ["Generated On",   new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })],
    ["Prepared By",    `${COLLEGE_SHORT} Administration`],
  ];
  r = writeMeta(worksheet, r, COLS, metas);
  r = writeSectionLabel(worksheet, r, COLS, "  ATTENDANCE PERFORMANCE LEADERBOARD");

  // Headers
  worksheet.getRow(r).height = 26;
  const headers = [
    "Rank", "Teacher Name", "Email",
    "Total\nDays", "Present", "Absent", "Late", "Half\nDay", "Leave",
    "Attendance\nRate %", "Avg\nCheck-In", "Avg\nCheck-Out", "Grade",
  ];
  headers.forEach((h, i) => {
    styleCell(worksheet.getCell(r, i + 1), {
      value: h,
      bold: true,
      bg: "FF1E40AF",
      fg: "FFFFFFFF",
      sz: 10
    });
  });
  r++;

  summaries.forEach((s, idx) => {
    worksheet.getRow(r).height = 22;
    const rank = idx + 1;
    const isMedal = rank <= 3;

    let rowBg  = idx % 2 === 1 ? "FFF8FAFC" : "FFFFFFFF";
    let rankBg = "FFEFF6FF";
    let rankFg = "FF1E3A8A";
    let rankLabel = `#${rank}`;

    if (rank === 1) { rowBg = "FFFEF3C7"; rankBg = "FFD97706"; rankFg = "FFFFFFFF"; rankLabel = "🥇 #1"; }
    if (rank === 2) { rowBg = "FFF1F5F9"; rankBg = "FF94A3B8"; rankFg = "FFFFFFFF"; rankLabel = "🥈 #2"; }
    if (rank === 3) { rowBg = "FFFFEDD5"; rankBg = "FF9A3412"; rankFg = "FFFFFFFF"; rankLabel = "🥉 #3"; }

    styleCell(worksheet.getCell(r, 1), {
      value: rankLabel,
      bold: true,
      bg: rankBg,
      fg: rankFg,
      sz: isMedal ? 11 : 10,
      borderStyle: isMedal ? "medium" : "thin"
    });

    styleCell(worksheet.getCell(r, 2),  { value: s.teacherName,  align: "left", bold: isMedal, bg: rowBg });
    styleCell(worksheet.getCell(r, 3),  { value: s.teacherEmail, align: "left", bg: rowBg });
    styleCell(worksheet.getCell(r, 4),  { value: s.total,        align: "center", bg: rowBg });
    
    styleCell(worksheet.getCell(r, 5),  { value: s.present,      align: "center", bg: "FFD1FAE5", fg: "FF065F46", bold: true });
    styleCell(worksheet.getCell(r, 6),  { value: s.absent,       align: "center", bg: s.absent > 0 ? "FFFEE2E2" : rowBg, fg: s.absent > 0 ? "FF991B1B" : "FF0F172A", bold: s.absent > 0 });
    styleCell(worksheet.getCell(r, 7),  { value: s.late,         align: "center", bg: s.late > 0 ? "FFFEF3C7" : rowBg, fg: s.late > 0 ? "FF92400E" : "FF0F172A", bold: s.late > 0 });
    styleCell(worksheet.getCell(r, 8),  { value: s.half_day,     align: "center", bg: s.half_day > 0 ? "FFDBEAFE" : rowBg, fg: s.half_day > 0 ? "FF1E40AF" : "FF0F172A", bold: s.half_day > 0 });
    styleCell(worksheet.getCell(r, 9),  { value: s.leave,        align: "center", bg: s.leave > 0 ? "FFEDE9FE" : rowBg, fg: s.leave > 0 ? "FF4C1D95" : "FF0F172A", bold: s.leave > 0 });

    styleCell(worksheet.getCell(r, 10), {
      value: `${s.presentRate}%`,
      bold: true,
      bg: s.presentRate >= 90 ? "FFD1FAE5" : s.presentRate >= 75 ? "FFFEF3C7" : "FFFEE2E2",
      fg: s.presentRate >= 90 ? "FF065F46" : s.presentRate >= 75 ? "FF92400E" : "FF991B1B",
      sz: isMedal ? 12 : 10,
      borderStyle: isMedal ? "medium" : "thin"
    });

    styleCell(worksheet.getCell(r, 11), { value: s.avgCheckIn,  align: "center", bg: rowBg });
    styleCell(worksheet.getCell(r, 12), { value: s.avgCheckOut, align: "center", bg: rowBg });
    
    // Grade
    const cellGrade = worksheet.getCell(r, 13);
    const gradeLabel = s.presentRate >= 90 ? "Excellent" : s.presentRate >= 75 ? "Good" : s.presentRate >= 60 ? "Average" : "Poor";
    const gradeFg    = s.presentRate >= 90 ? "FF065F46" : s.presentRate >= 75 ? "FF92400E" : s.presentRate >= 60 ? "FF1E40AF" : "FF991B1B";
    const gradeBg    = s.presentRate >= 90 ? "FFD1FAE5" : s.presentRate >= 75 ? "FFFEF3C7" : s.presentRate >= 60 ? "FFDBEAFE" : "FFFEE2E2";
    styleCell(cellGrade, { value: gradeLabel, bold: true, bg: gradeBg, fg: gradeFg });

    r++;
  });

  // Spacer
  worksheet.getRow(r).height = 10;
  mergeAndStyle(worksheet, r, 1, r, COLS, "", {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } }
  });
  r++;

  r = writeFootNote(worksheet, r, COLS);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function exportAllTeachersSummary(
  records: AttendanceHistoryRecord[],
  teachers: Teacher[],
  month: number,
  year: number,
  rangeLabel?: string
) {
  const period = rangeLabel ?? monthName(month, year);
  const fileTag = period.replace(/\s+/g, "_");
  const workbook = new ExcelJS.Workbook();

  // 1. Summary sheet
  const summarySheet = workbook.addWorksheet("Summary");
  buildSummarySheet(summarySheet, records, teachers, period);

  // 2. Individual sheets
  teachers.forEach(t => {
    const tRecs = records.filter(r => r.teacherId === t.id);
    const email = tRecs[0]?.teacherEmail ?? t.email;
    const sheetName = t.name.substring(0, 28).replace(/[\\/*?[\]]/g, "_");
    const teacherSheet = workbook.addWorksheet(sheetName);
    buildTeacherSheet(teacherSheet, tRecs, t.name, email, period);
  });

  await saveWorkbook(workbook, `Daily_Log_Report_${fileTag}.xlsx`);
}

export async function exportSingleTeacherReport(
  teacherRecords: AttendanceHistoryRecord[],
  teacherName: string,
  teacherEmail: string,
  month: number,
  year: number,
  rangeLabel?: string
) {
  const period   = rangeLabel ?? monthName(month, year);
  const fileTag  = period.replace(/\s+/g, "_");
  const safeName = teacherName.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/ /g, "_");
  const workbook = new ExcelJS.Workbook();
  const sheetName = teacherName.substring(0, 28).replace(/[\\/*?[\]]/g, "_");

  const teacherSheet = workbook.addWorksheet(sheetName);
  buildTeacherSheet(teacherSheet, teacherRecords, teacherName, teacherEmail, period);

  await saveWorkbook(workbook, `${safeName}_Attendance_${fileTag}.xlsx`);
}

export async function exportMonthlyMatrix(
  records: AttendanceHistoryRecord[],
  teachers: Teacher[],
  month: number,
  year: number
) {
  const period  = monthName(month, year);
  const fileTag = period.replace(/\s+/g, "_");
  const workbook = new ExcelJS.Workbook();

  const registerSheet = workbook.addWorksheet("Attendance Register");
  buildMonthlyMatrixSheet(registerSheet, records, teachers, month, year);

  await saveWorkbook(workbook, `Attendance_Register_${fileTag}.xlsx`);
}

export async function exportMonthlySummaryReport(
  summaries: TeacherSummary[],
  month: number,
  year: number,
  rangeLabel?: string
) {
  const period  = rangeLabel ?? monthName(month, year);
  const fileTag = period.replace(/\s+/g, "_");
  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet("Monthly Summary");
  buildMonthlySummarySheet(summarySheet, summaries, period);

  await saveWorkbook(workbook, `Monthly_Summary_${fileTag}.xlsx`);
}

export async function exportAllTimeRankings(
  summaries: TeacherSummary[],
  rangeLabel?: string
) {
  const period  = rangeLabel ?? new Date().getFullYear().toString();
  const fileTag = period.replace(/\s+/g, "_");
  const workbook = new ExcelJS.Workbook();

  const rankingsSheet = workbook.addWorksheet("Rankings");
  buildRankingsSheet(rankingsSheet, summaries, period);

  await saveWorkbook(workbook, `Attendance_Rankings_${fileTag}.xlsx`);
}
