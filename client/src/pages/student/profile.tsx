import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Edit3,
  GraduationCap,
  FileText,
  IdCard,
  Calendar,
  Award,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  UserCircle,
  BookOpen,
  TrendingUp,
  Target,
  Home,
  X,
  Sparkles,
} from "lucide-react";

const BASE = window.location.origin;

export default function StudentProfile() {
  const { user, token, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Profile completion calculation
  const calculateProfileCompletion = () => {
    const fields = [
      user?.name,
      user?.email,
      user?.phone,
      user?.cnic,
      user?.dob,
      user?.gender,
      user?.address,
      user?.avatar,
      user?.qualification,
      user?.specialization,
    ];
    const filledFields = fields.filter(f => f && f.toString().trim()).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const [profileCompletion, setProfileCompletion] = useState(0);

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    cnic: "",
    dob: "",
    gender: "",
    address: "",
    avatar: "",
  });

  const [educationForm, setEducationForm] = useState({
    qualification: "",
    specialization: "",
    obtainedMarks: "",
    totalMarks: "",
    educationDocumentUrl: "",
  });

  const [identityForm, setIdentityForm] = useState({
    identityDocumentUrl: "",
  });

  // Fetch fresh user data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id || !token) return;
      
      setIsLoadingProfile(true);
      try {
        const response = await fetch(`${BASE}/api/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const freshUserData = await response.json();
          
          // Update forms with fresh data FIRST (before refreshUser to ensure immediate display)
          setProfileForm({
            name: freshUserData.name || "",
            phone: freshUserData.phone || "",
            cnic: freshUserData.cnic || "",
            dob: freshUserData.dob ? new Date(freshUserData.dob).toISOString().slice(0, 10) : "",
            gender: freshUserData.gender || "",
            address: freshUserData.address || "",
            avatar: freshUserData.avatar || "",
          });
          
          setEducationForm({
            qualification: freshUserData.qualification || "",
            specialization: freshUserData.specialization || "",
            obtainedMarks: freshUserData.obtainedMarks?.toString() || "",
            totalMarks: freshUserData.totalMarks?.toString() || "",
            educationDocumentUrl: freshUserData.educationDocumentUrl || "",
          });
          
          setIdentityForm({
            identityDocumentUrl: freshUserData.identityDocumentUrl || "",
          });
          
          // Update AuthContext with fresh data
          await refreshUser?.();
          
          setProfileCompletion(calculateProfileCompletion());
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast({
          title: "Failed to load profile",
          description: "Please refresh the page",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user?.id, token]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEducation, setSavingEducation] = useState(false);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingEducationDoc, setUploadingEducationDoc] = useState(false);
  const [uploadingIdentityDoc, setUploadingIdentityDoc] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // Update forms when user data changes (after refresh)
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        cnic: user.cnic || "",
        dob: user.dob ? new Date(user.dob).toISOString().slice(0, 10) : "",
        gender: user.gender || "",
        address: user.address || "",
        avatar: user.avatar || "",
      });
      setEducationForm({
        qualification: user.qualification || "",
        specialization: user.specialization || "",
        obtainedMarks: user.obtainedMarks?.toString() || "",
        totalMarks: user.totalMarks?.toString() || "",
        educationDocumentUrl: user.educationDocumentUrl || "",
      });
      setIdentityForm({
        identityDocumentUrl: user.identityDocumentUrl || "",
      });
      setProfileCompletion(calculateProfileCompletion());
    }
  }, [user]);

  // Avatar upload handler (Corrected to /api/users/upload-avatar and avatar field)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image must be less than 2MB", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);
    setUploadingAvatar(true);

    try {
      // 1. Upload to Cloudinary via users route
      const response = await fetch(`${BASE}/api/users/upload-avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");

      // 2. Update user record with returned URL
      const updateResponse = await fetch(`${BASE}/api/users/${user?.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ avatar: data.url }),
      });

      if (updateResponse.ok) {
        await refreshUser?.();
        toast({ 
          title: "Profile picture uploaded!",
          description: "Your student profile picture is updated and active"
        });
      } else {
        const errData = await updateResponse.json();
        throw new Error(errData.message || "Failed to update profile record");
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: err.message || "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Avatar removal handler
  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const updateResponse = await fetch(`${BASE}/api/users/${user?.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ avatar: "" }),
      });

      if (updateResponse.ok) {
        await refreshUser?.();
        toast({ 
          title: "Profile picture removed",
          description: "Your profile picture has been reset successfully"
        });
      } else {
        const errData = await updateResponse.json();
        throw new Error(errData.message || "Failed to clear photo");
      }
    } catch (err: any) {
      toast({ title: err.message || "Failed to remove image", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Document upload handlers
  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "education" | "identity"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Please upload a PDF file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "PDF must be less than 5MB", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);
    
    if (type === "education") setUploadingEducationDoc(true);
    else setUploadingIdentityDoc(true);

    try {
      const response = await fetch(`${BASE}/api/upload-pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");

      if (type === "education") {
        setEducationForm({ ...educationForm, educationDocumentUrl: data.url });
      } else {
        setIdentityForm({ ...identityForm, identityDocumentUrl: data.url });
      }

      toast({ title: "Document uploaded successfully!" });
    } catch (err: any) {
      toast({ title: err.message || "Failed to upload document", variant: "destructive" });
    } finally {
      if (type === "education") setUploadingEducationDoc(false);
      else setUploadingIdentityDoc(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast({ title: "Name cannot be empty", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    try {
      // Build payload with only non-empty values
      const payload: any = {
        name: profileForm.name,
      };
      
      // Include optional fields
      payload.phone = profileForm.phone || null;
      payload.cnic = profileForm.cnic || null;
      payload.dob = profileForm.dob ? new Date(profileForm.dob).toISOString() : null;
      payload.gender = profileForm.gender || null;
      payload.address = profileForm.address || null;
      payload.avatar = profileForm.avatar || null;

      const r = await fetch(`${BASE}/api/users/${user?.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      
      if (r.ok) {
        const updatedUserData = await r.json();
        
        // Immediately update profileForm with response data
        setProfileForm({
          name: updatedUserData.name || "",
          phone: updatedUserData.phone || "",
          cnic: updatedUserData.cnic || "",
          dob: updatedUserData.dob ? new Date(updatedUserData.dob).toISOString().slice(0, 10) : "",
          gender: updatedUserData.gender || "",
          address: updatedUserData.address || "",
          avatar: updatedUserData.avatar || "",
        });
        
        // Update AuthContext with the new user data to persist changes everywhere
        await refreshUser?.();
        
        toast({ 
          title: "Profile updated successfully!",
          description: "Your changes have been saved and will reflect everywhere"
        });
      } else {
        const err = await r.json();
        toast({ title: err.message || "Failed to update profile", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setSavingProfile(false);
  };

  const handleSaveEducation = async () => {
    setSavingEducation(true);
    try {
      const payload: any = {
        qualification: educationForm.qualification,
        specialization: educationForm.specialization,
        educationDocumentUrl: educationForm.educationDocumentUrl,
      };

      if (educationForm.obtainedMarks) {
        payload.obtainedMarks = parseInt(educationForm.obtainedMarks);
      } else {
        payload.obtainedMarks = null;
      }
      
      if (educationForm.totalMarks) {
        payload.totalMarks = parseInt(educationForm.totalMarks);
      } else {
        payload.totalMarks = null;
      }

      const r = await fetch(`${BASE}/api/users/${user?.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        // Refresh user data everywhere
        await refreshUser?.();
        toast({ 
          title: "Education details updated successfully!",
          description: "Your academic information has been saved"
        });
      } else {
        const err = await r.json();
        toast({ title: err.message || "Failed to update education", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setSavingEducation(false);
  };

  const handleSaveIdentity = async () => {
    if (!identityForm.identityDocumentUrl) {
      toast({ title: "Please upload an identity document", variant: "destructive" });
      return;
    }
    setSavingIdentity(true);
    try {
      const r = await fetch(`${BASE}/api/users/${user?.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ identityDocumentUrl: identityForm.identityDocumentUrl }),
      });
      if (r.ok) {
        // Refresh user data everywhere
        await refreshUser?.();
        toast({ 
          title: "Identity document submitted for verification!",
          description: "Admin will review your document shortly"
        });
      } else {
        const err = await r.json();
        toast({ title: err.message || "Failed to submit document", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setSavingIdentity(false);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast({ title: "Please fill in all password fields", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      const r = await fetch(`${BASE}/api/auth/change-password`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (r.ok) {
        toast({ title: "Password changed successfully!" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const err = await r.json();
        toast({ title: err.message || "Incorrect current password", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setSavingPassword(false);
  };

  return (
    <DashboardLayout>
      {isLoadingProfile ? (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 animate-pulse"></div>
            <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-4 left-4" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-900">Loading Your Profile</p>
            <p className="text-sm text-slate-500">Fetching your latest information...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <UserCircle className="h-6 w-6" />
                </div>
                My Profile
              </h1>
              <p className="text-slate-500 mt-2 font-semibold text-base">
                Manage your student record, picture, educational status, and verification credentials
              </p>
            </div>
            <Badge className="w-fit bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-1.5 rounded-full font-bold text-sm">
              Student Hub
            </Badge>
          </div>

          {/* Missing Photo Attention Grabber Banner */}
          {!user?.avatar && (
            <div className="relative overflow-hidden rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50/70 via-orange-50/20 to-white p-6 shadow-md transition-all duration-300 hover:shadow-lg">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-amber-200/20 rounded-full blur-xl" />
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border-2 border-amber-300 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                  <Camera className="h-7 w-7 animate-pulse" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <h4 className="font-black text-amber-900 text-lg tracking-tight">📸 Profile Photo Missing</h4>
                    <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Recommended
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mt-1.5 leading-relaxed max-w-3xl font-semibold">
                    An official student profile picture is highly recommended to complete your registration profile and is <strong className="text-amber-800">required</strong> to issue verified, branded course certificates with your likeness and verification seal.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-95">
                      {uploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload Profile Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>
                    <a
                      href="#photo-url-section"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all duration-200"
                    >
                      Use hosted image link
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Completion and Basic Meta Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completion */}
            <Card className="md:col-span-1 border-2 border-slate-100 shadow-sm rounded-2xl overflow-hidden relative bg-white">
              <div className="h-1.5 bg-gradient-to-r from-primary to-blue-500" />
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-2xl font-black text-primary">{profileCompletion}%</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">Profile Strength</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Complete all registration details to unlock student benefits, grading statistics, and instant certificate downloads.
                  </p>
                </div>
                <div className="mt-5">
                  <Progress value={profileCompletion} className="h-3 bg-slate-100 rounded-full" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Details Card */}
            <Card className="md:col-span-2 border-2 border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-500" />
              <CardContent className="p-6">
                <h3 className="font-black text-slate-900 text-lg mb-3">Academic Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 block uppercase">BRANCH</span>
                    <span className="font-black text-slate-700 text-sm truncate block mt-0.5">
                      {user?.branchName || "Global / Online"}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 block uppercase">DEGREE LEVEL</span>
                    <span className="font-black text-slate-700 text-sm truncate block mt-0.5">
                      {user?.qualification || "Not provided"}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-xs font-bold text-slate-400 block uppercase">IDENTITY</span>
                    <span className={`inline-flex items-center gap-1 font-extrabold text-xs px-2.5 py-0.5 rounded-full mt-1.5 ${
                      user?.isIdentityVerified 
                        ? 'bg-purple-100 text-purple-800' 
                        : user?.identityVerificationStatus === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {user?.isIdentityVerified ? "Verified" : user?.identityVerificationStatus === 'pending' ? "Pending Review" : "Unverified"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Avatar Card */}
          <Card className="border-2 border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
            <div className="h-28 bg-[linear-gradient(135deg,rgba(37,99,235,0.9),rgba(99,102,241,0.95)_55%,rgba(124,58,237,0.9))] relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            </div>
            <CardContent className="px-6 pb-6 sm:px-8">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-14 relative z-10">
                <div className="relative group cursor-pointer mx-auto md:mx-0">
                  {user?.avatar ? (
                    <div className="relative overflow-hidden rounded-3xl h-28 w-28 bg-white shadow-xl ring-4 ring-white transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.03]">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white">
                        <Camera className="h-6 w-6 transform scale-75 group-hover:scale-100 transition-transform duration-300" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-28 w-28 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-xl ring-4 ring-white flex items-center justify-center text-primary text-5xl font-black transition-all duration-300 group-hover:scale-[1.03]">
                      {user?.name?.charAt(0).toUpperCase()}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white rounded-3xl">
                        <Camera className="h-6 w-6" />
                      </div>
                    </div>
                  )}
                  
                  {/* Floating Upload Trigger */}
                  <label className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer hover:scale-110">
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>

                <div className="flex-1 pb-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{user?.name}</h2>
                    {!user?.avatar && (
                      <Badge className="mx-auto md:mx-0 w-fit bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2.5 py-0.5 text-xs rounded-full">
                        ⚠️ Photo Pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-500 font-semibold text-base mt-0.5">{user?.email}</p>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-3 flex-wrap">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 capitalize font-bold px-3 py-1">
                      Student
                    </Badge>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1">
                      Active Portal
                    </Badge>
                    {user?.isIdentityVerified ? (
                      <Badge className="bg-purple-50 text-purple-700 border-purple-200 font-bold px-3 py-1 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verified Profile
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-bold px-3 py-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Unverified ID
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Photo Actions Quick Button Panel */}
                <div className="flex flex-wrap justify-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
                  <label className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border-2 border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-700 shadow-sm transition-all duration-200 cursor-pointer active:scale-95">
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Change Picture
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                  {user?.avatar && (
                    <Button
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      variant="outline"
                      className="h-11 px-4 rounded-xl border-2 border-rose-100 hover:bg-rose-50 hover:border-rose-200 text-rose-600 hover:text-rose-700 font-bold text-sm shadow-sm transition-all duration-200"
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="profile" className="space-y-6">
            <div className="bg-white rounded-2xl border-2 border-slate-100 p-2 shadow-sm">
              <TabsList className="bg-slate-50 rounded-xl p-1 w-full grid grid-cols-2 md:grid-cols-4 gap-1">
                <TabsTrigger 
                  value="profile" 
                  className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 justify-center py-2.5"
                >
                  <User className="h-4 w-4" /> Personal
                </TabsTrigger>
                <TabsTrigger 
                  value="education" 
                  className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 justify-center py-2.5"
                >
                  <GraduationCap className="h-4 w-4" /> Education
                </TabsTrigger>
                <TabsTrigger 
                  value="identity" 
                  className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 justify-center py-2.5"
                >
                  <IdCard className="h-4 w-4" /> Identity
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 justify-center py-2.5"
                >
                  <Shield className="h-4 w-4" /> Security
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border-2 border-slate-100 shadow-sm rounded-2xl bg-white">
                <CardHeader className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Edit3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900">Personal Information</CardTitle>
                      <CardDescription className="font-semibold">Review and update your basic demographic details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {/* Photo URL Config Panel (Direct link configuration) */}
                  <div id="photo-url-section" className="space-y-4 p-5 bg-slate-50 border border-slate-200/60 rounded-2xl">
                    <div>
                      <Label className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
                        <Camera className="h-5 w-5 text-primary" />
                        Profile Image URL configuration
                      </Label>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Prefer to host your own image? Paste a direct image link below, or upload a local image file. 
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4 items-center">
                      <div className="flex h-24 w-24 mx-auto md:mx-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-inner shrink-0 relative">
                        {profileForm.avatar ? (
                          <img src={profileForm.avatar} alt="Profile preview" className="h-full w-full object-cover" />
                        ) : (
                          <Upload className="h-7 w-7 text-slate-300" />
                        )}
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3 w-full">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-600">Hosted Picture URL</Label>
                          <Input
                            className="h-11 rounded-xl border-2 border-slate-200 focus:border-primary text-sm font-medium"
                            value={profileForm.avatar}
                            onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                            placeholder="https://example.com/your-photo.jpg"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <label className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs shadow-sm cursor-pointer transition-all duration-200">
                            {uploadingAvatar ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                            Browse File
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                              disabled={uploadingAvatar}
                            />
                          </label>
                          {profileForm.avatar && (
                            <Button
                              type="button"
                              onClick={() => setProfileForm({ ...profileForm, avatar: "" })}
                              variant="outline"
                              className="h-10 px-3 rounded-xl border-2 border-slate-200 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            >
                              Clear URL
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700 flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        Full Name *
                      </Label>
                      <Input
                        className="h-11 rounded-xl border-2 border-slate-200 focus:border-primary font-medium"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        Phone Number
                      </Label>
                      <Input
                        className="h-11 rounded-xl border-2 border-slate-200 focus:border-primary font-medium"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+92 300 1234567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700 flex items-center gap-2">
                        <IdCard className="h-4 w-4 text-slate-400" />
                        CNIC / ID Number
                      </Label>
                      <Input
                        className="h-11 rounded-xl border-2 border-slate-200 focus:border-primary font-medium"
                        value={profileForm.cnic}
                        onChange={(e) => setProfileForm({ ...profileForm, cnic: e.target.value })}
                        placeholder="12345-1234567-1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        Date of Birth
                      </Label>
                      <Input
                        type="date"
                        className="h-11 rounded-xl border-2 border-slate-200 focus:border-primary font-medium"
                        value={profileForm.dob}
                        onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700 flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-slate-400" />
                        Gender
                      </Label>
                      <Select
                        value={profileForm.gender || "not-set"}
                        onValueChange={(value) => setProfileForm({ ...profileForm, gender: value === "not-set" ? "" : value })}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200 font-medium">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not-set">Not set</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        Email Address
                      </Label>
                      <Input
                        className="h-11 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-500 font-medium"
                        value={user?.email || ""}
                        readOnly
                      />
                      <p className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <Lock className="h-3 w-3" />
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 flex items-center gap-2">
                      <Home className="h-4 w-4 text-slate-400" />
                      Address
                    </Label>
                    <Textarea
                      className="min-h-[100px] rounded-xl border-2 border-slate-200 focus:border-primary resize-none font-medium"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="Your complete home or mailing address"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      Campus Branch
                    </Label>
                    <Input
                      className="h-11 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-500 font-medium"
                      value={user?.branchName || "Global / Online"}
                      readOnly
                    />
                    <p className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Lock className="h-3 w-3" />
                      Contact admin to change your branch
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="px-8 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                    >
                      {savingProfile ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Save className="h-5 w-5 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education">
              <Card className="border-2 border-slate-100 shadow-sm rounded-2xl bg-white">
                <CardHeader className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 bg-gradient-to-br from-blue-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900">Education Details</CardTitle>
                      <CardDescription className="font-semibold">Manage your academic qualifications</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-slate-400" />
                        Highest Qualification Level
                      </Label>
                      <Select
                        value={educationForm.qualification}
                        onValueChange={(value) => setEducationForm({ ...educationForm, qualification: value })}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200 font-medium">
                          <SelectValue placeholder="Select qualification level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Matric">Matric / O-Level</SelectItem>
                          <SelectItem value="Intermediate">Intermediate / A-Level</SelectItem>
                          <SelectItem value="BS">BS / Bachelor's</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Conditional Fields Based on Qualification */}
                    {educationForm.qualification && (
                      <div className="space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        {(educationForm.qualification === "Intermediate" || educationForm.qualification === "BS") && (
                          <div className="space-y-2">
                            <Label className="font-bold text-slate-700 flex items-center gap-2">
                              <Award className="h-4 w-4 text-slate-400" />
                              {educationForm.qualification === "Intermediate" ? "Stream (e.g., FSc Pre-Medical, ICS)" : "Discipline / Major"}
                            </Label>
                            <Input
                              className="h-11 rounded-xl border-2 border-slate-200 focus:border-primary font-medium"
                              value={educationForm.specialization}
                              onChange={(e) => setEducationForm({ ...educationForm, specialization: e.target.value })}
                              placeholder={educationForm.qualification === "Intermediate" ? "e.g., FSc Pre-Medical or ICS" : "e.g., Computer Science, Engineering"}
                            />
                          </div>
                        )}

                        {(educationForm.qualification === "Matric" || educationForm.qualification === "Intermediate") && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="font-bold text-slate-700 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-slate-400" />
                                Obtained Marks
                              </Label>
                              <Input
                                type="number"
                                className="h-11 rounded-xl border-2 border-slate-200 focus:border-primary font-medium"
                                value={educationForm.obtainedMarks}
                                onChange={(e) => setEducationForm({ ...educationForm, obtainedMarks: e.target.value })}
                                placeholder="e.g., 850"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-bold text-slate-700 flex items-center gap-2">
                                <Target className="h-4 w-4 text-slate-400" />
                                Total Marks
                              </Label>
                              <Input
                                type="number"
                                className="h-11 rounded-xl border-2 border-slate-200 focus:border-primary font-medium"
                                value={educationForm.totalMarks}
                                onChange={(e) => setEducationForm({ ...educationForm, totalMarks: e.target.value })}
                                placeholder="e.g., 1100"
                              />
                            </div>
                          </div>
                        )}

                        {educationForm.qualification === "BS" && (
                          <div className="space-y-2">
                            <Label className="font-bold text-slate-700 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-slate-400" />
                              CGPA / GPA
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              className="h-11 rounded-xl border-2 border-slate-200 focus:border-primary font-medium"
                              value={educationForm.obtainedMarks}
                              onChange={(e) => setEducationForm({ ...educationForm, obtainedMarks: e.target.value })}
                              placeholder="e.g., 3.5 (out of 4.0)"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="font-bold text-slate-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      Education Document (Degree/Certificate)
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        className="h-12 rounded-xl border-2 border-slate-200 bg-slate-50 flex-1 font-medium text-slate-600"
                        value={educationForm.educationDocumentUrl ? "Document uploaded" : "No document uploaded"}
                        readOnly
                      />
                      <label className="relative">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleDocumentUpload(e, "education")}
                          className="hidden"
                          disabled={uploadingEducationDoc}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 px-6 rounded-xl font-bold border-2 active:scale-95 transition-all duration-200"
                          disabled={uploadingEducationDoc}
                          asChild
                        >
                          <span>
                            {uploadingEducationDoc ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Upload PDF
                          </span>
                        </Button>
                      </label>
                    </div>
                    {educationForm.educationDocumentUrl && (
                      <a
                        href={educationForm.educationDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline font-bold flex items-center gap-1 w-fit"
                      >
                        <FileText className="h-4 w-4" />
                        View uploaded document
                      </a>
                    )}
                    <p className="text-xs text-slate-500 font-medium">Upload your degree, certificate, or transcript (PDF, max 5MB)</p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSaveEducation}
                      disabled={savingEducation}
                      className="px-8 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                    >
                      {savingEducation ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Save className="h-5 w-5 mr-2" />
                      )}
                      Save Education Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Identity Verification Tab */}
            <TabsContent value="identity">
              <Card className="border-2 border-slate-100 shadow-sm rounded-2xl bg-white">
                <CardHeader className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 bg-gradient-to-br from-purple-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <IdCard className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900">Identity Verification</CardTitle>
                      <CardDescription className="font-semibold">Verify your identity to unlock premium features and certificate eligibility</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {/* Verification Status */}
                  <div className="bg-slate-50 border-2 border-slate-200/60 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 ${
                          user?.isIdentityVerified 
                            ? 'bg-emerald-100' 
                            : user?.identityVerificationStatus === 'pending'
                            ? 'bg-amber-100'
                            : 'bg-slate-200'
                        }`}>
                          {user?.isIdentityVerified ? (
                            <CheckCircle className="h-7 w-7 text-emerald-600" />
                          ) : user?.identityVerificationStatus === 'pending' ? (
                            <Clock className="h-7 w-7 text-amber-600" />
                          ) : (
                            <AlertCircle className="h-7 w-7 text-slate-500" />
                          )}
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="font-black text-slate-900 text-lg">Verification Status</h3>
                          <p className="text-sm text-slate-500 font-semibold mt-0.5">
                            {user?.isIdentityVerified 
                              ? 'Your student identity has been verified successfully' 
                              : user?.identityVerificationStatus === 'pending'
                              ? 'Your document has been submitted and is under review'
                              : 'Identity verification document not submitted yet'}
                          </p>
                        </div>
                      </div>
                      <Badge className={`text-sm font-bold px-3 py-1 rounded-full ${
                        user?.isIdentityVerified 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                          : user?.identityVerificationStatus === 'pending'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-slate-500 hover:bg-slate-600 text-white'
                      }`}>
                        {user?.isIdentityVerified 
                          ? 'Verified' 
                          : user?.identityVerificationStatus === 'pending'
                          ? 'Pending'
                          : 'Not Verified'}
                      </Badge>
                    </div>
                  </div>

                  {!user?.isIdentityVerified && (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                        <h4 className="font-extrabold text-blue-900 mb-2 flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-700" />
                          Why verify your student profile identity?
                        </h4>
                        <ul className="space-y-2 text-sm text-blue-800 font-semibold">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                            <span>Qualify for formal course completion diplomas</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                            <span>Unlock verified student records shareable on LinkedIn</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                            <span>Establish institutional records for offline classes</span>
                          </li>
                        </ul>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label className="font-bold text-slate-700 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          Identity Document (CNIC, Passport, or ID Card)
                        </Label>
                        <div className="flex gap-3">
                          <Input
                            className="h-12 rounded-xl border-2 border-slate-200 bg-slate-50 flex-1 font-medium text-slate-600"
                            value={identityForm.identityDocumentUrl ? "Document uploaded" : "No document uploaded"}
                            readOnly
                          />
                          <label className="relative">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => handleDocumentUpload(e, "identity")}
                              className="hidden"
                              disabled={uploadingIdentityDoc}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="h-12 px-6 rounded-xl font-bold border-2 active:scale-95 transition-all duration-200"
                              disabled={uploadingIdentityDoc}
                              asChild
                            >
                              <span>
                                {uploadingIdentityDoc ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Upload className="h-4 w-4 mr-2" />
                                )}
                                Upload PDF
                              </span>
                            </Button>
                          </label>
                        </div>
                        {identityForm.identityDocumentUrl && (
                          <a
                            href={identityForm.identityDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline font-bold flex items-center gap-1 w-fit"
                          >
                            <FileText className="h-4 w-4" />
                            View uploaded document
                          </a>
                        )}
                        <p className="text-xs text-slate-500 font-medium">Upload a clear scan of your CNIC, passport, or government ID (PDF, max 5MB)</p>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={handleSaveIdentity}
                          disabled={savingIdentity || !identityForm.identityDocumentUrl}
                          className="px-8 h-12 rounded-xl font-bold shadow-lg shadow-primary/20 animate-none"
                        >
                          {savingIdentity ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          ) : (
                            <Shield className="h-5 w-5 mr-2" />
                          )}
                          Submit for Verification
                        </Button>
                      </div>
                    </>
                  )}

                  {user?.isIdentityVerified && user?.identityDocumentUrl && (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center gap-3 bg-emerald-50 border-2 border-emerald-200 rounded-2xl px-6 py-4">
                        <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" />
                        <div className="text-left">
                          <p className="font-black text-emerald-900 text-base">Identity Verified Successfully!</p>
                          <a
                            href={user.identityDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-emerald-700 hover:underline font-bold flex items-center gap-1 mt-0.5"
                          >
                            View your verified document
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="border-2 border-slate-100 shadow-sm rounded-2xl bg-white">
                <CardHeader className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 bg-gradient-to-br from-rose-50/50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-rose-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900">Account Security</CardTitle>
                      <CardDescription className="font-semibold">Manage your portal password and account access</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6 max-w-2xl">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-extrabold text-amber-900 mb-1 text-sm">Security Best Practices</h4>
                        <ul className="text-xs text-amber-800 space-y-1 font-semibold">
                          <li>• Choose a password with at least 8 characters</li>
                          <li>• Include uppercase letters, lowercase letters, numbers, and symbols</li>
                          <li>• Never share your credentials or login session</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {[
                    { label: "Current Password", key: "current", field: "currentPassword" },
                    { label: "New Password", key: "new", field: "newPassword" },
                    { label: "Confirm New Password", key: "confirm", field: "confirmPassword" },
                  ].map(({ label, key, field }) => (
                    <div key={key} className="space-y-2">
                      <Label className="font-bold text-slate-700">{label}</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                          type={showPasswords[key as keyof typeof showPasswords] ? "text" : "password"}
                          className="pl-11 pr-11 h-11 rounded-xl border-2 border-slate-200 focus:border-primary font-medium"
                          value={passwordForm[field as keyof typeof passwordForm]}
                          onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                          className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPasswords[key as keyof typeof showPasswords] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleChangePassword}
                      disabled={savingPassword}
                      className="px-8 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                    >
                      {savingPassword ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Shield className="h-5 w-5 mr-2" />
                      )}
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DashboardLayout>
  );
}
