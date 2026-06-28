import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Printer, Trash2, Plus, Edit, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LedgerEntry {
  id: string;
  date: string;
  pageNo: string;
  description: string;
  category: string;
  rs: number;
  ps: number;
}

interface CashbookData {
  year: string;
  month: string;
  expenseEntries: LedgerEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  "تنخواہ",
  "بجلی بل",
  "کرایہ",
  "سٹیشنری",
  "مرمت و دیکھ بھال",
  "انٹرنیٹ / فون",
  "دیگر خرچ",
];

const MONTHS = [
  { name: "جنوری", value: 1 }, 
  { name: "فروری", value: 2 }, 
  { name: "مارچ", value: 3 }, 
  { name: "اپریل", value: 4 }, 
  { name: "مئی", value: 5 }, 
  { name: "جون", value: 6 },
  { name: "جولائی", value: 7 }, 
  { name: "اگست", value: 8 }, 
  { name: "ستمبر", value: 9 }, 
  { name: "اکتوبر", value: 10 }, 
  { name: "نومبر", value: 11 }, 
  { name: "دسمبر", value: 12 },
];

const STORAGE_KEY = "gccs_cashbook_expenses_v1";

// ─── Filter Types ─────────────────────────────────────────────────────────────
type FilterType = "all" | "today" | "thisMonth" | "selectedDate" | "selectedMonth";

// ─── Pagination Constants ────────────────────────────────────────────────────
const ENTRIES_PER_PAGE = 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

const getTotal = (arr: LedgerEntry[]) => {
  let rs = 0, ps = 0;
  arr.forEach(e => { rs += e.rs; ps += e.ps; });
  const carry = Math.floor(ps / 100);
  return { rs: rs + carry, ps: ps % 100 };
};

const fmtAmt = (rs: number, ps: number) =>
  `${rs.toLocaleString()}.${ps.toString().padStart(2, "0")}`;

const makeEmpty = (): CashbookData => ({
  year: new Date().getFullYear().toString(),
  month: MONTHS[new Date().getMonth()].name,
  expenseEntries: [],
});

// ─── Filter Functions ────────────────────────────────────────────────────────

const filterEntries = (entries: LedgerEntry[], filterType: FilterType, filterDate: string, selectedYear: string, selectedMonth: string) => {
  const today = new Date().toISOString().split("T")[0];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  switch (filterType) {
    case "today":
      return entries.filter(e => e.date === today);
    
    case "thisMonth":
      return entries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate.getMonth() + 1 === currentMonth && 
               entryDate.getFullYear() === currentYear;
      });
    
    case "selectedDate":
      return filterDate ? entries.filter(e => e.date === filterDate) : entries;
    
    case "selectedMonth":
      return entries.filter(e => {
        const entryDate = new Date(e.date);
        const selectedMonthNum = MONTHS.find(m => m.name === selectedMonth)?.value || currentMonth;
        return entryDate.getMonth() + 1 === selectedMonthNum && 
               entryDate.getFullYear() === parseInt(selectedYear);
      });
    
    default:
      return entries;
  }
};

// ─── Entry Form Component ────────────────────────────────────────────────────

interface EntryFormProps {
  onAdd?: (e: LedgerEntry) => void;
  onUpdate?: (e: LedgerEntry) => void;
  onClose: () => void;
  editEntry?: LedgerEntry | null;
}

function EntryForm({ onAdd, onUpdate, onClose, editEntry }: EntryFormProps) {
  const { toast } = useToast();

  // Get current month/year context from parent or use current date
  const getCurrentMonthYear = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const year = urlParams.get('year') || new Date().getFullYear().toString();
    const month = urlParams.get('month') || MONTHS[new Date().getMonth()].name;
    return { year, month };
  };

  const { year: contextYear, month: contextMonth } = getCurrentMonthYear();
  const selectedMonthObj = MONTHS.find(m => m.name === contextMonth) || MONTHS[new Date().getMonth()];
  const defaultDate = `${contextYear}-${selectedMonthObj.value.toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`;

  const [date, setDate] = useState(editEntry?.date || defaultDate);
  const [pageNo, setPageNo] = useState(editEntry?.pageNo || "");
  const [desc, setDesc] = useState(editEntry?.description || "");
  const [cat, setCat] = useState(editEntry?.category || "");
  const [rs, setRs] = useState(editEntry?.rs.toString() || "");
  const [ps, setPs] = useState(editEntry?.ps.toString() || "");

  const reset = () => {
    setDesc("");
    setCat("");
    setRs("");
    setPs("");
    setPageNo("");
    setDate(defaultDate);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) {
      toast({ title: "تفصیل درج کریں", variant: "destructive" });
      return;
    }
    
    const entry: LedgerEntry = {
      id: editEntry?.id || uid(),
      date,
      pageNo,
      description: desc.trim(),
      category: cat,
      rs: parseInt(rs) || 0,
      ps: Math.min(parseInt(ps) || 0, 99),
    };

    if (editEntry && onUpdate) {
      onUpdate(entry);
      toast({ title: "خرچ اپڈیٹ ہو گیا ✓" });
    } else if (onAdd) {
      onAdd(entry);
      toast({ title: "خرچ شامل ہو گیا ✓" });
    }
    
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl" 
        onClick={e => e.stopPropagation()}
        style={{ direction: "rtl", fontFamily: "'Noto Nastaliq Urdu', serif" }}
      >
        {/* Header */}
        <div className="px-6 py-4 rounded-t-2xl flex items-center justify-between bg-rose-600">
          <h3 className="text-white font-bold text-base">
            📤 تفصیل خرچ — {editEntry ? "ترمیم" : "نئی اندراج"}
          </h3>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full h-8 w-8 flex items-center justify-center text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">تاریخ</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="h-10 text-right"
                required
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">صفحہ نمبر</Label>
              <Input
                type="text"
                value={pageNo}
                onChange={e => setPageNo(e.target.value)}
                className="h-10 text-right"
                placeholder="مثلاً 1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">خرچ کی تفصیل</Label>
            <Input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="h-10 text-right"
              placeholder="تفصیل درج کریں"
              required
            />
          </div>

          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">خرچ کی قسم</Label>
            <select
              value={cat}
              onChange={e => setCat(e.target.value)}
              className="w-full h-10 border border-input rounded-md px-3 text-right bg-background outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">-- قسم منتخب کریں --</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">رقم — روپیہ</Label>
              <Input
                type="number"
                value={rs}
                onChange={e => setRs(e.target.value)}
                className="h-10 text-right"
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">رقم — پیسہ</Label>
              <Input
                type="number"
                value={ps}
                onChange={e => setPs(e.target.value)}
                className="h-10 text-right"
                placeholder="00"
                min="0"
                max="99"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 h-10 text-sm font-bold bg-rose-600 hover:bg-rose-700">
              {editEntry ? "✔ اپڈیٹ کریں" : "✔ شامل کریں"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="px-6 h-10 text-sm font-bold">
              منسوخ
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Ledger Table Component ──────────────────────────────────────────────────

interface LedgerTableProps {
  entries: LedgerEntry[];
  onRemove: (id: string) => void;
  onEdit: (entry: LedgerEntry) => void;
}

function LedgerTable({ entries, onRemove, onEdit }: LedgerTableProps) {
  const total = getTotal(entries);

  return (
    <div 
      className="bg-white rounded-xl border-2 border-gray-300 overflow-hidden shadow-lg"
      style={{ direction: "rtl", fontFamily: "'Noto Nastaliq Urdu', serif" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">تاریخ</th>
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">تفصیل خرچ</th>
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">صفحہ</th>
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">
                رقم<br />روپیہ
              </th>
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">پیسہ</th>
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">
                میزان<br />روپیہ
              </th>
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">پیسہ</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-bold text-gray-700 print:hidden">عمل</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-gray-300 px-4 py-12 text-center text-gray-400 text-sm">
                  کوئی اندراج موجود نہیں
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => {
                const runningTotal = getTotal(entries.slice(0, idx + 1));
                return (
                  <tr key={entry.id} className="hover:bg-rose-50">
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right">
                      {new Date(entry.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right">
                      <div className="font-semibold">{entry.description}</div>
                      {entry.category && (
                        <div className="text-xs text-gray-500 mt-0.5">{entry.category}</div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                      {entry.pageNo || "-"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right font-mono font-semibold text-rose-700">
                      {entry.rs.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right font-mono">
                      {entry.ps.toString().padStart(2, "0")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right font-mono font-semibold bg-rose-50">
                      {runningTotal.rs.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right font-mono bg-rose-50">
                      {runningTotal.ps.toString().padStart(2, "0")}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(entry)}
                          className="text-blue-600 hover:bg-blue-50 rounded p-1 transition-colors"
                          title="ترمیم کریں"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onRemove(entry.id)}
                          className="text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
                          title="حذف کریں"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="bg-rose-600 text-white font-bold">
              <td colSpan={3} className="border border-white/30 px-3 py-3 text-sm">
                کل خرچ
              </td>
              <td className="border border-white/30 px-3 py-3 text-sm text-right font-mono">
                {total.rs.toLocaleString()}
              </td>
              <td className="border border-white/30 px-3 py-3 text-sm text-right font-mono">
                {total.ps.toString().padStart(2, "0")}
              </td>
              <td colSpan={3} className="border border-white/30"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CashbookExpenses() {
  const { toast } = useToast();
  const [data, setData] = useState<CashbookData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return makeEmpty();
      }
    }
    return makeEmpty();
  });
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  
  // Filter states
  const [filterType, setFilterType] = useState<FilterType>("selectedMonth");
  const [filterDate, setFilterDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Initialize with current month/year filter
  useEffect(() => {
    setFilterType("selectedMonth");
  }, [data.year, data.month]);

  const set = (p: Partial<CashbookData>) => {
    const newData = { ...data, ...p };
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const addEntry = (entry: LedgerEntry) => {
    set({ expenseEntries: [...data.expenseEntries, entry] });
  };

  const updateEntry = (entry: LedgerEntry) => {
    set({ 
      expenseEntries: data.expenseEntries.map(e => e.id === entry.id ? entry : e) 
    });
  };

  const removeEntry = (id: string) => {
    if (!window.confirm("کیا آپ واقعی یہ اندراج حذف کرنا چاہتے ہیں؟")) return;
    set({ expenseEntries: data.expenseEntries.filter(e => e.id !== id) });
    toast({ title: "اندراج حذف ہو گیا" });
  };

  const clearAll = () => {
    if (!window.confirm("کیا آپ تمام خرچ کی تفصیلات صاف کرنا چاہتے ہیں؟")) return;
    const empty = makeEmpty();
    setData(empty);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    toast({ title: "تمام ڈیٹا صاف ہو گیا" });
  };

  const total = getTotal(data.expenseEntries);
  const filteredEntries = filterEntries(data.expenseEntries, filterType, filterDate, data.year, data.month);
  const filteredTotal = getTotal(filteredEntries);
  
  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);
  const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
  const endIndex = startIndex + ENTRIES_PER_PAGE;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterDate, data.year, data.month]);

  // Print-specific: Split entries into pages (50 entries per page for print)
  const PRINT_ENTRIES_PER_PAGE = 50;
  const printPages: LedgerEntry[][] = [];
  for (let i = 0; i < filteredEntries.length; i += PRINT_ENTRIES_PER_PAGE) {
    printPages.push(filteredEntries.slice(i, i + PRINT_ENTRIES_PER_PAGE));
  }
  
  // If no entries, create one empty page
  if (printPages.length === 0) {
    printPages.push([]);
  }

  // Get filter description
  const getFilterDescription = () => {
    if (filterType === "all") return "تمام ریکارڈز";
    if (filterType === "today") return `آج کی تاریخ: ${new Date().toLocaleDateString("en-GB")}`;
    if (filterType === "thisMonth") return `موجودہ ماہ: ${new Date().toLocaleDateString("ur-PK", { year: "numeric", month: "long" })}`;
    if (filterType === "selectedDate" && filterDate) return `منتخب تاریخ: ${new Date(filterDate).toLocaleDateString("en-GB")}`;
    if (filterType === "selectedMonth") return `منتخب ماہ: ${data.month} ${data.year}`;
    return "";
  };

  return (
    <DashboardLayout>
      <div className="pb-12" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
        
        {/* Print Layout - Hidden on Screen */}
        <div className="hidden print:block">
          {printPages.map((pageEntries, pageIndex) => {
            const pageTotal = getTotal(pageEntries);
            const currentDateTime = new Date().toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
            
            return (
              <div key={pageIndex} className="print-page page-break" style={{ direction: "rtl", fontFamily: "'Noto Nastaliq Urdu', serif" }}>
                {/* Professional Letterhead Header */}
                <div className="print-header">
                  {/* Top Branding Section */}
                  <div className="border-4 border-rose-600 rounded-lg p-4 mb-3 bg-gradient-to-r from-rose-50 to-white">
                    <div className="flex items-center justify-between">
                      {/* Left: Logo/Icon */}
                      <div className="text-center" style={{ width: "15%" }}>
                        <div className="w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center mx-auto mb-1">
                          <span className="text-3xl">🎓</span>
                        </div>
                      </div>
                      
                      {/* Center: Institution Details */}
                      <div className="text-center" style={{ width: "70%" }}>
                        <h1 className="text-2xl font-black text-rose-800 mb-1" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
                          گلوبل کالج آف کمپیوٹر سائنس
                        </h1>
                        <p className="text-sm font-bold text-rose-700 mb-1">
                          Global College of Computer Science
                        </p>
                        <p className="text-xs text-gray-600">
                          📍 پتہ: [College Address] | ☎ رابطہ: [Phone] | ✉ [Email]
                        </p>
                      </div>
                      
                      {/* Right: Document Type */}
                      <div className="text-center" style={{ width: "15%" }}>
                        <div className="w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center mx-auto mb-1">
                          <span className="text-3xl">📤</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Document Title Bar */}
                  <div className="bg-rose-600 text-white py-2 px-4 mb-2 rounded">
                    <h2 className="text-center text-lg font-bold">خرچ کی کیش بک</h2>
                  </div>
                  
                  {/* Document Info Section */}
                  <div className="grid grid-cols-3 gap-2 mb-2 text-xs border-b-2 border-rose-300 pb-2">
                    <div className="text-right">
                      <span className="font-bold">ماہ: </span>
                      <span className="border-b border-black px-2">{data.month}</span>
                      <span className="font-bold ml-2">سال: </span>
                      <span className="border-b border-black px-2">{data.year}</span>
                    </div>
                    
                    <div className="text-center">
                      <span className="font-bold">تاریخ و وقت پرنٹ: </span>
                      <span className="border-b border-black px-2">{currentDateTime}</span>
                    </div>
                    
                    <div className="text-left">
                      {getFilterDescription() && (
                        <>
                          <span className="font-bold">فلٹر: </span>
                          <span className="border-b border-black px-2">{getFilterDescription()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Print Table */}
                <table className="w-full border-collapse border-2 border-black print-table">
                  <thead>
                    <tr>
                      <th className="border-2 border-black px-2 py-2 text-xs font-bold">تاریخ</th>
                      <th className="border-2 border-black px-2 py-2 text-xs font-bold">تفصیل خرچ</th>
                      <th className="border-2 border-black px-2 py-2 text-xs font-bold">صفحہ</th>
                      <th className="border-2 border-black px-2 py-2 text-xs font-bold">رقم روپیہ</th>
                      <th className="border-2 border-black px-2 py-2 text-xs font-bold">پیسہ</th>
                      <th className="border-2 border-black px-2 py-2 text-xs font-bold">میزان روپیہ</th>
                      <th className="border-2 border-black px-2 py-2 text-xs font-bold">پیسہ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-black px-2 py-20 text-center text-gray-400 text-sm">
                          کوئی اندراج موجود نہیں
                        </td>
                      </tr>
                    ) : (
                      pageEntries.map((entry, idx) => {
                        const globalIndex = pageIndex * PRINT_ENTRIES_PER_PAGE + idx;
                        const runningTotal = getTotal(filteredEntries.slice(0, globalIndex + 1));
                        return (
                          <tr key={entry.id}>
                            <td className="border border-black px-2 py-1 text-xs text-right">
                              {new Date(entry.date).toLocaleDateString("en-GB")}
                            </td>
                            <td className="border border-black px-2 py-1 text-xs text-right">
                              <div className="font-semibold">{entry.description}</div>
                              {entry.category && (
                                <div className="text-xs text-gray-600">({entry.category})</div>
                              )}
                            </td>
                            <td className="border border-black px-2 py-1 text-xs text-center">
                              {entry.pageNo || "-"}
                            </td>
                            <td className="border border-black px-2 py-1 text-xs text-right font-semibold">
                              {entry.rs.toLocaleString()}
                            </td>
                            <td className="border border-black px-2 py-1 text-xs text-right">
                              {entry.ps.toString().padStart(2, "0")}
                            </td>
                            <td className="border border-black px-2 py-1 text-xs text-right font-bold">
                              {runningTotal.rs.toLocaleString()}
                            </td>
                            <td className="border border-black px-2 py-1 text-xs text-right font-bold">
                              {runningTotal.ps.toString().padStart(2, "0")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="border-2 border-black px-2 py-2 text-xs font-bold bg-gray-100">
                        اس صفحہ کا کل خرچ ({pageEntries.length} اندراجات)
                      </td>
                      <td className="border-2 border-black px-2 py-2 text-xs text-right font-bold bg-gray-100">
                        {pageTotal.rs.toLocaleString()}
                      </td>
                      <td className="border-2 border-black px-2 py-2 text-xs text-right font-bold bg-gray-100">
                        {pageTotal.ps.toString().padStart(2, "0")}
                      </td>
                      <td colSpan={2} className="border-2 border-black bg-gray-100 px-2 py-2 text-xs text-center">
                        صفحہ {pageIndex + 1} از {printPages.length}
                      </td>
                    </tr>
                    {pageIndex === printPages.length - 1 && filteredEntries.length > 0 && (
                      <tr>
                        <td colSpan={3} className="border-2 border-black px-2 py-2 text-sm font-bold bg-rose-100">
                          مجموعی کل خرچ ({filteredEntries.length} اندراجات)
                        </td>
                        <td className="border-2 border-black px-2 py-2 text-sm text-right font-bold bg-rose-100">
                          {filteredTotal.rs.toLocaleString()}
                        </td>
                        <td className="border-2 border-black px-2 py-2 text-sm text-right font-bold bg-rose-100">
                          {filteredTotal.ps.toString().padStart(2, "0")}
                        </td>
                        <td colSpan={2} className="border-2 border-black bg-rose-100"></td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            );
          })}
        </div>
        
        {/* Toolbar */}
        <div className="mb-4 bg-rose-600 border-b-2 border-rose-800 p-3 flex flex-wrap items-center gap-2 print:hidden sticky top-0 z-10 shadow-lg">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-white text-rose-700 hover:bg-rose-50 font-bold h-9 px-4 text-sm"
            style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
          >
            <Plus className="h-4 w-4 ml-2" /> 📤 نیا خرچ
          </Button>

          <Link href="/admin/cashbook-income">
            <Button
              className="bg-rose-800 hover:bg-rose-900 text-white font-bold h-9 px-4 text-sm"
              style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
            >
              📥 آمدن کی کیش بک
            </Button>
          </Link>

          <div className="h-6 w-px bg-rose-400 mx-1"></div>

          <Button
            onClick={() => window.print()}
            variant="outline"
            className="font-bold h-9 px-3 bg-white/10 border-white/30 text-white hover:bg-white/20 text-sm"
            style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
          >
            <Printer className="h-3 w-3 ml-1" /> پرنٹ
          </Button>

          <div className="h-6 w-px bg-rose-400 mx-1"></div>

          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="font-bold h-9 px-3 bg-white/10 border-white/30 text-white hover:bg-white/20 text-sm"
            style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
          >
            <Filter className="h-3 w-3 ml-1" /> فلٹر
          </Button>
        </div>

        {/* Filter Section */}
        {showFilters && (
          <div 
            className="mb-4 bg-rose-100 border border-rose-300 rounded-lg p-3 print:hidden"
            style={{ direction: "rtl", fontFamily: "'Noto Nastaliq Urdu', serif" }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs font-bold text-rose-800">فلٹر:</Label>
              
              <div className="flex flex-wrap gap-1">
                <Button
                  onClick={() => setFilterType("all")}
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2"
                >
                  تمام
                </Button>
                
                <Button
                  onClick={() => setFilterType("today")}
                  variant={filterType === "today" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2"
                >
                  آج
                </Button>
                
                <Button
                  onClick={() => setFilterType("thisMonth")}
                  variant={filterType === "thisMonth" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2"
                >
                  اس ماہ
                </Button>
                
                <Button
                  onClick={() => setFilterType("selectedMonth")}
                  variant={filterType === "selectedMonth" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2"
                >
                  منتخب ماہ
                </Button>

                <Button
                  onClick={() => setFilterType("selectedDate")}
                  variant={filterType === "selectedDate" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2"
                >
                  منتخب تاریخ
                </Button>
              </div>

              {filterType === "selectedDate" && (
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-32 h-7 text-xs"
                />
              )}
            </div>
            
            <div className="mt-2 pt-2 border-t border-rose-300">
              <p className="text-xs text-rose-700">
                <strong>نتائج:</strong> {filteredEntries.length} ریکارڈز | 
                <strong> کل:</strong> {fmtAmt(filteredTotal.rs, filteredTotal.ps)} روپے | 
                <strong> صفحہ:</strong> {currentPage}/{totalPages}
              </p>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div 
          className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-300 rounded-lg p-4 mb-4 shadow-sm"
          style={{ direction: "rtl" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div>
                <Label className="text-xs font-semibold text-rose-700 mb-1 block">سال</Label>
                <Input
                  type="number"
                  value={data.year}
                  onChange={e => set({ year: e.target.value })}
                  className="w-20 h-8 text-right font-bold border-rose-300 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-rose-700 mb-1 block">ماہ</Label>
                <select
                  value={data.month}
                  onChange={e => set({ month: e.target.value })}
                  className="h-8 px-2 border border-rose-300 rounded-md text-right bg-white font-bold w-24 text-sm"
                >
                  {MONTHS.map(m => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-lg font-black text-rose-900 mb-1">📤 خرچ کی کیش بک</h1>
              <p className="text-xs text-rose-700 font-semibold">Global College of Computer Science</p>
            </div>
          </div>

          {/* Balance Summary */}
          <div className="mt-3 pt-3 border-t border-rose-300">
            <div className="bg-rose-600 border border-rose-700 rounded-lg p-4 text-center">
              <p className="text-xs font-bold text-rose-100 uppercase mb-1">
                {filterType === "all" ? "کل خرچ" : 
                 filterType === "today" ? "آج کا خرچ" :
                 filterType === "thisMonth" ? "اس ماہ کا خرچ" :
                 filterType === "selectedDate" ? "منتخب تاریخ کا خرچ" :
                 "منتخب ماہ کا خرچ"}
              </p>
              <p className="text-xl font-black text-white font-mono">
                {fmtAmt(filteredTotal.rs, filteredTotal.ps)} روپے
              </p>
              <p className="text-xs text-rose-100 mt-1">
                {filteredEntries.length} اندراجات
                {filterType !== "all" && (
                  <span className="ml-2 text-rose-200">
                    (کل: {data.expenseEntries.length})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <LedgerTable
          entries={paginatedEntries}
          onRemove={removeEntry}
          onEdit={(entry) => {
            setEditingEntry(entry);
            setShowForm(true);
          }}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div 
            className="mt-4 flex items-center justify-between bg-white rounded-lg border border-gray-300 p-3 print:hidden shadow-sm"
            style={{ direction: "rtl", fontFamily: "'Noto Nastaliq Urdu', serif" }}
          >
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-600">
                صفحہ {currentPage}/{totalPages} | 
                کل {filteredEntries.length} | 
                صفحے میں {paginatedEntries.length}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                پہلا
              </Button>
              
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="h-7 px-1"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage <= 2) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="h-7 px-1"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              
              <Button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                آخری
              </Button>
            </div>
          </div>
        )}

        {/* Entry Form Modal */}
        {showForm && (
          <EntryForm
            editEntry={editingEntry}
            onAdd={entry => {
              addEntry(entry);
              setShowForm(false);
              setEditingEntry(null);
            }}
            onUpdate={entry => {
              updateEntry(entry);
              setShowForm(false);
              setEditingEntry(null);
            }}
            onClose={() => {
              setShowForm(false);
              setEditingEntry(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
