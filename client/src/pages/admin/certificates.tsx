import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BadgeCheck,
  Search,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";
import { useState } from "react";

// Mock certificate data — replace with API call
const MOCK_CERTIFICATES = [
  {
    id: "cert-1",
    certificateId: "GC-2026-8241-EBAY",
    studentName: "Ahmed Ali",
    studentEmail: "ahmed@example.com",
    course: "eBay Business Course (EBC)",
    issuedAt: "2026-04-20",
    status: "ISSUED",
    isRevoked: false,
  },
  {
    id: "cert-2",
    certificateId: "GC-2026-5512-AMZ",
    studentName: "Sara Khan",
    studentEmail: "sara@example.com",
    course: "Amazon FBA Mastery",
    issuedAt: "2026-05-01",
    status: "ISSUED",
    isRevoked: false,
  },
  {
    id: "cert-3",
    certificateId: "GC-2026-1120-GFX",
    studentName: "Bilal Hussain",
    studentEmail: "bilal@example.com",
    course: "Graphics & Logo Design",
    issuedAt: "2026-03-15",
    status: "ISSUED",
    isRevoked: true,
  },
  {
    id: "cert-4",
    certificateId: "GC-2026-9934-FREE",
    studentName: "Fatima Zahra",
    studentEmail: "fatima@example.com",
    course: "Freelancing Bootcamp",
    issuedAt: "2026-05-10",
    status: "AWAITING_VERIFICATION",
    isRevoked: false,
  },
];

export default function AdminCertificates() {
  const [search, setSearch] = useState("");
  const [certificates, setCertificates] = useState(MOCK_CERTIFICATES);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const filtered = certificates.filter(
    (c) =>
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.certificateId.toLowerCase().includes(search.toLowerCase()) ||
      c.course.toLowerCase().includes(search.toLowerCase())
  );

  const handleRevoke = (id: string) => {
    setRevoking(id);
    setTimeout(() => {
      setCertificates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isRevoked: true } : c))
      );
      setRevoking(null);
      setConfirmRevoke(null);
    }, 1200);
  };

  const stats = {
    total: certificates.length,
    issued: certificates.filter((c) => c.status === "ISSUED" && !c.isRevoked).length,
    revoked: certificates.filter((c) => c.isRevoked).length,
    awaiting: certificates.filter((c) => c.status === "AWAITING_VERIFICATION").length,
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Certificates</h1>
            <p className="text-gray-500 font-medium mt-1">
              Manage issued certificates and revoke if necessary
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Issued", value: stats.total, icon: BadgeCheck, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active", value: stats.issued, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Revoked", value: stats.revoked, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
            { label: "Awaiting Verification", value: stats.awaiting, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((stat) => (
            <Card key={stat.label} className="border border-gray-100 rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-11 w-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Card */}
        <Card className="border border-gray-100 rounded-2xl overflow-hidden">
          <CardHeader className="px-6 py-5 border-b border-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl font-black text-gray-900">All Certificates</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search student or certificate ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl border-gray-100 bg-slate-50 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Certificate ID</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Issued Date</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length > 0 ? (
                    filtered.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-bold text-primary">{cert.certificateId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center font-black text-sm text-blue-600 shrink-0">
                              {cert.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{cert.studentName}</p>
                              <p className="text-xs text-gray-400">{cert.studentEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-700 text-sm max-w-[200px] truncate">{cert.course}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{cert.issuedAt}</td>
                        <td className="px-6 py-4">
                          {cert.isRevoked ? (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-100 font-bold">Revoked</Badge>
                          ) : cert.status === "ISSUED" ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">Active</Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold">Awaiting</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" className="h-8 text-xs font-bold gap-1 text-gray-500">
                              <Download className="h-3.5 w-3.5" /> Download
                            </Button>
                            {!cert.isRevoked && cert.status === "ISSUED" && (
                              confirmRevoke === cert.id ? (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white"
                                    onClick={() => handleRevoke(cert.id)}
                                    disabled={revoking === cert.id}
                                  >
                                    {revoking === cert.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                    onClick={() => setConfirmRevoke(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50"
                                  onClick={() => setConfirmRevoke(cert.id)}
                                >
                                  Revoke
                                </Button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-gray-400">
                        <BadgeCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No certificates found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
