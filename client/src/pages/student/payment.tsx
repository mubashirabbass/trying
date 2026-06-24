import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useGetCourse, useListSettings } from "@workspace/api-client-react";
import {
  Loader2, Upload, CheckCircle, AlertCircle, Copy,
  User, Phone, MapPin, CreditCard, Banknote, Smartphone,
  Calendar, Shield, ChevronRight, Info, ReceiptText,
  ArrowLeft, Wallet, TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const BASE = window.location.origin;

type PaymentMethod = "easypaisa" | "jazzcash" | "bank_transfer";
type PaymentPlan = "full" | "monthly";

const parseDurationMonths = (durationStr: string): number => {
  if (!durationStr) return 3; // Fallback
  const match = durationStr.match(/(\d+)\s*(month|Month|mon|Mon)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  const numMatch = durationStr.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (durationStr.toLowerCase().includes("year")) {
      return num * 12;
    }
    return num;
  }
  return 3; // Default default
};

export default function StudentPayment() {
  const { courseId } = useParams();
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const { data: course, isLoading: courseLoading } = useGetCourse(Number(courseId));
  const { data: settings, isLoading: settingsLoading } = useListSettings();

  // Student info (pre-filled, editable)
  const [studentInfo, setStudentInfo] = useState({
    name: "", phone: "", address: "", cnic: "",
  });

  // Payment options
  const [method, setMethod] = useState<PaymentMethod>("easypaisa");
  const [plan, setPlan] = useState<PaymentPlan>("full");
  const [installmentMonths, setInstallmentMonths] = useState(3);

  // Receipt upload
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Pre-fill student info from auth context
  useEffect(() => {
    if (user) {
      setStudentInfo({
        name: user.name || "",
        phone: (user as any).phone || "",
        address: (user as any).address || "",
        cnic: (user as any).cnic || "",
      });
    }
  }, [user]);

  const [previousPayments, setPreviousPayments] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [hasExistingPlan, setHasExistingPlan] = useState(false);

  // Set installmentMonths automatically when course is loaded
  useEffect(() => {
    if (course && course.duration && !hasExistingPlan) {
      setInstallmentMonths(parseDurationMonths(course.duration));
    }
  }, [course, hasExistingPlan]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.id || !token || !courseId) return;
      try {
        const res = await fetch(`${BASE}/api/payments?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const coursePayments = data.filter((p: any) => p.courseId === Number(courseId));
          setPreviousPayments(coursePayments);
          
          const firstPayment = coursePayments[0];
          if (firstPayment) {
            setPlan(firstPayment.paymentPlan);
            setHasExistingPlan(true);
            if (firstPayment.paymentPlan === "monthly") {
              setInstallmentMonths(firstPayment.installmentMonths || 3);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch payments:", err);
      } finally {
        setIsLoadingPayments(false);
      }
    };
    fetchPayments();
  }, [user?.id, courseId, token]);

  const getSetting = (key: string) => settings?.find((s: any) => s.key === key)?.value || "Not configured";

  const totalFee = course?.fee || 0;
  const verifiedPayments = previousPayments.filter((p: any) => p.status === "verified");
  const hasPendingPayment = previousPayments.some((p: any) => p.status === "pending");
  const totalPaid = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingFee = totalFee - totalPaid;

  const monthlyFee = plan === "monthly" ? Math.ceil(totalFee / installmentMonths) : totalFee;
  const amountDueNow = plan === "monthly" ? (remainingFee < monthlyFee ? remainingFee : monthlyFee) : remainingFee;
  const nextInstallmentNumber = plan === "monthly" ? verifiedPayments.length + 1 : 1;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const handleReceiptUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" }); return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file); // reuse avatar upload endpoint
      const res = await fetch(`${BASE}/api/users/upload-avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setReceiptUrl(data.url);
      toast({ title: "Receipt uploaded successfully!" });
    } catch (err: any) {
      toast({ title: err.message || "Upload failed", variant: "destructive" });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async () => {
    if (!receiptUrl) {
      toast({ title: "Please upload your payment receipt", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/payments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: Number(courseId),
          userId: user?.id,
          amount: amountDueNow,
          totalFee,
          remainingFee: Math.max(0, remainingFee - amountDueNow),
          paymentPlan: plan,
          installmentMonths: plan === "monthly" ? installmentMonths : null,
          installmentNumber: nextInstallmentNumber,
          method,
          receiptUrl,
          notes: `${plan === "monthly" ? `Monthly plan - Installment ${nextInstallmentNumber} of ${installmentMonths}` : "Full payment"} | Student: ${studentInfo.name} | CNIC: ${studentInfo.cnic}`,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      toast({
        title: "Receipt submitted successfully! 🎉",
        description: "Admin will verify your payment and update your installment status.",
      });
      setLocation("/dashboard/courses");
    } catch {
      toast({ title: "Submission failed. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (courseLoading || settingsLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  const METHODS = [
    { id: "easypaisa" as PaymentMethod, label: "EasyPaisa", color: "text-green-600", bg: "bg-green-50 border-green-200", settingKey: "easypaisa_account" },
    { id: "jazzcash" as PaymentMethod, label: "JazzCash", color: "text-red-600", bg: "bg-red-50 border-red-200", settingKey: "jazzcash_account" },
    { id: "bank_transfer" as PaymentMethod, label: "Bank Transfer", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", settingKey: "bank_account" },
  ];

  const selectedMethod = METHODS.find(m => m.id === method)!;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/courses">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-200">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Course Enrollment</h1>
            <p className="text-sm text-slate-500 font-medium">{course?.title}</p>
          </div>
        </div>

        {hasPendingPayment && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex items-start gap-3.5 shadow-sm">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <h4 className="font-black text-amber-800 text-sm">Payment Verification Pending</h4>
              <p className="text-xs text-amber-700 font-semibold leading-relaxed">
                You have already submitted a payment receipt for this course. Please wait for the admin to verify it. You cannot submit another payment request while one is pending.
              </p>
            </div>
          </div>
        )}

        {hasExistingPlan && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black text-blue-800 text-xs">Payment Plan Locked</h4>
              <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                Your payment plan is locked to the <strong>{plan === "monthly" ? "Monthly Installment" : "Pay in Full"}</strong> plan chosen in your first payment.
              </p>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[{ n: 1, label: "Your Info" }, { n: 2, label: "Payment Plan" }, { n: 3, label: "Submit Receipt" }].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${step >= n ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                {step > n ? <CheckCircle className="h-4 w-4" /> : n}
              </div>
              <span className={`text-xs font-bold hidden sm:block ${step >= n ? "text-slate-800" : "text-slate-400"}`}>{label}</span>
              {n < 3 && <div className={`h-px w-8 ${step > n ? "bg-indigo-400" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">

            {/* STEP 1: Student Info */}
            <Card className={`border-2 rounded-2xl transition-all ${step === 1 ? "border-indigo-200 shadow-md" : "border-slate-100"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                    Step 1 — Confirm Your Details
                  </CardTitle>
                  {step > 1 && (
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-600" onClick={() => setStep(1)}>
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              {step === 1 && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Full Name *</Label>
                      <Input value={studentInfo.name} onChange={e => setStudentInfo({ ...studentInfo, name: e.target.value })}
                        className="h-11 rounded-xl border-slate-200 font-medium" placeholder="Your full name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone Number *</Label>
                      <Input value={studentInfo.phone} onChange={e => setStudentInfo({ ...studentInfo, phone: e.target.value })}
                        className="h-11 rounded-xl border-slate-200 font-medium" placeholder="03xx-xxxxxxx" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> CNIC Number</Label>
                      <Input value={studentInfo.cnic} onChange={e => setStudentInfo({ ...studentInfo, cnic: e.target.value })}
                        className="h-11 rounded-xl border-slate-200 font-medium" placeholder="XXXXX-XXXXXXX-X" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Address</Label>
                      <Input value={studentInfo.address} onChange={e => setStudentInfo({ ...studentInfo, address: e.target.value })}
                        className="h-11 rounded-xl border-slate-200 font-medium" placeholder="Your city / address" />
                    </div>
                  </div>
                  <Button
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                    onClick={() => {
                      if (!studentInfo.name || !studentInfo.phone) {
                        toast({ title: "Name and phone are required", variant: "destructive" }); return;
                      }
                      setStep(2);
                    }}
                  >
                    Continue to Payment Plan <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              )}
              {step > 1 && (
                <CardContent className="pb-4">
                  <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-600">
                    <span className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">{studentInfo.name}</span>
                    <span className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">{studentInfo.phone}</span>
                    {studentInfo.cnic && <span className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">CNIC: {studentInfo.cnic}</span>}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* STEP 2: Payment Plan */}
            {step >= 2 && (
              <Card className={`border-2 rounded-2xl transition-all ${step === 2 ? "border-indigo-200 shadow-md" : "border-slate-100"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                      </div>
                      Step 2 — Choose Payment Plan
                    </CardTitle>
                    {step > 2 && (
                      <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-600" onClick={() => setStep(2)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {step === 2 && (
                  <CardContent className="space-y-5">
                    {/* Plan Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "full" as PaymentPlan, label: "Pay in Full", desc: `Rs. ${totalFee.toLocaleString()} once`, icon: CreditCard, color: "indigo" },
                        { value: "monthly" as PaymentPlan, label: "Pay Monthly", desc: "Split into installments", icon: Calendar, color: "emerald" },
                      ].map(({ value, label, desc, icon: Icon, color }) => (
                        <button key={value} 
                          type="button"
                          onClick={() => { if (!hasExistingPlan) setPlan(value); }}
                          disabled={hasExistingPlan}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            hasExistingPlan && plan !== value ? "opacity-40 cursor-not-allowed border-slate-100 bg-slate-50" : ""
                          } ${plan === value ? `border-${color}-400 bg-${color}-50` : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                          <Icon className={`h-5 w-5 mb-2 ${plan === value ? `text-${color}-600` : "text-slate-400"}`} />
                          <p className={`font-black text-sm ${plan === value ? "text-slate-900" : "text-slate-600"}`}>{label}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{desc}</p>
                        </button>
                      ))}
                    </div>

                    {/* Monthly config */}
                    {plan === "monthly" && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-emerald-805 uppercase tracking-wider">Installment Plan Details</p>
                          <p className="text-[11px] text-emerald-700 font-medium">
                            Split into monthly installments based on the course duration of <strong>{course?.duration}</strong>.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white rounded-xl p-3 border border-emerald-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Installment Period</span>
                            <span className="font-black text-slate-800 text-sm">{installmentMonths} Months</span>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-emerald-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Payment</span>
                            <span className="font-black text-emerald-700 text-sm">Rs. {monthlyFee.toLocaleString()}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          Each monthly payment requires admin approval. Your access continues as long as installments are paid on time.
                        </p>
                      </div>
                    )}

                    {/* Payment Method */}
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Payment Method</p>
                      <div className="grid grid-cols-3 gap-2">
                        {METHODS.map(m => (
                          <button key={m.id} onClick={() => setMethod(m.id)}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${method === m.id ? `${m.bg} border-current ${m.color}` : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                            <Smartphone className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-xs font-black">{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Account info */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Transfer Rs. {amountDueNow.toLocaleString()} to:</p>
                      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{selectedMethod.label} Account</p>
                          <p className="font-black text-slate-900 text-base font-mono">{getSetting(selectedMethod.settingKey)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => handleCopy(getSetting(selectedMethod.settingKey))}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="font-medium">After transferring, take a screenshot of your receipt and upload it in the next step.</span>
                      </div>
                    </div>

                    <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl" onClick={() => setStep(3)}>
                      I've Made the Payment <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                )}
                {step > 2 && (
                  <CardContent className="pb-4">
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <span className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700">
                        {plan === "full" ? "Full Payment" : `Monthly — ${installmentMonths} months`}
                      </span>
                      <span className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700">{selectedMethod.label}</span>
                      <span className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 text-indigo-700">Rs. {amountDueNow.toLocaleString()} due now</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* STEP 3: Receipt Upload */}
            {step >= 3 && (
              <Card className="border-2 border-indigo-200 shadow-md rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                      <ReceiptText className="h-4 w-4 text-amber-600" />
                    </div>
                    Step 3 — Upload Payment Receipt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload zone */}
                   <label className={`block w-full border-2 border-dashed rounded-2xl cursor-pointer transition-all relative overflow-hidden ${
                     uploadingReceipt ? "border-indigo-300 bg-indigo-50/5 cursor-wait" :
                     receiptPreview ? "border-emerald-300 bg-emerald-50" : 
                     "border-slate-350 hover:border-indigo-300 hover:bg-indigo-50/30"
                   }`}>
                     <input 
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       disabled={uploadingReceipt}
                       onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptUpload(f); }} 
                     />
                     {uploadingReceipt ? (
                       <div className="py-10 flex flex-col items-center justify-center gap-3">
                         <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
                         <div className="text-center">
                           <p className="font-black text-indigo-900 text-sm">Uploading Receipt...</p>
                           <p className="text-xs text-slate-405 font-semibold mt-1">Please wait, saving to secure server</p>
                         </div>
                       </div>
                     ) : receiptPreview ? (
                       <div className="p-4 flex items-center gap-4">
                         <img src={receiptPreview} alt="Receipt" className="h-20 w-20 object-cover rounded-xl border border-slate-200" />
                         <div>
                           <p className="font-black text-emerald-700 text-sm flex items-center gap-1.5">
                             <CheckCircle className="h-4 w-4" /> Receipt uploaded!
                           </p>
                           <p className="text-xs text-slate-500 font-medium mt-0.5">{receiptFile?.name}</p>
                           <p className="text-xs text-indigo-600 font-bold mt-2">Click to change</p>
                         </div>
                       </div>
                     ) : (
                       <div className="py-10 flex flex-col items-center gap-3">
                         <Upload className="h-8 w-8 text-slate-400" />
                         <div className="text-center">
                           <p className="font-black text-slate-700 text-sm">Tap to upload receipt</p>
                           <p className="text-xs text-slate-400 font-medium mt-1">Screenshot or photo of your transaction — JPG, PNG up to 5MB</p>
                         </div>
                       </div>
                     )}
                   </label>

                  {/* Or paste URL */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500">Or paste a receipt image URL</Label>
                    <Input value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 font-medium text-sm"
                      placeholder="https://imgur.com/..." />
                  </div>

                  <Button
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-base shadow-lg shadow-indigo-500/20"
                    onClick={handleSubmit}
                    disabled={submitting || uploadingReceipt || !receiptUrl || hasPendingPayment}
                  >
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                    {hasPendingPayment ? "Verification Pending" : "Submit Receipt & Fulfill Pay"}
                  </Button>

                  <p className="text-xs text-slate-400 text-center font-medium">
                    Your enrollment will be activated after admin verifies your receipt (usually within 24 hours)
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-4">
            <Card className="border-2 border-slate-100 rounded-2xl sticky top-6">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl" />
              <CardContent className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enrolling In</p>
                  <h3 className="font-black text-slate-900 text-sm leading-snug">{course?.title}</h3>
                  <Badge className="mt-1.5 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">{course?.category}</Badge>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Course Fee</span>
                    <span className="font-black text-slate-800">Rs. {totalFee.toLocaleString()}</span>
                  </div>
                  {plan === "monthly" && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Installments</span>
                        <span className="font-black text-slate-800">{installmentMonths} months</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Per Month</span>
                        <span className="font-black text-emerald-600">Rs. {monthlyFee.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-slate-100 pt-2.5 flex justify-between">
                    <span className="font-black text-slate-800 text-sm">{plan === "monthly" ? `Installment #${nextInstallmentNumber}` : "Due Now"}</span>
                    <span className="font-black text-indigo-700 text-lg">Rs. {amountDueNow.toLocaleString()}</span>
                  </div>
                  {plan === "monthly" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">Remaining balance</span>
                      <span className="font-black text-slate-500">Rs. {Math.max(0, remainingFee - amountDueNow).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Admin-verified enrollment</div>
                  <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> 24-hour activation</div>
                  <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Official certificate on completion</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
