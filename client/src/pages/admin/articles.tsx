import { DashboardLayout } from "@/components/DashboardLayout";
import { FileUploadButton } from "@/components/FileUploadButton";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { 
  Newspaper, Loader2, Trash2, Pencil, 
  Save, CheckCircle2, XCircle, FileText, Star, User as UserIcon, Upload, Image as ImageIcon,
  Search, Eye, EyeOff, Plus, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, List, ListOrdered, Eraser
} from "lucide-react";

const BASE_URL = window.location.origin;

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  token?: string | null;
}

export function RichTextEditor({ value, onChange, token }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Sync value to editor only when it differs (avoids cursor resets on typing)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const execCmd = (command: string, value: string = "") => {
    // Basic rich text styling commands
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    setIsUploading(true);
    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      // Focus back to editor to restore selection range
      editorRef.current?.focus();
      
      // Insert centered visual image layout
      const imgHtml = `<img src="${data.url}" class="mx-auto my-4 max-h-[380px] rounded-xl shadow-md block object-contain" alt="Blog Image" />`;
      document.execCommand("insertHTML", false, imgHtml);
      
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    } catch (err) {
      alert("Failed to upload image: " + (err as Error).message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-50 border-b border-slate-200 p-1.5 dark:bg-slate-900 dark:border-slate-800">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => execCmd("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => execCmd("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => execCmd("underline")}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-slate-250 mx-1 dark:bg-slate-800" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => execCmd("formatBlock", "h2")}
          title="Heading 2"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => execCmd("formatBlock", "h3")}
          title="Heading 3"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => execCmd("formatBlock", "p")}
          title="Paragraph"
        >
          <span className="font-bold text-xs font-sans">P</span>
        </Button>

        <div className="w-px h-5 bg-slate-250 mx-1 dark:bg-slate-800" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => execCmd("insertUnorderedList")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => execCmd("insertOrderedList")}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-slate-250 mx-1 dark:bg-slate-800" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => execCmd("justifyLeft")}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => execCmd("justifyCenter")}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => execCmd("justifyRight")}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-slate-250 mx-1 dark:bg-slate-800" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md text-indigo-600 hover:text-indigo-750"
          onClick={() => fileInputRef.current?.click()}
          title="Insert Center/Line Image"
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={() => execCmd("removeFormat")}
          title="Clear Formatting"
        >
          <Eraser className="h-4 w-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="p-4 min-h-[360px] max-h-[600px] overflow-y-auto focus:outline-none prose prose-slate max-w-none text-left font-serif text-slate-850 dark:text-slate-100"
        style={{ fontFamily: "'Lora', Georgia, serif" }}
      />
    </div>
  );
}

export default function AdminArticles() {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("manage");
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 8;
  
  // Article form state
  const [articleForm, setArticleForm] = useState({
    id: null,
    title: "",
    excerpt: "",
    content: "",
    category: "General",
    imageUrl: "",
    isPublished: false,
    isFeatured: false,
    readTime: "5 min read"
  });
  
  const [isEditingArticle, setIsEditingArticle] = useState(false);

  const filteredArticles = articles.filter((article) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return (
      article.title?.toLowerCase().includes(query) ||
      article.excerpt?.toLowerCase().includes(query) ||
      article.category?.toLowerCase().includes(query) ||
      article.author?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / articlesPerPage));
  const paginatedArticles = filteredArticles.slice((currentPage - 1) * articlesPerPage, currentPage * articlesPerPage);
  const pageStart = filteredArticles.length ? (currentPage - 1) * articlesPerPage + 1 : 0;
  const pageEnd = Math.min(currentPage * articlesPerPage, filteredArticles.length);

  const visibleArticleCount = articles.filter((article) => article.isPublished).length;

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/articles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setArticles(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const resetArticleForm = () => {
    setArticleForm({
      id: null,
      title: "",
      excerpt: "",
      content: "",
      category: "General",
      imageUrl: "",
      isPublished: user?.role === "teacher",
      isFeatured: false,
      readTime: "5 min read"
    });
  };

  useEffect(() => {
    if (!isEditingArticle && user?.role === "teacher") {
      setArticleForm((current) => ({ ...current, isPublished: true }));
    }
  }, [isEditingArticle, user?.role]);

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
      const res = await fetch(`${BASE_URL}/api/articles/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const uploaded = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(uploaded.error || uploaded.message || "Image upload failed");

      setArticleForm((current) => ({ ...current, imageUrl: uploaded.url }));
      toast({ title: "Article cover uploaded" });
    } catch (error: any) {
      toast({ title: error.message || "Image upload failed", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditingArticle ? `${BASE_URL}/api/articles/${articleForm.id}` : `${BASE_URL}/api/articles`;
    const method = isEditingArticle ? "PUT" : "POST";
    
    // Estimate read time based on content length
    const words = articleForm.content.trim().split(/\s+/).length;
    const estMinutes = Math.max(1, Math.ceil(words / 200));
    const estimatedReadTime = `${estMinutes} min read`;
    
    const payload = {
      ...articleForm,
      readTime: estimatedReadTime,
      // Fallback author to current user's name on creation
      author: isEditingArticle ? undefined : (user?.name || "Global College Staff"),
      // Only admin can feature articles
      isFeatured: user?.role === "admin" ? articleForm.isFeatured : false
    };
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast({ title: isEditingArticle ? "Article updated successfully!" : "Article published successfully!" });
        setIsEditingArticle(false);
        resetArticleForm();
        setActiveTab("manage");
        fetchArticles();
      } else {
        const errorData = await res.json();
        toast({ title: "Operation failed", description: errorData.error || "Please verify all required fields.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error occurred", description: "Failed to connect to the backend server.", variant: "destructive" });
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      const res = await fetch(`${BASE_URL}/api/articles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: "Article deleted successfully." });
        fetchArticles();
      } else {
        const errorData = await res.json();
        toast({ title: "Failed to delete article", description: errorData.error || "Permission denied.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error deleting article", variant: "destructive" });
    }
  };

  const handleEditArticle = (article: any) => {
    setArticleForm(article);
    setIsEditingArticle(true);
    setActiveTab("write");
  };

  const handleNewArticle = () => {
    setIsEditingArticle(false);
    resetArticleForm();
    setActiveTab("write");
  };

  const handleTogglePublish = async (article: any) => {
    const nextPublishedState = !article.isPublished;

    try {
      const res = await fetch(`${BASE_URL}/api/articles/${article.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          category: article.category,
          imageUrl: article.imageUrl,
          isPublished: nextPublishedState,
          isFeatured: article.isFeatured,
          readTime: article.readTime || "5 min read",
        }),
      });

      if (res.ok) {
        toast({ title: nextPublishedState ? "Article is now visible" : "Article hidden from public site" });
        fetchArticles();
      } else {
        const errorData = await res.json();
        toast({ title: "Could not update visibility", description: errorData.error || "Permission denied.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Could not update visibility", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Newspaper className="h-8 w-8 text-indigo-500" /> 
              {user?.role === "admin" ? "Articles & News Manager" : "Teacher's Article Studio"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Create, edit, hide, show, and publish articles for the public website.
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:flex-row md:items-center md:justify-between">
            <TabsList className="h-auto justify-start rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
              <TabsTrigger value="manage" className="h-10 rounded-lg px-4 text-xs font-black uppercase tracking-wide">
                <Newspaper className="mr-2 h-4 w-4" />
                Published Articles
              </TabsTrigger>
              <TabsTrigger value="write" className="h-10 rounded-lg px-4 text-xs font-black uppercase tracking-wide">
                <Plus className="mr-2 h-4 w-4" />
                Write Article
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 px-2">
              <Badge className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 hover:bg-emerald-50">
                {visibleArticleCount} visible
              </Badge>
              <Badge variant="outline" className="rounded-lg px-3 py-1 text-xs font-black">
                {articles.length} total
              </Badge>
            </div>
          </div>

          <TabsContent value="manage" className="mt-0">
            <Card className="overflow-hidden rounded-[28px] border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
              <CardHeader className="gap-4 border-b border-slate-100 bg-slate-50/50 dark:border-slate-850 dark:bg-slate-900/30 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Published Articles</CardTitle>
                  <CardDescription>
                    Search articles and manage public visibility, edits, and deletion.
                  </CardDescription>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                  <div className="relative min-w-0 sm:w-80">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search title, author, category..."
                      className="h-10 rounded-xl bg-white pl-10 text-sm"
                    />
                  </div>
                  <Button type="button" onClick={handleNewArticle} className="h-10 rounded-xl font-bold">
                    <Plus className="mr-2 h-4 w-4" />
                    New Article
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                ) : articles.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium">No articles yet. Create one!</div>
                ) : filteredArticles.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium">No articles match your search.</div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-850">
                    {paginatedArticles.map(art => {
                      const isOwner = art.author === user?.name;
                      const canManage = user?.role === "admin" || user?.role === "teacher";
                      
                      return (
                        <div key={art.id} className="p-6 hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between group">
                          <div className="flex items-center gap-4 min-w-0 mr-4">
                            <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 overflow-hidden shrink-0">
                              {art.imageUrl ? (
                                <img src={art.imageUrl} className="h-full w-full object-cover" />
                              ) : (
                                <Newspaper className="h-6 w-6 m-5 text-slate-300 dark:text-slate-700" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                                  {art.title}
                                </h3>
                                {art.isFeatured && (
                                  <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-none font-bold text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Featured
                                  </Badge>
                                )}
                                {isOwner && (
                                  <Badge className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                                    My Article
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1 max-w-lg">{art.excerpt}</p>
                              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0">{art.category}</Badge>
                                <span className="text-[10px] text-slate-400 font-medium flex items-center">
                                  <UserIcon className="h-3 w-3 mr-1" /> {art.author}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  - {art.readTime || "5 min read"}
                                </span>
                                {art.isPublished ? (
                                  <span className="flex items-center text-[10px] font-black text-emerald-500 uppercase">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Published
                                  </span>
                                ) : (
                                  <span className="flex items-center text-[10px] font-black text-slate-400 uppercase">
                                    <XCircle className="h-3.5 w-3.5 mr-1" /> Draft
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {canManage ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTogglePublish(art)}
                                  className={`h-9 rounded-xl text-xs font-bold ${art.isPublished ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                                >
                                  {art.isPublished ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
                                  {art.isPublished ? "Hide" : "Show"}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleEditArticle(art)} 
                                  className="h-9 rounded-xl text-xs font-bold"
                                >
                                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDeleteArticle(art.id)} 
                                  className="h-9 rounded-xl border-rose-100 text-xs font-bold text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                  Delete
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-md">
                                Read Only
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              {!loading && filteredArticles.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-850 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-bold text-slate-500">
                    Showing {pageStart}-{pageEnd} of {filteredArticles.length} articles
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl text-xs font-bold"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      Page {currentPage} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl text-xs font-bold"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="write" className="mt-0">
            <Card className="border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 rounded-[32px] overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850">
                <CardTitle className="text-xl font-bold">{isEditingArticle ? "Edit Article" : "Write Article"}</CardTitle>
                <CardDescription>
                  {user?.role === "teacher" ? "Published articles appear on the public website and resources page." : "Share stories, knowledge, and course announcements."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveArticle} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Title</Label>
                      <Input 
                        required 
                        value={articleForm.title} 
                        onChange={e => setArticleForm({...articleForm, title: e.target.value})} 
                        placeholder="Headline / Blog Title..." 
                        className="rounded-xl" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Excerpt</Label>
                      <Textarea 
                        required 
                        value={articleForm.excerpt} 
                        onChange={e => setArticleForm({...articleForm, excerpt: e.target.value})} 
                        placeholder="Short catchy summary (shown in cards)..." 
                        className="rounded-xl h-24 resize-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Content</Label>
                      <RichTextEditor
                        value={articleForm.content}
                        onChange={(val) => setArticleForm({ ...articleForm, content: val })}
                        token={token}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <FileUploadButton
                        type="image"
                        label="Cover Image"
                        currentUrl={articleForm.imageUrl || null}
                        onUploaded={(url) => setArticleForm({ ...articleForm, imageUrl: url })}
                        onClear={() => setArticleForm({ ...articleForm, imageUrl: "" })}
                        showDownload={true}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="space-y-2">
                        <Label className="font-bold">Category</Label>
                        <Input 
                          required
                          value={articleForm.category} 
                          onChange={e => setArticleForm({...articleForm, category: e.target.value})} 
                          className="rounded-xl" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Read Time</Label>
                        <Input value="Auto calculated on save" readOnly className="rounded-xl bg-slate-50 text-xs font-semibold text-slate-500" />
                      </div>
                    </div>
                  
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                      <div className="space-y-0.5">
                        <Label className="font-bold">Publish Instantly?</Label>
                        <p className="text-[10px] text-slate-400">Published articles appear on the public resources page and homepage recent articles.</p>
                      </div>
                      <Switch 
                        checked={articleForm.isPublished} 
                        onCheckedChange={val => setArticleForm({...articleForm, isPublished: val})} 
                      />
                    </div>

                    {user?.role === "admin" && (
                      <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                        <div className="space-y-0.5">
                          <Label className="font-bold text-amber-900 dark:text-amber-300">Feature on Home Page?</Label>
                          <p className="text-[10px] text-amber-600/80">Pins this article to the website homepage.</p>
                        </div>
                        <Switch 
                          checked={articleForm.isFeatured} 
                          onCheckedChange={val => setArticleForm({...articleForm, isFeatured: val})} 
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="flex-1 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-md" disabled={isUploadingImage}>
                        <Save className="h-4 w-4 mr-2" /> {isEditingArticle ? "Update" : articleForm.isPublished ? "Publish Article" : "Save Draft"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => { 
                          setIsEditingArticle(false); 
                          resetArticleForm(); 
                        }} 
                        className="rounded-xl"
                      >
                        {isEditingArticle ? "Cancel" : "Clear"}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

