import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { 
  Newspaper, Loader2, Plus, Trash2, Pencil, 
  Save, CheckCircle2, XCircle, FileText, Star, User as UserIcon
} from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function AdminArticles() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/articles`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
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
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast({ title: isEditingArticle ? "Article updated successfully!" : "Article published successfully!" });
        setIsEditingArticle(false);
        setArticleForm({ 
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
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
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
              Create, edit, and publish blogs, announcements, or news updates for your student community.
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 rounded-[32px] overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850">
                <CardTitle className="text-xl font-bold">All Articles & Blogs</CardTitle>
                <CardDescription>
                  {user?.role === "admin" 
                    ? "Manage all catalog articles, feature up to 3 on the home page, and review submissions." 
                    : "Create professional articles. You can view all blogs and update or delete your own entries."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                ) : articles.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium">No articles yet. Create one!</div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-850">
                    {articles.map(art => {
                      const isOwner = art.author === user?.name;
                      const canManage = user?.role === "admin" || isOwner;
                      
                      return (
                        <div key={art.id} className="p-6 hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors flex items-center justify-between group">
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
                                  • {art.readTime || "5 min read"}
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
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {canManage ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => { setArticleForm(art); setIsEditingArticle(true); }} 
                                  className="rounded-xl hover:bg-primary/10 hover:text-primary h-9 w-9"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteArticle(art.id)} 
                                  className="rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 h-9 w-9"
                                >
                                  <Trash2 className="h-4 w-4" />
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
            </Card>
          </div>

          {/* Form */}
          <div>
            <Card className="border-none shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 rounded-[32px] sticky top-6">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850">
                <CardTitle className="text-xl font-bold">{isEditingArticle ? "Edit Article" : "Write Article"}</CardTitle>
                <CardDescription>Share stories, knowledge, and course announcements.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveArticle} className="space-y-4">
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
                      className="rounded-xl h-20 resize-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Content</Label>
                    <Textarea 
                      required 
                      value={articleForm.content} 
                      onChange={e => setArticleForm({...articleForm, content: e.target.value})} 
                      placeholder="Type the full body details here..." 
                      className="rounded-xl h-36 resize-y" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label className="font-bold">Image URL</Label>
                      <Input 
                        value={articleForm.imageUrl} 
                        onChange={e => setArticleForm({...articleForm, imageUrl: e.target.value})} 
                        placeholder="https://..." 
                        className="rounded-xl" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <div className="space-y-0.5">
                      <Label className="font-bold">Publish Instantly?</Label>
                      <p className="text-[10px] text-slate-400">Available to student portal if toggled live.</p>
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
                        <p className="text-[10px] text-amber-600/80">Pins this article to the website homepage (Max 3).</p>
                      </div>
                      <Switch 
                        checked={articleForm.isFeatured} 
                        onCheckedChange={val => setArticleForm({...articleForm, isFeatured: val})} 
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-md">
                      <Save className="h-4 w-4 mr-2" /> {isEditingArticle ? "Update" : "Publish"}
                    </Button>
                    {isEditingArticle && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => { 
                          setIsEditingArticle(false); 
                          setArticleForm({
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
                        }} 
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
