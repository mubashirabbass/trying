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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, MapPin, Phone, Mail, Edit2, Users, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdminBranches() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
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
  });

  const { data: branches = [], isLoading } = useListBranches({
    query: { queryKey: getListBranchesQueryKey() },
  });

  const createMutation = useCreateBranch({
    mutation: {
      onSuccess: () => {
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
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        handleClose();
        toast({ title: "Branch updated successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to update branch", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteBranch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        toast({ title: "Branch deleted" });
      },
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
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBranch(null);
    setForm({ name: "", address: "", city: "", phone: "", email: "", mapUrl: "", description: "", headName: "", manualStudentCount: 0, image: "" });
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
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
              <Plus className="h-4 w-4 mr-2" /> Add New Campus
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingBranch ? "Edit Branch Details" : "Add New Campus Branch"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="phone">Phone</Label>
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
                  <Label htmlFor="image">Campus Image URL</Label>
                  <Input
                    id="image"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headName">Principal / Head of Branch</Label>
                  <Input
                    id="headName"
                    value={form.headName}
                    onChange={(e) => setForm({ ...form, headName: e.target.value })}
                    placeholder="e.g. Prof. John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this branch?")) {
                          deleteMutation.mutate({ id: branch.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
