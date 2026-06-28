import { MainLayout } from "@/components/MainLayout";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Newspaper, Search, Calendar, User, Clock, 
  ChevronRight, ArrowUpRight, BookOpen, Star,
  TrendingUp, AlertTriangle, Info, Bell
} from "lucide-react";

export default function Resources() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [announcements, setAnnouncements] = useState<any[]>([]);

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

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements/public');
        console.log('Announcements API Response Status:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('Announcements Data Received:', data);
          console.log('Number of announcements:', data.length);
          if (Array.isArray(data)) {
            if (data.length > 0) {
              console.log('First announcement:', data[0]);
            }
            setAnnouncements(data);
          } else {
            console.error('Announcements API response is not an array:', data);
          }
        } else {
          const errorText = await res.text();
          console.error('Failed to fetch announcements:', res.status, res.statusText, errorText);
        }
      } catch (err) {
        console.error("Failed to load announcements - Network error:", err);
      }
    };
    fetchAnnouncements();
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
      <div className="min-h-screen bg-gray-50">
        
        {/* Simple Header */}
        <div className="bg-white border-b-2 border-gray-200">
          <div className="w-full px-4 md:px-10 lg:px-16 max-w-6xl mx-auto py-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
                Updates & Announcements
              </h1>
              <p className="text-gray-600 text-lg">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* All Updates - Simple List */}
        <div className="w-full px-4 md:px-10 lg:px-16 max-w-6xl mx-auto py-12">
          
          {announcements.length > 0 ? (
            <div className="space-y-6">
              {announcements.map((announcement, index) => {
                const date = new Date(announcement.sentAt || announcement.createdAt);
                // Determine target badge
                const targetInfo = announcement.targetType === "STUDENTS" 
                  ? { label: "For Students", color: "bg-emerald-500" }
                  : announcement.targetType === "TEACHERS"
                  ? { label: "For Teachers", color: "bg-purple-500" }
                  : { label: "For Everyone", color: "bg-blue-500" };
                
                return (
                  <div key={announcement.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    
                    {/* Update Header */}
                    <div className={`${targetInfo.color} text-white px-6 py-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center font-black text-lg border-2 border-white/40">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-sm flex items-center gap-2">
                            Update #{index + 1}
                            <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white text-[10px] px-2 py-0.5">
                              {targetInfo.label}
                            </Badge>
                          </p>
                          <p className="text-xs text-white/90">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/80">Posted by</p>
                        <p className="font-bold text-sm">{announcement.sentBy || "Admin"}</p>
                      </div>
                    </div>

                    {/* Update Content */}
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        {announcement.title}
                      </h2>
                      <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                        {announcement.message}
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 p-16 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Updates Yet</h2>
              <p className="text-gray-600">
                There are no announcements at this time. Check back later for updates.
              </p>
            </div>
          )}

        </div>

        {/* Divider */}
        <div className="border-t-2 border-gray-300 my-12" />

        {/* Educational Articles Section */}
        <div className="w-full px-4 md:px-10 lg:px-16 max-w-6xl mx-auto py-12">
          <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">Educational Articles</h2>
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
