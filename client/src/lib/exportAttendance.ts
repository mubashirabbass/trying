/**
 * exportAttendance.ts
 * Excel export helpers for the Teacher Attendance system.
 * Uses SheetJS (xlsx) for browser-side workbook generation.
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  present:  "Present",
  absent:   "Absent",
  late:     "Late",
  half_day: "Half Day",
  leave:    "Leave",
  weekend:  "Weekend / Off",
};

function pct(num: number, denom: number) {
  if (denom === 0) return "0%";
  return `${Math.round((num / denom) * 100)}%`;
}

/** Apply a uniform column-width array to a worksheet */
function autoWidth(ws: XLSX.WorkSheet, data: unknown[][]) {
  const widths: number[] = [];
  data.forEach((row) =>
    row.forEach((cell, c) => {
      const len = String(cell ?? "").length;
      widths[c] = Math.max(widths[c] ?? 8, len + 2);
    })
  );
  ws["!cols"] = widths.map((w) => ({ wch: Math.min(w, 40) }));
}

/** Style a header cell with bold + fill */
function headerCell(value: string): XLSX.CellObject {
  return {
    v: value,
    t: "s",
    s: {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E40AF" } },          // blue-800
      alignment: { horizontal: "center", wrapText: true },
      border: {
        bottom: { style: "thin", color: { rgb: "93C5FD" } },
      },
    },
  };
}

/** Trigger a browser download */
function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename, { compression: true });
}

// ─── Export 1: All-Teachers Summary ──────────────────────────────────────────

/**
 * Generates an Excel file with two sheets:
 *   1. "Summary" – one row per teacher, totals for each status + rate
 *   2. "All Records" – every individual attendance record (raw log)
 */
export function exportAllTeachersSummary(
  records: AttendanceHistoryRecord[],
  teachers: Teacher[],
  month: number,
  year: number
) {
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long" });
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ───────────────────────────────────────────────────────
  const summaryHeaders = [
    "#", "Teacher Name", "Email",
    "Working Days", "Present", "Absent", "Late", "Half Day", "Leave",
    "Attendance %", "Punctuality %",
  ];

  const teacherMap = new Map<number, {
    name: string; email: string;
    total: number; present: number; absent: number;
    late: number; half_day: number; leave: number;
  }>();

  teachers.forEach((t) =>
    teacherMap.set(t.id, {
      name: t.name, email: t.email,
      total: 0, present: 0, absent: 0, late: 0, half_day: 0, leave: 0,
    })
  );

  records.forEach((r) => {
    const entry = teacherMap.get(r.teacherId);
    if (!entry) return;
    entry.total += 1;
    if (r.status === "present")  entry.present  += 1;
    if (r.status === "absent")   entry.absent   += 1;
    if (r.status === "late")     entry.late     += 1;
    if (r.status === "half_day") entry.half_day += 1;
    if (r.status === "leave")    entry.leave    += 1;
  });

  const summaryRows: unknown[][] = [
    // Title row
    [`Teacher Attendance Summary — ${monthName} ${year}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    summaryHeaders.map(headerCell),
  ];

  let i = 1;
  let totPresent = 0, totAbsent = 0, totLate = 0, totHalfDay = 0, totLeave = 0, totDays = 0;

  teacherMap.forEach((entry) => {
    const attendanceRate = pct(entry.present + entry.late, entry.total);
    const punctualityRate = pct(entry.present, entry.total);
    summaryRows.push([
      i++,
      entry.name,
      entry.email,
      entry.total,
      entry.present,
      entry.absent,
      entry.late,
      entry.half_day,
      entry.leave,
      attendanceRate,
      punctualityRate,
    ]);
    totDays    += entry.total;
    totPresent += entry.present;
    totAbsent  += entry.absent;
    totLate    += entry.late;
    totHalfDay += entry.half_day;
    totLeave   += entry.leave;
  });

  // Totals row
  summaryRows.push([
    "", "TOTAL", "",
    totDays, totPresent, totAbsent, totLate, totHalfDay, totLeave,
    pct(totPresent + totLate, totDays),
    pct(totPresent, totDays),
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  // Merge title
  wsSummary["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: summaryHeaders.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: summaryHeaders.length - 1 } },
  ];
  autoWidth(wsSummary, summaryRows as unknown[][]);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // ── Sheet 2: All Records ───────────────────────────────────────────────────
  const logHeaders = [
    "#", "Date", "Teacher Name", "Email",
    "Status", "Check In", "Check Out", "Working Hours", "Notes", "Leave Type",
  ];

  const logRows: unknown[][] = [
    [`Detailed Attendance Log — ${monthName} ${year}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    logHeaders.map(headerCell),
  ];

  const sorted = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sorted.forEach((r, idx) => {
    logRows.push([
      idx + 1,
      new Date(r.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      r.teacherName,
      r.teacherEmail,
      STATUS_LABEL[r.status] ?? r.status,
      r.checkInTime  ?? "—",
      r.checkOutTime ?? "—",
      r.workingHours ?? "—",
      r.notes        ?? "—",
      r.leaveType    ?? "—",
    ]);
  });

  const wsLog = XLSX.utils.aoa_to_sheet(logRows);
  wsLog["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: logHeaders.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: logHeaders.length - 1 } },
  ];
  autoWidth(wsLog, logRows as unknown[][]);
  XLSX.utils.book_append_sheet(wb, wsLog, "All Records");

  downloadWorkbook(wb, `All_Teachers_Attendance_${monthName}_${year}.xlsx`);
}

// ─── Export 2: Single Teacher Report ─────────────────────────────────────────

/**
 * Generates a per-teacher report:
 *   1. "Summary" – totals card
 *   2. "Daily Log" – every record for that teacher
 */
export function exportSingleTeacherReport(
  teacherRecords: AttendanceHistoryRecord[],
  teacherName: string,
  teacherEmail: string,
  month: number,
  year: number
) {
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long" });
  const wb = XLSX.utils.book_new();

  // Count stats
  const stats = { total: 0, present: 0, absent: 0, late: 0, half_day: 0, leave: 0 };
  teacherRecords.forEach((r) => {
    stats.total += 1;
    if (r.status === "present")  stats.present  += 1;
    if (r.status === "absent")   stats.absent   += 1;
    if (r.status === "late")     stats.late     += 1;
    if (r.status === "half_day") stats.half_day += 1;
    if (r.status === "leave")    stats.leave    += 1;
  });

  const attendanceRate  = pct(stats.present + stats.late, stats.total);
  const punctualityRate = pct(stats.present, stats.total);

  // ── Sheet 1: Summary ───────────────────────────────────────────────────────
  const summaryData: unknown[][] = [
    [`Attendance Report — ${teacherName}`],
    [`Email: ${teacherEmail}`],
    [`Period: ${monthName} ${year}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    [headerCell("Metric"), headerCell("Value")],
    ["Working Days Recorded", stats.total],
    ["Present",              stats.present],
    ["Absent",               stats.absent],
    ["Late",                 stats.late],
    ["Half Day",             stats.half_day],
    ["Leave",                stats.leave],
    [],
    ["Attendance Rate",      attendanceRate],
    ["Punctuality Rate",     punctualityRate],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
  ];
  wsSummary["!cols"] = [{ wch: 28 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // ── Sheet 2: Daily Log ─────────────────────────────────────────────────────
  const logHeaders = [
    "#", "Date", "Day", "Status", "Check In", "Check Out", "Working Hours", "Notes", "Leave Type",
  ];

  const logRows: unknown[][] = [
    [`Daily Attendance — ${teacherName} — ${monthName} ${year}`],
    [],
    logHeaders.map(headerCell),
  ];

  const sorted = [...teacherRecords].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sorted.forEach((r, idx) => {
    const d = new Date(r.date);
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    logRows.push([
      idx + 1,
      d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      dayName,
      STATUS_LABEL[r.status] ?? r.status,
      r.checkInTime  ?? "—",
      r.checkOutTime ?? "—",
      r.workingHours ?? "—",
      r.notes        ?? "—",
      r.leaveType    ?? "—",
    ]);
  });

  // Totals row
  logRows.push([
    "", "TOTAL", "",
    `P:${stats.present} A:${stats.absent} L:${stats.late} H:${stats.half_day} Lv:${stats.leave}`,
    "", "", "", "", "",
  ]);

  const wsLog = XLSX.utils.aoa_to_sheet(logRows);
  wsLog["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: logHeaders.length - 1 } },
  ];
  autoWidth(wsLog, logRows as unknown[][]);
  XLSX.utils.book_append_sheet(wb, wsLog, "Daily Log");

  const safeName = teacherName.replace(/[^a-zA-Z0-9]/g, "_");
  downloadWorkbook(wb, `${safeName}_Attendance_${monthName}_${year}.xlsx`);
}
