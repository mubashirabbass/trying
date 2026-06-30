import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, ArrowLeft, BookOpen, Clock, Calendar, 
  Share2, Heart, Twitter, Linkedin, Facebook, Eye, Newspaper
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  imageUrl?: string;
  isPublished: boolean;
  isFeatured: boolean;
  readTime?: string;
  createdAt: string;
  slug: string;
}

export default function ArticleDetail({ params }: { params: { slug: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [article, setArticle] = useState<Article | null>(null);
  const [moreArticles, setMoreArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple clean clap/share metrics
  const [claps, setClaps] = useState(64);
  const [clapped, setClapped] = useState(false);
  const [views, setViews] = useState(180);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Inject clean Outfit + Lora fonts
    const fontLink = document.createElement("link");
    fontLink.href = "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Outfit:wght@300;400;500;600;700;900&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);

    setViews(Math.floor(Math.random() * 80) + 120);

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      document.head.removeChild(fontLink);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchArticleDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/articles/${params.slug}`);
        if (res.ok) {
          const targetArticle: Article = await res.json();
          setArticle(targetArticle);
          
          const allRes = await fetch(`/api/articles`);
          if (allRes.ok) {
            const allArticles: Article[] = await allRes.json();
            const suggestions = allArticles
              .filter(a => a.id !== targetArticle.id)
              .slice(0, 3);
            setMoreArticles(suggestions);
          }
        } else {
          toast({ title: "Article not found", variant: "destructive" });
          setLocation("/resources");
        }
      } catch (err) {
        console.error("Error fetching article details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticleDetail();
  }, [params.slug]);

  const handleShare = (platform: string) => {
    navigator.clipboard.writeText(window.location.href);
    toast({ 
      title: "Link copied!", 
      description: `Copied to clipboard. Share on ${platform}!`
    });
  };

  const handleClap = () => {
    setClaps(prev => prev + 1);
    setClapped(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-10 w-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 font-medium text-sm">Loading article...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!article) return null;

  // Modern Clean Markdown Parser
  let isFirstParagraph = true;

  const renderBlogContent = (content: string) => {
    if (!content) return null;
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    if (isHtml) {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: content }} 
          className="blog-html-content space-y-6 font-serif text-slate-800 text-base md:text-lg leading-relaxed prose prose-slate max-w-none text-left" 
        />
      );
    }
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-lg md:text-xl font-bold text-slate-900 mt-8 mb-4 text-left font-sans">
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="text-xl md:text-2xl font-bold text-slate-900 mt-10 mb-4 text-left pb-2 border-b border-slate-100 font-sans">
            {trimmed.replace(/^##\s*/, "")}
          </h3>
        );
      }
      if (trimmed.startsWith("#")) {
        return (
          <h2 key={idx} className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-12 mb-6 text-left pb-2 border-b border-slate-150 font-sans tracking-tight">
            {trimmed.replace(/^#\s*/, "")}
          </h2>
        );
      }

      // Bullet Lists
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        return (
          <li key={idx} className="text-slate-700 text-base md:text-lg leading-relaxed text-left ml-6 list-disc mb-2 font-serif pl-1">
            {trimmed.replace(/^[-*]\s*/, "")}
          </li>
        );
      }

      // Blockquotes (WordPress style: simple clean left border, gray background)
      if (trimmed.startsWith(">")) {
        return (
          <blockquote key={idx} className="border-l-4 border-slate-400 bg-slate-50/80 px-6 py-4 my-8 text-slate-700 font-serif italic text-base md:text-lg text-left leading-relaxed">
            "{trimmed.replace(/^>\s*/, "")}"
          </blockquote>
        );
      }

      // Divider
      if (trimmed === "---" || trimmed === "***") {
        return <hr key={idx} className="my-10 border-slate-100" />;
      }

      if (!trimmed) {
        return <div key={idx} className="h-4" />;
      }

      // Drop cap on first paragraph (elegant and classic)
      if (isFirstParagraph) {
        isFirstParagraph = false;
        const firstLetter = trimmed.charAt(0);
        const restOfText = trimmed.slice(1);
        return (
          <p key={idx} className="text-slate-700 font-serif text-base md:text-lg leading-relaxed text-left mb-6">
            <span className="float-left text-5xl font-bold text-slate-900 mr-2 mt-1 leading-none">
              {firstLetter}
            </span>
            {restOfText}
          </p>
        );
      }

      // Standard paragraphs
      return (
        <p key={idx} className="text-slate-700 font-serif text-base md:text-lg leading-relaxed text-left mb-6">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <MainLayout>
      {/* Font styles override for true WordPress-style editorial layout */}
      <style>{`
        .font-serif {
          font-family: 'Lora', Georgia, serif !important;
        }
        .font-sans {
          font-family: 'Outfit', 'Inter', sans-serif !important;
        }
      `}</style>

      <div className="min-h-screen bg-white pb-24 font-serif">
        {/* Dynamic reading scroll progress indicator (simple thin line) */}
        <div 
          className="fixed top-0 left-0 h-1 bg-slate-900 z-50 transition-all duration-100" 
          style={{ width: `${scrollProgress}%` }}
        />

        {/* ── CENTRAL CLEAN SINGLE-COLUMN CONTAINER ──────────────────────────── */}
        <div className="max-w-3xl mx-auto px-6 pt-12 md:pt-16">
          
          {/* Back button link */}
          <div className="text-left mb-8 font-sans">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/resources")}
              className="text-slate-650 hover:text-slate-900 font-bold p-0 flex items-center gap-1.5 hover:bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Articles
            </Button>
          </div>

          {/* Title & Metadata Header Block */}
          <header className="text-left space-y-4 mb-8">
            <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-800 border-none font-bold uppercase tracking-wider text-[10px] px-3.5 py-1 rounded-full font-sans">
              {article.category || "General"}
            </Badge>

            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight font-sans">
              {article.title}
            </h1>

            {/* Clean metadata line */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs md:text-sm text-slate-450 font-sans font-medium border-b border-slate-100 pb-4">
              <span>By <strong className="text-slate-900">{article.author || "Global College Staff"}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(article.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {article.readTime || "5 min read"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {views} views
              </span>
            </div>
          </header>

          {/* Centered widescreen cover image */}
          {article.imageUrl && (
            <div className="w-full overflow-hidden rounded-xl border border-slate-100 mb-10 shadow-sm">
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-auto object-cover max-h-[420px]"
              />
            </div>
          )}

          {/* Pure single-column text article body */}
          <article className="prose prose-slate max-w-none text-left tracking-wide leading-relaxed font-serif text-slate-850 text-base md:text-lg mb-12">
            {renderBlogContent(article.content)}
          </article>

          {/* Simple Clean Clap & Share Box (WordPress style) */}
          <div className="border-t border-b border-slate-100 py-6 my-10 flex flex-col sm:flex-row items-center justify-between gap-6 font-sans">
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleClap}
                variant="outline"
                className={`rounded-full h-11 px-5 font-bold gap-2 transition-all ${clapped ? "bg-rose-50/50 text-rose-600 border-rose-100" : "bg-white text-slate-800"}`}
              >
                <Heart className={`h-4.5 w-4.5 ${clapped ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
                Clap
              </Button>
              <span className="text-sm font-semibold text-slate-500">{claps} appreciations</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">Share:</span>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-50" onClick={() => handleShare("Twitter")}>
                <Twitter className="h-4 w-4 text-slate-650" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-50" onClick={() => handleShare("LinkedIn")}>
                <Linkedin className="h-4 w-4 text-slate-650" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-50" onClick={() => handleShare("Facebook")}>
                <Facebook className="h-4 w-4 text-slate-650" />
              </Button>
            </div>
          </div>

          {/* ── RELATED POSTS GRID AT THE VERY BOTTOM (WordPress style) ──────── */}
          {moreArticles.length > 0 && (
            <div className="pt-10 border-t border-slate-100 font-sans text-left mt-12">
              <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-wider text-xs">
                You May Also Read
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {moreArticles.map((item) => (
                  <Card 
                    key={item.id}
                    onClick={() => setLocation(`/resources/${item.slug}`)}
                    className="overflow-hidden border border-slate-100 bg-white shadow-none hover:shadow-md transition-all rounded-2xl cursor-pointer flex flex-col group"
                  >
                    <div className="h-32 bg-slate-50 relative overflow-hidden flex items-center justify-center shrink-0">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                        />
                      ) : (
                        <Newspaper className="h-8 w-8 text-slate-300" />
                      )}
                    </div>
                    
                    <CardContent className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <Badge className="bg-slate-50 text-slate-700 border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-md mb-2">
                          {item.category || "General"}
                        </Badge>
                        <h4 className="font-extrabold text-sm text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-3">by {item.author}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
}
