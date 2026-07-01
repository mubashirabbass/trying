/**
 * exportPayroll.ts
 * Professional Excel export for the Payroll Ledger.
 * Produces fully-styled workbooks with college branding, color-coded
 * status cells, bordered tables, summary metadata blocks, and grand totals.
 *
 * Uses ExcelJS for advanced formatting and styling.
 */
import ExcelJS from "exceljs";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayrollRecord {
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  baseSalary: number;
  allowance: number;
  deductions: number;
  netPaid: number;
  payDate: string | null;
  paymentMethod: string | null;
  status: "Paid" | "Pending";
  notes: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLEGE_NAME  = "Global College of Computer Science & Commerce";
const COLLEGE_SHORT = "GCCSC";

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

// ─── Public API ───────────────────────────────────────────────────────────────

export async function exportMonthlyPayrollReport(
  records: PayrollRecord[],
  month: string,
  year: number
) {
  const periodLabel = `${month} ${year}`;
  const fileTag = periodLabel.replace(/\s+/g, "_");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Payroll Ledger");

  const COLS = 11;
  const widths = [5, 24, 28, 12, 14, 14, 14, 14, 16, 12, 28];
  widths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w;
  });

  let r = 1;
  
  // Banner
  r = writeBanner(worksheet, r, COLS, `MONTHLY PAYROLL LEDGER  ·  ${periodLabel}`);

  // Metadata block
  const totalFaculty = records.length;
  const paidCount = records.filter(rec => rec.status === "Paid").length;
  const pendingCount = totalFaculty - paidCount;
  const totalNetDisbursed = records.reduce((sum, rec) => sum + (rec.status === "Paid" ? rec.netPaid : 0), 0);

  const metas: [string, string][] = [
    ["Report Type",    "Monthly Payroll Ledger"],
    ["Report Period",  periodLabel],
    ["Total Faculty",  `${totalFaculty} members`],
    ["Status Overview",`Paid: ${paidCount}  |  Pending: ${pendingCount}`],
    ["Net Disbursed",  `Rs. ${totalNetDisbursed.toLocaleString()}`],
    ["Generated On",   new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })],
    ["Prepared By",    `${COLLEGE_SHORT} Administration`],
  ];
  r = writeMeta(worksheet, r, COLS, metas);
  
  // Section Title
  r = writeSectionLabel(worksheet, r, COLS, "  FACULTY PAYROLL DISBURSEMENT DETAIL");

  // Table Headers
  worksheet.getRow(r).height = 26;
  const headers = [
    "#", "Faculty Member", "Email", "Status", "Base Salary",
    "Allowance", "Deductions", "Net Amount", "Payment Method", "Pay Date", "Transaction Notes"
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

  // Data rows
  let sumBase = 0, sumAllowance = 0, sumDeduction = 0, sumNet = 0;

  records.forEach((rec, idx) => {
    worksheet.getRow(r).height = 20;
    const isAlt = idx % 2 === 1;

    sumBase += rec.baseSalary;
    sumAllowance += rec.allowance;
    sumDeduction += rec.deductions;
    sumNet += rec.netPaid;

    styleCell(worksheet.getCell(r, 1), { value: idx + 1, align: "center", altRow: isAlt });
    styleCell(worksheet.getCell(r, 2), { value: rec.teacherName, align: "left", bold: true, altRow: isAlt });
    styleCell(worksheet.getCell(r, 3), { value: rec.teacherEmail, align: "left", altRow: isAlt });
    
    // Status
    const isPaid = rec.status === "Paid";
    styleCell(worksheet.getCell(r, 4), {
      value: rec.status,
      bold: true,
      bg: isPaid ? "FFD1FAE5" : "FFFEF3C7",
      fg: isPaid ? "FF065F46" : "FF92400E"
    });

    styleCell(worksheet.getCell(r, 5), { value: rec.baseSalary, align: "right", altRow: isAlt });
    styleCell(worksheet.getCell(r, 6), { value: rec.allowance, align: "right", bg: rec.allowance > 0 ? "FFD1FAE5" : undefined, fg: rec.allowance > 0 ? "FF065F46" : undefined, altRow: isAlt && rec.allowance === 0 });
    styleCell(worksheet.getCell(r, 7), { value: rec.deductions, align: "right", bg: rec.deductions > 0 ? "FFFEE2E2" : undefined, fg: rec.deductions > 0 ? "FF991B1B" : undefined, altRow: isAlt && rec.deductions === 0 });
    styleCell(worksheet.getCell(r, 8), { value: rec.netPaid, align: "right", bold: true, bg: isPaid ? "FFEFF6FF" : undefined, fg: isPaid ? "FF1E40AF" : undefined, altRow: isAlt && !isPaid });
    styleCell(worksheet.getCell(r, 9), { value: rec.paymentMethod ?? "—", align: "center", altRow: isAlt });
    styleCell(worksheet.getCell(r, 10), { value: rec.payDate ?? "—", align: "center", altRow: isAlt });
    styleCell(worksheet.getCell(r, 11), { value: rec.notes ?? "—", align: "left", altRow: isAlt });

    // Format currency columns
    worksheet.getCell(r, 5).numFmt = '"Rs. "#,##0';
    worksheet.getCell(r, 6).numFmt = '"Rs. "#,##0';
    worksheet.getCell(r, 7).numFmt = '"Rs. "#,##0';
    worksheet.getCell(r, 8).numFmt = '"Rs. "#,##0';

    r++;
  });

  // Grand Total Footer Row
  worksheet.getRow(r).height = 24;
  const footerVals = [
    "", "GRAND TOTAL", "", "", sumBase, sumAllowance, sumDeduction, sumNet, "", "", ""
  ];

  footerVals.forEach((v, i) => {
    const cell = worksheet.getCell(r, i + 1);
    styleCell(cell, {
      value: v,
      bold: true,
      bg: "FF1E3A8A",
      fg: "FFFFFFFF",
      align: i === 1 ? "left" : (i >= 4 && i <= 7 ? "right" : "center"),
      sz: 10
    });
  });

  worksheet.getCell(r, 5).numFmt = '"Rs. "#,##0';
  worksheet.getCell(r, 6).numFmt = '"Rs. "#,##0';
  worksheet.getCell(r, 7).numFmt = '"Rs. "#,##0';
  worksheet.getCell(r, 8).numFmt = '"Rs. "#,##0';

  r++;

  // Spacer
  worksheet.getRow(r).height = 10;
  mergeAndStyle(worksheet, r, 1, r, COLS, "", {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } }
  });
  r++;

  // Footnote
  worksheet.getRow(r).height = 20;
  const note = `${COLLEGE_NAME} · This document is system-generated and is valid without a signature.`;
  mergeAndStyle(worksheet, r, 1, r, COLS, note, {
    font: { italic: true, size: 9, color: { argb: "FF64748B" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } },
    alignment: { horizontal: "left", vertical: "middle" }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Payroll_Ledger_${fileTag}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Pay Slip Types & Builder ─────────────────────────────────────────────────

export interface PaySlipTeacher {
  id: number;
  name: string;
  email: string;
}

async function buildPaySlipSheet(
  ws: ExcelJS.Worksheet,
  teacher: PaySlipTeacher,
  record: PayrollRecord | null,
  month: string,
  year: number
) {
  const isPaid     = record !== null && record.status === "Paid";
  const base       = record?.baseSalary ?? 120000;
  const allowance  = record?.allowance ?? 0;
  const deductions = record?.deductions ?? 0;
  const gross      = base + allowance;
  const net        = gross - deductions;
  const periodLabel = `${month} ${year}`;
  const COLS = 8;

  [3, 20, 18, 4, 3, 20, 14, 12].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  let r = 1;

  // College Banner
  ws.getRow(r).height = 45;
  mergeAndStyle(ws, r, 1, r, COLS, COLLEGE_NAME, {
    font: { bold: true, size: 20, color: { argb: "FFDBEAFE" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } },
    alignment: { horizontal: "center", vertical: "middle" },
    border: { top: { style: "medium", color: { argb: "FF2563EB" } }, bottom: { style: "medium", color: { argb: "FF2563EB" } }, left: { style: "medium", color: { argb: "FF2563EB" } }, right: { style: "medium", color: { argb: "FF2563EB" } } }
  });
  r++;

  // Subtitle
  ws.getRow(r).height = 26;
  mergeAndStyle(ws, r, 1, r, COLS, `EMPLOYEE SALARY SLIP  ·  ${periodLabel}`, {
    font: { bold: true, size: 13, color: { argb: "FFDBEAFE" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } },
    alignment: { horizontal: "center", vertical: "middle" },
    border: { top: { style: "thin", color: { argb: "FF2563EB" } }, bottom: { style: "thin", color: { argb: "FF2563EB" } }, left: { style: "thin", color: { argb: "FF2563EB" } }, right: { style: "thin", color: { argb: "FF2563EB" } } }
  });
  r++;

  // Status Banner
  ws.getRow(r).height = 20;
  mergeAndStyle(ws, r, 1, r, COLS, isPaid ? "✓  SALARY PAID" : "⚠  SALARY PENDING — NOT YET PROCESSED", {
    font: { bold: true, size: 10, color: { argb: "FFFFFFFF" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: isPaid ? "FF059669" : "FFD97706" } },
    alignment: { horizontal: "center", vertical: "middle" }
  });
  r++;

  ws.getRow(r).height = 8;
  mergeAndStyle(ws, r, 1, r, COLS, "", { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } } });
  r++;

  // Employee Info
  ws.getRow(r).height = 22;
  mergeAndStyle(ws, r, 1, r, COLS, "  EMPLOYEE INFORMATION", {
    font: { bold: true, size: 10, color: { argb: "FFFFFFFF" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD97706" } },
    alignment: { horizontal: "left", vertical: "middle" },
    border: { top: { style: "thin", color: { argb: "FFD97706" } }, bottom: { style: "thin", color: { argb: "FFD97706" } }, left: { style: "medium", color: { argb: "FFD97706" } }, right: { style: "thin", color: { argb: "FFD97706" } } }
  });
  r++;

  const tb = { top: { style: "thin" as const, color: { argb: "FFCBD5E1" } }, bottom: { style: "thin" as const, color: { argb: "FFCBD5E1" } }, left: { style: "thin" as const, color: { argb: "FFCBD5E1" } }, right: { style: "thin" as const, color: { argb: "FFCBD5E1" } } };
  const lF = { font: { bold: true, size: 9, color: { argb: "FF1E3A8A" }, name: "Calibri" }, fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFDBEAFE" } }, alignment: { horizontal: "left" as const, vertical: "middle" as const }, border: tb };
  const vF = { font: { bold: false, size: 9, color: { argb: "FF0F172A" }, name: "Calibri" }, fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFFFFF" } }, alignment: { horizontal: "left" as const, vertical: "middle" as const }, border: tb };

  function infoRow(row: number, l1: string, v1: string, l2: string, v2: string) {
    ws.getRow(row).height = 20;
    mergeAndStyle(ws, row, 1, row, 2, l1, lF);
    mergeAndStyle(ws, row, 3, row, 4, v1, vF);
    mergeAndStyle(ws, row, 5, row, 6, l2, lF);
    mergeAndStyle(ws, row, 7, row, COLS, v2, vF);
  }

  const empId = `EMP-${String(teacher.id).padStart(4, "0")}`;
  infoRow(r, "Employee Name",  teacher.name,                       "Employee ID",    empId);      r++;
  infoRow(r, "Email Address",  teacher.email,                      "Designation",    "Faculty Member"); r++;
  infoRow(r, "Department",     "Academic Faculty",                  "Pay Period",     periodLabel); r++;
  infoRow(r, "Pay Date",       record?.payDate ?? "Not Processed",  "Payment Method", record?.paymentMethod ?? "—"); r++;

  ws.getRow(r).height = 10;
  mergeAndStyle(ws, r, 1, r, COLS, "", { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } } });
  r++;

  // Earnings | Deductions headers
  ws.getRow(r).height = 22;
  mergeAndStyle(ws, r, 1, r, 4, "  EARNINGS", { font: { bold: true, size: 10, color: { argb: "FFFFFFFF" }, name: "Calibri" }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF065F46" } }, alignment: { horizontal: "left", vertical: "middle" } });
  mergeAndStyle(ws, r, 5, r, COLS, "  DEDUCTIONS", { font: { bold: true, size: 10, color: { argb: "FFFFFFFF" }, name: "Calibri" }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } }, alignment: { horizontal: "left", vertical: "middle" } });
  r++;

  const hAllow = Math.round(allowance * 0.6);
  const oAllow = allowance - hAllow;
  const taxDed = Math.round(deductions * 0.5);
  const pfDed  = Math.round(deductions * 0.3);
  const othDed = deductions - taxDed - pfDed;

  const earnRows: [string, number, boolean][] = [
    ["Basic Salary",     base,      false],
    ["House Allowance",  hAllow,    false],
    ["Other Allowances", oAllow,    false],
    ["Gross Salary",     gross,     true ],
  ];
  const dedRows: [string, number, boolean][] = [
    ["Income Tax",       taxDed,    false],
    ["Provident Fund",   pfDed,     false],
    ["Other Deductions", othDed,    false],
    ["Total Deductions", deductions, true],
  ];

  earnRows.forEach(([el, ev, eT], i) => {
    ws.getRow(r).height = 20;
    const [dl, dv, dT] = dedRows[i];
    const ebg = eT ? "FFD1FAE5" : (i % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC");
    const dbg = dT ? "FFFEE2E2" : (i % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC");
    const efg = eT ? "FF065F46" : "FF0F172A";
    const dfg = dT ? "FF991B1B" : "FF0F172A";
    const ef  = { font: { bold: eT, size: 9, color: { argb: efg }, name: "Calibri" }, fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: ebg } }, alignment: { horizontal: "left" as const, vertical: "middle" as const }, border: tb };
    const efR = { ...ef, alignment: { horizontal: "right" as const, vertical: "middle" as const } };
    const df  = { font: { bold: dT, size: 9, color: { argb: dfg }, name: "Calibri" }, fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: dbg } }, alignment: { horizontal: "left" as const, vertical: "middle" as const }, border: tb };
    const dfR = { ...df, alignment: { horizontal: "right" as const, vertical: "middle" as const } };
    mergeAndStyle(ws, r, 1, r, 3, el, ef);
    mergeAndStyle(ws, r, 4, r, 4, `Rs. ${ev.toLocaleString()}`, efR);
    mergeAndStyle(ws, r, 5, r, 7, dl, df);
    mergeAndStyle(ws, r, COLS, r, COLS, `Rs. ${dv.toLocaleString()}`, dfR);
    r++;
  });

  ws.getRow(r).height = 10;
  mergeAndStyle(ws, r, 1, r, COLS, "", { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } } });
  r++;

  // Net Pay block
  ws.getRow(r).height = 38;
  mergeAndStyle(ws, r, 1, r, COLS, `NET SALARY:    Rs. ${net.toLocaleString()}`, {
    font: { bold: true, size: 18, color: { argb: "FFFFFFFF" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: isPaid ? "FF1E3A8A" : "FFB45309" } },
    alignment: { horizontal: "center", vertical: "middle" },
    border: { top: { style: "medium", color: { argb: "FF2563EB" } }, bottom: { style: "medium", color: { argb: "FF2563EB" } }, left: { style: "medium", color: { argb: "FF2563EB" } }, right: { style: "medium", color: { argb: "FF2563EB" } } }
  });
  r++;

  ws.getRow(r).height = 10;
  mergeAndStyle(ws, r, 1, r, COLS, "", { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } } });
  r++;

  // Notes
  ws.getRow(r).height = 20;
  mergeAndStyle(ws, r, 1, r, 2, "Notes / Remarks:", lF);
  mergeAndStyle(ws, r, 3, r, COLS, record?.notes ?? "—", vF);
  r++;

  ws.getRow(r).height = 16;
  mergeAndStyle(ws, r, 1, r, COLS, "", { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } } });
  r++;

  // Signature lines
  ws.getRow(r).height = 22;
  mergeAndStyle(ws, r, 1, r, 4, "Employee Signature: ____________________", { font: { size: 9, color: { argb: "FF64748B" }, name: "Calibri" }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }, alignment: { horizontal: "left", vertical: "middle" }, border: tb });
  mergeAndStyle(ws, r, 5, r, COLS, "Authorized Signatory: _________________", { font: { size: 9, color: { argb: "FF64748B" }, name: "Calibri" }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }, alignment: { horizontal: "left", vertical: "middle" }, border: tb });
  r++;

  ws.getRow(r).height = 8;
  mergeAndStyle(ws, r, 1, r, COLS, "", { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } } });
  r++;

  // Footer footnote
  ws.getRow(r).height = 18;
  mergeAndStyle(ws, r, 1, r, COLS, `${COLLEGE_NAME}  ·  This salary slip is system-generated and is valid without a manual signature.  ·  ${COLLEGE_SHORT}`, {
    font: { italic: true, size: 8, color: { argb: "FF94A3B8" }, name: "Calibri" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } },
    alignment: { horizontal: "center", vertical: "middle" }
  });
}

async function saveAs(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Public Pay Slip Exporters ────────────────────────────────────────────────

export async function exportPaySlip(
  teacher: PaySlipTeacher,
  record: PayrollRecord | null,
  month: string,
  year: number
) {
  const workbook = new ExcelJS.Workbook();
  const sheetName = teacher.name.substring(0, 28).replace(/[\\/*?[\]:]/g, "_");
  const ws = workbook.addWorksheet(sheetName);
  await buildPaySlipSheet(ws, teacher, record, month, year);
  const safeName = teacher.name.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/ +/g, "_");
  await saveAs(workbook, `PaySlip_${safeName}_${month}_${year}.xlsx`);
}

export async function exportBulkPaySlips(
  data: Array<{ teacher: PaySlipTeacher; record: PayrollRecord | null }>,
  month: string,
  year: number
) {
  const workbook = new ExcelJS.Workbook();
  for (const { teacher, record } of data) {
    const sheetName = teacher.name.substring(0, 28).replace(/[\\/*?[\]:]/g, "_");
    const ws = workbook.addWorksheet(sheetName);
    await buildPaySlipSheet(ws, teacher, record, month, year);
  }
  await saveAs(workbook, `PaySlips_All_${month}_${year}.xlsx`);
}

