import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Upload, 
  FileText,
  Info,
  ChevronRight,
  Fingerprint
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Verification {
  id: number;
  status: "pending" | "approved" | "rejected";
  documentType: string;
  cnicNumber?: string;
  documentUrl: string;
  submittedAt: string;
  rejectionReason?: string;
}

const STATUS_CONFIG = {
  pending: { 
    icon: Clock, 
    color: "text-amber-600", 
    label: "Under Review", 
    bg: "bg-amber-50 border-amber-100",
    description: "Our compliance team is currently reviewing your documents. This usually takes 24-48 hours."
  },
  approved: { 
    icon: CheckCircle2, 
    color: "text-emerald-600", 
    label: "Verified", 
    bg: "bg-emerald-50 border-emerald-100",
    description: "Your identity has been verified. You can now download official certificates and apply for internships."
  },
  rejected: { 
    icon: AlertTriangle, 
    color: "text-rose-600", 
    label: "Rejected", 
    bg: "bg-rose-50 border-rose-100",
    description: "Your verification request was declined. Please review the reason below and resubmit."
  },
};

export default function VerifyIdentity() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [docType, setDocType] = useState("CNIC");
  const [cnicNumber, setCnicNumber] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchStatus = async () => {
    const r = await fetch(`${BASE}/api/identity-verification?userId=${user?.id}`, { headers });
    if (r.ok) {
      const data = await r.json();
      setVerification(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentUrl) { 
      toast({ title: "Please provide a document URL", variant: "destructive" }); 
      return; 
    }
    setSubmitting(true);
    const r = await fetch(`${BASE}/api/identity-verification`, {
      method: "POST",
      headers,
      body: JSON.stringify({ userId: user?.id, documentType: docType, cnicNumber, documentUrl }),
    });
    if (r.ok) {
      toast({ 
        title: "Submission Successful!", 
        description: "Your documents have been queued for review." 
      });
      fetchStatus();
    } else {
      toast({ title: "Submission failed", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-3 text-primary mb-2">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]">Security & Trust</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Identity Verification</h1>
          <p className="text-slate-500 font-medium mt-2 max-w-xl">
            Global College requires official identity verification to maintain academic integrity and issue legitimate certifications.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border-2 border-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-4">Checking Status...</p>
              </div>
            ) : verification && verification.status !== "rejected" ? (
              <Card className={`border-2 rounded-[40px] overflow-hidden shadow-xl shadow-slate-200/40 ${STATUS_CONFIG[verification.status].bg}`}>
                <div className="p-10 text-center">
                  <div className={`h-24 w-24 rounded-[32px] mx-auto flex items-center justify-center mb-8 shadow-inner ${STATUS_CONFIG[verification.status].bg} ${STATUS_CONFIG[verification.status].color}`}>
                    {(() => {
                      const Icon = STATUS_CONFIG[verification.status].icon;
                      return <Icon className="h-12 w-12" />;
                    })()}
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-4">
                    Verification {STATUS_CONFIG[verification.status].label}
                  </h2>
                  <p className="text-slate-600 font-medium mb-8 leading-relaxed px-6">
                    {STATUS_CONFIG[verification.status].description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-left bg-white/50 rounded-3xl p-6 border border-white">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Document</p>
                      <p className="font-bold text-slate-900">{verification.documentType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CNIC/ID</p>
                      <p className="font-bold text-slate-900">{verification.cnicNumber || "Not provided"}</p>
                    </div>
                    <div className="col-span-2 mt-4 pt-4 border-t border-slate-100/50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submitted On</p>
                      <p className="font-bold text-slate-900">{new Date(verification.submittedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border-2 border-slate-100 rounded-[40px] overflow-hidden shadow-xl shadow-slate-200/20 bg-white">
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <Fingerprint className="h-7 w-7 text-primary" />
                    Document Submission
                  </CardTitle>
                  <p className="text-slate-500 font-medium">Please provide your official identification details below.</p>
                </CardHeader>
                <CardContent className="p-10 pt-6">
                  {verification?.status === "rejected" && (
                    <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl flex items-start gap-4">
                      <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
                      <div>
                        <p className="text-rose-900 font-black text-sm uppercase tracking-wider mb-1">Previously Rejected</p>
                        <p className="text-rose-700 font-medium text-sm">Reason: {verification.rejectionReason}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-bold text-slate-700">Document Type</Label>
                        <select 
                          value={docType} 
                          onChange={e => setDocType(e.target.value)}
                          className="w-full h-12 rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        >
                          <option value="CNIC">CNIC (National ID)</option>
                          <option value="FORMB">Form-B (Minor ID)</option>
                          <option value="PASSPORT">Passport</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-bold text-slate-700">ID Number</Label>
                        <Input 
                          value={cnicNumber} 
                          onChange={e => setCnicNumber(e.target.value)} 
                          placeholder="e.g. 42101-1234567-1" 
                          className="h-12 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold px-4"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-bold text-slate-700">Document Image Link</Label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                        <Input 
                          value={documentUrl} 
                          onChange={e => setDocumentUrl(e.target.value)} 
                          placeholder="Link to hosted image (e.g. Google Drive, Imgur)" 
                          className="h-14 pl-12 rounded-2xl border-2 border-slate-100 bg-slate-50 font-medium" 
                          required 
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2">
                        Must be a clear photo of your ID (Front & Back)
                      </p>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20">
                      {submitting ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Upload className="h-6 w-6 mr-2" />}
                      {verification?.status === "rejected" ? "Resubmit Documents" : "Submit Verification"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-black mb-4">Guidelines</h3>
                <ul className="space-y-4">
                  {[
                    "Clear, high-resolution photo",
                    "Full name must match profile",
                    "Documents must be valid",
                    "Public link accessibility"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="absolute -bottom-8 -right-8 h-32 w-32 bg-primary/20 blur-3xl rounded-full" />
            </div>

            <div className="bg-primary/5 border-2 border-primary/10 rounded-[32px] p-8">
              <h3 className="font-black text-slate-900 mb-2">Need Help?</h3>
              <p className="text-sm text-slate-600 font-medium mb-6">
                If you encounter issues with verification, contact our support team.
              </p>
              <Button variant="outline" className="w-full rounded-2xl font-bold border-primary/20 text-primary hover:bg-primary/5">
                Support Hub <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
