import { DashboardLayout } from "@/components/DashboardLayout";
import {
  useListSuccessStories,
  useCreateSuccessStory,
  useDeleteSuccessStory,
  getListSuccessStoriesQueryKey,
  useListSuccessStoryCategories,
  useCreateSuccessStoryCategory,
  useDeleteSuccessStoryCategory,
  getListSuccessStoryCategoriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Trophy, FolderOpen, LayoutGrid, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function AdminSuccessStories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    studentName: "",
    title: "",
    description: "",
    image: "",
    course: "",
    achievement: "",
    categoryId: undefined as number | undefined,
    rating: "5",
    category: "", // Legacy field, keeping for compatibility
    metric1Value: "",
    metric1Label: "",
    metric2Value: "",
    metric2Label: "",
    metric3Value: "",
    metric3Label: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const { data: stories, isLoading } = useListSuccessStories({
    query: { queryKey: getListSuccessStoriesQueryKey() },
  });

  const { data: categories } = useListSuccessStoryCategories({
    query: { queryKey: getListSuccessStoryCategoriesQueryKey() },
  });

  const createMutation = useCreateSuccessStory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuccessStoriesQueryKey() });
        setOpen(false);
        setForm({ 
          studentName: "", title: "", description: "", image: "", course: "", achievement: "", 
          categoryId: undefined,
          rating: "5", category: "", metric1Value: "", metric1Label: "", metric2Value: "", 
          metric2Label: "", metric3Value: "", metric3Label: "" 
        });
        toast({ title: "Success story added!" });
      },
      onError: (err: any) => {
        toast({ 
          title: "Failed to add story", 
          description: err?.data?.error || err?.message || "Check required fields",
          variant: "destructive" 
        });
      },
    },
  });

  const createCategoryMutation = useCreateSuccessStoryCategory({
    mutation: {
      onSuccess: () => {
        console.log("Category created successfully");
        queryClient.invalidateQueries({ queryKey: getListSuccessStoryCategoriesQueryKey() });
        setCategoryForm({ name: "", slug: "", description: "" });
        toast({ title: "Category created!" });
      },
      onError: (err: any) => {
        console.error("Failed to create category:", err);
        toast({ 
          title: "Failed to create category", 
          description: err?.data?.error || err?.message || "Unknown error",
          variant: "destructive" 
        });
      }
    },
  });

  const deleteCategoryMutation = useDeleteSuccessStoryCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuccessStoryCategoriesQueryKey() });
        toast({ title: "Category deleted" });
      },
    },
  });

  const deleteMutation = useDeleteSuccessStory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuccessStoriesQueryKey() });
        toast({ title: "Story deleted" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: form });
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Success Stories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showcase graduate achievements on the homepage
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Story
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Success Story</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Student Name *</Label>
                  <Input
                    required
                    value={form.studentName}
                    onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                    placeholder="Full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Headline / Title *</Label>
                  <Input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. From Student to Senior Dev"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Course *</Label>
                <Input
                  required
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  placeholder="Course completed"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Their Story / Description *</Label>
                <Textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="How Global College changed their life..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select 
                    required
                    value={form.categoryId?.toString() || ""} 
                    onValueChange={(val) => setForm({ ...form, categoryId: val ? parseInt(val) : undefined })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rating (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-gray-100">
                <Label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Achievement Metrics</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    placeholder="Value (e.g. $5k)" 
                    value={form.metric1Value}
                    onChange={(e) => setForm({ ...form, metric1Value: e.target.value })}
                  />
                  <Input 
                    placeholder="Label (e.g. Monthly)" 
                    value={form.metric1Label}
                    onChange={(e) => setForm({ ...form, metric1Label: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    placeholder="Value (e.g. 500+)" 
                    value={form.metric2Value}
                    onChange={(e) => setForm({ ...form, metric2Value: e.target.value })}
                  />
                  <Input 
                    placeholder="Label (e.g. Orders)" 
                    value={form.metric2Label}
                    onChange={(e) => setForm({ ...form, metric2Label: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    placeholder="Value (e.g. 95%)" 
                    value={form.metric3Value}
                    onChange={(e) => setForm({ ...form, metric3Value: e.target.value })}
                  />
                  <Input 
                    placeholder="Label (e.g. Success)" 
                    value={form.metric3Label}
                    onChange={(e) => setForm({ ...form, metric3Label: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Photo URL</Label>
                <Input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Add Story
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="stories" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="stories" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <LayoutGrid className="h-4 w-4 mr-2" /> Success Stories
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Tag className="h-4 w-4 mr-2" /> Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stories">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories?.map((story: any) => (
                <Card key={story.id} className="hover:shadow-md transition-shadow overflow-hidden">
                  <CardHeader className="bg-gradient-to-br from-[#0f2c6f] to-[#1a47b8] text-white p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold overflow-hidden">
                          {story.image ? (
                            <img src={story.image} className="h-full w-full object-cover" />
                          ) : (
                            story.studentName?.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold">{story.studentName}</p>
                          <p className="text-xs text-blue-200">{story.title}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/60 hover:text-white hover:bg-white/10"
                        onClick={() => deleteMutation.mutate({ id: story.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold border-gray-200 text-gray-500">
                        {categories?.find((c: any) => c.id === story.categoryId)?.name || "Uncategorized"}
                      </Badge>
                      <div className="flex">
                        {[...Array(parseInt(story.rating || "5"))].map((_, i) => (
                          <Trophy key={i} className="h-2 w-2 text-amber-500 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 italic line-clamp-3 mb-4">
                      "{story.description}"
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {story.metric1Value && (
                        <div className="text-center p-1 bg-slate-50 rounded-lg">
                          <p className="text-[10px] font-bold text-primary">{story.metric1Value}</p>
                          <p className="text-[8px] text-gray-400 uppercase">{story.metric1Label}</p>
                        </div>
                      )}
                      {story.metric2Value && (
                        <div className="text-center p-1 bg-slate-50 rounded-lg">
                          <p className="text-[10px] font-bold text-emerald-600">{story.metric2Value}</p>
                          <p className="text-[8px] text-gray-400 uppercase">{story.metric2Label}</p>
                        </div>
                      )}
                      {story.metric3Value && (
                        <div className="text-center p-1 bg-slate-50 rounded-lg">
                          <p className="text-[10px] font-bold text-amber-600">{story.metric3Value}</p>
                          <p className="text-[8px] text-gray-400 uppercase">{story.metric3Label}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[10px]">
                        {story.course}
                      </Badge>
                      {story.achievement && (
                        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                          <Trophy className="h-3 w-3" /> {story.achievement}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!stories || stories.length === 0) && (
                <div className="col-span-3 text-center py-16 bg-white rounded-xl border border-gray-200">
                  <Trophy className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No success stories yet.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Category Form */}
            <Card className="lg:col-span-1 h-fit border-0 shadow-sm ring-1 ring-gray-100">
              <CardHeader className="p-6 pb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" /> Create Category
                </h3>
              </CardHeader>
              <CardContent className="p-6 pt-4 space-y-4">
                <div>
                  <Label>Category Name *</Label>
                  <Input 
                    placeholder="e.g. Amazon Mastery" 
                    value={categoryForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase()
                        .replace(/[^a-z0-9\s]/g, '') // Remove non-alphanumeric
                        .replace(/\s+/g, '-'); // Replace spaces with hyphens
                      setCategoryForm({ ...categoryForm, name, slug });
                    }}
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input 
                    placeholder="e.g. amazon-mastery" 
                    value={categoryForm.slug}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Brief overview of this category..." 
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button 
                  className="w-full" 
                  disabled={createCategoryMutation.isPending || !categoryForm.name || !categoryForm.slug}
                  onClick={() => createCategoryMutation.mutate({ data: categoryForm })}
                >
                  {createCategoryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Category
                </Button>
              </CardContent>
            </Card>

            {/* Category List */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories?.map((cat: any) => (
                  <Card key={cat.id} className="border-0 shadow-sm ring-1 ring-gray-100 hover:ring-primary/20 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
                            <FolderOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{cat.name}</h4>
                            <p className="text-[10px] text-gray-400 font-mono">{cat.slug}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Are you sure? This will not delete the stories in this category.")) {
                              deleteCategoryMutation.mutate({ id: cat.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {cat.description && (
                        <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                          {cat.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {(!categories || categories.length === 0) && (
                  <div className="col-span-2 text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <FolderOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No categories created yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
