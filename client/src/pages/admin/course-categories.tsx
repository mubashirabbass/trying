import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit2, 
  BookOpen, 
  Tag,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CourseCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export default function AdminCourseCategories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<CourseCategory[]>({
    queryKey: ["course-categories"],
    queryFn: async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/course-categories", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/course-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-categories"] });
      handleClose();
      toast({ title: "✅ Category created successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create category", description: error.message, variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof form }) => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`/api/course-categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-categories"] });
      handleClose();
      toast({ title: "✅ Category updated successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update category", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`/api/course-categories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-categories"] });
      toast({ title: "Category deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete category", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenEdit = (category: CourseCategory) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
    setForm({ name: "", slug: "", description: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setForm({ 
      ...form, 
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    });
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Course Categories</h1>
          <p className="text-gray-500 mt-1">Organize courses into categories for better navigation and filtering.</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => val ? setOpen(true) : handleClose()}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
              <Plus className="h-4 w-4 mr-2" /> Add New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Web Development"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. web-development"
                />
                <p className="text-xs text-gray-500">
                  Used in URLs. Auto-generated from name, but you can customize it.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this category..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
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
                  {editingCategory ? "Save Changes" : "Create Category"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((category) => (
            <Card key={category.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-gray-100">
              <div className="h-1.5 bg-primary/10 group-hover:bg-primary transition-colors" />
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold leading-tight">{category.name}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Tag className="h-3 w-3 text-gray-400" />
                        <p className="text-xs font-mono text-gray-500">{category.slug}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/5"
                      onClick={() => handleOpenEdit(category)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Delete "${category.name}" category? Courses in this category will need to be reassigned.`)) {
                          deleteMutation.mutate(category.id);
                        }
                      }}
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.description ? (
                  <p className="text-sm text-gray-600 line-clamp-3">{category.description}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No description provided</p>
                )}
                
                <div className="pt-3 border-t border-gray-100">
                  <Badge variant="secondary" className="bg-gray-50 text-gray-600 text-xs">
                    Created {new Date(category.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}

          {categories?.length === 0 && (
            <div className="col-span-full text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-100">
              <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Categories Found</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-1">Start by adding your first course category to organize your courses.</p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => setOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Your First Category
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-bold text-blue-900">Category Management Tips</p>
          <ul className="mt-2 space-y-1 text-blue-700">
            <li>• Categories help students find courses more easily</li>
            <li>• Use clear, descriptive names (e.g., "Web Development", "Graphic Design")</li>
            <li>• The slug is used in URLs and should be unique</li>
            <li>• Deleting a category won't delete courses, but they'll need reassignment</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
