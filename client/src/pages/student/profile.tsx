import { useState } from "react";
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
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function StudentProfile() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: (user as any)?.phone || "",
  });

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
  const [savingPassword, setSavingPassword] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast({ title: "Name cannot be empty", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    try {
      const r = await fetch(`${BASE}/api/users/${user?.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ name: profileForm.name, phone: profileForm.phone }),
      });
      if (r.ok) {
        toast({ title: "Profile updated successfully!" });
      } else {
        const err = await r.json();
        toast({ title: err.message || "Failed to update profile", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setSavingProfile(false);
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your personal information and account security.</p>
        </div>

        {/* Avatar Card */}
        <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] mb-6 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/80 to-blue-600" />
          <CardContent className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12">
              <div className="relative">
                <div className="h-24 w-24 rounded-[20px] bg-white shadow-xl ring-4 ring-white flex items-center justify-center text-primary text-4xl font-black">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <button className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 pb-1">
                <h2 className="text-2xl font-black text-gray-900">{user?.name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-100 capitalize font-bold">
                    {user?.role}
                  </Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-2xl shadow-sm ring-1 ring-gray-100 w-full justify-start h-14">
            <TabsTrigger value="profile" className="rounded-xl h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <User className="h-4 w-4 mr-2" /> Personal Info
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" /> Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
              <CardHeader className="px-8 pt-8 pb-0">
                <CardTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-primary" /> Edit Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">
                      Full Name *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-10 h-11 rounded-xl border-gray-200"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-10 h-11 rounded-xl border-gray-200"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+92 300 1234567"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Read-only fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-500"
                        value={user?.email || ""}
                        readOnly
                      />
                    </div>
                    <p className="text-xs text-gray-400">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Campus Branch</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-500"
                        value={(user as any)?.branchName || "Global / Online"}
                        readOnly
                      />
                    </div>
                    <p className="text-xs text-gray-400">Contact admin to change your branch</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="px-8 h-11 rounded-xl font-bold shadow-lg shadow-primary/20"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
              <CardHeader className="px-8 pt-8 pb-0">
                <CardTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" /> Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-5 max-w-lg">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-sm font-bold text-amber-700">
                    For security, please use a strong password with at least 8 characters including letters and numbers.
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
                        className="pl-10 pr-10 h-11 rounded-xl border-gray-200"
                        value={passwordForm[field as keyof typeof passwordForm]}
                        onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
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

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={savingPassword}
                    className="px-8 h-11 rounded-xl font-bold shadow-lg shadow-primary/20"
                  >
                    {savingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Shield className="h-4 w-4 mr-2" />
                    )}
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
