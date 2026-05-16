import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Save,
  Pencil,
  Search,
  ChevronRight,
  HelpCircle as HelpIcon,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function AdminFAQs() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // FAQ form
  const [faqForm, setFaqForm] = useState({
    id: null,
    question: "",
    answer: "",
    category: "General",
    orderIndex: 0
  });
  const [isEditingFaq, setIsEditingFaq] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/faqs`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to fetch FAQs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditingFaq ? `${BASE_URL}/api/faqs/${faqForm.id}` : `${BASE_URL}/api/faqs`;
    const method = isEditingFaq ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
        },
        body: JSON.stringify(faqForm)
      });
      
      if (res.ok) {
        toast({ title: isEditingFaq ? "FAQ updated" : "FAQ created" });
        setIsEditingFaq(false);
        setIsFormOpen(false);
        setFaqForm({ id: null, question: "", answer: "", category: "General", orderIndex: 0 });
        fetchData();
      } else {
        const error = await res.json();
        toast({ title: error.error || "Operation failed", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error occurred", variant: "destructive" });
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm("Are you sure you want to delete this FAQ? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${BASE_URL}/api/faqs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` }
      });
      if (res.ok) {
        toast({ title: "FAQ deleted" });
        fetchData();
      }
    } catch (err) {
      toast({ title: "Failed to delete FAQ", variant: "destructive" });
    }
  };

  const handleEditClick = (faq: any) => {
    setFaqForm(faq);
    setIsEditingFaq(true);
    setIsFormOpen(true);
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(search.toLowerCase()) || 
    faq.answer.toLowerCase().includes(search.toLowerCase()) ||
    faq.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              FAQ Management
              <Badge className="bg-primary/10 text-primary border-none text-xs px-2 py-0">Admin</Badge>
            </h1>
            <p className="text-slate-500 font-medium mt-1">Add, edit, and organize frequently asked questions for your students.</p>
          </div>
          <Button 
            onClick={() => {
              setIsEditingFaq(false);
              setFaqForm({ id: null, question: "", answer: "", category: "General", orderIndex: 0 });
              setIsFormOpen(!isFormOpen);
            }} 
            className="rounded-2xl h-12 px-6 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
          >
            {isFormOpen ? "View All FAQs" : <><Plus className="h-5 w-5 mr-2" /> Add New FAQ</>}
          </Button>
        </div>

        {isFormOpen ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto w-full">
            <Card className="border-2 border-slate-100 rounded-[32px] shadow-xl shadow-slate-200/50">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <HelpIcon className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold">{isEditingFaq ? "Edit FAQ" : "Create New FAQ"}</CardTitle>
                <CardDescription>Provide clear and concise answers to help your users.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveFaq} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 ml-1">Question</Label>
                    <Input 
                      required 
                      value={faqForm.question} 
                      onChange={e => setFaqForm({...faqForm, question: e.target.value})} 
                      placeholder="e.g. How do I access my certificates?" 
                      className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <Label className="text-sm font-bold text-slate-700">Answer</Label>
                      <span className={`text-[10px] font-bold ${faqForm.answer.length > 450 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {faqForm.answer.length} / 500
                      </span>
                    </div>
                    <Textarea 
                      required 
                      maxLength={500}
                      value={faqForm.answer} 
                      onChange={e => setFaqForm({...faqForm, answer: e.target.value})} 
                      placeholder="Provide the detailed answer here..." 
                      className="rounded-2xl min-h-[160px] bg-slate-50 border-slate-200 focus:bg-white transition-all p-4" 
                    />
                    <p className="text-[10px] text-slate-400 ml-1">Limit answers to 500 characters to ensure perfect responsiveness on the home page.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700 ml-1">Category</Label>
                      <Input 
                        value={faqForm.category} 
                        onChange={e => setFaqForm({...faqForm, category: e.target.value})} 
                        placeholder="e.g. Payments, Courses"
                        className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700 ml-1">Display Order Index</Label>
                      <Input 
                        type="number" 
                        value={faqForm.orderIndex} 
                        onChange={e => setFaqForm({...faqForm, orderIndex: parseInt(e.target.value) || 0})} 
                        className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all" 
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20">
                      <Save className="h-5 w-5 mr-2" /> {isEditingFaq ? "Update FAQ" : "Save FAQ"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => {
                        setIsEditingFaq(false);
                        setIsFormOpen(false);
                        setFaqForm({ id: null, question: "", answer: "", category: "General", orderIndex: 0 });
                      }} 
                      className="rounded-2xl h-12 px-6"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Search FAQs..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-slate-50 border-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-xl h-12 border-slate-100 text-slate-500">
                  <Filter className="h-4 w-4 mr-2" /> All Categories
                </Button>
              </div>
            </div>

            {/* FAQ List - Row Wise */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-24 text-center">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary opacity-20" />
                </div>
              ) : filteredFaqs.length === 0 ? (
                <div className="py-24 text-center">
                  <HelpCircle className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                  <h3 className="text-xl font-bold text-slate-900">No FAQs Found</h3>
                  <p className="text-slate-500 mt-1">Start by adding your first question to help your users.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Question & Answer</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Category</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredFaqs.map((faq) => (
                        <tr key={faq.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                              {faq.orderIndex}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-md">
                            <h4 className="text-sm font-bold text-slate-900 mb-1">{faq.question}</h4>
                            <p className="text-xs text-slate-400 line-clamp-1">{faq.answer}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                              {faq.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditClick(faq)} 
                                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteFaq(faq.id)} 
                                className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
