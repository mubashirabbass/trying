import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useVerifyCertificate } from "@workspace/api-client-react";
import { CheckCircle2, XCircle, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export default function VerifyCertificate() {
  const [searchType, setSearchType] = useState<"cnic" | "certificate">("certificate");
  const [searchValue, setSearchValue] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: verificationResult, isLoading, refetch } = useVerifyCertificate(
    {
      cnic: searchType === "cnic" ? searchValue : undefined,
      certificateNumber: searchType === "certificate" ? searchValue : undefined
    },
    { query: { enabled: false } }
  );

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    setHasSearched(true);
    refetch();
  };

  return (
    <MainLayout>
      <div className="bg-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Verify Certificate</h1>
          <p className="text-xl text-primary-foreground/80">
            Check the authenticity of a Global College certificate using a CNIC or Certificate Number.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white p-8 rounded-xl shadow-sm border mb-8">
          <div className="flex justify-center gap-4 mb-8">
            <Button 
              variant={searchType === "certificate" ? "default" : "outline"}
              onClick={() => { setSearchType("certificate"); setSearchValue(""); setHasSearched(false); }}
            >
              By Certificate No.
            </Button>
            <Button 
              variant={searchType === "cnic" ? "default" : "outline"}
              onClick={() => { setSearchType("cnic"); setSearchValue(""); setHasSearched(false); }}
            >
              By CNIC
            </Button>
          </div>

          <form onSubmit={handleVerify} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="search"
                  className="pl-10 h-12 text-lg"
                  placeholder={searchType === "certificate" ? "e.g. GC-2024-12345" : "e.g. 12345-1234567-1"}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="h-12 px-8" disabled={isLoading || !searchValue.trim()}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify"}
            </Button>
          </form>
        </div>

        {hasSearched && !isLoading && verificationResult && (
          <Card className={`border-2 ${verificationResult.isValid ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
            <CardContent className="p-8 text-center">
              {verificationResult.isValid && verificationResult.certificate ? (
                <>
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-800 mb-2">Certificate is Valid</h2>
                  <div className="text-left mt-8 space-y-4 max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm">
                    <div>
                      <p className="text-sm text-gray-500">Student Name</p>
                      <p className="font-semibold text-lg">{verificationResult.certificate.studentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Course Completed</p>
                      <p className="font-semibold text-lg">{verificationResult.certificate.courseName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Certificate No.</p>
                        <p className="font-medium">{verificationResult.certificate.certificateNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Issue Date</p>
                        <p className="font-medium">
                          {format(new Date(verificationResult.certificate.issuedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-red-800 mb-2">Verification Failed</h2>
                  <p className="text-red-600">{verificationResult.message || "We couldn't find a valid certificate matching these details."}</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
