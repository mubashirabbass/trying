import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useListCertificates, getListCertificatesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentCertificates() {
  const { user } = useAuth();
  
  const { data: certificates, isLoading } = useListCertificates(
    { userId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListCertificatesQueryKey({ userId: user?.id }) } }
  );

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Certificates</h1>
        <p className="text-gray-500">View and download your earned certificates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates?.map((cert) => (
          <Card key={cert.id} className="border-2 border-primary/20 bg-primary/5">
            <CardHeader className="text-center pb-2">
              <Award className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-xl text-primary">{cert.courseName}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <p className="font-medium text-gray-900">{cert.studentName}</p>
              <p className="text-sm text-gray-500">Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
              <div className="mt-4 pt-4 border-t border-primary/20">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Certificate ID</p>
                <p className="font-mono font-medium text-gray-700">{cert.certificateNumber}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {certificates?.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-xl border">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No certificates yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Complete courses to earn certificates. They will appear here once issued.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
