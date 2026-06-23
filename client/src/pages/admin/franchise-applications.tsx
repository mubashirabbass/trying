import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Handshake,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  Phone,
  MapPin,
  User,
  Building2,
  RefreshCw,
  Search,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface FranchiseApplication {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string | null;
  description: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:  { label: "Pending",  color: "bg-amber-50 text-amber-700 border-amber-200",  icon: Clock },
  reviewed: { label: "Reviewed", color: "bg-blue-50 text-blue-700 border-blue-200",    icon: Eye },
  approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200",       icon: XCircle },
};

export default function AdminFranchiseApplications() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [applications, setApplications] = useState<FranchiseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [selectedApp, setSelectedApp] = useState<FranchiseApplication | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/franchise-applications`, { headers });
      if (r.ok) setApplications(await r.json());
    } catch {
      toast({ title: "Failed to load applications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [token]);

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;
    setUpdatingStatus(true);
    try {
      const r = await fetch(`${BASE}/api/franchise-applications/${selectedApp.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: editStatus, adminNotes: editNotes }),
      });
      if (r.ok) {
        const updated = await r.json();
        setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
        setSelectedApp(updated);
        toast({ title: "Application updated successfully!" });
      } else {
        toast({ title: "Failed to update application", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const r = await fetch(`${BASE}/api/franchise-applications/${deleteId}`, {
        method: "DELETE",
        headers,
      });
      if (r.ok) {
        setApplications(prev => prev.filter(a => a.id !== deleteId));
        toast({ title: "Application deleted" });
        if (selectedApp?.id === deleteId) setViewOpen(false);
      } else {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  const openView = (app: FranchiseApplication) => {
    setSelectedApp(app);
    setEditStatus(app.status);
    setEditNotes(app.adminNotes || "");
    setViewOpen(true);
  };

  const filtered = applications.filter(a => {
    const matchSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.includes(searchQuery) ||
      (a.city || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    reviewed: applications.filter(a => a.status === "reviewed").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Handshake className="h-5 w-5 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black text-slate-900">Franchise Applications</h1>
            </div>
            <p className="text-slate-500 text-sm font-medium ml-13">
              Manage all "Get Work With Us" franchise enquiries
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchApplications}
            className="rounded-xl font-bold gap-2 border-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["pending", "reviewed", "approved", "rejected"] as const).map(s => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
                className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                  filterStatus === s ? cfg.color + " border-current" : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${filterStatus === s ? "" : "text-slate-400"}`} />
                <p className={`text-2xl font-black ${filterStatus === s ? "" : "text-slate-900"}`}>{counts[s]}</p>
                <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${filterStatus === s ? "" : "text-slate-400"}`}>{cfg.label}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, phone, city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-11 rounded-xl border-slate-200 h-11"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 rounded-xl border-slate-200 h-11 font-bold">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All ({counts.all})</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label} ({counts[k as keyof typeof counts]})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Applications Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="font-bold">Loading applications...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Handshake className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-900">No applications found</h3>
            <p className="text-slate-400 text-sm mt-1">
              {applications.length === 0 ? "No franchise applications have been submitted yet." : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Applicant</th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(app => {
                    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                    const Icon = cfg.icon;
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center font-black text-emerald-700 text-sm shrink-0">
                              {app.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm">{app.name}</p>
                              <p className="text-slate-400 text-xs font-medium">{app.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700">{app.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-600">{app.city || "—"}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">{app.address}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${cfg.color}`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-500 font-medium">
                            {new Date(app.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openView(app)}
                              className="h-8 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteId(app.id)}
                              className="h-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View / Update Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl rounded-[2rem] overflow-hidden p-0">
          {selectedApp && (() => {
            const cfg = STATUS_CONFIG[selectedApp.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <div>
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0f2c6f] to-[#1a4d3a] px-8 py-6">
                  <DialogHeader>
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center font-black text-white text-xl">
                        {selectedApp.name.charAt(0)}
                      </div>
                      <div>
                        <DialogTitle className="text-white text-xl font-black">{selectedApp.name}</DialogTitle>
                        <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black border mt-1 ${cfg.color}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                  {/* Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { icon: Mail, label: "Email", value: selectedApp.email },
                      { icon: Phone, label: "Phone", value: selectedApp.phone },
                      { icon: MapPin, label: "City", value: selectedApp.city || "Not specified" },
                      { icon: Building2, label: "Address", value: selectedApp.address },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <item.icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                          <p className="text-sm font-bold text-slate-800 break-all">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">About the Applicant</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedApp.description}</p>
                  </div>

                  {/* Update Status */}
                  <div className="space-y-4 border-t pt-5 border-slate-100">
                    <p className="text-sm font-black text-slate-700 uppercase tracking-wider">Update Application</p>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Status</label>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="rounded-xl border-slate-200 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Admin Notes (Internal)</label>
                      <textarea
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        rows={3}
                        placeholder="Add private notes about this applicant..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-medium text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="px-8 py-5 bg-slate-50 border-t border-slate-100 gap-3">
                  <Button variant="outline" onClick={() => setViewOpen(false)} className="rounded-xl font-bold">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus}
                    className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this franchise application. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
