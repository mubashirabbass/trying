import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Printer, Save, FolderOpen, Trash2 } from "lucide-react";

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

type ActiveTab = "income" | "expenses";

interface CashbookData {
  year: string;
  month: string;
  incomeEntries: LedgerEntry[];
  expenseEntries: LedgerEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INCOME_CATEGORIES = [
  "ماہانہ فیس",
  "داخلہ فیس",
  "سرٹیفکیٹ فیس",
  "کتب فروخت",
  "گرانٹ / امداد",
  "دیگر آمدن",
];

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
  "جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون",
  "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر",
];

const STORAGE_KEY = "gccs_cashbook_urdu_v1";

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
  month: MONTHS[new Date().getMonth()],
  incomeEntries: [],
  expenseEntries: [],
});

// ─── Entry Form Component ────────────────────────────────────────────────────

interface EntryFormProps {
  type: ActiveTab;
  onAdd: (e: LedgerEntry) => void;
  onClose: () => void;
}

function EntryForm({ type, onAdd, onClose }: EntryFormProps) {
  const { toast } = useToast();
  const isIncome = type === "income";
  const cats = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [pageNo, setPageNo] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [rs, setRs] = useState("");
  const [ps, setPs] = useState("");

  const reset = () => {
    setDesc("");
    setCat("");
    setRs("");
    setPs("");
    setPageNo("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) {
      toast({ title: "تفصیل درج کریں", variant: "destructive" });
      return;
    }
    onAdd({
      id: uid(),
      date,
      pageNo,
      description: desc.trim(),
      category: cat,
      rs: parseInt(rs) || 0,
      ps: Math.min(parseInt(ps) || 0, 99),
    });
    toast({ title: isIncome ? "آمدن شامل ہو گئی ✓" : "خرچ شامل ہو گیا ✓" });
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
        <div className={`px-6 py-4 rounded-t-2xl flex items-center justify-between ${
          isIncome ? "bg-emerald-600" : "bg-rose-600"
        }`}>
          <h3 className="text-white font-bold text-lg">
            {isIncome ? "📥 تفصیل آمدن — نئی اندراج" : "📤 تفصیل خرچ — نئی اندراج"}
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
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              {isIncome ? "آمدن کی تفصیل" : "خرچ کی تفصیل"}
            </Label>
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
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              {isIncome ? "آمدن کی قسم" : "خرچ کی قسم"}
            </Label>
            <select
              value={cat}
              onChange={e => setCat(e.target.value)}
              className="w-full h-10 border border-input rounded-md px-3 text-right bg-background outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">-- قسم منتخب کریں --</option>
              {cats.map(c => (
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
            <Button type="submit" className={`flex-1 h-11 text-base font-bold ${
              isIncome ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
            }`}>
              ✔ شامل کریں
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="px-6 h-11 text-base font-bold">
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
  type: ActiveTab;
  entries: LedgerEntry[];
  onRemove: (id: string) => void;
}

function LedgerTable({ type, entries, onRemove }: LedgerTableProps) {
  const isIncome = type === "income";
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
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">
                {isIncome ? "تفصیل آمدن" : "تفصیل خرچ"}
              </th>
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">صفحہ</th>
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">
                رقم<br />روپیہ
              </th>
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">پیسہ</th>
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">
                میزان<br />روپیہ
              </th>
              <th className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700">پیسہ</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-bold text-gray-700 print:hidden">حذف</th>
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
                  <tr key={entry.id} className="hover:bg-gray-50">
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
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right font-mono font-semibold">
                      {entry.rs.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right font-mono">
                      {entry.ps.toString().padStart(2, "0")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right font-mono font-semibold bg-gray-50">
                      {runningTotal.rs.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right font-mono bg-gray-50">
                      {runningTotal.ps.toString().padStart(2, "0")}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center print:hidden">
                      <button
                        onClick={() => onRemove(entry.id)}
                        className="text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
                        title="حذف کریں"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className={`${isIncome ? "bg-emerald-600" : "bg-rose-600"} text-white font-bold`}>
              <td colSpan={3} className="border border-white/30 px-3 py-3 text-base">
                {isIncome ? "کل آمدن" : "کل خرچ"}
              </td>
              <td className="border border-white/30 px-3 py-3 text-base text-right font-mono">
                {total.rs.toLocaleString()}
              </td>
              <td className="border border-white/30 px-3 py-3 text-base text-right font-mono">
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

export default function AdminCashbook() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("income");
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

  const set = (p: Partial<CashbookData>) => {
    const newData = { ...data, ...p };
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const addEntry = (type: ActiveTab, entry: LedgerEntry) => {
    if (type === "income") set({ incomeEntries: [...data.incomeEntries, entry] });
    else set({ expenseEntries: [...data.expenseEntries, entry] });
  };

  const removeEntry = (type: ActiveTab, id: string) => {
    if (!window.confirm("کیا آپ واقعی یہ اندراج حذف کرنا چاہتے ہیں؟")) return;
    if (type === "income") set({ incomeEntries: data.incomeEntries.filter(e => e.id !== id) });
    else set({ expenseEntries: data.expenseEntries.filter(e => e.id !== id) });
    toast({ title: "اندراج حذف ہو گیا" });
  };

  const saveData = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    toast({ title: "کیش بک محفوظ ہو گئی ✓" });
  };

  const loadData = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      toast({ title: "کوئی ڈیٹا موجود نہیں", variant: "destructive" });
      return;
    }
    try {
      const d = JSON.parse(raw);
      setData(d);
      toast({ title: "ڈیٹا لوڈ ہو گیا ✓" });
    } catch {
      toast({ title: "ڈیٹا لوڈ نہیں ہو سکا", variant: "destructive" });
    }
  };

  const clearAll = () => {
    if (!window.confirm("کیا آپ تمام ڈیٹا صاف کرنا چاہتے ہیں؟")) return;
    const empty = makeEmpty();
    setData(empty);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    toast({ title: "تمام ڈیٹا صاف ہو گیا" });
  };

  const incomeTotal = getTotal(data.incomeEntries);
  const expenseTotal = getTotal(data.expenseEntries);
  const balanceRs = incomeTotal.rs - expenseTotal.rs;
  const balancePs = incomeTotal.ps - expenseTotal.ps;

  return (
    <DashboardLayout>
      <div className="pb-12" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
        
        {/* Toolbar */}
        <div className="mb-6 bg-white border-b-4 border-rose-700 p-4 flex flex-wrap items-center gap-3 print:hidden sticky top-0 z-10 shadow-md">
          <Button
            onClick={() => {
              setActiveTab("income");
              setShowForm(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5"
            style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
          >
            📥 تفصیل آمدن درج کریں
          </Button>
          
          <Button
            onClick={() => {
              setActiveTab("expenses");
              setShowForm(true);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 px-5"
            style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
          >
            📤 تفصیل خرچ درج کریں
          </Button>

          <div className="h-8 w-px bg-gray-300 mx-2"></div>

          <Button
            onClick={() => window.print()}
            variant="outline"
            className="font-bold h-10 px-4"
            style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
          >
            <Printer className="h-4 w-4 ml-2" /> 🖨 پرنٹ
          </Button>

          <Button
            onClick={saveData}
            variant="outline"
            className="font-bold h-10 px-4"
            style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
          >
            <Save className="h-4 w-4 ml-2" /> 💾 محفوظ
          </Button>

          <Button
            onClick={loadData}
            variant="outline"
            className="font-bold h-10 px-4"
            style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
          >
            <FolderOpen className="h-4 w-4 ml-2" /> 📂 لوڈ
          </Button>

          <Button
            onClick={clearAll}
            variant="outline"
            className="font-bold h-10 px-4 border-red-300 text-red-600 hover:bg-red-50"
            style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
          >
            <Trash2 className="h-4 w-4 ml-2" /> 🗑 صاف
          </Button>
        </div>

        {/* Header Section */}
        <div 
          className="bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-300 rounded-xl p-6 mb-6 shadow-lg"
          style={{ direction: "rtl" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div>
                <Label className="text-sm font-semibold text-gray-600 mb-1 block">سال</Label>
                <Input
                  type="number"
                  value={data.year}
                  onChange={e => set({ year: e.target.value })}
                  className="w-28 h-10 text-right font-bold"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-600 mb-1 block">بابت ماہ</Label>
                <select
                  value={data.month}
                  onChange={e => set({ month: e.target.value })}
                  className="h-10 px-3 border border-input rounded-md text-right bg-background font-bold w-32"
                >
                  {MONTHS.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-gray-900 mb-1">کیش بک</h1>
              <p className="text-sm text-gray-600 font-semibold">Global College of Computer Science</p>
            </div>
          </div>

          {/* Balance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t-2 border-gray-300">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 text-center">
              <p className="text-xs font-bold text-emerald-700 uppercase mb-1">کل آمدن</p>
              <p className="text-2xl font-black text-emerald-700 font-mono">
                {fmtAmt(incomeTotal.rs, incomeTotal.ps)} روپے
              </p>
            </div>
            <div className="bg-rose-50 border-2 border-rose-200 rounded-lg p-4 text-center">
              <p className="text-xs font-bold text-rose-700 uppercase mb-1">کل خرچ</p>
              <p className="text-2xl font-black text-rose-700 font-mono">
                {fmtAmt(expenseTotal.rs, expenseTotal.ps)} روپے
              </p>
            </div>
            <div className={`border-2 rounded-lg p-4 text-center ${
              balanceRs >= 0 ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"
            }`}>
              <p className={`text-xs font-bold uppercase mb-1 ${
                balanceRs >= 0 ? "text-blue-700" : "text-amber-700"
              }`}>
                باقی رقم
              </p>
              <p className={`text-2xl font-black font-mono ${
                balanceRs >= 0 ? "text-blue-700" : "text-amber-700"
              }`}>
                {balanceRs >= 0 ? "" : "-"}{fmtAmt(Math.abs(balanceRs), Math.abs(balancePs))} روپے
              </p>
            </div>
          </div>
        </div>

        {/* Both Ledger Tables - Side by Side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Income Section */}
          <div className="space-y-4">
            <div 
              className="bg-emerald-600 text-white px-6 py-4 rounded-t-xl font-bold text-xl flex items-center justify-between"
              style={{ direction: "rtl", fontFamily: "'Noto Nastaliq Urdu', serif" }}
            >
              <span>📥 آمدن کی تفصیل</span>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                {data.incomeEntries.length} اندراج
              </span>
            </div>
            <LedgerTable
              type="income"
              entries={data.incomeEntries}
              onRemove={id => removeEntry("income", id)}
            />
          </div>

          {/* Expense Section */}
          <div className="space-y-4">
            <div 
              className="bg-rose-600 text-white px-6 py-4 rounded-t-xl font-bold text-xl flex items-center justify-between"
              style={{ direction: "rtl", fontFamily: "'Noto Nastaliq Urdu', serif" }}
            >
              <span>📤 خرچ کی تفصیل</span>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                {data.expenseEntries.length} اندراج
              </span>
            </div>
            <LedgerTable
              type="expenses"
              entries={data.expenseEntries}
              onRemove={id => removeEntry("expenses", id)}
            />
          </div>

        </div>

        {/* Entry Form Modal */}
        {showForm && (
          <EntryForm
            type={activeTab}
            onAdd={entry => {
              addEntry(activeTab, entry);
              setShowForm(false);
            }}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
