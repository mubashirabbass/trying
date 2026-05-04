import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, AlertTriangle, CheckCircle2, Clock, Upload, FileText } from "lucide-react";
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
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-700", label: "Under Review", bg: "bg-yellow-50 border-yellow-200" },
  approved: { icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700", label: "Verified", bg: "bg-emerald-50 border-emerald-200" },
  rejected: { icon: AlertTriangle, color: "bg-red-100 text-red-700", label: "Rejected", bg: "bg-red-50 border-red-200" },
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
    if (!documentUrl) { toast({ title: "Please provide a document URL", variant: "destructive" }); return; }
    setSubmitting(true);
    const r = await fetch(`${BASE}/api/identity-verification`, {
      method: "POST",
      headers,
      body: JSON.stringify({ userId: user?.id, documentType: docType, cnicNumber, documentUrl }),
    });
    if (r.ok) {
      toast({ title: "Verification submitted!", description: "We'll review your documents within 24-48 hours." });
      fetchStatus();
    } else {
      toast({ title: "Submission failed", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
        <p className="text-sm text-gray-500 mt-1">Required to download your certificates</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Why needed */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-5 flex gap-4">
            <ShieldCheck className="h-8 w-8 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Why is this required?</h3>
              <p className="text-sm text-blue-700">
                Global College verifies student identity using CNIC or Form-B before issuing official certificates.
                This ensures your certificate is authentic and tied to your real identity.
              </p>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : verification ? (
          <>
            {/* Current status */}
            {(() => {
              const cfg = STATUS_CONFIG[verification.status];
              const Icon = cfg.icon;
              return (
                <Card className={`border ${cfg.bg}`}>
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${cfg.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">Verification {cfg.label}</h3>
                        <Badge className={cfg.color}>{cfg.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Document: <span className="font-medium">{verification.documentType}</span>
                        {verification.cnicNumber && <> · CNIC: <span className="font-medium">{verification.cnicNumber}</span></>}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">Submitted: {new Date(verification.submittedAt).toLocaleDateString()}</p>
                      {verification.rejectionReason && (
                        <p className="text-sm text-red-600 mt-2">
                          <strong>Reason:</strong> {verification.rejectionReason}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {verification.status === "rejected" && (
              <Card>
                <CardHeader><CardTitle>Resubmit Documents</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Document Type</Label>
                      <select value={docType} onChange={e => setDocType(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="CNIC">CNIC (National ID Card)</option>
                        <option value="FORMB">Form-B (Under 18)</option>
                      </select>
                    </div>
                    <div>
                      <Label>CNIC Number</Label>
                      <Input value={cnicNumber} onChange={e => setCnicNumber(e.target.value)} placeholder="42101-1234567-1" className="mt-1" />
                    </div>
                    <div>
                      <Label>Document Image URL *</Label>
                      <Input value={documentUrl} onChange={e => setDocumentUrl(e.target.value)} placeholder="Paste a link to your uploaded document image" className="mt-1" required />
                      <p className="text-xs text-gray-400 mt-1">Upload your document image to Google Drive or Imgur and paste the link here.</p>
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      Resubmit for Review
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Submit Your Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label>Document Type *</Label>
                  <select value={docType} onChange={e => setDocType(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="CNIC">CNIC (National ID Card)</option>
                    <option value="FORMB">Form-B (Under 18)</option>
                  </select>
                </div>
                <div>
                  <Label>CNIC / Form-B Number</Label>
                  <Input value={cnicNumber} onChange={e => setCnicNumber(e.target.value)} placeholder="42101-1234567-1" className="mt-1" />
                </div>
                <div>
                  <Label>Document Image URL *</Label>
                  <Input value={documentUrl} onChange={e => setDocumentUrl(e.target.value)} placeholder="https://drive.google.com/..." className="mt-1" required />
                  <p className="text-xs text-gray-400 mt-1">Upload your front & back CNIC scan to Google Drive or Imgur, make it public, and paste the link.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                  <p className="font-semibold text-gray-700">Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Clear, readable scan of both sides of your CNIC</li>
                    <li>Matches the name on your Global College account</li>
                    <li>File should be JPG, PNG, or PDF format</li>
                    <li>Verification takes 24-48 hours</li>
                  </ul>
                </div>

                <Button type="submit" disabled={submitting} className="w-full h-11">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Submit for Verification
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
