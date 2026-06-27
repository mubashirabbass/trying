import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Lock,
  Loader2,
  Calendar,
  CreditCard,
  Home,
  GraduationCap,
  Upload,
  X,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

const BASE = window.location.origin;

export default function StudentProfileRedesigned() {
  const { user, token, refreshUser, patchUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeSection, setActiveSection] = useState<"personal" | "security">("personal");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    cnic: "",
    dob: "",
    gender: "",
    address: "",
    fatherName: "",
    nameUrdu: "",
    qualification: "",
    specialization: "",
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Fetch fresh user data on mount
  useEffect(() => {
    refreshUser?.();
  }, [refreshUser]);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        cnic: user.cnic || "",
        dob: user.dob ? new Date(user.dob).toISOString().slice(0, 10) : "",
        gender: user.gender || "",
        address: user.address || "",
        fatherName: (user as any).fatherName || "",
        nameUrdu: (user as any).nameUrdu || "",
        qualification: user.qualification || "",
        specialization: user.specialization || "",
      });
    }
  }, [user]);

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith("image/")) {
      toast({ 
        title: "Invalid file type", 
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive" 
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Image must be less than 2MB",
        variant: "destructive" 
      });
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      // Upload to server
      const uploadRes = await fetch(`${BASE}/api/users/upload-avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || "Upload failed");

      // Update user profile with new avatar URL
      const updateRes = await fetch(`${BASE}/api/users/${user?.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: uploadData.url }),
      });

      if (updateRes.ok) {
        const updatedUser = await updateRes.json();
        patchUser(updatedUser);   // instant — no extra GET
        toast({ 
          title: "✅ Success!", 
          description: "Profile photo updated successfully" 
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error: any) {
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle photo removal
  const handleRemovePhoto = async () => {
    setUploadingPhoto(true);
    try {
      const res = await fetch(`${BASE}/api/users/${user?.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: "" }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        patchUser(updatedUser);   // instant — no extra GET
        toast({ title: "Profile photo removed" });
      } else {
        throw new Error("Failed to remove photo");
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Build full payload — send all fields so cleared values are also saved
      const payload: any = {
        name: formData.name.trim(),
        phone: formData.phone,
        cnic: formData.cnic,
        gender: formData.gender,
        address: formData.address,
        fatherName: formData.fatherName,
        nameUrdu: formData.nameUrdu,
        qualification: formData.qualification,
        specialization: formData.specialization,
      };

      // Only add dob if it has a value (avoids invalid date conversion)
      if (formData.dob) payload.dob = new Date(formData.dob).toISOString();

      const res = await fetch(`${BASE}/api/users/${user?.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        patchUser(updatedUser);   // instant — no extra GET
        toast({ 
          title: "✅ Saved!", 
          description: "Your profile has been updated successfully" 
        });
      } else {
        const error = await res.json();
        throw new Error(error.message || "Update failed");
      }
    } catch (error: any) {
      toast({ 
        title: "Save failed", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({ title: "All password fields are required", variant: "destructive" });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (res.ok) {
        toast({ title: "✅ Password changed successfully!" });
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const error = await res.json();
        throw new Error(error.message || "Password change failed");
      }
    } catch (error: any) {
      toast({ 
        title: "Failed", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-slate-900">Profile Settings</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and account security</p>
        </div>

        {/* Profile Photo Section */}
        <Card className="border-2 border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-24"></div>
          <CardContent className="p-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="h-24 w-24 rounded-full border-4 border-white shadow-xl bg-slate-200 overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-4xl font-black text-slate-600 bg-gradient-to-br from-slate-100 to-slate-300">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Upload button overlay */}
                <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/90 shadow-lg transition-all">
                  {uploadingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>

              {/* User info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-black text-slate-900">{user?.name}</h2>
                <p className="text-slate-500 font-semibold">{user?.email}</p>
                <div className="flex gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg cursor-pointer transition-all">
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </label>
                  {user?.avatar && (
                    <Button
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      variant="outline"
                      size="sm"
                      className="font-bold"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Tabs */}
        <div className="flex gap-2 border-b-2 border-slate-200">
          <button
            onClick={() => setActiveSection("personal")}
            className={`px-6 py-3 font-bold text-sm transition-all ${
              activeSection === "personal"
                ? "text-primary border-b-2 border-primary -mb-0.5"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <User className="inline h-4 w-4 mr-2" />
            Personal Information
          </button>
          <button
            onClick={() => setActiveSection("security")}
            className={`px-6 py-3 font-bold text-sm transition-all ${
              activeSection === "security"
                ? "text-primary border-b-2 border-primary -mb-0.5"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Lock className="inline h-4 w-4 mr-2" />
            Security
          </button>
        </div>

        {/* Personal Information Section */}
        {activeSection === "personal" && (
          <Card className="border-2 border-slate-200 rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-bold text-slate-700">
                    <User className="inline h-4 w-4 mr-2 text-slate-400" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="h-11 font-semibold"
                  />
                </div>

                {/* Name in Urdu */}
                <div className="space-y-2">
                  <Label htmlFor="nameUrdu" className="text-sm font-bold text-slate-700">
                    نام (اردو میں)
                  </Label>
                  <Input
                    id="nameUrdu"
                    value={formData.nameUrdu}
                    onChange={(e) => setFormData({ ...formData, nameUrdu: e.target.value })}
                    placeholder="اپنا نام درج کریں"
                    className="h-11 font-semibold text-right"
                    dir="rtl"
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-slate-700">
                    <Mail className="inline h-4 w-4 mr-2 text-slate-400" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="h-11 font-semibold bg-slate-50"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-bold text-slate-700">
                    <Phone className="inline h-4 w-4 mr-2 text-slate-400" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="03XX-XXXXXXX"
                    className="h-11 font-semibold"
                  />
                </div>

                {/* CNIC */}
                <div className="space-y-2">
                  <Label htmlFor="cnic" className="text-sm font-bold text-slate-700">
                    <CreditCard className="inline h-4 w-4 mr-2 text-slate-400" />
                    CNIC / ID Number
                  </Label>
                  <Input
                    id="cnic"
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                    placeholder="XXXXX-XXXXXXX-X"
                    className="h-11 font-semibold"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-sm font-bold text-slate-700">
                    <Calendar className="inline h-4 w-4 mr-2 text-slate-400" />
                    Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="h-11 font-semibold"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-bold text-slate-700">
                    <User className="inline h-4 w-4 mr-2 text-slate-400" />
                    Gender
                  </Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger className="h-11 font-semibold">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Father's Name */}
                <div className="space-y-2">
                  <Label htmlFor="fatherName" className="text-sm font-bold text-slate-700">
                    <User className="inline h-4 w-4 mr-2 text-slate-400" />
                    Father's Name
                  </Label>
                  <Input
                    id="fatherName"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    placeholder="Enter father's name"
                    className="h-11 font-semibold"
                  />
                </div>

                {/* Qualification */}
                <div className="space-y-2">
                  <Label htmlFor="qualification" className="text-sm font-bold text-slate-700">
                    <GraduationCap className="inline h-4 w-4 mr-2 text-slate-400" />
                    Qualification
                  </Label>
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g., Matric, Inter, Bachelor"
                    className="h-11 font-semibold"
                  />
                </div>

                {/* Specialization */}
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-sm font-bold text-slate-700">
                    <GraduationCap className="inline h-4 w-4 mr-2 text-slate-400" />
                    Specialization
                  </Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g., Computer Science, Biology"
                    className="h-11 font-semibold"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-bold text-slate-700">
                  <Home className="inline h-4 w-4 mr-2 text-slate-400" />
                  Home Address
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your complete address"
                  rows={3}
                  className="font-semibold resize-none"
                />
              </div>

              {/* Academic & Enrollment Info (Read-Only) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Academic & Enrollment Details (Official)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wide block">Roll No</span>
                    <span className="text-slate-800 font-mono font-bold">{(user as any)?.rollNo || "Not assigned"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wide block">Registration No</span>
                    <span className="text-slate-800 font-mono font-bold">{(user as any)?.regNo || "Not assigned"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wide block">Department</span>
                    <span className="text-slate-800 font-bold">{(user as any)?.department || "Not assigned"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wide block">Session</span>
                    <span className="text-slate-800 font-bold">{(user as any)?.session || "Not assigned"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wide block">Semester / Term</span>
                    <span className="text-slate-800 font-bold">{(user as any)?.semesterTerm || "Not assigned"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wide block">Shift</span>
                    <span className="text-slate-800 font-bold">{(user as any)?.shift || "Not assigned"}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Note: The academic details above are assigned by college administration during admission approval and cannot be modified by students.
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-8"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Section */}
        {activeSection === "security" && (
          <Card className="border-2 border-slate-200 rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-1">Change Password</h3>
                <p className="text-sm text-slate-500">Update your password to keep your account secure</p>
              </div>

              <div className="space-y-4 max-w-md">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-bold text-slate-700">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="h-11 font-semibold pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-bold text-slate-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password (min 8 characters)"
                      className="h-11 font-semibold pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      className="h-11 font-semibold pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-bold text-blue-900 mb-2">Password Requirements:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3" />
                      At least 8 characters long
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3" />
                      Use a mix of letters, numbers, and symbols
                    </li>
                  </ul>
                </div>
              </div>

              {/* Update Password Button */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <Button
                  onClick={handleChangePassword}
                  disabled={loading}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-8"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
