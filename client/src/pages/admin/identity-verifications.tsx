import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ShieldCheck, Clock, CheckCircle2, XCircle, Eye, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Verification {
  id: number; userId: number; documentType: string; cnicNumber?: string;
  documentUrl: string; status: string; submittedAt: string; reviewedAt?: string;
  userName?: string; userEmail?: string; rejectionReason?: string;
}

const STATUS_CFG: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock, label: "Pending" },
  approved: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, label: "Approved" },
  rejected: { color: "bg-red-100 text-red-700", icon: XCircle, label: "Rejected" },
};

export default function AdminIdentityVerifications() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Verification | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchAll = async () => {
    const r = await fetch(`${BASE}/api/admin/identity-verifications`, { headers });
    if (r.ok) setVerifications(await r.json());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const approve = async (id: number) => {
    setActing(true);
    const r = await fetch(`${BASE}/api/admin/identity-verifications/${id}/approve`, { method: "PATCH", headers });
    if (r.ok) { toast({ title: "Identity verified!" }); fetchAll(); setSelected(null); }
    setActing(false);
  };

  const reject = async (id: number) => {
    if (!rejectReason.trim()) { toast({ title: "Please provide a rejection reason", variant: "destructive" }); return; }
    setActing(true);
    const r = await fetch(`${BASE}/api/admin/identity-verifications/${id}/reject`, {
      method: "PATCH", headers, body: JSON.stringify({ rejectionReason: rejectReason }),
    });
    if (r.ok) { toast({ title: "Verification rejected" }); fetchAll(); setSelected(null); setRejectReason(""); }
    setActing(false);
  };

  const pending = verifications.filter(v => v.status === "pending");
  const others = verifications.filter(v => v.status !== "pending");

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Identity Verifications</h1>
          <p className="text-sm text-gray-500 mt-1">Review CNIC/Form-B submissions to unlock certificates</p>
        </div>
        {pending.length > 0 && (
          <Badge className="bg-yellow-100 text-yellow-700 text-sm px-3 py-1">{pending.length} Pending</Badge>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : verifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <ShieldCheck className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No verification requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...pending, ...others].map(v => {
            const cfg = STATUS_CFG[v.status] ?? STATUS_CFG.pending;
            const Icon = cfg.icon;
            return (
              <Card key={v.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${cfg.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{v.userName}</p>
                      <Badge className={`${cfg.color} text-xs`}>{cfg.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{v.userEmail} · {v.documentType} {v.cnicNumber && `· ${v.cnicNumber}`}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Submitted: {new Date(v.submittedAt).toLocaleString()}</p>
                    {v.rejectionReason && <p className="text-xs text-red-600 mt-1">Rejected: {v.rejectionReason}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={v.documentUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1" /> View Doc</Button>
                    </a>
                    {v.status === "pending" && (
                      <Button size="sm" onClick={() => setSelected(v)}><Eye className="h-4 w-4 mr-1" /> Review</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setRejectReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Review Identity Submission</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Student:</span><span className="font-medium">{selected.userName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Document:</span><span className="font-medium">{selected.documentType}</span></div>
                {selected.cnicNumber && <div className="flex justify-between"><span className="text-gray-500">CNIC:</span><span className="font-medium">{selected.cnicNumber}</span></div>}
              </div>
              <a href={selected.documentUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full"><ExternalLink className="h-4 w-4 mr-2" /> Open Document</Button>
              </a>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => approve(selected.id)} disabled={acting} className="bg-emerald-600 hover:bg-emerald-700">
                  {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />} Approve
                </Button>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => { if (rejectReason) reject(selected.id); else toast({ title: "Enter rejection reason", variant: "destructive" }); }}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
              <div>
                <Label>Rejection Reason (required to reject)</Label>
                <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Image is blurry, please resubmit." className="mt-1" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
