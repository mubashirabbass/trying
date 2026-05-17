import { DashboardLayout } from "@/components/DashboardLayout";
import {
  useListBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
  getListBranchesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, MapPin, Phone, Mail, Edit2, Users, ExternalLink, RotateCcw, Upload, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdminBranches() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const adminBranchesQueryKey = ["admin-branches"];
  const [open, setOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    mapUrl: "",
    description: "",
    headName: "",
    manualStudentCount: 0,
    image: "",
    officeHours: "",
    isMain: false,
    isActive: true,
  });

  const { data: branches = [], isLoading } = useListBranches({
    query: { queryKey: adminBranchesQueryKey },
    request: { headers: { "x-include-inactive": "true" } },
  });

  const createMutation = useCreateBranch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminBranchesQueryKey });
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        handleClose();
        toast({ title: "Branch added successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to add branch", variant: "destructive" }),
    },
  });

  const updateMutation = useUpdateBranch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminBranchesQueryKey });
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        handleClose();
        toast({ title: "Branch updated successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to update branch", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteBranch({
    mutation: {
      onSuccess: (_data, variables) => {
        queryClient.setQueryData(adminBranchesQueryKey, (current: any) => {
          return Array.isArray(current) ? current.filter((branch: any) => branch.id !== variables.id) : current;
        });
        queryClient.invalidateQueries({ queryKey: adminBranchesQueryKey });
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        toast({ title: "Campus deleted" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || err?.message || "Failed to delete campus", variant: "destructive" }),
    },
  });

  const handleOpenEdit = (branch: any) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name,
      address: branch.address,
      city: branch.city,
      phone: branch.phone || "",
      email: branch.email || "",
      mapUrl: branch.mapUrl || "",
      description: branch.description || "",
      headName: branch.headName || "",
      manualStudentCount: branch.manualStudentCount || 0,
      image: branch.image || "",
      officeHours: branch.officeHours || "",
      isMain: branch.isMain || false,
      isActive: branch.isActive !== false,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBranch(null);
    setIsUploadingImage(false);
    setForm({ name: "", address: "", city: "", phone: "", email: "", mapUrl: "", description: "", headName: "", manualStudentCount: 0, image: "", officeHours: "", isMain: false, isActive: true });
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }

    const body = new FormData();
    body.append("image", file);

    try {
      setIsUploadingImage(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/branches/upload-image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || error?.error || "Image upload failed");
      }

      const uploaded = await response.json();
      setForm((current) => ({ ...current, image: uploaded.url }));
      toast({ title: "Campus photo uploaded" });
    } catch (error: any) {
      toast({ title: error?.message || "Image upload failed", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data: form });
    } else {
      createMutation.mutate({ data: form });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Campuses & Branches</h1>
          <p className="text-gray-500 mt-1">Manage physical locations and track student enrollment per campus.</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => val ? setOpen(true) : handleClose()}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
              <Plus className="h-4 w-4 mr-2" /> Add New Campus
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  {editingBranch ? "Edit Branch Details" : "Add New Campus Branch"}
                </DialogTitle>
              </DialogHeader>
            </div>
            <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name *</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Lahore Main Campus"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Lahore"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Number</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+92 300..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Official Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="campus@globalcollege.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Input
                    id="address"
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Street, Block, City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="map">Google Maps URL</Label>
                  <Input
                    id="map"
                    value={form.mapUrl}
                    onChange={(e) => setForm({ ...form, mapUrl: e.target.value })}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Campus Photo</Label>
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3">
                    {form.image ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={form.image}
                          alt="Campus preview"
                          className="h-16 w-20 rounded-lg object-cover border border-gray-200 bg-white"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">Photo ready</p>
                          <p className="text-xs text-gray-500 truncate">{form.image}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setForm({ ...form, image: "" })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Upload photo from computer</p>
                          <p className="text-xs text-gray-500">JPG, PNG, or WEBP up to 10MB</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-3">
                      <Label className="flex items-center gap-2 cursor-pointer border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-md w-fit">
                        {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <span className="text-sm font-medium">{isUploadingImage ? "Uploading..." : form.image ? "Replace Photo" : "Choose Photo"}</span>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={isUploadingImage}
                          onChange={(e) => {
                            handleImageUpload(e.target.files?.[0] || null);
                            e.target.value = "";
                          }}
                        />
                      </Label>
                      <Input
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        placeholder="Or paste image URL"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headName">City Leader / Campus Head</Label>
                  <Input
                    id="headName"
                    value={form.headName}
                    onChange={(e) => setForm({ ...form, headName: e.target.value })}
                    placeholder="e.g. Prof. John Doe"
                  />
                </div>
                {/* Fixed layout: Toggle is now inside the grid */}
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div>
                    <Label htmlFor="isMain" className="text-primary font-bold">Main Campus</Label>
                    <p className="text-xs text-gray-500 mt-0.5">Designate this as the primary campus shown in the map section of the home page.</p>
                  </div>
                  <Switch
                    id="isMain"
                    checked={form.isMain}
                    onCheckedChange={(checked) => setForm({ ...form, isMain: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officeHours">Office Hours</Label>
                  <Input
                    id="officeHours"
                    value={form.officeHours}
                    onChange={(e) => setForm({ ...form, officeHours: e.target.value })}
                    placeholder="e.g. Mon-Sat: 8AM-4PM, Sun: Closed"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div>
                    <Label htmlFor="isActive">Show on Website</Label>
                    <p className="text-xs text-gray-500 mt-0.5">Inactive campuses stay in admin but disappear from Home, Branches, and Registration.</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manualStudentCount">Additional Students (Manual)</Label>
                    <Input
                      id="manualStudentCount"
                      type="number"
                      value={form.manualStudentCount}
                      onChange={(e) => setForm({ ...form, manualStudentCount: parseInt(e.target.value) || 0 })}
                      placeholder="e.g. 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Actual Students (System)</Label>
                    <Input
                      disabled
                      value={editingBranch?.actualStudentCount || 0}
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Short Description (for Home Page)</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. Empowering students with IT skills..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button type="button" variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="px-8"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {editingBranch ? "Save Changes" : "Create Branch"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches?.map((branch: any) => (
            <Card key={branch.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-gray-100">
              <div className="h-1.5 bg-primary/10 group-hover:bg-primary transition-colors" />
              <div className="relative h-40 overflow-hidden bg-slate-100">
                {branch.image ? (
                  <img
                    src={branch.image}
                    alt={branch.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-100 via-white to-primary/10 flex items-center justify-center text-slate-300">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  <Badge className={branch.isActive === false ? "bg-slate-900/80 text-white border-0" : "bg-emerald-600 text-white border-0"}>
                    {branch.isActive === false ? "Hidden" : "Live"}
                  </Badge>
                  {branch.isMain && (
                    <Badge className="bg-primary text-white border-0">
                      Main Campus
                    </Badge>
                  )}
                </div>
              </div>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold leading-tight">{branch.name}</CardTitle>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{branch.city}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/5"
                      onClick={() => handleOpenEdit(branch)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {branch.isActive === false && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                        onClick={() => updateMutation.mutate({ id: branch.id, data: { ...branch, isActive: true } })}
                        title="Restore campus"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Permanently delete this campus? Students assigned to it will remain, but their campus selection will be cleared.")) {
                          deleteMutation.mutate({ id: branch.id });
                        }
                      }}
                      title="Delete campus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {branch.isActive === false && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                    Hidden from website
                  </Badge>
                )}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 group-hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Total Students</span>
                  </div>
                  <Badge variant="secondary" className="bg-white group-hover:bg-primary group-hover:text-white transition-colors">
                    {branch.studentCount}
                  </Badge>
                </div>
                
                <div className="space-y-2.5 text-sm text-gray-600 px-1">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{branch.address}</span>
                  </div>
                  {branch.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="truncate">{branch.email}</span>
                    </div>
                  )}
                  {branch.headName && (
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-gray-400 shrink-0" />
                      <span>City Leader: {branch.headName}</span>
                    </div>
                  )}
                </div>

                {branch.mapUrl && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary text-xs font-semibold hover:no-underline group-hover:gap-2 transition-all"
                    asChild
                  >
                    <a href={branch.mapUrl} target="_blank" rel="noreferrer">
                      NAVIGATE ON MAP <ExternalLink className="h-3 w-3 inline ml-1" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {branches?.length === 0 && (
            <div className="col-span-full text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-100">
              <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Campuses Found</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-1">Start by adding your first college campus branch to manage students locally.</p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => setOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Your First Branch
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
