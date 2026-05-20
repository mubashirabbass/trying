import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useVerifyEmail } from "@workspace/api-client-react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [location, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  
  const verifyEmailMutation = useVerifyEmail();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided in the link.");
      return;
    }

    verifyEmailMutation.mutate(
      { data: { token } },
      {
        onSuccess: () => {
          setStatus("success");
        },
        onError: (err: any) => {
          setStatus("error");
          setErrorMessage(err?.response?.data?.error || err.message || "Failed to verify email");
        }
      }
    );
  }, []); // Run once on mount

  return (
    <MainLayout>
      <div className="flex-1 min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              <h2 className="text-2xl font-bold text-slate-800">Verifying Email</h2>
              <p className="text-slate-500">Please wait while we verify your email address...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold text-slate-800">Email Verified!</h2>
              <p className="text-slate-500">
                Your email address has been successfully verified. You can now log in to access your dashboard.
              </p>
              <Button onClick={() => setLocation("/login")} className="w-full mt-4 h-12 rounded-xl text-md">
                Go to Login
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <h2 className="text-2xl font-bold text-slate-800">Verification Failed</h2>
              <p className="text-slate-500 text-sm">
                {errorMessage}
              </p>
              <Button onClick={() => setLocation("/login")} variant="outline" className="w-full mt-4 h-12 rounded-xl text-md">
                Back to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
