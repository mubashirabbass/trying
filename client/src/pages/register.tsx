import { useState, useMemo } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import {
  useRegister,
  useListBranches,
  getListBranchesQueryKey,
  RegisterBodyRole,
} from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  UserPlus,
  Mail,
  User,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Award,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  Users,
  FileText,
  Calendar,
  Book,
  Upload,
  Camera,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Password strength helper ─────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "Weak", color: "#ef4444" },
    { label: "Fair", color: "#f97316" },
    { label: "Good", color: "#eab308" },
    { label: "Strong", color: "#22c55e" },
    { label: "Very Strong", color: "#10b981" },
  ];
  return { score, ...map[score] };
}

// ─── Feature bullet ───────────────────────────────────────────────────────────
function Feature({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3 text-white/80">
      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Register() {
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  
  // Step 2 fields
  const [cnic, setCnic] = useState("");
  const [dob, setDob] = useState("");
  const [cnicFile, setCnicFile] = useState<File | null>(null);
  const [lastEducation, setLastEducation] = useState<"Matric" | "Intermediate" | "BS" | "">("");
  const [educationStream, setEducationStream] = useState("");
  const [obtainedMarks, setObtainedMarks] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [educationFile, setEducationFile] = useState<File | null>(null);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [registeredData, setRegisteredData] = useState<any>(null);

  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const registerMutation = useRegister();
  const { data: branchesResponse, isLoading: branchesLoading } = useListBranches({
    query: { queryKey: getListBranchesQueryKey() },
  });
  const branches = branchesResponse || [];

  const strength = useMemo(() => getStrength(password), [password]);
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const canProceedToStep2 = 
    name && email && phone && branchId && password && confirmPassword && 
    password === confirmPassword && agreed;

  const canSubmit =
    canProceedToStep2 && 
    cnic && dob && cnicFile && lastEducation && educationFile &&
    (lastEducation === "Matric" ? (obtainedMarks && totalMarks) : true) &&
    (lastEducation === "Intermediate" ? (educationStream && obtainedMarks && totalMarks) : true) &&
    (lastEducation === "BS" ? educationStream : true) &&
    !registerMutation.isPending && !isUploading;

  const handleNextStep = () => {
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (!agreed) {
      toast({ title: "Please accept the Terms & Conditions", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    let identityDocumentUrl = "";
    let educationDocumentUrl = "";
    let uploadedAvatarUrl = avatarUrl;

    try {
      setIsUploading(true);

      // Upload profile picture first (if selected)
      if (avatarFile && !avatarUrl) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        const res = await fetch("/api/upload/image", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          const errMsg = data.error?.message || data.error || data.message || "Failed to upload profile picture";
          throw new Error(typeof errMsg === "object" ? JSON.stringify(errMsg) : errMsg);
        }
        uploadedAvatarUrl = data.url;
        setAvatarUrl(uploadedAvatarUrl);
      }
      
      // Upload CNIC/B-Form
      if (cnicFile) {
        const formData = new FormData();
        formData.append("file", cnicFile);
        const res = await fetch("/api/upload/image", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          const errMsg = data.error?.message || data.error || data.message || "Failed to upload Identity Document";
          throw new Error(typeof errMsg === "object" ? JSON.stringify(errMsg) : errMsg);
        }
        identityDocumentUrl = data.url;
      }

      // Upload Education Document (PDF or image)
      if (educationFile) {
        const formData = new FormData();
        const isPdf = educationFile.type === "application/pdf";
        formData.append("file", educationFile);
        const endpoint = isPdf ? "/api/upload/pdf" : "/api/upload/image";
        const res = await fetch(endpoint, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          const errMsg = data.error?.message || data.error || data.message || "Failed to upload Education Document";
          throw new Error(typeof errMsg === "object" ? JSON.stringify(errMsg) : errMsg);
        }
        educationDocumentUrl = data.url;
      }
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
      setIsUploading(false);
      return;
    }
    
    setIsUploading(false);

    registerMutation.mutate(
      {
        data: {
          name,
          email,
          password,
          phone: phone || undefined,
          cnic: cnic || undefined,
          dob: dob || undefined,
          avatar: uploadedAvatarUrl || undefined,
          identityDocumentUrl: identityDocumentUrl || undefined,
          lastEducation: lastEducation || undefined,
          educationStream: educationStream || undefined,
          obtainedMarks: obtainedMarks ? Number(obtainedMarks) : undefined,
          totalMarks: totalMarks ? Number(totalMarks) : undefined,
          educationDocumentUrl: educationDocumentUrl || undefined,
          branchId: branchId ? Number(branchId) : undefined,
          role: "student" as RegisterBodyRole,
        },
      },
      {
        onSuccess: (data) => {
          toast({
            title: "🎉 Application Received!",
            description: "Please check your registered details below.",
            duration: 5000,
          });
          setRegisteredData({
            name,
            email,
            phone,
            cnic,
            dob,
            avatar: uploadedAvatarUrl || avatarUrl || avatarPreview || "",
            lastEducation,
            educationStream,
            obtainedMarks,
            totalMarks,
            branchName: branches.find((b: any) => b.id.toString() === branchId)?.name || "Main Campus"
          });
        },
        onError: (error: any) => {
          toast({
            title: "Registration Failed",
            description:
              error?.data?.error?.message ||
              error?.data?.message ||
              error?.message ||
              "An error occurred during registration. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (registeredData) {
    return (
      <MainLayout>
        <div className="flex-1 min-h-screen flex items-center justify-center p-6 bg-slate-50 relative">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at top right, #eff6ff 0%, transparent 55%), radial-gradient(ellipse at bottom left, #f0fdf4 0%, transparent 55%)",
            }}
          />
          
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/80 border border-slate-100 p-8 sm:p-12 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />

            <div className="flex flex-col items-center text-center mb-8">
              {registeredData.avatar ? (
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl mb-4 ring-4 ring-emerald-100">
                  <img 
                    src={registeredData.avatar} 
                    alt="Profile photo" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-4xl font-black">
                          ${registeredData.name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                      `;
                    }}
                  />
                </div>
              ) : registeredData.name ? (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center border-4 border-emerald-500 shadow-xl mb-4 ring-4 ring-emerald-100">
                  <span className="text-white text-4xl font-black">
                    {registeredData.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-lg shadow-emerald-500/10 mb-4 animate-bounce">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
              )}
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">🎉 Registration Submitted!</h1>
              <p className="text-slate-500 font-semibold mt-1">Thank you for applying to Global College</p>
            </div>

            {/* Verification message card */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-6 mb-8 text-left flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-blue-900 text-sm">Application Under Review</p>
                <p className="text-blue-700 text-xs sm:text-sm font-medium leading-relaxed">
                  Please wait, our team will verify your details and your login will be created. A confirmation mail will be sent to your registered Gmail.
                </p>
              </div>
            </div>

            {/* Profile summary card */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-6 sm:p-8 mb-8 text-left">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                Application Summary
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Full Name</p>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">{registeredData.name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Email Address</p>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">{registeredData.email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Phone Number</p>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">{registeredData.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Branch / Campus</p>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">{registeredData.branchName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">CNIC / Form-B</p>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">{registeredData.cnic}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Date of Birth</p>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                    {new Date(registeredData.dob).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Education Level</p>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">{registeredData.lastEducation}</p>
                </div>
                {registeredData.lastEducation === "Matric" || registeredData.lastEducation === "Intermediate" ? (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Academic Score</p>
                    <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                      {registeredData.obtainedMarks} / {registeredData.totalMarks} Marks
                    </p>
                  </div>
                ) : null}
                {registeredData.educationStream ? (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Academic Program</p>
                    <p className="text-sm font-extrabold text-slate-800 mt-0.5">{registeredData.educationStream}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <Button
              onClick={() => setLocation("/login")}
              className="w-full h-13 font-bold rounded-xl shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all"
              style={{ height: 52 }}
            >
              Okay
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 min-h-screen flex">
        {/* ── LEFT PANEL ── */}
        <div
          className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #1e3a5f 0%, #0f2540 40%, #162d4a 100%)",
          }}
        >
          {/* Decorative blobs */}
          <div
            className="absolute -top-24 -right-24 h-80 w-80 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
          />
          <div
            className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
          />

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
              >
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-xl tracking-tight">EduSphere</p>
                <p className="text-white/50 text-xs">Learning Management System</p>
              </div>
            </div>
          </div>

          {/* Hero text */}
          <div className="relative z-10 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
                <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                Start Learning Today — It's Free
              </div>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                Unlock Your<br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg, #60a5fa, #a78bfa)" }}
                >
                  Learning Potential
                </span>
              </h1>
              <p className="mt-4 text-white/60 text-base leading-relaxed max-w-xs">
                Join thousands of students advancing their careers with world-class courses.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Feature icon={BookOpen} text="Access 100+ curated courses across all programs" />
              <Feature icon={Award} text="Earn verified certificates recognized by employers" />
              <Feature icon={Globe} text="Learn at your own pace, anytime, anywhere" />
              <Feature icon={Users} text="Join a community of 5,000+ active learners" />
            </div>
          </div>

          {/* Testimonial */}
          <div className="relative z-10 bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
            <p className="text-white/80 text-sm italic leading-relaxed">
              "EduSphere completely changed how I learn. The courses are structured brilliantly
              and the support is phenomenal."
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                JS
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Javeria Saeed</p>
                <p className="text-white/50 text-[10px]">Enrolled in FSc Pre-Medical</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (FORM) ── */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-24 bg-white relative">
          <div className="max-w-md w-full mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {step === 1 ? "Create an account" : "Educational & Identity Details"}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {step === 1 
                  ? "Enter your basic details to get started." 
                  : "Help us verify your profile by providing your documents."}
              </p>
              
              {/* Stepper */}
              <div className="flex items-center gap-2 mt-6 mb-2">
                <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-blue-600" : "bg-slate-100"}`} />
                <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-blue-600" : "bg-slate-100"}`} />
              </div>
              <p className="text-xs text-slate-400 font-medium">Step {step} of 2</p>
            </div>

            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit} className="space-y-5">
              
              {/* ── STEP 1 FIELDS ── */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">

                  {/* ── Profile Picture Upload ── */}
                  <div className="flex flex-col items-center gap-3 pb-2">
                    <div className="relative">
                      <label htmlFor="avatarInput" className="cursor-pointer block">
                        <div className={`h-24 w-24 rounded-full border-4 flex items-center justify-center overflow-hidden transition-all ${
                          avatarPreview ? "border-blue-400 shadow-lg shadow-blue-200" : "border-dashed border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
                        }`}>
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Profile preview" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="h-8 w-8 text-slate-300" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-md">
                          <Upload className="h-3.5 w-3.5 text-white" />
                        </div>
                      </label>
                      <input
                        id="avatarInput"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            toast({ title: "Image too large. Maximum size is 2 MB.", variant: "destructive" });
                            return;
                          }
                          setAvatarFile(file);
                          setAvatarUrl(""); // reset pre-uploaded
                          const reader = new FileReader();
                          reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        {avatarPreview ? "Profile Photo Selected ✓" : "Upload Profile Photo"}
                      </p>
                      <p className="text-xs text-slate-400">JPEG, PNG, WebP · Max 2 MB · Optional</p>
                    </div>
                  </div>

                  {/* ── Name ── */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-slate-700 font-medium text-sm">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" style={{ height: 18, width: 18 }} />
                      <Input
                        id="name"
                        required
                        value={name}
                        onBlur={() => setTouched(t => ({ ...t, name: true }))}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        placeholder="e.g. Ali Hassan"
                      />
                    </div>
                    {touched.name && !name && (
                      <p className="text-xs text-red-500 pl-1">Full name is required.</p>
                    )}
                  </div>

                  {/* ── Email ── */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" style={{ height: 18, width: 18 }} />
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onBlur={() => setTouched(t => ({ ...t, email: true }))}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                    {touched.email && !email && (
                      <p className="text-xs text-red-500 pl-1">Email address is required.</p>
                    )}
                  </div>

                  {/* ── Phone ── */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-slate-700 font-medium text-sm">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" style={{ height: 18, width: 18 }} />
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={phone}
                        onBlur={() => setTouched(t => ({ ...t, phone: true }))}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        placeholder="+92 300 1234567"
                      />
                    </div>
                    {touched.phone && !phone && (
                      <p className="text-xs text-red-500 pl-1">Phone number is required.</p>
                    )}
                  </div>

                  {/* ── Branch ── */}
                  <div className="space-y-1.5">
                    <Label htmlFor="branch" className="text-slate-700 font-medium text-sm">
                      Select Branch / Campus <span className="text-red-500">*</span>
                    </Label>
                    <Select value={branchId} onValueChange={setBranchId} required disabled={branchesLoading}>
                      <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                          <SelectValue placeholder={branchesLoading ? "Loading campuses…" : "Choose your campus"} />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {branches.length === 0 && !branchesLoading ? (
                          <div className="p-4 text-center text-sm text-slate-500">No campuses found.</div>
                        ) : (
                          branches.map((branch: any) => (
                            <SelectItem key={branch.id} value={branch.id.toString()}>
                              {branch.name} — {branch.city}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {touched.branch && !branchId && (
                      <p className="text-xs text-red-500 pl-1">Please select a campus.</p>
                    )}
                  </div>

                  {/* ── Password ── */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-slate-700 font-medium text-sm">
                      Create Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" style={{ height: 18, width: 18 }} />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onBlur={() => setTouched(t => ({ ...t, password: true }))}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-11 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff style={{ height: 18, width: 18 }} /> : <Eye style={{ height: 18, width: 18 }} />}
                      </button>
                    </div>
                    {password && (
                      <div className="space-y-1 pt-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="h-1.5 flex-1 rounded-full transition-all duration-300"
                              style={{ background: i <= strength.score ? strength.color : "#e2e8f0" }}
                            />
                          ))}
                        </div>
                        <p className="text-xs pl-0.5" style={{ color: strength.color }}>
                          {strength.label}
                          {strength.score < 3 && (
                            <span className="text-slate-400 ml-1">— add uppercase letters, numbers or symbols</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── Confirm Password ── */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-medium text-sm">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" style={{ height: 18, width: 18 }} />
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`pl-10 pr-11 h-12 bg-slate-50 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20 ${
                          passwordMismatch
                            ? "border-red-400 focus:border-red-400"
                            : confirmPassword && !passwordMismatch
                            ? "border-green-400 focus:border-green-400"
                            : "border-slate-200 focus:border-blue-400"
                        }`}
                        placeholder="Re-enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff style={{ height: 18, width: 18 }} /> : <Eye style={{ height: 18, width: 18 }} />}
                      </button>
                    </div>
                    {passwordMismatch && (
                      <p className="text-xs text-red-500 pl-1">Passwords do not match.</p>
                    )}
                  </div>

                  {/* ── Terms ── */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group select-none">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                            agreed
                              ? "border-blue-500 bg-blue-500"
                              : "border-slate-300 bg-white group-hover:border-blue-400"
                          }`}
                        >
                          {agreed && (
                            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-slate-600 leading-relaxed">
                        I agree to the{" "}
                        <Link href="/terms" className="text-blue-600 font-medium hover:underline">Terms & Conditions</Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="text-blue-600 font-medium hover:underline">Privacy Policy</Link>
                      </span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-13 font-bold rounded-xl shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-60 mt-4"
                    style={{
                      height: 52,
                      background: canProceedToStep2 ? "linear-gradient(135deg, #3b82f6, #6366f1)" : undefined,
                    }}
                    disabled={!canProceedToStep2}
                  >
                    Next Step <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* ── STEP 2 FIELDS ── */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  
                  {/* CNIC/Form-B */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cnic" className="text-slate-700 font-medium text-sm">
                      CNIC / Form-B Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" style={{ height: 18, width: 18 }} />
                      <Input
                        id="cnic"
                        type="text"
                        required
                        value={cnic}
                        onChange={(e) => setCnic(e.target.value)}
                        className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        placeholder="XXXXX-XXXXXXX-X"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="text-slate-700 font-medium text-sm">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" style={{ height: 18, width: 18 }} />
                      <Input
                        id="dob"
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      />
                    </div>
                  </div>

                  {/* CNIC Photo Upload */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cnicFile" className="text-slate-700 font-medium text-sm">
                      Upload CNIC / Form-B Photo <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" style={{ height: 18, width: 18 }} />
                      <Input
                        id="cnicFile"
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => setCnicFile(e.target.files?.[0] || null)}
                        className="pl-10 h-12 pt-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 file:border-0 file:bg-transparent file:text-sm file:font-medium"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 my-4 pt-4">
                    <h3 className="font-semibold text-slate-800 mb-3">Educational Details</h3>
                    
                    {/* Last Education Selection */}
                    <div className="space-y-1.5 mb-4">
                      <Label htmlFor="lastEducation" className="text-slate-700 font-medium text-sm">
                        Last Education <span className="text-red-500">*</span>
                      </Label>
                      <Select value={lastEducation} onValueChange={(val: any) => setLastEducation(val)} required>
                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                          <div className="flex items-center gap-2">
                            <Book className="h-4 w-4 text-slate-400 shrink-0" />
                            <SelectValue placeholder="Select Education Level" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Matric">Matric / O-Level</SelectItem>
                          <SelectItem value="Intermediate">Intermediate / A-Level</SelectItem>
                          <SelectItem value="BS">BS / Bachelor's</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Conditional Fields based on Education */}
                    {lastEducation && (
                      <div className="space-y-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                        
                        {(lastEducation === "Intermediate" || lastEducation === "BS") && (
                          <div className="space-y-1.5">
                            <Label htmlFor="educationStream" className="text-slate-700 font-medium text-sm">
                              {lastEducation === "Intermediate" ? "Stream (e.g. FSc Pre-Medical, ICS)" : "Discipline / Major (e.g. Computer Science)"} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="educationStream"
                              required
                              value={educationStream}
                              onChange={(e) => setEducationStream(e.target.value)}
                              className="h-12 bg-white border-slate-200 rounded-xl"
                              placeholder={lastEducation === "Intermediate" ? "e.g. ICS or FSc Pre-Engineering" : "e.g. BS Software Engineering"}
                            />
                          </div>
                        )}

                        {(lastEducation === "Matric" || lastEducation === "Intermediate") && (
                          <div className="flex gap-4">
                            <div className="space-y-1.5 flex-1">
                              <Label htmlFor="obtainedMarks" className="text-slate-700 font-medium text-sm">
                                Obtained Marks <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="obtainedMarks"
                                type="number"
                                required
                                value={obtainedMarks}
                                onChange={(e) => setObtainedMarks(e.target.value)}
                                className="h-12 bg-white border-slate-200 rounded-xl"
                                placeholder="e.g. 850"
                              />
                            </div>
                            <div className="space-y-1.5 flex-1">
                              <Label htmlFor="totalMarks" className="text-slate-700 font-medium text-sm">
                                Total Marks <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="totalMarks"
                                type="number"
                                required
                                value={totalMarks}
                                onChange={(e) => setTotalMarks(e.target.value)}
                                className="h-12 bg-white border-slate-200 rounded-xl"
                                placeholder="e.g. 1100"
                              />
                            </div>
                          </div>
                        )}

                        {/* Document Upload for Education */}
                        <div className="space-y-1.5">
                          <Label htmlFor="educationFile" className="text-slate-700 font-medium text-sm">
                            Upload {lastEducation === "BS" ? "Transcript" : "Result Card"} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="educationFile"
                            type="file"
                            accept="image/*,.pdf"
                            required
                            onChange={(e) => setEducationFile(e.target.files?.[0] || null)}
                            className="h-12 pt-3 bg-white border-slate-200 rounded-xl file:border-0 file:bg-transparent file:text-sm file:font-medium"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Email verification notice ── */}
                  <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 p-3.5">
                    <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Your account will be activated once your documents are approved by the administrator.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button
                      type="button"
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="h-13 rounded-xl border-slate-200 px-4"
                      style={{ height: 52 }}
                      disabled={registerMutation.isPending || isUploading}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-13 font-bold rounded-xl shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                      style={{
                        height: 52,
                        background: canSubmit ? "linear-gradient(135deg, #3b82f6, #6366f1)" : undefined,
                      }}
                      disabled={!canSubmit}
                    >
                      {registerMutation.isPending || isUploading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5 mr-2" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-500 transition-colors">
                  Sign In →
                </Link>
              </p>
            </div>

            <p className="text-center text-xs text-slate-400 mt-5">
              By registering, you confirm that the information provided is accurate.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
