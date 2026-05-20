import { MainLayout } from "@/components/MainLayout";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Newspaper, Search, Calendar, User, Clock, 
  ChevronRight, ArrowUpRight, BookOpen, Star
} from "lucide-react";

export default function Resources() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/articles");
        if (res.ok) {
          setArticles(await res.json());
        }
      } catch (err) {
        console.error("Failed to load articles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // Extract unique categories
  const categories = ["All", ...Array.from(new Set(articles.map(a => a.category || "General")))];

  // Filter logic
  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || art.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50/50 pb-24">
        {/* Majestic banner header */}
        <section className="relative py-24 bg-slate-900 overflow-hidden text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-emerald-950/60 z-0" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl z-0" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl z-0" />
          
          <div className="relative z-10 w-full px-4 md:px-10 lg:px-16 text-center max-w-4xl mx-auto space-y-6">
            <span className="bg-[#e6fcf5] text-[#0ca678] border border-[#b2f2bb] rounded-md px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-md">
              Knowledge Hub & Blog Studio
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-300">Articles & News</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
              Real ecommerce guides, tips, announcements, and success blueprints curated by our expert educators and administrators.
            </p>
          </div>
        </section>

        {/* Content catalog */}
        <div className="w-full px-4 md:px-10 lg:px-16 mt-16 max-w-7xl mx-auto">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            {/* Horizontal tags filter */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto py-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${
                    selectedCategory === cat 
                      ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                      : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="pl-11 pr-4 py-3 rounded-2xl border-slate-200 focus-visible:ring-primary h-12"
              />
            </div>
          </div>

          {/* Grid listing */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-bold">Fetching latest articles...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-16 text-center shadow-sm max-w-lg mx-auto space-y-4">
              <Newspaper className="h-16 w-16 mx-auto text-slate-300 animate-pulse" />
              <h3 className="text-xl font-bold text-slate-950">No articles found</h3>
              <p className="text-slate-500 text-sm font-medium">
                We couldn't find any articles matching your search query or chosen category. Try resetting the filters.
              </p>
              <Button onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }} className="rounded-xl mt-4">
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map(art => (
                <Card key={art.id} className="overflow-hidden border-0 ring-1 ring-slate-100 bg-white shadow-sm hover:shadow-2xl hover:shadow-indigo-900/5 transition-all duration-500 rounded-[2.5rem] flex flex-col h-[520px] group">
                  {/* Thumbnail */}
                  <div className="h-52 bg-slate-900 relative overflow-hidden flex items-center justify-center shrink-0">
                    {art.imageUrl ? (
                      <img 
                        src={art.imageUrl} 
                        alt={art.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-500 opacity-80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
                    
                    {/* Category Overlay */}
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                      <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 font-bold uppercase tracking-wider text-[9px] px-2.5 py-1">
                        {art.category}
                      </Badge>
                      {art.isFeatured && (
                        <Badge className="bg-amber-400 text-slate-900 border-none font-bold uppercase tracking-wider text-[9px] px-2.5 py-1 shadow-lg flex items-center gap-1">
                          <Star className="h-3 w-3 fill-slate-900 text-slate-900" /> Featured
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <CardContent className="p-8 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-400 text-xs font-bold">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(art.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {art.readTime || "5 min read"}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {art.title}
                      </h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-3">
                        {art.excerpt}
                      </p>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 shrink-0">
                      <div className="flex items-center gap-3 min-w-0 mr-4">
                        <div className="h-9 w-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-100/30">
                          {(art.author || "A").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{art.author || "Global College Staff"}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Author</p>
                        </div>
                      </div>

                      <Link href={`/resources/${art.slug}`}>
                        <Button className="rounded-xl font-bold text-xs h-10 px-4 flex items-center gap-1 bg-slate-900 hover:bg-primary text-white border-0 group/btn shadow-md shadow-slate-100">
                          Read Article <ArrowUpRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
