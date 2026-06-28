import { DashboardLayout } from "@/components/DashboardLayout";
import {
  useListBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
  getListBranchesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
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
import {
  Loader2, Plus, Trash2, MapPin, Phone, Mail, Edit2,
  Users, ExternalLink, RotateCcw, Upload, Image as ImageIcon, X, Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const ADMIN_BRANCHES_KEY = ["admin-branches"];

// ─── Client-side image compression to keep uploads fast & small ──────────────
async function compressImage(file: File, maxWidthPx = 1280, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidthPx / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Compression failed")), "image/webp", quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Skeleton card for loading state ─────────────────────────────────────────
function BranchSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      <div className="h-1.5 bg-gray-200" />
      <div className="h-36 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  name: "", address: "", city: "", phone: "", email: "",
  mapUrl: "", description: "", headName: "",
  manualStudentCount: 0, image: "", officeHours: "",
  isMain: false, isActive: true,
};

export default function AdminBranches() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // ─── Data fetching with staleTime to avoid redundant refetches ──────────────
  const { data: branches = [], isLoading } = useListBranches({
    query: {
      queryKey: ADMIN_BRANCHES_KEY,
      staleTime: 30_000,          // data stays fresh for 30 s
      gcTime: 5 * 60_000,         // keep in cache for 5 min
    },
    request: { headers: { "x-include-inactive": "true" } },
  } as any);

  const createMutation = useCreateBranch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ADMIN_BRANCHES_KEY });
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        handleClose();
        toast({ title: "✅ Branch added successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to add branch", variant: "destructive" }),
    },
  });

  const updateMutation = useUpdateBranch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ADMIN_BRANCHES_KEY });
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        handleClose();
        toast({ title: "✅ Branch updated successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to update branch", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteBranch({
    mutation: {
      onMutate: async (variables) => {
        // Optimistic: remove from cache immediately
        await queryClient.cancelQueries({ queryKey: ADMIN_BRANCHES_KEY });
        const prev = queryClient.getQueryData(ADMIN_BRANCHES_KEY);
        queryClient.setQueryData(ADMIN_BRANCHES_KEY, (current: any) =>
          Array.isArray(current) ? current.filter((b: any) => b.id !== variables.id) : current
        );
        return { prev };
      },
      onError: (_err, _vars, ctx: any) => {
        queryClient.setQueryData(ADMIN_BRANCHES_KEY, ctx?.prev);
        toast({ title: "Failed to delete campus", variant: "destructive" });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ADMIN_BRANCHES_KEY });
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        toast({ title: "🗑️ Campus deleted" });
      },
    },
  });

  const handleOpenEdit = (branch: any) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name, address: branch.address, city: branch.city,
      phone: branch.phone || "", email: branch.email || "",
      mapUrl: branch.mapUrl || "", description: branch.description || "",
      headName: branch.headName || "",
      manualStudentCount: branch.manualStudentCount || 0,
      image: branch.image || "", officeHours: branch.officeHours || "",
      isMain: branch.isMain || false, isActive: branch.isActive !== false,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBranch(null);
    setIsUploadingImage(false);
    setForm({ ...EMPTY_FORM });
  };

  // ─── Client-side compress → then upload (max 1280px wide, WebP 82%) ─────────
  const handleImageUpload = useCallback(async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }
    try {
      setIsUploadingImage(true);
      const compressed = await compressImage(file);
      const body = new FormData();
      body.append("image", compressed, "campus.webp");
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
      setForm(cur => ({ ...cur, image: uploaded.url }));
      toast({ title: "📸 Campus photo uploaded" });
    } catch (error: any) {
      toast({ title: error?.message || "Image upload failed", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  }, [toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data: form });
    } else {
      createMutation.mutate({ data: form });
    }
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(cur => ({ ...cur, [field]: e.target.value }));

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Campuses &amp; Branches
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm">Manage locations and track enrollment per campus.</p>
        </div>

        <Dialog open={open} onOpenChange={(val) => val ? setOpen(true) : handleClose()}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 gap-2">
              <Plus className="h-4 w-4" /> Add Campus
            </Button>
          </DialogTrigger>

          {/* ── Form dialog ── */}
          <DialogContent className="sm:max-w-[680px] max-h-[92vh] overflow-y-auto p-0 border-none shadow-2xl">
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">
                  {editingBranch ? "✏️ Edit Branch Details" : "➕ Add New Campus"}
                </DialogTitle>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
              {/* Row 1: Name + City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name">Branch Name *</Label>
                  <Input id="name" required autoFocus value={form.name} onChange={f("name")} placeholder="e.g. Lahore Main Campus" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" required value={form.city} onChange={f("city")} placeholder="e.g. Lahore" />
                </div>
              </div>

              {/* Row 2: Phone + Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="phone">Contact Number</Label>
                  <Input id="phone" value={form.phone} onChange={f("phone")} placeholder="+92 300..." />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Official Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={f("email")} placeholder="campus@college.edu" />
                </div>
              </div>

              {/* Row 3: Address */}
              <div className="space-y-1">
                <Label htmlFor="address">Full Address *</Label>
                <Input id="address" required value={form.address} onChange={f("address")} placeholder="Street, Block, City" />
              </div>

              {/* Row 4: Map URL + Office Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="map">Google Maps URL</Label>
                  <Input id="map" value={form.mapUrl} onChange={f("mapUrl")} placeholder="https://maps.google.com/..." />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="officeHours">Office Hours</Label>
                  <Input id="officeHours" value={form.officeHours} onChange={f("officeHours")} placeholder="Mon-Sat: 8AM-4PM" />
                </div>
              </div>

              {/* Row 5: Head + Manual count */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="headName">Campus Head</Label>
                  <Input id="headName" value={form.headName} onChange={f("headName")} placeholder="Prof. John Doe" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="manualStudentCount">Additional Students (manual)</Label>
                  <Input
                    id="manualStudentCount"
                    type="number"
                    min={0}
                    value={form.manualStudentCount}
                    onChange={(e) => setForm(cur => ({ ...cur, manualStudentCount: parseInt(e.target.value) || 0 }))}
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              {/* Row 6: Description */}
              <div className="space-y-1">
                <Label htmlFor="description">Short Description</Label>
                <Input id="description" value={form.description} onChange={f("description")} placeholder="Empowering students with IT skills..." />
              </div>

              {/* Row 7: Campus photo */}
              <div className="space-y-1">
                <Label>Campus Photo <span className="text-xs text-gray-400 font-normal">(auto-compressed to WebP)</span></Label>
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3">
                  {form.image ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={form.image}
                        alt="Campus preview"
                        loading="lazy"
                        decoding="async"
                        className="h-14 w-20 rounded-lg object-cover border border-gray-200 bg-white shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">Photo ready ✓</p>
                        <p className="text-[11px] text-gray-400 truncate">{form.image}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setForm(cur => ({ ...cur, image: "" }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <ImageIcon className="h-5 w-5 shrink-0" />
                      <span className="text-xs">No photo yet — upload or paste URL</span>
                    </div>
                  )}

                  <div className="mt-2.5 flex items-center gap-2">
                    <Label className="flex items-center gap-2 cursor-pointer border border-input bg-background hover:bg-accent h-9 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                      {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {isUploadingImage ? "Uploading…" : form.image ? "Replace" : "Upload Photo"}
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={isUploadingImage}
                        onChange={(e) => { handleImageUpload(e.target.files?.[0] || null); e.target.value = ""; }}
                      />
                    </Label>
                    <Input
                      value={form.image}
                      onChange={f("image")}
                      placeholder="Or paste image URL here"
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Row 8: Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div>
                    <Label htmlFor="isMain" className="text-primary font-bold text-sm">Main Campus</Label>
                    <p className="text-xs text-gray-400 mt-0.5">Shown as primary on home page map.</p>
                  </div>
                  <Switch id="isMain" checked={form.isMain} onCheckedChange={(c) => setForm(cur => ({ ...cur, isMain: c }))} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div>
                    <Label htmlFor="isActive" className="font-bold text-sm">Show on Website</Label>
                    <p className="text-xs text-gray-400 mt-0.5">Hidden campuses won't appear publicly.</p>
                  </div>
                  <Switch id="isActive" checked={form.isActive} onCheckedChange={(c) => setForm(cur => ({ ...cur, isActive: c }))} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
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

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <BranchSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(branches as any[]).map((branch: any) => (
            <Card key={branch.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-gray-100">
              <div className="h-1.5 bg-primary/10 group-hover:bg-primary transition-colors" />
              <div className="relative h-36 overflow-hidden bg-slate-100">
                {branch.image ? (
                  <img
                    src={branch.image}
                    alt={branch.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-100 via-white to-primary/10 flex items-center justify-center text-slate-300">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                  <Badge className={branch.isActive === false ? "bg-slate-900/80 text-white border-0 text-[10px]" : "bg-emerald-600 text-white border-0 text-[10px]"}>
                    {branch.isActive === false ? "Hidden" : "Live"}
                  </Badge>
                  {branch.isMain && (
                    <Badge className="bg-primary text-white border-0 text-[10px]">Main Campus</Badge>
                  )}
                </div>
              </div>

              <CardHeader className="pb-3 pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold leading-tight">{branch.name}</CardTitle>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{branch.city}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-primary hover:bg-primary/5"
                      onClick={() => handleOpenEdit(branch)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    {branch.isActive === false && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                        onClick={() => updateMutation.mutate({ id: branch.id, data: { ...branch, isActive: true } })}
                        title="Restore campus">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Permanently delete this campus?")) {
                          deleteMutation.mutate({ id: branch.id });
                        }
                      }}
                      title="Delete campus">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 group-hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>Total Students</span>
                  </div>
                  <Badge variant="secondary" className="bg-white text-xs group-hover:bg-primary group-hover:text-white transition-colors">
                    {branch.studentCount}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 px-0.5">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{branch.address}</span>
                  </div>
                  {branch.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{branch.email}</span>
                    </div>
                  )}
                  {branch.headName && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>Head: {branch.headName}</span>
                    </div>
                  )}
                </div>

                {branch.mapUrl && (
                  <Button variant="link" className="p-0 h-auto text-primary text-xs font-semibold" asChild>
                    <a href={branch.mapUrl} target="_blank" rel="noreferrer">
                      NAVIGATE ON MAP <ExternalLink className="h-3 w-3 inline ml-1" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {branches.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
              <div className="h-14 w-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-7 w-7 text-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No Campuses Found</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-1 text-sm">Add your first campus branch to manage students locally.</p>
              <Button variant="outline" className="mt-5" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Your First Branch
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
