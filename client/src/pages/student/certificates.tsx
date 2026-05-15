import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useListCertificates, getListCertificatesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Loader2, 
  Award, 
  Download, 
  CheckCircle, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function StudentCertificates() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  
  const { data: certificates, isLoading } = useListCertificates(
    { userId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListCertificatesQueryKey({ userId: user?.id }) } }
  );

  const handleDownload = async (certId: number) => {
    setDownloadingId(certId);
    try {
      const r = await fetch(`${BASE}/api/certificates/${certId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const blob = await r.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `certificate-${certId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        toast({ title: "Failed to download certificate", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Achievements</h1>
        <p className="text-slate-500 font-medium mt-2">Official certifications earned from Global College</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {certificates?.map((cert) => (
          <Card key={cert.id} className="group relative border-none shadow-sm ring-1 ring-slate-100 hover:ring-primary/20 transition-all hover:shadow-2xl hover:shadow-primary/5 rounded-[40px] overflow-hidden bg-white">
            <div className="h-40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              <div className="relative z-10 bg-white/5 backdrop-blur-md p-5 rounded-[28px] border border-white/10">
                <Award className="h-12 w-12 text-primary drop-shadow-2xl" />
              </div>
            </div>

            <CardContent className="p-8 text-center pt-10">
              <Badge className="mb-4 bg-primary/10 text-primary border-none font-black text-[10px] tracking-widest uppercase py-1 px-4 rounded-full">
                Official Credential
              </Badge>
              <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover:text-primary transition-colors truncate px-2">
                {cert.courseName}
              </h3>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-wide mb-6">
                {cert.studentName}
              </p>
              
              <div className="grid grid-cols-2 gap-4 py-5 border-y border-slate-50">
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Issued
                  </p>
                  <p className="font-bold text-slate-700 text-sm">
                    {new Date(cert.issuedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> ID
                  </p>
                  <p className="font-mono font-bold text-slate-700 text-xs truncate">
                    {cert.certificateNumber?.split('-')[0] || cert.id}
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-8 pt-0 flex gap-3">
              <Button 
                disabled={downloadingId === cert.id}
                onClick={() => handleDownload(cert.id)}
                className="flex-1 h-12 rounded-2xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
              >
                {downloadingId === cert.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                PDF
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-2xl border-2 border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 transition-all active:scale-95"
                onClick={() => toast({ title: "Sharing link copied!" })}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {certificates?.length === 0 && (
          <div className="col-span-full py-24 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
            <div className="h-20 w-20 rounded-[30px] bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-200">
              <Award className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">No achievements yet</h3>
            <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto px-6">
              Official certificates will appear here once you successfully complete your courses and exams.
            </p>
            <Button className="mt-8 rounded-2xl font-black border-slate-200 px-8 h-12" variant="outline">
              Explore Courses <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
