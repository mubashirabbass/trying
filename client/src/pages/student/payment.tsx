import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useGetCourse, useListSettings, useCreatePayment } from "@workspace/api-client-react";
import { 
  Loader2, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function StudentPayment() {
  const { courseId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: course, isLoading: courseLoading } = useGetCourse(Number(courseId));
  const { data: settings, isLoading: settingsLoading } = useListSettings();
  const createPayment = useCreatePayment();
  
  const [method, setMethod] = useState<"card" | "bank_transfer" | "easypaisa" | "jazzcash">("easypaisa");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getSetting = (key: string) => settings?.find(s => s.key === key)?.value || "Not configured";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptUrl) {
      toast({ title: "Please provide a receipt image URL", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await createPayment.mutateAsync({
        data: {
          courseId: Number(courseId),
          amount: course?.fee || 0,
          method,
          receiptUrl
        }
      });
      toast({ 
        title: "Payment submitted!", 
        description: "An administrator will verify your payment within 24 hours." 
      });
      setLocation("/dashboard/courses");
    } catch (error) {
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (courseLoading || settingsLoading) {
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
        <h1 className="text-3xl font-bold tracking-tight">Course Payment</h1>
        <p className="text-muted-foreground mt-1">Enroll in {course?.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={method} onValueChange={(v: any) => setMethod(v)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="easypaisa" id="easypaisa" className="peer sr-only" />
                  <Label
                    htmlFor="easypaisa"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Smartphone className="mb-3 h-6 w-6" />
                    EasyPaisa
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="jazzcash" id="jazzcash" className="peer sr-only" />
                  <Label
                    htmlFor="jazzcash"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Smartphone className="mb-3 h-6 w-6 text-orange-500" />
                    JazzCash
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" className="peer sr-only" />
                  <Label
                    htmlFor="bank_transfer"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Banknote className="mb-3 h-6 w-6 text-blue-500" />
                    Bank Transfer
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-6 border">
                {method === "easypaisa" && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Transfer Rs. {course?.fee} to EasyPaisa Account:</p>
                    <div className="flex items-center justify-between bg-background p-3 rounded border">
                      <span className="font-mono text-lg">{getSetting("easypaisa_account")}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(getSetting("easypaisa_account"))}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {method === "jazzcash" && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Transfer Rs. {course?.fee} to JazzCash Account:</p>
                    <div className="flex items-center justify-between bg-background p-3 rounded border">
                      <span className="font-mono text-lg">{getSetting("jazzcash_account")}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(getSetting("jazzcash_account"))}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {method === "bank_transfer" && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Transfer Rs. {course?.fee} to Bank Account:</p>
                    <div className="flex items-center justify-between bg-background p-3 rounded border gap-4">
                      <span className="font-mono text-sm break-all">{getSetting("bank_account")}</span>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleCopy(getSetting("bank_account"))}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg border border-blue-100">
                <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
                <p>
                  Please take a screenshot of your transaction receipt and upload it below. 
                  Your enrollment will be activated once the payment is verified.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Submit Proof</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt-url">Receipt Image URL *</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="receipt-url" 
                      placeholder="https://imgur.com/..." 
                      value={receiptUrl}
                      onChange={(e) => setReceiptUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload your receipt to Google Drive or Imgur and paste the link here.
                  </p>
                </div>
                <Button type="submit" className="w-full h-12 text-lg" disabled={submitting}>
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Upload className="h-5 w-5 mr-2" />}
                  Submit Payment Details
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium text-right ml-4">{course?.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">Rs. {course?.fee}</span>
              </div>
              <div className="pt-4 border-t flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>Rs. {course?.fee}</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Secure Payment
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
