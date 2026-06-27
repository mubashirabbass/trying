import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  Loader2, 
  Search, 
  CreditCard, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  RotateCcw
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = [2025, 2026, 2027];

interface SalaryRecord {
  id: string;
  month: string;
  year: number;
  baseSalary: number;
  allowance: number;
  deductions: number;
  netPaid: number;
  payDate: string;
  paymentMethod: string;
  status: string;
  notes: string;
}

export default function AdminPayroll() {
  const { token } = useAuth();
  const { toast } = useToast();
  
  // Date states
  const [selectedMonth, setSelectedMonth] = useState("June");
  const [selectedYear, setSelectedYear] = useState(2026);
  
  // Data states
  const [staff, setStaff] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [search, setSearch] = useState("");
  
  // Active payout modal state
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  
  // Payout form inputs
  const [allowance, setAllowance] = useState("");
  const [deductions, setDeductions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [notes, setNotes] = useState("");
  
  // Local cache version key to force state refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // In-memory cache map for fast renders
  const [salariesMap, setSalariesMap] = useState<Record<number, SalaryRecord[]>>({});

  const headers = { 
    Authorization: `Bearer ${token}`, 
    "Content-Type": "application/json" 
  };

  // 1. Fetch active faculty (teachers) list
  useEffect(() => {
    setLoadingStaff(true);
    fetch(`${BASE}/api/users?role=teacher`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setStaff(data);
      })
      .catch(() => {
        toast({ title: "Failed to load faculty", variant: "destructive" });
      })
      .finally(() => {
        setLoadingStaff(false);
      });
  }, [refreshKey]);

  // Load all salaries into memory to make renders O(1) fast
  useEffect(() => {
    if (staff.length === 0) return;
    const map: Record<number, SalaryRecord[]> = {};
    staff.forEach((teacher) => {
      const raw = localStorage.getItem(`teacher_${teacher.id}_salaries`);
      if (raw) {
        try {
          map[teacher.id] = JSON.parse(raw);
        } catch {
          map[teacher.id] = [];
        }
      } else {
        map[teacher.id] = [];
      }
    });
    setSalariesMap(map);
  }, [staff, refreshKey]);

  // Helper to load salaries list for a specific teacher (now using memory map cache)
  const getTeacherSalaries = (teacherId: number): SalaryRecord[] => {
    return salariesMap[teacherId] || [];
  };

  // Helper to save salaries list for a specific teacher
  const saveTeacherSalaries = (teacherId: number, records: SalaryRecord[]) => {
    localStorage.setItem(`teacher_${teacherId}_salaries`, JSON.stringify(records));
  };

  // Get active payout status for a teacher in the current month/year
  const getPayoutStatus = (teacherId: number) => {
    const records = getTeacherSalaries(teacherId);
    return records.find(r => r.month === selectedMonth && r.year === selectedYear);
  };

  // Open payout drawer for a teacher
  const handleOpenPayout = (teacher: any) => {
    setSelectedTeacher(teacher);
    setAllowance("0");
    setDeductions("0");
    setPaymentMethod("Bank Transfer");
    setNotes("Regular monthly payroll processed.");
    setIsPayoutModalOpen(true);
  };

  // Submit payout processing
  const handleProcessPayout = () => {
    if (!selectedTeacher) return;
    
    const base = Number(selectedTeacher.salary) || 120000;
    const allowVal = Number(allowance) || 0;
    const deductVal = Number(deductions) || 0;
    const net = base + allowVal - deductVal;

    const newRecord: SalaryRecord = {
      id: `payout_${Date.now()}`,
      month: selectedMonth,
      year: selectedYear,
      baseSalary: base,
      allowance: allowVal,
      deductions: deductVal,
      netPaid: net,
      payDate: new Date().toISOString().split("T")[0],
      paymentMethod,
      status: "Paid",
      notes: notes || "Payroll processed manually."
    };

    const currentRecords = getTeacherSalaries(selectedTeacher.id);
    
    // Check if duplicate payout
    if (currentRecords.some(r => r.month === selectedMonth && r.year === selectedYear)) {
      toast({ title: "Salary already processed for this period", variant: "destructive" });
      return;
    }

    saveTeacherSalaries(selectedTeacher.id, [newRecord, ...currentRecords]);
    
    toast({
      title: "Salary payout processed successfully",
      description: `Rs. ${net.toLocaleString()} paid to ${selectedTeacher.name}.`
    });

    setIsPayoutModalOpen(false);
    setSelectedTeacher(null);
    setRefreshKey(prev => prev + 1); // Refresh the UI counters
  };

  // Undo/Rollback a payout
  const handleRollbackPayout = (teacherId: number, recordId: string) => {
    const currentRecords = getTeacherSalaries(teacherId);
    const updated = currentRecords.filter(r => r.id !== recordId);
    saveTeacherSalaries(teacherId, updated);
    
    toast({ title: "Payout successfully rolled back" });
    setRefreshKey(prev => prev + 1);
  };

  // Filtered list
  const filteredStaff = staff.filter((s: any) => 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Compute overall stats for selected period
  const totalBaseBudget = staff.reduce((acc, s) => acc + (Number(s.salary) || 120000), 0);
  
  const processedPayouts = staff.map(s => getPayoutStatus(s.id)).filter(Boolean) as SalaryRecord[];
  
  const totalNetPaid = processedPayouts.reduce((acc, r) => acc + r.netPaid, 0);
  
  const pendingStaffCount = staff.length - processedPayouts.length;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Payroll Management</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Configure base salaries, process payouts, and audit monthly ledger history</p>
          </div>
          
          {/* Period Selectors */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 shadow-sm">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36 h-10 border-transparent bg-white shadow-none rounded-xl">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {MONTHS.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(Number(val))}>
              <SelectTrigger className="w-24 h-10 border-transparent bg-white shadow-none rounded-xl">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {YEARS.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Staff</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{staff.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Base Budget</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">Rs. {totalBaseBudget.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Net Paid ({selectedMonth})</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">Rs. {totalNetPaid.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Pending Payouts</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{pendingStaffCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table block */}
        <div className="space-y-4">
          <Card className="border-none shadow-sm ring-1 ring-gray-100">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search staff by name or email..." 
                  className="pl-10 max-w-md rounded-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl ring-1 ring-gray-100 overflow-hidden rounded-[24px] bg-white">
            <CardContent className="p-0">
              {loadingStaff ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-bold uppercase tracking-widest text-[10px]">Loading Payroll List...</p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 opacity-35">
                  <AlertCircle className="h-12 w-12 text-slate-400 mb-3" />
                  <p className="font-bold text-slate-900 text-lg">No staff found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="py-3.5 pl-6 font-bold text-slate-500 text-xs">Faculty Name</TableHead>
                      <TableHead className="py-3.5 font-bold text-slate-500 text-xs">Base Salary</TableHead>
                      <TableHead className="py-3.5 font-bold text-slate-500 text-xs">Allowances</TableHead>
                      <TableHead className="py-3.5 font-bold text-slate-500 text-xs">Deductions</TableHead>
                      <TableHead className="py-3.5 font-bold text-slate-500 text-xs">Net Paid</TableHead>
                      <TableHead className="py-3.5 font-bold text-slate-500 text-xs">Transaction Period</TableHead>
                      <TableHead className="py-3.5 font-bold text-slate-500 text-xs">Status</TableHead>
                      <TableHead className="py-3.5 font-bold text-slate-500 text-xs text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((teacher: any) => {
                      const payout = getPayoutStatus(teacher.id);
                      const base = Number(teacher.salary) || 120000;
                      
                      return (
                        <TableRow key={teacher.id} className="hover:bg-slate-50/40 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                                {teacher.name?.charAt(0) ?? "F"}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{teacher.name}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{teacher.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-sm font-semibold text-slate-600">
                            Rs. {base.toLocaleString()}
                          </TableCell>
                          
                          <TableCell className="text-sm font-semibold text-emerald-600">
                            {payout && payout.allowance > 0 ? `+Rs. ${payout.allowance.toLocaleString()}` : "—"}
                          </TableCell>

                          <TableCell className="text-sm font-semibold text-rose-600">
                            {payout && payout.deductions > 0 ? `-Rs. ${payout.deductions.toLocaleString()}` : "—"}
                          </TableCell>

                          <TableCell className="text-sm font-extrabold text-indigo-600">
                            Rs. {payout ? payout.netPaid.toLocaleString() : base.toLocaleString()}
                          </TableCell>

                          <TableCell className="text-xs font-semibold text-slate-500">
                            {payout ? (
                              <div>
                                <span className="font-bold text-slate-700">{payout.paymentMethod}</span>
                                <div className="text-[10px] text-slate-400 mt-0.5">Paid on {new Date(payout.payDate).toLocaleDateString()}</div>
                              </div>
                            ) : "Not Processed"}
                          </TableCell>

                          <TableCell>
                            {payout ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold rounded-lg">
                                Paid
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold rounded-lg">
                                Pending
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-right pr-6">
                            {payout ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRollbackPayout(teacher.id, payout.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl font-bold h-9 gap-1"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Rollback
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => handleOpenPayout(teacher)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-9 gap-1 shadow-md shadow-emerald-950/10"
                              >
                                <DollarSign className="h-3.5 w-3.5" /> Pay Salary
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pay Salary Dialog */}
      <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Process Salary Payout</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Record payout details for {selectedTeacher?.name} ({selectedMonth} {selectedYear}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base Salary</Label>
              <p className="text-lg font-black text-slate-800">
                Rs. {(Number(selectedTeacher?.salary) || 120000).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Allowances (Rs.)</Label>
                <Input 
                  type="number" 
                  value={allowance} 
                  onChange={(e) => setAllowance(e.target.value)} 
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Deductions (Rs.)</Label>
                <Input 
                  type="number" 
                  value={deductions} 
                  onChange={(e) => setDeductions(e.target.value)} 
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full rounded-xl border-slate-200">
                  <SelectValue placeholder="Choose Method" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Transaction Notes</Label>
              <Input 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="rounded-xl border-slate-200"
              />
            </div>

            {/* Live Net Pay Estimate */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Est. Net Payout</p>
                <p className="text-lg font-black text-indigo-600 mt-0.5">
                  Rs. {((Number(selectedTeacher?.salary) || 120000) + (Number(allowance) || 0) - (Number(deductions) || 0)).toLocaleString()}
                </p>
              </div>
              <FileCheck className="h-6 w-6 text-indigo-600" />
            </div>
          </div>

          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 flex gap-3">
            <Button variant="ghost" onClick={() => setIsPayoutModalOpen(false)} className="flex-1 font-bold text-slate-600 rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleProcessPayout}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-600/20"
            >
              Confirm Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
