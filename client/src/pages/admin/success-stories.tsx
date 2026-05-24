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
import { 
  Loader2, Plus, Trash2, Trophy, FolderOpen, LayoutGrid, Tag, Pencil, Eye, EyeOff, 
  Upload, X, Image as ImageIcon, Star, Check, FileText, Coins, Sparkles, Award, User
} from "lucide-react";
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
    externalLink: "",
    storyContent: "",
    storyType: "standard",
  });

  const [isEditingStory, setIsEditingStory] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState<number | null>(null);
  const [isUpdatingStory, setIsUpdatingStory] = useState(false);
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<number | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [activeTab, setActiveTab] = useState("stories");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }

    const body = new FormData();
    body.append("file", file);

    try {
      setIsUploadingImage(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("📸 [CLIENT UPLOAD ERROR] Status:", response.status, "Response text:", text);
        try {
          const parsed = JSON.parse(text);
          throw new Error(parsed.message || parsed.error || `Upload failed: Status ${response.status}`);
        } catch {
          throw new Error(`Upload failed: Status ${response.status}. ${text.slice(0, 80)}`);
        }
      }

      const uploaded = await response.json();
      setForm((current) => ({ ...current, image: uploaded.url }));
      toast({ title: "Student photo uploaded successfully" });
    } catch (error: any) {
      console.error("📸 [CLIENT UPLOAD CATCH ERROR]", error);
      toast({ title: error?.message || "Image upload failed", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCategorySubmit = async () => {
    if (isEditingCategory && editingCategoryId) {
      setIsUpdatingCategory(true);
      try {
        const res = await fetch(`/api/success-story-categories/${editingCategoryId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(categoryForm),
        });
        if (res.ok) {
          toast({ title: "Category updated!" });
          setIsEditingCategory(false);
          setEditingCategoryId(null);
          setCategoryForm({ name: "", slug: "", description: "" });
          queryClient.invalidateQueries({ queryKey: getListSuccessStoryCategoriesQueryKey() });
          setActiveTab("view-categories");
        } else {
          const err = await res.json();
          toast({ title: "Failed to update category", description: err.error || "Unknown error", variant: "destructive" });
        }
      } catch (e: any) {
        toast({ title: "Error occurred", description: e.message, variant: "destructive" });
      } finally {
        setIsUpdatingCategory(false);
      }
    } else {
      createCategoryMutation.mutate({ data: categoryForm });
    }
  };

  const { data: stories, isLoading } = useListSuccessStories({
    query: { queryKey: [...getListSuccessStoriesQueryKey(), "admin"] },
    axios: { params: { admin: "true" } },
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
          metric2Label: "", metric3Value: "", metric3Label: "", externalLink: "", storyContent: "",
          storyType: "standard" 
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
        setActiveTab("view-categories");
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

  const handleToggleVisibility = async (story: any) => {
    setTogglingVisibilityId(story.id);
    try {
      const res = await fetch(`/api/success-stories/${story.id}/visibility`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        const updated = await res.json();
        toast({
          title: updated.isHidden ? "Story hidden from homepage" : "Story is now visible on homepage",
        });
        queryClient.invalidateQueries({ queryKey: getListSuccessStoriesQueryKey() });
      } else {
        const err = await res.json();
        toast({ title: "Failed to toggle visibility", description: err.error || "Unknown error", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setTogglingVisibilityId(null);
    }
  };

  const handleEditStory = (story: any) => {
    setIsEditingStory(true);
    setEditingStoryId(story.id);
    setForm({
      studentName: story.studentName || "",
      title: story.title || "",
      description: story.description || "",
      image: story.image || "",
      course: story.course || "",
      achievement: story.achievement || "",
      categoryId: story.categoryId || undefined,
      rating: story.rating || "5",
      category: story.category || "",
      metric1Value: story.metric1Value || "",
      metric1Label: story.metric1Label || "",
      metric2Value: story.metric2Value || "",
      metric2Label: story.metric2Label || "",
      metric3Value: story.metric3Value || "",
      metric3Label: story.metric3Label || "",
      externalLink: story.externalLink || "",
      storyContent: story.storyContent || "",
      storyType: story.storyType || "standard",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingStory && editingStoryId) {
      setIsUpdatingStory(true);
      try {
        const res = await fetch(`/api/success-stories/${editingStoryId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          toast({ title: "Success story updated!" });
          setOpen(false);
          setIsEditingStory(false);
          setEditingStoryId(null);
          setForm({ 
            studentName: "", title: "", description: "", image: "", course: "", achievement: "", 
            categoryId: undefined, rating: "5", category: "", metric1Value: "", metric1Label: "", 
            metric2Value: "", metric2Label: "", metric3Value: "", metric3Label: "", externalLink: "",
            storyContent: "", storyType: "standard"
          });
          queryClient.invalidateQueries({ queryKey: getListSuccessStoriesQueryKey() });
        } else {
          const err = await res.json();
          toast({ title: "Failed to update story", description: err.error || "Unknown error", variant: "destructive" });
        }
      } catch (e: any) {
        toast({ title: "Error occurred", description: e.message, variant: "destructive" });
      } finally {
        setIsUpdatingStory(false);
      }
    } else {
      createMutation.mutate({ data: form });
    }
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
        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setIsEditingStory(false);
            setEditingStoryId(null);
            setForm({
              studentName: "",
              title: "",
              description: "",
              image: "",
              course: "",
              achievement: "",
              categoryId: undefined,
              rating: "5",
              category: "",
              metric1Value: "",
              metric1Label: "",
              metric2Value: "",
              metric2Label: "",
              metric3Value: "",
              metric3Label: "",
              externalLink: "",
              storyContent: "",
              storyType: "standard",
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#0f2c6f] hover:bg-[#1a47b8] text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2">
              <Plus className="h-4.5 w-4.5" /> Add Success Story
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[720px] p-0 border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
            {/* Unified Corporate Sticky Header */}
            <div className="bg-[#0f2c6f] text-white px-8 py-5 flex items-center justify-between">
              <div>
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <Trophy className="h-5.5 w-5.5 text-blue-200 fill-blue-500/20" />
                    {isEditingStory ? "Configure Success Story" : "Publish Student Success"}
                  </DialogTitle>
                </DialogHeader>
                <p className="text-[10px] text-blue-200/80 font-bold mt-1 uppercase tracking-wider">LMS Graduate Showcase Engine</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white/75 hover:text-white hover:bg-white/10 rounded-full" 
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl">
                  <TabsTrigger value="general" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 data-[state=active]:text-[#0f2c6f]">
                    <User className="h-3.5 w-3.5 mr-1.5" /> 1. Profile Info
                  </TabsTrigger>
                  <TabsTrigger value="metrics" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 data-[state=active]:text-[#0f2c6f]">
                    <Coins className="h-3.5 w-3.5 mr-1.5" /> 2. Media & Stats
                  </TabsTrigger>
                  <TabsTrigger value="narrative" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 data-[state=active]:text-[#0f2c6f]">
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> 3. Story Text
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: GENERAL INFORMATION */}
                <TabsContent value="general" className="space-y-4 focus:outline-none mt-0">
                  {/* DISPLAY PARADIGM */}
                  <div className="space-y-1.5 text-left">
                    <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Card Design Paradigm *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => setForm({ ...form, storyType: "standard" })}
                        className={`cursor-pointer rounded-xl p-3 border-2 transition-all flex gap-3 items-center ${
                          form.storyType === "standard" 
                            ? "border-[#0f2c6f] bg-blue-50/30 shadow-sm" 
                            : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${form.storyType === "standard" ? "bg-[#0f2c6f] text-white" : "bg-slate-200 text-slate-500"}`}>
                          <Award className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-slate-800 truncate">Achiever Card</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">Earnings & metrics highlight</p>
                        </div>
                      </div>

                      <div 
                        onClick={() => setForm({ ...form, storyType: "blog" })}
                        className={`cursor-pointer rounded-xl p-3 border-2 transition-all flex gap-3 items-center ${
                          form.storyType === "blog" 
                            ? "border-[#0f2c6f] bg-blue-50/30 shadow-sm" 
                            : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${form.storyType === "blog" ? "bg-[#0f2c6f] text-white" : "bg-slate-200 text-slate-500"}`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-slate-800 truncate">Blogger Article</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">Editorial article format</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600">Student Name *</Label>
                      <Input
                        required
                        value={form.studentName}
                        onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                        placeholder="e.g. Devon Reynolds"
                        className="rounded-xl h-10 border-slate-200 focus-visible:ring-[#0f2c6f]/50 bg-slate-50/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600">Headline / Title *</Label>
                      <Input
                        required
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. Generated $240k Sales in 45 Days"
                        className="rounded-xl h-10 border-slate-200 focus-visible:ring-[#0f2c6f]/50 bg-slate-50/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600">Course Studied *</Label>
                      <Input
                        required
                        value={form.course}
                        onChange={(e) => setForm({ ...form, course: e.target.value })}
                        placeholder="e.g. Shopify Mastery"
                        className="rounded-xl h-10 border-slate-200 focus-visible:ring-[#0f2c6f]/50 bg-slate-50/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600">Category *</Label>
                      <Select 
                        required
                        value={form.categoryId?.toString() || ""} 
                        onValueChange={(val) => setForm({ ...form, categoryId: val ? parseInt(val) : undefined })}
                      >
                        <SelectTrigger className="rounded-xl h-10 border-slate-200 focus:ring-[#0f2c6f]/50 bg-slate-50/30">
                          <SelectValue placeholder="Select Niche Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl border-slate-100">
                          {categories?.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id.toString()} className="font-semibold text-slate-700">
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* STARS RATING */}
                  <div className="flex items-center justify-between gap-4 py-2 px-4 rounded-xl border border-slate-100 bg-slate-50/50 text-left">
                    <div>
                      <Label className="text-[11px] font-bold text-slate-700">Graduate Rating</Label>
                      <p className="text-[9px] text-slate-400 mt-0.5">Verification stars</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setForm({ ...form, rating: star.toString() })}
                          className="text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                        >
                          <Star 
                            className={`h-4.5 w-4.5 ${
                              star <= parseInt(form.rating || "5") 
                                ? "fill-amber-400 text-amber-400" 
                                : "text-slate-200 fill-none"
                            }`} 
                          />
                        </button>
                      ))}
                      <span className="text-[11px] font-black text-slate-700 ml-1.5">{form.rating || "5"}.0</span>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: MEDIA & SUCCESS METRICS */}
                <TabsContent value="metrics" className="space-y-4 focus:outline-none mt-0">
                  {/* UPLOADER */}
                  <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/30 text-left relative group">
                    {form.image ? (
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-inner flex-shrink-0">
                          <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-800">Photo Uploaded Successfully</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-sm font-mono">{form.image}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 rounded-full"
                          onClick={() => setForm({ ...form, image: "" })}
                        >
                          <X className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 py-1">
                        <div className="h-9 w-9 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#0f2c6f] shadow-sm flex-shrink-0">
                          <ImageIcon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Upload profile image or article cover</p>
                          <p className="text-[10px] text-slate-400">Supports PNG, JPG, or WEBP up to 10MB</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <Label className="flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-8.5 px-3 rounded-lg font-bold text-xs transition-all shadow-sm flex-shrink-0">
                        {isUploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-[#0f2c6f]" />}
                        <span>{isUploadingImage ? "Uploading..." : form.image ? "Change" : "Browse"}</span>
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
                        placeholder="Or paste direct student image link URL..."
                        className="rounded-lg h-8.5 border-slate-200 focus-visible:ring-[#0f2c6f]/50 bg-white shadow-sm text-xs flex-1"
                      />
                    </div>
                  </div>

                  {/* SUCCESS METRICS STATS */}
                  <div className="space-y-2 text-left">
                    <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Achievement Statistics (Optional)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Input 
                          placeholder="Value 1 (e.g. $5k)" 
                          value={form.metric1Value}
                          onChange={(e) => setForm({ ...form, metric1Value: e.target.value })}
                          className="rounded-lg h-9 border-slate-200 bg-slate-50/50 focus-visible:ring-[#0f2c6f]/50 text-xs"
                        />
                        <Input 
                          placeholder="Label 1 (e.g. Monthly)" 
                          value={form.metric1Label}
                          onChange={(e) => setForm({ ...form, metric1Label: e.target.value })}
                          className="rounded-lg h-9 border-slate-200 bg-slate-50/50 focus-visible:ring-[#0f2c6f]/50 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Input 
                          placeholder="Value 2 (e.g. 95%)" 
                          value={form.metric2Value}
                          onChange={(e) => setForm({ ...form, metric2Value: e.target.value })}
                          className="rounded-lg h-9 border-slate-200 bg-slate-50/50 focus-visible:ring-[#0f2c6f]/50 text-xs"
                        />
                        <Input 
                          placeholder="Label 2 (e.g. Success)" 
                          value={form.metric2Label}
                          onChange={(e) => setForm({ ...form, metric2Label: e.target.value })}
                          className="rounded-lg h-9 border-slate-200 bg-slate-50/50 focus-visible:ring-[#0f2c6f]/50 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Input 
                          placeholder="Value 3 (e.g. 45 Days)" 
                          value={form.metric3Value}
                          onChange={(e) => setForm({ ...form, metric3Value: e.target.value })}
                          className="rounded-lg h-9 border-slate-200 bg-slate-50/50 focus-visible:ring-[#0f2c6f]/50 text-xs"
                        />
                        <Input 
                          placeholder="Label 3 (e.g. Setup)" 
                          value={form.metric3Label}
                          onChange={(e) => setForm({ ...form, metric3Label: e.target.value })}
                          className="rounded-lg h-9 border-slate-200 bg-slate-50/50 focus-visible:ring-[#0f2c6f]/50 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 3: NARRATIVE & CASE STUDY */}
                <TabsContent value="narrative" className="space-y-3 focus:outline-none mt-0 text-left">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600">Student Short Bio / Card Quote *</Label>
                    <Textarea
                      required
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Provide a stunning short summary of what the student accomplished. This is shown on card quote sections..."
                      rows={2}
                      className="rounded-xl border-slate-200 focus-visible:ring-[#0f2c6f]/50 bg-slate-50/30 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <Label className="text-[11px] font-bold text-slate-600">Full Post Narrative / Long Story Markdown Editor</Label>
                      <Badge variant="outline" className="bg-blue-50 text-[#0f2c6f] border-none font-bold text-[8px] px-1.5 py-0.5 rounded">
                        Markdown Supported
                      </Badge>
                    </div>
                    <Textarea
                      value={form.storyContent}
                      onChange={(e) => setForm({ ...form, storyContent: e.target.value })}
                      placeholder={`Write or paste the full case study narrative here...\nUse '#' for H2, '##' for H3, '>' for blockquotes, and '-' for lists.`}
                      rows={5}
                      className="rounded-xl border-slate-200 focus-visible:ring-[#0f2c6f]/50 bg-slate-50/30 font-mono text-xs leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600">External Reference Web Link (Optional)</Label>
                    <Input
                      value={form.externalLink}
                      onChange={(e) => setForm({ ...form, externalLink: e.target.value })}
                      placeholder="https://facebook.com/... or verified blog references..."
                      className="rounded-xl h-9 border-slate-200 focus-visible:ring-[#0f2c6f]/50 bg-slate-50/30 text-xs"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-5">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)} 
                  className="rounded-xl h-10 px-4 border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || isUpdatingStory || isUploadingImage} 
                  className="rounded-xl h-10 px-6 bg-[#0f2c6f] hover:bg-[#1a47b8] text-white font-extrabold shadow-md shadow-blue-900/10 transition-all text-xs"
                >
                  {(createMutation.isPending || isUpdatingStory) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  )}
                  {isEditingStory ? "Save Story Settings" : "Launch Success Narrative"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3 mb-8 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="stories" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <LayoutGrid className="h-4 w-4 mr-2" /> Success Stories
          </TabsTrigger>
          <TabsTrigger value="add-category" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Add Category
          </TabsTrigger>
          <TabsTrigger value="view-categories" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Tag className="h-4 w-4 mr-2" /> View Categories
          </TabsTrigger>
        </TabsList>

        {/* Success Stories Grid */}
        <TabsContent value="stories">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories?.map((story: any) => (
                <Card key={story.id} className={`hover:shadow-md transition-shadow overflow-hidden ${story.isHidden ? "opacity-60 ring-2 ring-orange-300" : ""}`}>
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
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{story.studentName}</p>
                            {story.isHidden && (
                              <span className="text-[9px] bg-orange-500/30 text-orange-200 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Hidden</span>
                            )}
                          </div>
                          <p className="text-xs text-blue-200">{story.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={story.isHidden ? "Show on homepage" : "Hide from homepage"}
                          className={`h-8 w-8 hover:bg-white/10 ${
                            story.isHidden
                              ? "text-orange-300 hover:text-orange-100"
                              : "text-white/60 hover:text-white"
                          }`}
                          disabled={togglingVisibilityId === story.id}
                          onClick={() => handleToggleVisibility(story)}
                        >
                          {togglingVisibilityId === story.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : story.isHidden ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
                          onClick={() => handleEditStory(story)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this success story?")) {
                              deleteMutation.mutate({ id: story.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-1.5 items-center">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold border-gray-200 text-gray-500">
                          {categories?.find((c: any) => c.id === story.categoryId)?.name || "Uncategorized"}
                        </Badge>
                        <Badge className={`text-[10px] uppercase font-black border-none ${
                          story.storyType === "blog" ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-50" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-50"
                        }`}>
                          {story.storyType === "blog" ? "✍️ Blog Post" : "🎓 Achiever"}
                        </Badge>
                      </div>
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

        {/* Add / Edit Category Form */}
        <TabsContent value="add-category">
          <div className="max-w-xl mx-auto">
            <Card className="border-0 shadow-md ring-1 ring-slate-100">
              <CardHeader className="p-6 pb-2">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  {isEditingCategory ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />} 
                  {isEditingCategory ? "Edit Category" : "Create New Category"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isEditingCategory 
                    ? "Modify category metadata and save updates" 
                    : "Add a brand new success stories category and launch it immediately"
                  }
                </p>
              </CardHeader>
              <CardContent className="p-6 pt-4 space-y-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700 ml-1">Category Name *</Label>
                  <Input 
                    placeholder="e.g. Amazon Mastery" 
                    value={categoryForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase()
                        .replace(/[^a-z0-9\s]/g, '')
                        .replace(/\s+/g, '-');
                      setCategoryForm({ ...categoryForm, name, slug });
                    }}
                    className="rounded-xl h-11 bg-slate-50 mt-1 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 ml-1">Slug</Label>
                  <Input 
                    placeholder="e.g. amazon-mastery" 
                    value={categoryForm.slug}
                    readOnly
                    className="bg-slate-100 text-slate-400 rounded-xl h-11 mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 ml-1">Description</Label>
                  <Textarea 
                    placeholder="Brief overview of what students accomplish in this category..." 
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    rows={4}
                    className="rounded-xl bg-slate-50 mt-1 focus:bg-white transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    className="w-full h-11 rounded-xl font-bold" 
                    disabled={createCategoryMutation.isPending || isUpdatingCategory || !categoryForm.name || !categoryForm.slug}
                    onClick={handleCategorySubmit}
                  >
                    {(createCategoryMutation.isPending || isUpdatingCategory) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {isEditingCategory ? "Update Category" : "Create Category"}
                  </Button>
                  {isEditingCategory && (
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl font-bold"
                      onClick={() => {
                        setIsEditingCategory(false);
                        setEditingCategoryId(null);
                        setCategoryForm({ name: "", slug: "", description: "" });
                        setActiveTab("view-categories");
                      }}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* View Registered Categories List-wise */}
        <TabsContent value="view-categories">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 pl-6">Category Info</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories?.map((cat: any) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                            <FolderOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 text-sm block">{cat.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{cat.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-500 max-w-sm truncate leading-relaxed">
                        {cat.description || <span className="text-slate-300 italic">No description provided</span>}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5"
                            onClick={() => {
                              setIsEditingCategory(true);
                              setEditingCategoryId(cat.id);
                              setCategoryForm({
                                name: cat.name,
                                slug: cat.slug,
                                description: cat.description || "",
                              });
                              setActiveTab("add-category");
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => {
                              if (confirm("Are you sure? This will not delete the stories in this category.")) {
                                deleteCategoryMutation.mutate({ id: cat.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!categories || categories.length === 0) && (
                    <tr>
                      <td colSpan={3} className="text-center py-16 text-slate-400 text-sm">
                        <FolderOpen className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                        <p>No categories registered yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
