import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, Star, DollarSign, TrendingUp, Award, ArrowLeft, 
  BookOpen, Clock, Calendar, Share2, Bookmark, CheckCircle,
  ThumbsUp, MessageSquare, ChevronRight, PlayCircle, Heart,
  Twitter, Linkedin, Facebook, Copy, ShieldAlert, Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SuccessStory {
  id: number;
  studentName: string;
  title: string;
  description: string;
  image?: string;
  course?: string;
  achievement?: string;
  rating?: string;
  category?: string;
  categoryId?: number;
  metric1Value?: string;
  metric1Label?: string;
  metric2Value?: string;
  metric2Label?: string;
  metric3Value?: string;
  metric3Label?: string;
  storyContent?: string;
  storyType?: string;
  createdAt: string;
}

export default function SuccessStoryDetail({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [story, setStory] = useState<SuccessStory | null>(null);
  const [moreStories, setMoreStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);

  // Advanced Blog Page Interactions React State
  const [likes, setLikes] = useState(142);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Tracks reading progress for publication aesthetics
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchStoryDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/success-stories`);
        if (res.ok) {
          const allStories: SuccessStory[] = await res.json();
          const targetStory = allStories.find(s => s.id === parseInt(params.id));
          if (targetStory) {
            setStory(targetStory);
            // Get 3 random or related stories for the sidebar
            const otherStories = allStories
              .filter(s => s.id !== targetStory.id)
              .slice(0, 3);
            setMoreStories(otherStories);
          } else {
            toast({ title: "Success story not found", variant: "destructive" });
            setLocation("/success-stories");
          }
        }
      } catch (err) {
        console.error("Error fetching success story:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryDetail();
  }, [params.id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied to clipboard!", description: "Share it with your friends!" });
  };

  const handleLike = () => {
    if (liked) {
      setLikes(prev => prev - 1);
      setLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setLiked(true);
      toast({ title: "Narrative Liked!", description: "Thanks for celebrating this achievement!" });
    }
  };

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
    toast({ 
      title: bookmarked ? "Bookmark removed" : "Added to bookmarks", 
      description: bookmarked ? "Removed from reading list." : "Story added to your personal reading list!"
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-[#0b965c] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 font-medium">Loading success narrative...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!story) return null;

  // Immersive Blogger Renderer supporting styled Drop Caps, verified Blockquotes & section dividers
  let isFirstParagraph = true;

  const renderBlogContent = (content: string) => {
    if (!content) return null;
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-xl md:text-2xl font-black text-slate-800 mt-8 mb-4 text-left">
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-10 mb-4 text-left border-b pb-2 border-slate-100">
            {trimmed.replace(/^##\s*/, "")}
          </h3>
        );
      }
      if (trimmed.startsWith("#")) {
        return (
          <h2 key={idx} className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-12 mb-6 text-left border-b pb-3 border-slate-100">
            {trimmed.replace(/^#\s*/, "")}
          </h2>
        );
      }

      // Bullet Lists
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        return (
          <li key={idx} className="text-slate-700 text-lg leading-relaxed text-left ml-6 list-disc mb-2 font-serif">
            {trimmed.replace(/^[-*]\s*/, "")}
          </li>
        );
      }

      // Blockquotes with gorgeous publication styling
      if (trimmed.startsWith(">")) {
        return (
          <blockquote key={idx} className="border-l-4 border-[#0b965c] bg-[#0b965c]/5 px-6 py-5 rounded-r-3xl my-8 text-slate-800 font-serif italic text-lg md:text-xl text-left leading-relaxed shadow-sm">
            "{trimmed.replace(/^>\s*/, "")}"
          </blockquote>
        );
      }

      // Elegant divider dot marks
      if (trimmed === "---" || trimmed === "***") {
        return (
          <div key={idx} className="flex items-center justify-center gap-2 my-10 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0b965c]/40" />
            <span className="h-2 w-2 rounded-full bg-[#0b965c]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#0b965c]/40" />
          </div>
        );
      }

      if (!trimmed) {
        return <div key={idx} className="h-4" />;
      }

      // First Paragraph gets the majestic drop cap element
      if (isFirstParagraph) {
        isFirstParagraph = false;
        const firstLetter = trimmed.charAt(0);
        const restOfText = trimmed.slice(1);
        return (
          <p key={idx} className="text-slate-700 font-serif text-lg md:text-xl leading-relaxed text-left mb-6">
            <span className="float-left text-5xl md:text-6xl font-black text-[#0b965c] mr-3 mt-1.5 font-sans leading-none">
              {firstLetter}
            </span>
            {restOfText}
          </p>
        );
      }

      // Standard paragraphs
      return (
        <p key={idx} className="text-slate-700 font-serif text-lg md:text-xl leading-relaxed text-left mb-6">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50/50 pb-20 relative">
        {/* Dynamic reading scroll progress indicator */}
        <div 
          className="fixed top-0 left-0 h-1 bg-[#0b965c] z-50 transition-all duration-100 shadow-[0_1px_10px_rgba(11,150,92,0.5)]" 
          style={{ width: `${scrollProgress}%` }}
        />

        {/* Floating Back Navigation Bar */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-slate-100 py-4 px-4 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/success-stories")}
              className="text-[#0b965c] hover:bg-[#0b965c]/5 font-bold rounded-full group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Stories
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className={`rounded-full h-9 w-9 border-slate-200 transition-colors ${bookmarked ? "bg-emerald-50 border-emerald-100" : ""}`}
                onClick={toggleBookmark}
              >
                <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-emerald-600 text-emerald-600" : "text-slate-600"}`} />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border-slate-200" onClick={handleShare}>
                <Share2 className="h-4 w-4 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>

        {story.storyType === "blog" ? (
          /* ── DUAL NATURE 1: PREMIUM INTERACTIVE PUBLICATION-GRADE BLOG PAGE ── */
          <div className="max-w-6xl mx-auto px-4 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8 bg-white border border-slate-100 rounded-3xl p-6 md:p-12 shadow-sm relative">
              
              {/* Publication Category Header */}
              <div className="text-left space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-[#0b965c] text-white hover:bg-[#0b965c] border-none font-black text-xs px-3.5 py-1.5 rounded-full shadow-sm">
                    {story.category || "SUCCESS CASE STUDY"}
                  </Badge>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                    <Clock className="h-3.5 w-3.5" /> 4 min read
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                    <Calendar className="h-3.5 w-3.5" /> Published recently
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight font-sans">
                  {story.title}
                </h1>
                
                <p className="text-slate-500 font-medium text-lg md:text-xl leading-relaxed italic border-l-2 border-emerald-500 pl-4 py-1">
                  "{story.description}"
                </p>
              </div>

              {/* Author Info Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 border-y border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full border-2 border-[#0b965c]/25 overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center shadow-sm">
                    {story.image ? (
                      <img src={story.image} alt={story.studentName} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-slate-900 text-base">{story.studentName}</h4>
                      <Badge className="bg-emerald-50 text-[#0b965c] hover:bg-emerald-50 border-none text-[9px] font-black py-0.5 px-2 rounded-md">
                        Verified Scholar
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-400 text-xs font-bold mt-0.5">
                      <span>{story.achievement || "eBay Graduate"}</span>
                      <span className="text-[#0b965c]">•</span>
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Star className="h-3 w-3 fill-amber-500" /> {story.rating || "5"}.0 Rating
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Social Icons */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLike}
                    className={`rounded-full px-4 h-9 font-bold transition-all ${liked ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-50" : "hover:bg-slate-50"}`}
                  >
                    <Heart className={`h-4 w-4 mr-1.5 ${liked ? "fill-red-500 text-red-500 animate-ping-once" : "text-slate-600"}`} />
                    {likes} Claps
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border-slate-200 hover:bg-[#1da1f2]/5 group">
                    <Twitter className="h-4 w-4 text-slate-500 group-hover:text-[#1da1f2]" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border-slate-200 hover:bg-[#0a66c2]/5 group">
                    <Linkedin className="h-4 w-4 text-slate-500 group-hover:text-[#0a66c2]" />
                  </Button>
                </div>
              </div>

              {/* Cover Banner with elegant rounded bounds */}
              <div className="aspect-[21/9] md:aspect-[16/7] w-full relative bg-slate-100 overflow-hidden rounded-2xl shadow-md border border-slate-100 group">
                {story.image ? (
                  <img 
                    src={story.image} 
                    alt={story.studentName} 
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-[#0b965c]/10 flex items-center justify-center">
                    <BookOpen className="h-20 w-20 text-[#0b965c]/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>

              {/* Main Article Content */}
              <div className="prose prose-slate max-w-none text-left">
                {story.storyContent ? (
                  renderBlogContent(story.storyContent)
                ) : (
                  <p className="text-slate-700 font-serif text-lg md:text-xl leading-relaxed whitespace-pre-line">
                    {story.description}
                  </p>
                )}
              </div>

              {/* Interactive Share Box at the bottom */}
              <div className="pt-8 border-t border-slate-100 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleLike}
                      className={`rounded-full h-11 px-5 border-slate-200 transition-all font-bold ${liked ? "bg-red-50 text-red-600 border-red-100" : ""}`}
                    >
                      <Heart className={`h-5 w-5 mr-2 ${liked ? "fill-red-500 text-red-500" : "text-slate-500"}`} />
                      Support Graduate Narrative
                    </Button>
                    <div className="text-xs text-slate-400 font-black uppercase tracking-widest">{likes} total applauds</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-[#1da1f2]/10 group transition-all" onClick={handleShare}>
                      <Twitter className="h-4 w-4 text-slate-500 group-hover:text-[#1da1f2]" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-[#0a66c2]/10 group transition-all" onClick={handleShare}>
                      <Linkedin className="h-4 w-4 text-slate-500 group-hover:text-[#0a66c2]" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-[#1877f2]/10 group transition-all" onClick={handleShare}>
                      <Facebook className="h-4 w-4 text-slate-500 group-hover:text-[#1877f2]" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-8">
              
              {/* About the Author card */}
              <Card className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden text-left hover:border-emerald-100 transition-all">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#0b965c] border-b pb-3">About the Student</h3>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0 flex items-center justify-center">
                      {story.image ? (
                        <img src={story.image} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-lg leading-tight">{story.studentName}</h4>
                      <p className="text-slate-400 text-xs font-bold leading-none mt-1">{story.achievement || "eBay Scholar"}</p>
                    </div>
                  </div>
                  
                  <p className="text-slate-500 text-sm leading-relaxed font-serif">
                    Certified Scholar at Global College. Completed mastery trainings and set up automated multi-channel sourcing structures resulting in elite targets.
                  </p>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 leading-tight">Elite Student Honor Award Recipient</span>
                  </div>
                </CardContent>
              </Card>

              {/* Key Audited highlights statistics */}
              <Card className="bg-gradient-to-br from-[#0b965c] to-emerald-900 text-white border-none shadow-xl rounded-3xl overflow-hidden relative text-left">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <CardContent className="p-6 md:p-8 space-y-6 relative z-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-100/80 border-b border-white/10 pb-3">Audited Success Metrics</h3>
                  
                  <div className="space-y-6">
                    {/* Metric 1 */}
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center shadow-inner">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-black">{story.metric1Value || "$240k"}</p>
                        <p className="text-xs text-emerald-100/70 font-bold mt-0.5">{story.metric1Label || "Revenue Earned"}</p>
                      </div>
                    </div>
                    {/* Metric 2 */}
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center shadow-inner">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-black">{story.metric2Value || "45 Days"}</p>
                        <p className="text-xs text-emerald-100/70 font-bold mt-0.5">{story.metric2Label || "Timeline accomplished"}</p>
                      </div>
                    </div>
                    {/* Metric 3 */}
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center shadow-inner">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-black">{story.metric3Value || "Elite"}</p>
                        <p className="text-xs text-emerald-100/70 font-bold mt-0.5">{story.metric3Label || "Systems Implemented"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related/More Success Stories Block with Hover Glow Effect */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-left">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-3">More Success Narratives</h3>
                
                <div className="space-y-6">
                  {moreStories.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setLocation(`/success-stories/${item.id}`)}
                      className="flex items-center gap-4 group cursor-pointer border-b border-slate-50 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm relative">
                        {item.image ? (
                          <img src={item.image} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-slate-50">
                            <User className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-md mb-1">
                          {item.course || "LMS Graduate"}
                        </Badge>
                        <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-[#0b965c] transition-colors leading-snug truncate">
                          {item.title}
                        </h4>
                        <p className="text-slate-400 text-[10px] font-bold mt-0.5">by {item.studentName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Newsletter CTA Block */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 text-left shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <h3 className="text-xl font-black leading-tight">Join Our Success Network</h3>
                <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                  Subscribe to receive real case studies, blueprint systems, and student success highlights directly in your inbox.
                </p>
                <div className="mt-6 space-y-3">
                  <input 
                    type="email" 
                    placeholder="Enter email address" 
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b965c]/50"
                  />
                  <Button className="w-full bg-[#0b965c] hover:bg-[#097b4b] text-white font-bold py-3.5 rounded-xl shadow-md transition-all">
                    Subscribe Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── DUAL NATURE 2: HIGH-FIDELITY STUDENT ACHIEVER PROFILE PAGE ── */
          <div className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
            {/* Achiever Header Panel */}
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#0b965c]/10 rounded-full -mr-40 -mt-40 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-900/10 rounded-full -ml-40 -mb-40 blur-3xl" />
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10 text-center md:text-left">
                {/* Large Profile Image */}
                <div className="h-28 w-28 md:h-36 md:w-36 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl bg-white/5 flex-shrink-0 flex items-center justify-center">
                  {story.image ? (
                    <img src={story.image} alt={story.studentName} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-16 w-16 text-white/50" />
                  )}
                </div>
                
                {/* Text Metadata */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <Badge className="bg-[#0b965c] text-white border-none font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg">
                      🎓 CERTIFIED GRADUATE
                    </Badge>
                    {story.course && (
                      <Badge className="bg-white/10 text-emerald-300 border-none font-bold text-xs px-3.5 py-1.5 rounded-full">
                        {story.course}
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
                    {story.studentName}
                  </h1>
                  
                  <p className="text-emerald-100 text-lg md:text-xl font-bold tracking-wide leading-relaxed">
                    {story.title}
                  </p>

                  <div className="flex justify-center md:justify-start items-center gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-slate-300 text-sm font-semibold ml-2">(Verified Student Achievement)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement Highlight Quote */}
            {story.achievement && (
              <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-4 left-6 text-emerald-100 text-7xl font-serif leading-none pointer-events-none">“</div>
                <p className="text-slate-800 font-extrabold text-xl md:text-2xl leading-relaxed italic text-center relative z-10">
                  "{story.achievement}"
                </p>
                <div className="absolute bottom-4 right-6 text-emerald-100 text-7xl font-serif leading-none pointer-events-none">”</div>
              </div>
            )}

            {/* Metrics Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Metric Card 1 */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center shadow-sm flex flex-col justify-between items-center min-h-[140px] hover:border-emerald-100 hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-3 shadow-sm">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-800">{story.metric1Value || "100%"}</p>
                  <p className="text-xs text-slate-400 font-black uppercase mt-1.5 tracking-wider">{story.metric1Label || "Earned"}</p>
                </div>
              </div>

              {/* Metric Card 2 */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center shadow-sm flex flex-col justify-between items-center min-h-[140px] hover:border-emerald-100 hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-3 shadow-sm">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-800">{story.metric2Value || "Active"}</p>
                  <p className="text-xs text-slate-400 font-black uppercase mt-1.5 tracking-wider">{story.metric2Label || "Timeline"}</p>
                </div>
              </div>

              {/* Metric Card 3 */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center shadow-sm flex flex-col justify-between items-center min-h-[140px] hover:border-emerald-100 hover:shadow-md transition-all">
                <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-3 shadow-sm">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-800">{story.metric3Value || "Elite"}</p>
                  <p className="text-xs text-slate-400 font-black uppercase mt-1.5 tracking-wider">{story.metric3Label || "Results"}</p>
                </div>
              </div>
            </div>

            {/* Narrative & Detailed Journey */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-8 md:p-10 shadow-sm text-left space-y-6">
                <h3 className="text-2xl font-black text-slate-900 border-b pb-3 flex items-center gap-2 font-sans">
                  <CheckCircle className="h-6 w-6 text-[#0b965c]" /> The Detailed Student Journey
                </h3>
                
                <div className="prose prose-slate max-w-none text-left">
                  {story.storyContent ? (
                    renderBlogContent(story.storyContent)
                  ) : (
                    <p className="text-slate-600 text-base md:text-lg leading-relaxed whitespace-pre-line font-serif">
                      {story.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Sidebar */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 text-left shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500 fill-amber-500" /> Verification Status
                  </h3>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-black text-slate-700">Identity Confirmed</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-black text-slate-700">Course Completion Verified</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-black text-slate-700">Earnings & Metrics Audited</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                    This success story has been certified by the Global College Registrar team to ensure accuracy.
                  </p>
                </div>

                {/* More successes */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-left">
                  <h3 className="text-lg font-black text-slate-900 border-b pb-3">More Graduate Successes</h3>
                  
                  <div className="space-y-6">
                    {moreStories.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => setLocation(`/success-stories/${item.id}`)}
                        className="flex items-center gap-4 group cursor-pointer border-b border-slate-50 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="h-14 w-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm relative">
                          {item.image ? (
                            <img src={item.image} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-slate-50">
                              <User className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-[#0b965c] transition-colors leading-snug truncate">
                            {item.studentName}
                          </h4>
                          <p className="text-slate-400 text-[10px] font-bold leading-none mt-1 truncate">
                            {item.achievement || "eBay Graduate"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Course Promo */}
                <div className="bg-gradient-to-br from-[#0b965c] to-emerald-900 text-white rounded-3xl p-6 md:p-8 text-left shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl" />
                  <h3 className="text-xl font-black leading-tight">Inspired by {story.studentName}?</h3>
                  <p className="text-emerald-100 text-sm mt-3 leading-relaxed">
                    Start learning Shopify Mastery today and acquire the exact skills, automated sourcing blueprints, and targeting frameworks to achieve multi-six figure results!
                  </p>
                  <Button 
                    onClick={() => setLocation("/courses")}
                    className="w-full bg-white hover:bg-slate-100 text-[#0b965c] font-black py-3 rounded-xl shadow-md mt-6 flex items-center justify-center gap-2 group"
                  >
                    <PlayCircle className="h-5 w-5" /> Start Sourcing Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
