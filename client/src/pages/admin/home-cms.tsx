import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Newspaper, 
  HelpCircle, 
  Star, 
  Layout,
  Save,
  Pencil,
  CheckCircle2,
  XCircle,
  BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// I'll use local state and fetch for now since generation takes time
const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function AdminHomeCMS() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("courses");
  const [articles, setArticles] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Article form
  const [articleForm, setArticleForm] = useState({
    id: null,
    title: "",
    excerpt: "",
    content: "",
    category: "General",
    imageUrl: "",
    isPublished: false
  });
  const [isEditingArticle, setIsEditingArticle] = useState(false);

  // FAQ form
  const [faqForm, setFaqForm] = useState({
    id: null,
    question: "",
    answer: "",
    category: "General",
    orderIndex: 0
  });
  const [isEditingFaq, setIsEditingFaq] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [artRes, faqRes, courseRes] = await Promise.all([
        fetch(`${BASE_URL}/api/admin/articles`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }),
        fetch(`${BASE_URL}/api/faqs`),
        fetch(`${BASE_URL}/api/courses`)
      ]);
      
      if (artRes.ok) setArticles(await artRes.json());
      if (faqRes.ok) setFaqs(await faqRes.json());
      if (courseRes.ok) setCourses(await courseRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseFeatured = async (id: number, current: boolean) => {
    try {
      const res = await fetch(`${BASE_URL}/api/courses/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ isFeatured: !current })
      });
      if (res.ok) {
        toast({ title: !current ? "Course Featured!" : "Removed from Featured" });
        fetchData();
      }
    } catch (err) {}
  };

  // Article handlers
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditingArticle ? `${BASE_URL}/api/articles/${articleForm.id}` : `${BASE_URL}/api/articles`;
    const method = isEditingArticle ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(articleForm)
      });
      
      if (res.ok) {
        toast({ title: isEditingArticle ? "Article updated" : "Article created" });
        setIsEditingArticle(false);
        setArticleForm({ id: null, title: "", excerpt: "", content: "", category: "General", imageUrl: "", isPublished: false });
        fetchData();
      } else {
        toast({ title: "Operation failed", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error occurred", variant: "destructive" });
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${BASE_URL}/api/articles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        toast({ title: "Article deleted" });
        fetchData();
      }
    } catch (err) {}
  };

  // FAQ handlers
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditingFaq ? `${BASE_URL}/api/faqs/${faqForm.id}` : `${BASE_URL}/api/faqs`;
    const method = isEditingFaq ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(faqForm)
      });
      
      if (res.ok) {
        toast({ title: isEditingFaq ? "FAQ updated" : "FAQ created" });
        setIsEditingFaq(false);
        setFaqForm({ id: null, question: "", answer: "", category: "General", orderIndex: 0 });
        fetchData();
      }
    } catch (err) {}
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${BASE_URL}/api/faqs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        toast({ title: "FAQ deleted" });
        fetchData();
      }
    } catch (err) {}
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Home Content Management</h1>
            <p className="text-slate-500 font-medium mt-1">Manage articles, FAQs, and featured sections of your landing page.</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Layout className="h-6 w-6" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-2xl mb-6">
            <TabsTrigger value="courses" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Star className="h-4 w-4 mr-2" /> Featured Courses
            </TabsTrigger>
            <TabsTrigger value="articles" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Newspaper className="h-4 w-4 mr-2" /> Articles & News
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <Card className="border-2 border-slate-100 rounded-[32px] overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Manage Featured Courses</CardTitle>
                <CardDescription>Select up to 6 courses to showcase on the home page hero section.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                      <div key={course.id} className={`p-4 rounded-[24px] border-2 transition-all ${course.isFeatured ? 'border-primary bg-primary/5' : 'border-slate-50 bg-white'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden">
                            {course.thumbnail ? <img src={course.thumbnail} className="h-full w-full object-cover" /> : <BookOpen className="h-5 w-5 m-3.5 text-slate-300" />}
                          </div>
                          <Switch 
                            checked={course.isFeatured} 
                            onCheckedChange={() => toggleCourseFeatured(course.id, course.isFeatured)}
                          />
                        </div>
                        <h4 className="font-bold text-slate-900 line-clamp-1">{course.title}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">{course.category}</p>
                        {course.isFeatured && (
                          <div className="flex items-center gap-1 mt-3 text-[10px] font-black text-primary uppercase">
                            <Star className="h-3 w-3 fill-primary" /> Featured on Home
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="articles">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* List */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-2 border-slate-100 rounded-[32px] overflow-hidden">
                  <CardHeader className="border-b border-slate-50">
                    <CardTitle className="text-xl font-bold">Published Articles</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                    ) : articles.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 font-medium">No articles yet.</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {articles.map(art => (
                          <div key={art.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="h-16 w-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                                {art.imageUrl ? <img src={art.imageUrl} className="h-full w-full object-cover" /> : <Newspaper className="h-6 w-6 m-5 text-slate-300" />}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{art.title}</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">{art.excerpt}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">{art.category}</Badge>
                                  {art.isPublished ? (
                                    <span className="flex items-center text-[10px] font-black text-emerald-500 uppercase"><CheckCircle2 className="h-3 w-3 mr-1" /> Published</span>
                                  ) : (
                                    <span className="flex items-center text-[10px] font-black text-slate-400 uppercase"><XCircle className="h-3 w-3 mr-1" /> Draft</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => { setArticleForm(art); setIsEditingArticle(true); }} className="rounded-xl hover:bg-primary/10 hover:text-primary">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteArticle(art.id)} className="rounded-xl hover:bg-rose-50 hover:text-rose-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Form */}
              <div>
                <Card className="border-2 border-slate-100 rounded-[32px] sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">{isEditingArticle ? "Edit Article" : "Write Article"}</CardTitle>
                    <CardDescription>Share news and updates with your community.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveArticle} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input required value={articleForm.title} onChange={e => setArticleForm({...articleForm, title: e.target.value})} placeholder="Article headline" className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>Excerpt</Label>
                        <Textarea required value={articleForm.excerpt} onChange={e => setArticleForm({...articleForm, excerpt: e.target.value})} placeholder="Short summary..." className="rounded-xl h-20" />
                      </div>
                      <div className="space-y-2">
                        <Label>Content (Markdown supported)</Label>
                        <Textarea required value={articleForm.content} onChange={e => setArticleForm({...articleForm, content: e.target.value})} placeholder="Full article body..." className="rounded-xl h-40" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input value={articleForm.category} onChange={e => setArticleForm({...articleForm, category: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Image URL</Label>
                          <Input value={articleForm.imageUrl} onChange={e => setArticleForm({...articleForm, imageUrl: e.target.value})} placeholder="https://..." className="rounded-xl" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <Label className="font-bold">Publish instantly?</Label>
                        <Switch checked={articleForm.isPublished} onCheckedChange={val => setArticleForm({...articleForm, isPublished: val})} />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1 rounded-xl shadow-lg shadow-primary/20">
                          <Save className="h-4 w-4 mr-2" /> {isEditingArticle ? "Update" : "Publish"}
                        </Button>
                        {isEditingArticle && (
                          <Button type="button" variant="ghost" onClick={() => { setIsEditingArticle(false); setArticleForm({id: null, title: "", excerpt: "", content: "", category: "General", imageUrl: "", isPublished: false}); }} className="rounded-xl">Cancel</Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
