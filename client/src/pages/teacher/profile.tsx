import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Edit3,
  GraduationCap,
  BookOpen,
  MapPin,
  Briefcase,
  Calendar,
  BadgeCheck,
  Upload,
  X,
  IdCard,
  Building2,
  DollarSign,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type TeacherProfileRecord = {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  cnic?: string;
  dob?: string;
  avatar?: string;
  isActive?: boolean;
  createdAt?: string;
  branchName?: string;
  qualification?: string;
  specialization?: string;
  experience?: string;
  salary?: number | string | null;
  address?: string;
  designation?: string;
  gender?: string;
  joiningDate?: string;
};

const emptyProfileForm = {
  name: "",
  phone: "",
  cnic: "",
  dob: "",
  avatar: "",
  qualification: "",
  specialization: "",
  experience: "",
  salary: "",
  address: "",
  designation: "",
  gender: "",
  joiningDate: "",
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function displayValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "Not added";
  return String(value);
}

export default function TeacherProfile() {
  const { user, token, login, patchUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<TeacherProfileRecord | null>(user as TeacherProfileRecord | null);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);

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

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const avatarUrl = profileForm.avatar || profile?.avatar || "";
  const profileName = profileForm.name || profile?.name || user?.name || "Teacher";
  const initials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "T";

  const syncForm = (data: TeacherProfileRecord | null) => {
    setProfileForm({
      name: data?.name || "",
      phone: data?.phone || "",
      cnic: data?.cnic || "",
      dob: toDateInput(data?.dob),
      avatar: data?.avatar || "",
      qualification: data?.qualification || "",
      specialization: data?.specialization || "",
      experience: data?.experience || "",
      salary: data?.salary ? String(data.salary) : "",
      address: data?.address || "",
      designation: data?.designation || "",
      gender: data?.gender || "",
      joiningDate: toDateInput(data?.joiningDate),
    });
  };

  useEffect(() => {
    if (!user?.id || !token) {
      setLoadingProfile(false);
      return;
    }

    let cancelled = false;
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await fetch(`${BASE}/api/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to load profile");
        const data = await response.json();
        if (!cancelled) {
          setProfile(data);
          syncForm(data);
        }
      } catch {
        if (!cancelled) {
          setProfile(user as TeacherProfileRecord);
          syncForm(user as TeacherProfileRecord);
          toast({ title: "Could not refresh profile details", variant: "destructive" });
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [token, user?.id]);

  const updateField = (field: keyof typeof emptyProfileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }

    const body = new FormData();
    body.append("avatar", file);

    setUploadingPhoto(true);
    try {
      const response = await fetch(`${BASE}/api/users/upload-avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "Profile photo upload failed");
      }
      const uploaded = await response.json();
      updateField("avatar", uploaded.url);

      if (user?.id) {
        const updateRes = await fetch(`${BASE}/api/users/${user.id}`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({ avatar: uploaded.url }),
        });

        if (!updateRes.ok) {
          const error = await updateRes.json().catch(() => null);
          throw new Error(error?.message || "Failed to update profile photo in database");
        }

        const updatedUser = await updateRes.json();
        setProfile((prev) => prev ? { ...prev, ...updatedUser } : updatedUser);
        patchUser(updatedUser);
        toast({ title: "Profile photo updated successfully! ✅" });
      } else {
        toast({ title: "Profile photo uploaded" });
      }
    } catch (error: any) {
      toast({ title: error?.message || "Profile photo upload failed", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast({ title: "Name cannot be empty", variant: "destructive" });
      return;
    }
    if (!user?.id || !token) {
      toast({ title: "Please log in again to update your profile", variant: "destructive" });
      return;
    }

    const payload = {
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      cnic: profileForm.cnic.trim(),
      dob: profileForm.dob || undefined,
      avatar: profileForm.avatar.trim(),
      qualification: profileForm.qualification.trim(),
      specialization: profileForm.specialization.trim(),
      experience: profileForm.experience.trim(),
      salary: profileForm.salary ? Number(profileForm.salary) : undefined,
      address: profileForm.address.trim(),
      designation: profileForm.designation.trim(),
      gender: profileForm.gender || undefined,
      joiningDate: profileForm.joiningDate || undefined,
    };

    setSavingProfile(true);
    try {
      const response = await fetch(`${BASE}/api/users/${user.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "Failed to update profile");
      }

      const updated = await response.json();
      const updatedProfile = { ...profile, ...updated };
      setProfile(updatedProfile);
      syncForm(updatedProfile);
      login({ ...(user as any), ...updatedProfile }, token, Boolean(localStorage.getItem("token")));
      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: error?.message || "Network error", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
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
        headers: authHeaders,
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (r.ok) {
        toast({ title: "Password changed successfully" });
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

  const overviewItems = [
    { label: "Phone", value: displayValue(profile?.phone), icon: Phone },
    { label: "Email", value: displayValue(profile?.email || user?.email), icon: Mail },
    { label: "Address", value: displayValue(profile?.address), icon: MapPin },
    { label: "CNIC", value: displayValue(profile?.cnic), icon: IdCard },
    { label: "Designation", value: displayValue(profile?.designation), icon: Briefcase },
    { label: "Branch", value: displayValue(profile?.branchName), icon: Building2 },
    { label: "Qualification", value: displayValue(profile?.qualification), icon: GraduationCap },
    { label: "Specialization", value: displayValue(profile?.specialization), icon: BookOpen },
    { label: "Experience", value: displayValue(profile?.experience), icon: BadgeCheck },
    { label: "Joining Date", value: profile?.joiningDate ? toDateInput(profile.joiningDate) : "Not added", icon: Calendar },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2">
          <Badge className="w-fit border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-50">
            Teacher Portal
          </Badge>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-950">My Profile</h1>
            <p className="mt-1 text-gray-500">
              View and update your teacher information, profile photo, contact details, and account security.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl border-gray-200 shadow-sm">
          <div className="h-28 bg-[linear-gradient(135deg,#0f766e,#2563eb_55%,#7c3aed)]" />
          <CardContent className="px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={profileName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-3xl font-black text-gray-700">
                      {initials}
                    </div>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
                    </div>
                  )}
                </div>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-gray-950">{profileName}</h2>
                    <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      Active Teacher
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {profile?.email || user?.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {displayValue(profile?.designation || "Faculty")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handlePhotoUpload(event.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {avatarUrl ? "Replace Photo" : "Upload Photo"}
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 rounded-xl text-red-650 hover:text-red-700"
                    disabled={uploadingPhoto}
                    onClick={async () => {
                      updateField("avatar", "");
                      if (user?.id) {
                        setUploadingPhoto(true);
                        try {
                          const updateRes = await fetch(`${BASE}/api/users/${user.id}`, {
                            method: "PUT",
                            headers: authHeaders,
                            body: JSON.stringify({ avatar: "" }),
                          });
                          if (!updateRes.ok) {
                            const error = await updateRes.json().catch(() => null);
                            throw new Error(error?.message || "Failed to remove photo");
                          }
                          const updatedUser = await updateRes.json();
                          setProfile((prev) => prev ? { ...prev, ...updatedUser } : updatedUser);
                          patchUser(updatedUser);
                          toast({ title: "Profile photo removed successfully! ✅" });
                        } catch (error: any) {
                          toast({ title: error?.message || "Failed to remove photo", variant: "destructive" });
                        } finally {
                          setUploadingPhoto(false);
                        }
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-gray-100 md:w-fit">
            <TabsTrigger value="overview" className="gap-2 rounded-xl px-5 py-3 font-bold">
              <User className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="edit" className="gap-2 rounded-xl px-5 py-3 font-bold">
              <Edit3 className="h-4 w-4" /> Edit Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 rounded-xl px-5 py-3 font-bold">
              <Shield className="h-4 w-4" /> Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {overviewItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.label} className="rounded-2xl border-gray-200 shadow-sm">
                    <CardContent className="flex gap-4 p-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-normal text-gray-500">{item.label}</p>
                        <p className="mt-1 break-words text-base font-bold text-gray-950">{item.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="edit">
            <Card className="rounded-2xl border-gray-200 shadow-sm">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="flex items-center gap-2 text-xl font-black text-gray-950">
                  <Edit3 className="h-5 w-5 text-blue-700" />
                  Edit Teacher Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-6 pt-2">
                {loadingProfile ? (
                  <div className="flex min-h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
                  </div>
                ) : (
                  <>
                    <section className="space-y-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-normal text-gray-500">Personal Details</h3>
                        <p className="mt-1 text-sm text-gray-500">These details identify you inside the teacher portal.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700">Full Name *</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                              className="h-11 rounded-xl border-gray-200 pl-10"
                              value={profileForm.name}
                              onChange={(e) => updateField("name", e.target.value)}
                              placeholder="Your full name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                              className="h-11 rounded-xl border-gray-200 pl-10"
                              value={profileForm.phone}
                              onChange={(e) => updateField("phone", e.target.value)}
                              placeholder="+92 300 1234567"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700">CNIC</Label>
                          <div className="relative">
                            <IdCard className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                              className="h-11 rounded-xl border-gray-200 pl-10"
                              value={profileForm.cnic}
                              onChange={(e) => updateField("cnic", e.target.value)}
                              placeholder="35202-1234567-8"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700">Date of Birth</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                              type="date"
                              className="h-11 rounded-xl border-gray-200 pl-10"
                              value={profileForm.dob}
                              onChange={(e) => updateField("dob", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700">Gender</Label>
                          <Select value={profileForm.gender || "not-set"} onValueChange={(value) => updateField("gender", value === "not-set" ? "" : value)}>
                            <SelectTrigger className="h-11 rounded-xl border-gray-200">
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
                          <Label className="font-bold text-gray-700">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                              className="h-11 rounded-xl border-gray-200 bg-gray-50 pl-10 text-gray-500"
                              value={profile?.email || user?.email || ""}
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-gray-700">Address</Label>
                        <Textarea
                          className="min-h-24 rounded-xl border-gray-200"
                          value={profileForm.address}
                          onChange={(e) => updateField("address", e.target.value)}
                          placeholder="House, street, city, and area"
                        />
                      </div>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-normal text-gray-500">Professional Details</h3>
                        <p className="mt-1 text-sm text-gray-500">Keep your faculty and teaching record up to date.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700">Designation</Label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                              className="h-11 rounded-xl border-gray-200 pl-10"
                              value={profileForm.designation}
                              onChange={(e) => updateField("designation", e.target.value)}
                              placeholder="Senior Instructor"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700">Joining Date</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                              type="date"
                              className="h-11 rounded-xl border-gray-200 pl-10"
                              value={profileForm.joiningDate}
                              onChange={(e) => updateField("joiningDate", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700">Qualification</Label>
                          <div className="relative">
                            <GraduationCap className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                              className="h-11 rounded-xl border-gray-200 pl-10"
                              value={profileForm.qualification}
                              onChange={(e) => updateField("qualification", e.target.value)}
                              placeholder="MCS, BSCS, MBA"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700">Specialization</Label>
                          <div className="relative">
                            <BookOpen className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                              className="h-11 rounded-xl border-gray-200 pl-10"
                              value={profileForm.specialization}
                              onChange={(e) => updateField("specialization", e.target.value)}
                              placeholder="Web Development, AI, Networking"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700">Experience</Label>
                          <div className="relative">
                            <BadgeCheck className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                              className="h-11 rounded-xl border-gray-200 pl-10"
                              value={profileForm.experience}
                              onChange={(e) => updateField("experience", e.target.value)}
                              placeholder="5 years"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-gray-700">Salary</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              min="0"
                              className="h-11 rounded-xl border-gray-200 pl-10"
                              value={profileForm.salary}
                              onChange={(e) => updateField("salary", e.target.value)}
                              placeholder="50000"
                            />
                          </div>
                        </div>
                      </div>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-normal text-gray-500">Profile Photo</h3>
                        <p className="mt-1 text-sm text-gray-500">Upload an image or paste a hosted image URL.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-[160px_1fr]">
                        <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border bg-gray-50">
                          {profileForm.avatar ? (
                            <img src={profileForm.avatar} alt="Profile preview" className="h-full w-full object-cover" />
                          ) : (
                            <Upload className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="space-y-3">
                          <Input
                            className="h-11 rounded-xl border-gray-200"
                            value={profileForm.avatar}
                            onChange={(e) => updateField("avatar", e.target.value)}
                            placeholder="https://example.com/photo.jpg"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="gap-2 rounded-xl"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingPhoto}
                            >
                              {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                              Choose Image
                            </Button>
                            {avatarUrl && (
                              <Button
                                type="button"
                                variant="outline"
                                className="gap-2 rounded-xl text-red-600 hover:text-red-700"
                                disabled={uploadingPhoto}
                                onClick={async () => {
                                  updateField("avatar", "");
                                  if (user?.id) {
                                    setUploadingPhoto(true);
                                    try {
                                      const updateRes = await fetch(`${BASE}/api/users/${user.id}`, {
                                        method: "PUT",
                                        headers: authHeaders,
                                        body: JSON.stringify({ avatar: "" }),
                                      });
                                      if (!updateRes.ok) {
                                        const error = await updateRes.json().catch(() => null);
                                        throw new Error(error?.message || "Failed to remove photo");
                                      }
                                      const updatedUser = await updateRes.json();
                                      setProfile((prev) => prev ? { ...prev, ...updatedUser } : updatedUser);
                                      syncForm(updatedUser);
                                      patchUser(updatedUser);
                                      toast({ title: "Profile photo removed successfully! ✅" });
                                    } catch (error: any) {
                                      toast({ title: error?.message || "Failed to remove photo", variant: "destructive" });
                                    } finally {
                                      setUploadingPhoto(false);
                                    }
                                  }
                                }}
                              >
                                <X className="h-4 w-4" />
                                Clear Photo
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="h-11 rounded-xl px-8 font-bold shadow-lg shadow-blue-700/20"
                      >
                        {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Profile
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="rounded-2xl border-gray-200 shadow-sm">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="flex items-center gap-2 text-xl font-black text-gray-950">
                  <Lock className="h-5 w-5 text-blue-700" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-6 pt-2 md:max-w-xl">
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-700">
                    Use at least 8 characters. A mix of letters, numbers, and symbols is best.
                  </p>
                </div>
                {[
                  { label: "Current Password", key: "current", field: "currentPassword" },
                  { label: "New Password", key: "new", field: "newPassword" },
                  { label: "Confirm New Password", key: "confirm", field: "confirmPassword" },
                ].map(({ label, key, field }) => (
                  <div key={key} className="space-y-2">
                    <Label className="font-bold text-gray-700">{label}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <Input
                        type={showPasswords[key as keyof typeof showPasswords] ? "text" : "password"}
                        className="h-11 rounded-xl border-gray-200 pl-10 pr-10"
                        value={passwordForm[field as keyof typeof passwordForm]}
                        onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                        placeholder="********"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords[key as keyof typeof showPasswords] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={savingPassword}
                    className="h-11 rounded-xl px-8 font-bold shadow-lg shadow-blue-700/20"
                  >
                    {savingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
