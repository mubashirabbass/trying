/**
 * Edu-Sphere: Premium Service & LMS Platform
 * 
 * Goals:
 * - High-fidelity, enterprise-grade service website.
 * - Full mobile responsiveness for all sections.
 * - Step-by-step modular development (Home Page Complete).
 * - Optimized for future production deployment.
 * 
 * Layout Standard: w-full px-4 md:px-10 lg:px-16
 * Theme: Clean White / Professional Blue / Emerald Highlights
 */
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  useListCourses,
  useListTestimonials,
  useListSuccessStories,
  useListBranches,
  useListSuccessStoryCategories,
} from "@workspace/api-client-react";
import {
  getListCoursesQueryKey,
  getListTestimonialsQueryKey,
  getListSuccessStoriesQueryKey,
  getListSuccessStoryCategoriesQueryKey,
  getListBranchesQueryKey,
} from "@workspace/api-client-react";
import {
  Clock,
  Star,
  MapPin,
  Phone,
  Award,
  TrendingUp,
  Users,
  BookOpen,
  ShieldCheck,
  Laptop,
  Wifi,
  Trophy,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Mail,
  Play,
  Globe,
  User2,
  BarChart3,
  Quote,
  MessageCircle,
  MessageSquare,
  Building2,
  ExternalLink,
  DollarSign,
  Handshake,
  Briefcase,
  CheckCircle2,
  Loader2,
  X,
  Megaphone,
  Bell,
  Calendar,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CriticalAnnouncementPopup } from "@/components/CriticalAnnouncementPopup";
import { useSettings } from "@/lib/SettingsContext";

const CATEGORY_COLORS: Record<string, string> = {
  IT: "from-blue-600 to-blue-400",
  Graphics: "from-purple-600 to-pink-400",
  Freelancing: "from-emerald-600 to-teal-400",
  AI: "from-orange-500 to-amber-400",
  "MS Office": "from-cyan-600 to-sky-400",
  Web: "from-indigo-600 to-violet-400",
  Default: "from-primary to-blue-400",
};

const STATS = [
  { value: "2,500+", label: "Students Enrolled", icon: Users },
  { value: "50+", label: "Expert Courses", icon: BookOpen },
  { value: "20+", label: "Certified Teachers", icon: GraduationCap },
  { value: "95%", label: "Success Rate", icon: Trophy },
];

const FEATURES = [
  {
    icon: Laptop,
    title: "Portfolio-First Training",
    desc: "We don't just teach theory. You'll build real projects that serve as your professional portfolio for clients.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Users,
    title: "1-on-1 Mentorship",
    desc: "Get personalized guidance from experts who have already scaled 7-figure digital businesses.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: ShieldCheck,
    title: "ISO Certified Diplomas",
    desc: "Earn government-recognized certifications that add massive value to your CV across Pakistan.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: TrendingUp,
    title: "Freelance Launchpad",
    desc: "Our specialized team helps you land your first Upwork/Fiverr order or high-paying local job.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: Globe,
    title: "Global Seller Network",
    desc: "Join an elite community of eBay and Etsy sellers already earning $5,000+ monthly.",
    color: "bg-pink-50 text-pink-600",
  },
  {
    icon: Award,
    title: "Lifetime Support",
    desc: "Graduation isn't the end. You get lifetime access to our community and instructor support.",
    color: "bg-teal-50 text-teal-600",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

// Fetch helper for public API
const fetchPublic = async (path: string) => {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
  const r = await fetch(`${base}${path}`);
  return r.ok ? await r.json() : [];
};

export default function Home() {
  console.log("Home component rendering");
  const { get, loading: isSettingsLoading } = useSettings();

  const siteName          = get("site_name",            "Global College");
  const heroTitle         = get("hero_title",           "Learn from the Best Industry Experts");
  const heroSubtitle      = get("hero_subtitle",        "Start your journey today with our world-class courses designed to help you excel in the digital age.");
  const heroCTAText       = get("hero_cta_text",        "Browse Courses");
  const aboutTitle        = get("about_section_title",  "Empowering Next Generation of Professionals");
  const aboutContent      = get("about_section_content", "Global College is dedicated to providing high-quality technical and professional education to students across Pakistan.");

  const { data: courses, isLoading: isCoursesLoading } = useListCourses(
    { featured: true },
    { query: { queryKey: getListCoursesQueryKey({ featured: true }) } }
  );

  const { data: testimonials, isLoading: isTestimonialsLoading } = useListTestimonials({
    query: { queryKey: getListTestimonialsQueryKey() },
  });

  const { data: successStories, isLoading: isStoriesLoading } = useListSuccessStories({
    query: { queryKey: getListSuccessStoriesQueryKey() },
  });

  const { data: branches, isLoading: isBranchesLoading } = useListBranches({
    query: { queryKey: getListBranchesQueryKey() },
  });

  const { data: categories } = useListSuccessStoryCategories({
    query: { queryKey: getListSuccessStoryCategoriesQueryKey() },
  });

  const [articles, setArticles] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);

  // Franchise form state
  const [franchiseOpen, setFranchiseOpen] = useState(false);
  const [franchiseForm, setFranchiseForm] = useState({ name: "", email: "", phone: "", address: "", city: "", description: "" });
  const [franchiseSubmitting, setFranchiseSubmitting] = useState(false);
  const [franchiseSuccess, setFranchiseSuccess] = useState(false);
  const [franchiseError, setFranchiseError] = useState("");

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");

  const [activeAchiever, setActiveAchiever] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const branchScrollRef = useRef<HTMLDivElement>(null);
  const coursesScrollRef = useRef<HTMLDivElement>(null);

  // Success story calculations
  const rawSuccessStories = (successStories && successStories.filter((s: any) => !s.isHidden).length > 0)
    ? successStories.filter((story: any) => !story.isHidden)
    : [
        {
          id: 1,
          name: "M. Samam Amir",
          studentName: "M. Samam Amir",
          role: "eBay Store Owner",
          title: "eBay Store Owner",
          income: "$5,000+",
          metric1Value: "$5,000+",
          story: "I made my first $1,000 in just 6 weeks after completing the EBC program. The support and training quality is unmatched.",
          description: "I made my first $1,000 in just 6 weeks after completing the EBC program. The support and training quality is unmatched.",
          rating: 5,
          isHidden: false,
          categoryId: 1
        },
        {
          id: 2,
          name: "Ayesha Waseem",
          studentName: "Ayesha Waseem",
          role: "eBay Consultant",
          title: "eBay Consultant",
          income: "$500",
          metric1Value: "$500",
          story: "The practical training here is what made the difference. I now manage multiple international client stores with confidence.",
          description: "The practical training here is what made the difference. I now manage multiple international client stores with confidence.",
          rating: 5,
          isHidden: false,
          categoryId: 1
        },
        {
          id: 3,
          name: "Madiha Sadaf",
          studentName: "Madiha Sadaf",
          role: "eBay Consultant",
          title: "eBay Consultant",
          income: "200,000+ PKR",
          metric1Value: "200,000+ PKR",
          story: "Global College gave me the roadmap to financial independence through freelancing. I started with zero and now I'm here.",
          description: "Global College gave me the roadmap to financial independence through freelancing. I started with zero and now I'm here.",
          rating: 5,
          isHidden: false,
          categoryId: 2
        },
        {
          id: 4,
          name: "Mubashara Liaqat",
          studentName: "Mubashara Liaqat",
          role: "eBay Consultant",
          title: "eBay Consultant",
          income: "First 6-Figure",
          metric1Value: "First 6-Figure",
          story: "The ecosystem here is incredible. You don't just learn; you grow with a community of like-minded entrepreneurs.",
          description: "The ecosystem here is incredible. You don't just learn; you grow with a community of like-minded entrepreneurs.",
          rating: 5,
          isHidden: false,
          categoryId: 2
        },
        {
          id: 5,
          name: "Muhammad Tayyab",
          studentName: "Muhammad Tayyab",
          role: "eBay Store Owner",
          title: "eBay Store Owner",
          income: "Multi-Currency Earner",
          metric1Value: "Multi-Currency Earner",
          story: "Mastering international markets was my goal. Global College made it a reality. I'm now earning in multiple currencies.",
          description: "Mastering international markets was my goal. Global College made it a reality. I'm now earning in multiple currencies.",
          rating: 5,
          isHidden: false,
          categoryId: 3
        }
      ];

  const displaySuccessStories = rawSuccessStories.filter((story: any) => {
    if (selectedCategoryId === "all") return true;
    return Number(story.categoryId) === Number(selectedCategoryId);
  });

  const displayBranches = (branches || []).filter((branch: any) => branch.isActive !== false && !branch.isMain);
  const mainCampus = branches?.find((b: any) => b.isMain);

  // Franchise Form Submit Handler
  const handleFranchiseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!franchiseForm.name || !franchiseForm.email || !franchiseForm.phone || !franchiseForm.address || !franchiseForm.description) {
      setFranchiseError("Please fill in all required fields.");
      return;
    }
    setFranchiseSuccess(true);
    const payload = { ...franchiseForm };
    setFranchiseForm({ name: "", email: "", phone: "", address: "", city: "", description: "" });
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      await fetch(`${base}/api/franchise-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Silent
    }
  };

  // Effects
  useEffect(() => {
    fetchPublic("/api/articles").then(setArticles);
    fetchPublic("/api/faqs").then(setFaqs);
    fetchPublic("/api/announcements/public").then((data) => {
      if (Array.isArray(data)) {
        setAnnouncements(data);
      }
    });
  }, []);

  // Auto-scroll logic for Achievers
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAchiever((prev) => (prev + 1) % displaySuccessStories.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(interval);
  }, [displaySuccessStories.length]);

  // Ensure activeAchiever is always in bounds when data changes
  useEffect(() => {
    if (activeAchiever >= displaySuccessStories.length) {
      setActiveAchiever(0);
    }
  }, [displaySuccessStories.length, activeAchiever]);

  // Force play hero video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().then(() => setVideoLoaded(true)).catch((error) => {
        console.log("Autoplay was prevented:", error);
      });
    }
  }, []);

  // Scroll helpers
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth 
        : scrollLeft + clientWidth;
      
      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth"
      });
      
      // Check again after animation
      setTimeout(checkScroll, 500);
    }
  };

  const scrollBranches = (direction: "left" | "right") => {
    if (branchScrollRef.current) {
      const { scrollLeft, clientWidth } = branchScrollRef.current;
      const scrollAmount = clientWidth > 600 ? 400 : 300;
      const scrollTo = direction === "left" 
        ? scrollLeft - scrollAmount 
        : scrollLeft + scrollAmount;
      
      branchScrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth"
      });
    }
  };

  const scrollCourses = (direction: "left" | "right") => {
    if (coursesScrollRef.current) {
      const { scrollLeft, clientWidth } = coursesScrollRef.current;
      const scrollAmount = clientWidth > 600 ? 400 : 300;
      const scrollTo = direction === "left" 
        ? scrollLeft - scrollAmount 
        : scrollLeft + scrollAmount;
      
      coursesScrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth"
      });
    }
  };

  // Loading check (placed after all hooks)
  const isPageLoading = isSettingsLoading || isCoursesLoading || isStoriesLoading || isTestimonialsLoading || isBranchesLoading;


  const displayCourses = (courses && courses.length > 0) ? courses : [
    {
      id: 1,
      title: "MS Office Complete Course",
      category: "MS Office",
      duration: "3 Months",
      isFree: false,
      fee: 5000,
      isFeatured: true,
      description: "Master Word, Excel, PowerPoint and more with hands-on projects.",
    },
    {
      id: 2,
      title: "Graphic Design with Canva & Photoshop",
      category: "Graphics",
      duration: "4 Months",
      isFree: false,
      fee: 8000,
      isFeatured: true,
      description: "Design logos, posters, and social media content professionally.",
    },
    {
      id: 3,
      title: "Freelancing Mastery",
      category: "Freelancing",
      duration: "2 Months",
      isFree: false,
      fee: 6000,
      isFeatured: false,
      description: "Start earning on Upwork, Fiverr, and Freelancer from day one.",
    },
    {
      id: 4,
      title: "Web Development with React",
      category: "Web",
      duration: "6 Months",
      isFree: false,
      fee: 15000,
      isFeatured: true,
      description: "Build modern web applications using the most popular framework.",
    },
  ];
  const displayTestimonials = testimonials?.slice(0, 3) ?? [];

  return (
    <MainLayout>
      {/* ── Critical Announcement Popup (admin-controlled) ────────────── */}
      <CriticalAnnouncementPopup />

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
        <section className="relative min-h-[90vh] flex items-end justify-center overflow-hidden bg-slate-950 pb-8 md:pb-12">
          {/* High-quality poster fallback displayed immediately, fades out when video plays */}
          <div 
            className={`absolute inset-0 bg-cover bg-center z-0 transition-opacity duration-1000 ${
              videoLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            style={{ backgroundImage: 'url("/assets/images/hero-video-poster.png")' }}
          />

          {/* Video Background */}
          <video 
            ref={videoRef}
            autoPlay 
            loop 
            muted 
            playsInline
            preload="auto"
            onPlaying={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover z-0 scale-125 transition-opacity duration-1000 ${
              videoLoaded ? "opacity-100" : "opacity-0"
            }`}
          >
            <source src="/assets/videos/eBay-Course-Etsy-Training-Pakistan.mp4" type="video/mp4" />
          </video>
        
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-black/60 z-10" />
        
        {/* Content Container */}
        <div className="relative z-20 w-full px-4 md:px-10 lg:px-16 text-center text-white">
          <div className="mb-8">
            <span className="bg-[#e6fcf5] text-[#0ca678] border border-[#b2f2bb] rounded-md px-6 py-2.5 text-sm md:text-base font-bold shadow-lg uppercase tracking-wider">
              {siteName} — Redefining Digital Excellence in Pakistan
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-12 drop-shadow-2xl">
            {heroTitle.includes("Digital") || heroTitle.includes("Next") ? (
              <>{heroTitle.split(/(?=Digital|Next)/)[0]}<span className="text-[#ffec99]">{heroTitle.split(/(?=Digital|Next)/)[1] ?? ""}</span></>
            ) : (
              heroTitle
            )}
          </h1>
          
          <p className="text-slate-200 text-lg md:text-xl max-w-3xl mx-auto mb-12 font-medium leading-relaxed drop-shadow-md">
            {heroSubtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/courses">
              <Button className="bg-[#20c997] hover:bg-[#12b886] text-white font-bold text-lg px-10 h-16 rounded-xl shadow-xl transition-all hover:scale-105 flex items-center gap-2 border-0">
                {heroCTAText} <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/success-stories">
              <Button variant="outline" className="border-2 border-white/40 bg-white/10 backdrop-blur-md text-white font-bold text-lg px-10 h-16 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2">
                <div className="h-7 w-7 rounded-full border-2 border-white flex items-center justify-center">
                  <Play className="h-3 w-3 fill-white ml-0.5" />
                </div>
                View Success Stories
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator - Now relative to the entire section */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-30">
          <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <ChevronRight className="h-6 w-6 text-white rotate-90" />
          </div>
        </div>
      </section>

      {/* ── Announcement Bar ──────────────────────────────────────────────── */}
      <div className="bg-[#0f2c6f] text-white text-sm py-3 overflow-hidden border-y border-white/10">
        <div className="flex whitespace-nowrap animate-marquee gap-16 px-4">
          {[
            "🎉 New Batch Starting May 2025 — Register Now!",
            "📚 Free Demo Classes Available",
            "🏆 100+ Students Placed in Top Companies",
            "💰 Easy Installment Plans Available",
            "📞 Call Us: +92 300 1234567",
          ].concat([
            "🎉 New Batch Starting May 2025 — Register Now!",
            "📚 Free Demo Classes Available",
            "🏆 100+ Students Placed in Top Companies",
          ]).map((text, i) => (
            <span key={i}>{text}</span>
          ))}
        </div>
      </div>

      {/* ── Statistics Section (Clean White Style) ───────────────────────── */}
      <section className="pt-4 pb-8 bg-slate-50 relative overflow-hidden">
        <div className="w-full px-4 md:px-10 lg:px-16 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">
              Trusted by Thousands Worldwide
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Global College is building Pakistan's largest ecosystem for 
              international eCommerce success and digital entrepreneurship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                value: "4500+", 
                label: "Students Trained", 
                icon: Users, 
                color: "text-emerald-600", 
                bg: "bg-emerald-50",
                border: "border-emerald-100"
              },
              { 
                value: "4+", 
                label: "Fulfillment Centers", 
                icon: Globe, 
                color: "text-blue-600", 
                bg: "bg-blue-50",
                border: "border-blue-100"
              },
              { 
                value: "800+", 
                label: "Community Meetups", 
                icon: Trophy, 
                color: "text-purple-600", 
                bg: "bg-purple-50",
                border: "border-purple-100"
              },
              { 
                value: "200+", 
                label: "Consultation Clients", 
                icon: TrendingUp, 
                color: "text-rose-600", 
                bg: "bg-rose-50",
                border: "border-rose-100"
              },
            ].map((stat, i) => (
              <div 
                key={i}
                className="group p-8 rounded-3xl border border-white bg-white shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 flex flex-col items-center text-center"
              >
                <div className={`h-16 w-16 rounded-2xl ${stat.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <h3 className={`text-4xl font-black ${stat.color} mb-2 tracking-tight`}>
                  {stat.value}
                </h3>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Courses ───────────────────────────────────────────────── */}
      <section className="pt-10 pb-12 bg-gray-50 relative overflow-hidden">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">
              Explore Our Top Courses
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Professional training programs designed by industry experts to help you master high-income digital skills and launch your career globally.
            </p>
          </div>

          <div className="relative group/courses max-w-7xl mx-auto">
            {/* Scroll Buttons - Always Visible */}
            <div className="absolute top-1/2 left-2 -translate-y-1/2 z-20">
              <Button
                onClick={() => scrollCourses("left")}
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full bg-white shadow-2xl border-gray-100 text-gray-400 hover:bg-primary hover:text-white transition-all active:scale-95 flex items-center justify-center border border-gray-200"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            </div>

            <div className="absolute top-1/2 right-2 -translate-y-1/2 z-20">
              <Button
                onClick={() => scrollCourses("right")}
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full bg-white shadow-2xl border-gray-100 text-gray-400 hover:bg-primary hover:text-white transition-all active:scale-95 flex items-center justify-center border border-gray-200"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </div>

            <div 
              ref={coursesScrollRef}
              className="flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar pb-8 pt-4 px-12"
            >
              {displayCourses.map((course: any) => {
                const gradient =
                  CATEGORY_COLORS[course.category] || CATEGORY_COLORS.Default;
                return (
                  <div key={course.id} className="min-w-[280px] sm:min-w-[320px] md:min-w-[380px] snap-center">
                    <Card
                      className="overflow-hidden h-[580px] flex flex-col rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 hover:-translate-y-2 group/card"
                    >
                      <div
                        className={`h-56 bg-gradient-to-br ${gradient} relative flex items-center justify-center overflow-hidden shrink-0`}
                      >
                        {/* Animated Background Element */}
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                        
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110" />
                        ) : (
                          <BookOpen className="h-20 w-20 text-white/30 group-hover/card:scale-110 transition-transform duration-500" />
                        )}
                        
                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                          <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                            {course.category}
                          </Badge>
                          {course.isFeatured && (
                            <Badge className="bg-amber-400 text-gray-900 border-0 text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-lg">
                              ⭐ Featured
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardContent className="p-8 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-4 group-hover/card:text-blue-600 transition-colors line-clamp-2 h-[64px] overflow-hidden">
                            {course.title}
                          </h3>
                          <p className="text-gray-500 font-medium line-clamp-2 mb-4 text-sm leading-relaxed h-[40px] overflow-hidden">
                            {course.description}
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-2 text-gray-400">
                              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-blue-500" />
                              </div>
                              <span className="text-sm font-bold">{course.duration || "3 Months"}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Investment</p>
                              <p className="font-black text-xl text-gray-900">
                                {course.isFree ? (
                                  <span className="text-emerald-600">Free</span>
                                ) : (
                                  `Rs. ${(course.fee || 0).toLocaleString()}`
                                )}
                              </p>
                            </div>
                          </div>

                          <Link href={`/courses/${course.id}`}>
                            <Button className="w-full mt-4 bg-slate-900 hover:bg-primary text-white h-12 text-sm font-black rounded-2xl shadow-xl shadow-slate-200 transition-all group/btn border-0">
                              View Details
                              <ChevronRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/courses">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl h-16 px-12 text-lg shadow-2xl shadow-blue-500/20 transition-all hover:scale-105"
              >
                Explore All Courses <ChevronRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us (Career Ecosystem Redesign) ───────────────────── */}
      <section className="py-16 bg-white relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-50 rounded-full blur-3xl -z-10" />

        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-100 px-4 py-1.5 text-sm font-bold rounded-full">
              The Global College Edge
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Succeed</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              We go beyond teaching — we build careers. Here's what makes us
              different from every other institute in Pakistan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group p-10 rounded-[2.5rem] border border-gray-100 bg-white shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 relative overflow-hidden"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-emerald-50/0 group-hover:from-blue-50/50 group-hover:to-emerald-50/50 transition-colors duration-500 -z-10" />
                
                <div
                  className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-8 ${color} shadow-lg shadow-current/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                >
                  <Icon className="h-8 w-8" />
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {title}
                </h3>
                <p className="text-gray-500 leading-relaxed font-medium">
                  {desc}
                </p>

                {/* Decorative corner element */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Edu-Sphere Achievers (Success Stories Carousel) ───────────────── */}
      <section className="py-16 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl -z-10" />

        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Global College Achievers
            </h2>
            <p className="text-gray-500 text-lg font-medium">
              Our 6 Figures & 7 Figures Club Students
            </p>
          </div>

          {/* Horizontal Category Slider Bar */}
          <div className="flex items-center justify-center gap-2 mb-12 overflow-x-auto hide-scrollbar max-w-2xl mx-auto px-4 py-2 border-b border-slate-100">
            <button
              onClick={() => {
                setSelectedCategoryId("all");
                setActiveAchiever(0);
              }}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategoryId === "all"
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm"
              }`}
            >
              All Achievers
            </button>
            {categories?.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setActiveAchiever(0);
                }}
                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCategoryId === cat.id
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {displaySuccessStories.length > 0 ? (
            <div className="max-w-6xl mx-auto">
              <div className="relative group/achievers">
                {/* Featured Achiever Card */}
                <div 
                  className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 md:p-16 shadow-2xl shadow-blue-900/5 border border-white relative overflow-hidden min-h-[500px] flex items-center cursor-pointer transition-all duration-300 hover:shadow-3xl hover:border-emerald-100 hover:bg-white group"
                  onClick={() => {
                    setSelectedStory(displaySuccessStories[activeAchiever]);
                    setDetailOpen(true);
                  }}
                >
                  <div className="flex flex-col lg:flex-row items-center gap-12 w-full transition-all duration-700">
                    {/* Left Side: Content */}
                    <div className="flex-1 text-left animate-in fade-in slide-in-from-left duration-700" key={activeAchiever}>
                      <div className="flex gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      
                      <div className="relative">
                        <Quote className="h-12 w-12 text-blue-100 absolute -top-6 -left-6 -z-10" />
                        <h3 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-8">
                          "{displaySuccessStories[activeAchiever]?.description || displaySuccessStories[activeAchiever]?.story || "I had an amazing learning experience at Global College!"}"
                        </h3>
                      </div>

                      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="text-2xl font-black text-gray-900">
                            {displaySuccessStories[activeAchiever]?.studentName || displaySuccessStories[activeAchiever]?.name || "Anonymous Achiever"}
                          </p>
                          <p className="text-gray-500 font-bold">
                            {displaySuccessStories[activeAchiever]?.title || displaySuccessStories[activeAchiever]?.role || "Graduate"}
                          </p>
                        </div>
                        <span className="text-emerald-600 font-extrabold text-sm flex items-center gap-1 mt-2 md:mt-0 transition-colors group-hover:text-emerald-700">
                          Read Full Success Story <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>

                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 px-4 py-2 text-base font-black rounded-xl pointer-events-none">
                        💰 {displaySuccessStories[activeAchiever]?.metric1Value ? `${displaySuccessStories[activeAchiever]?.metric1Value} ${displaySuccessStories[activeAchiever]?.metric1Label || ''}` : (displaySuccessStories[activeAchiever]?.income || "$5,000+")}
                      </Badge>
                    </div>

                    {/* Right Side: Visual */}
                    <div className="w-full lg:w-[400px] relative animate-in fade-in zoom-in duration-700" key={`img-${activeAchiever}`}>
                      <div className="aspect-[1/1] rounded-full bg-gray-200 overflow-hidden shadow-2xl border-[12px] border-white relative flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                        {displaySuccessStories[activeAchiever]?.image ? (
                          <img 
                            src={displaySuccessStories[activeAchiever].image} 
                            alt={displaySuccessStories[activeAchiever].studentName || displaySuccessStories[activeAchiever].name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-300 flex items-center justify-center">
                            <Users className="h-24 w-24 text-white/50" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl -z-10" />
                    </div>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-center gap-6 mt-12 mb-16">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setActiveAchiever((prev) => (prev - 1 + displaySuccessStories.length) % displaySuccessStories.length)}
                    className="rounded-full h-12 w-12 border-gray-200 bg-white shadow-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  
                  <div className="flex gap-3">
                    {displaySuccessStories.map((_, i) => (
                      <div 
                        key={i} 
                        onClick={() => setActiveAchiever(i)}
                        className={`h-3 w-3 rounded-full transition-all duration-500 cursor-pointer ${i === activeAchiever ? 'bg-emerald-500 w-10' : 'bg-gray-200 hover:bg-gray-300'}`} 
                      />
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setActiveAchiever((prev) => (prev + 1) % displaySuccessStories.length)}
                    className="rounded-full h-12 w-12 border-gray-200 bg-white shadow-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>

                {/* Thumbnail Gallery */}
                <div className="w-full overflow-x-auto hide-scrollbar pb-4 pt-2">
                  <div className="flex items-center justify-center gap-6 min-w-max px-4 mx-auto">
                    {displaySuccessStories.map((achiever, i) => (
                      <div 
                        key={achiever.id}
                        onClick={() => setActiveAchiever(i)}
                        className={`group cursor-pointer transition-all duration-500 w-52 p-6 rounded-2xl border-2 flex flex-col items-center text-center ${
                          i === activeAchiever 
                          ? 'border-emerald-500 bg-emerald-50/30 shadow-lg scale-105' 
                          : 'border-transparent bg-white shadow-sm hover:shadow-md grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:scale-105'
                        }`}
                      >
                        <div className={`h-20 w-20 rounded-full mb-4 overflow-hidden border-4 transition-colors flex items-center justify-center ${i === activeAchiever ? 'border-emerald-500' : 'border-gray-100'}`}>
                          {achiever.image ? (
                            <img 
                              src={achiever.image} 
                              alt={achiever.studentName || achiever.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                              <Users className="h-8 w-8 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-black text-gray-900 text-sm mb-1 line-clamp-1">
                          {achiever.studentName || achiever.name}
                        </h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 line-clamp-1">
                          {achiever.title || achiever.role}
                        </p>
                        <p className={`text-xs font-black transition-colors ${i === activeAchiever ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {achiever.metric1Value ? `${achiever.metric1Value}` : (achiever.income?.split('-')[0] || "$5,000+")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">No stories active.</div>
          )}

          <div className="text-center mt-16">
            <Link href="/success-stories">
              <Button
                variant="outline"
                className="border-2 border-emerald-600 text-emerald-600 font-black rounded-2xl h-14 px-10 text-base hover:bg-emerald-50 transition-all flex items-center gap-2 mx-auto"
              >
                View More Success Stories <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Recent Articles (Blog Section) ─────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Recent Articles
            </h2>
            <Link href="/resources">
              <Button variant="ghost" className="text-emerald-600 font-bold hover:bg-emerald-50 gap-2">
                View All Articles <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {articles.length > 0 ? (() => {
              const display = articles.slice(0, 3);
              return display.map((article: any) => (
              <Card key={article.id} className="overflow-hidden border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-3xl border-0 shadow-sm ring-1 ring-gray-100 flex flex-col h-full group">
                <div className={`h-52 bg-slate-900 relative overflow-hidden flex items-center justify-center`}>
                  {article.imageUrl ? (
                    <img 
                      src={article.imageUrl} 
                      alt={article.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                    />
                  ) : (
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400 rounded-full blur-3xl" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <h4 className="text-white font-black text-xl px-8 text-center relative z-10 group-hover:scale-105 transition-transform duration-500 line-clamp-2">
                    {article.title}
                  </h4>
                </div>
                <CardContent className="p-8 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-gray-400 font-medium">
                      {article.readTime || "5 min read"}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-black text-gray-900 mb-4 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {article.title}
                  </h3>
                  
                  <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xs">
                        {(article.author || "A").charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{article.author || "Admin"}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          {new Date(article.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link href={`/resources/${article.slug}`}>
                      <span className="text-emerald-600 font-black text-sm flex items-center gap-1 hover:underline cursor-pointer">
                        Read <ChevronRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              ));
            })() : (
              // Fallback to static articles if none in DB
              [
                {
                  id: 1,
                  title: "eBay SEO Tips: How to Rank Higher in Search Results (2025 Guide)",
                  category: "eBay Tips",
                  readTime: "5 min read",
                  excerpt: "By optimizing titles, item specifics, pricing, and shipping, sellers can improve their rankings, attract more buyers, and increase sales effectively.",
                  author: "Samam Amer",
                  date: "October 13, 2025",
                  imageBg: "bg-emerald-900",
                  imageUrl: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=800"
                },
                {
                  id: 2,
                  title: "10 Mistakes New eBay Sellers Make (and How to Avoid Them)",
                  category: "eBay Tips",
                  readTime: "4 min read",
                  excerpt: "In 2025, many new eBay sellers fail due to simple mistakes like poor SEO, bad photos, overpricing, and slow shipping. By focusing on keywords, clear image...",
                  author: "Admin",
                  date: "October 13, 2025",
                  imageBg: "bg-emerald-800",
                  imageUrl: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=800"
                },
                {
                  id: 3,
                  title: "Why eBay Stands Out in 2025",
                  category: "Beginner Guide",
                  readTime: "5 min read",
                  excerpt: "In 2025, eBay is more than a marketplace—it's a global platform empowering entrepreneurs, promoting sustainability, and connecting people...",
                  author: "Samam Amer",
                  date: "October 13, 2025",
                  imageBg: "bg-emerald-700",
                  imageUrl: "https://images.unsplash.com/photo-1556740734-792f46efeb05?auto=format&fit=crop&q=80&w=800"
                }
              ].map((article) => (
                <Card key={article.id} className="overflow-hidden border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-3xl border-0 shadow-sm ring-1 ring-gray-100 flex flex-col h-full group">
                  <div className={`h-52 ${article.imageBg} relative overflow-hidden flex items-center justify-center`}>
                    {article.imageUrl && <img src={article.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <h4 className="text-white font-black text-xl px-8 text-center relative z-10 line-clamp-2">{article.title}</h4>
                  </div>
                  <CardContent className="p-8 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-4"><Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">{article.category}</Badge></div>
                    <h3 className="text-xl font-black text-gray-900 mb-4 line-clamp-2">{article.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1">{article.excerpt}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50/50">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked <span className="text-emerald-600">Questions</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Get answers to the most common questions about eBay, Etsy, and eCommerce in Pakistan
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.length > 0 ? faqs.map((faq, i) => (
                <AccordionItem 
                  key={faq.id} 
                  value={`item-${i}`}
                  className="bg-white border-gray-100 rounded-2xl shadow-sm border px-6 hover:shadow-md transition-all data-[state=open]:ring-2 data-[state=open]:ring-emerald-500/20 data-[state=open]:border-emerald-500"
                >
                  <AccordionTrigger className="text-base font-semibold text-gray-900 hover:no-underline py-5 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-500 text-sm leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              )) : (
                [
                  {
                    q: "Is eBay available in Pakistan?",
                    a: "Yes, you can create an eBay account from Pakistan and sell globally. While eBay doesn't have a local .pk site, Pakistani sellers are thriving on eBay.com, eBay.co.uk, and other international marketplaces."
                  },
                  {
                    q: "Can eBay Ship to Pakistan?",
                    a: "Yes, many international sellers on eBay ship to Pakistan. Additionally, as a seller, you can use various logistics partners to ship your products from Pakistan to customers worldwide."
                  },
                  {
                    q: "Is there any eBay dropshipping course in Pakistan?",
                    a: "Global College offers the most comprehensive and practical eBay dropshipping and EBC (eBay Business Course) training in Pakistan, designed to help you start earning in dollars."
                  }
                ].map((faq, i) => (
                  <AccordionItem 
                    key={i} 
                    value={`item-${i}`}
                    className="bg-white border-gray-100 rounded-2xl shadow-sm border px-6 hover:shadow-md transition-all"
                  >
                    <AccordionTrigger className="text-base font-semibold text-gray-900 hover:no-underline py-5 text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 text-sm leading-relaxed pb-5">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))
              )}
            </Accordion>
          </div>

          <div className="text-center mt-16">
            <p className="text-gray-500 font-bold mb-6">
              Still have questions? Our experts are here to help!
            </p>
            <a href="https://wa.me/923019890076?text=I%20have%20a%20question%20about%20your%20institute" target="_blank" rel="noreferrer">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 h-14 rounded-2xl gap-2 shadow-lg shadow-emerald-500/20">
                Ask Our Experts <MessageCircle className="h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Map Section ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Map Info */}
            <div className="max-w-xl">
              <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-100 px-4 py-1.5 text-sm font-bold rounded-full">
                Visit Our Main Campus
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 tracking-tight">
                {mainCampus?.name || "Global College of Computer Science, 18 Hazari"}
              </h2>
              <div className="space-y-8">
                <div className="flex items-start gap-6 group">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900 mb-1">Campus Address</h4>
                    <p className="text-gray-500 font-medium leading-relaxed whitespace-pre-line">
                      {mainCampus?.address || "18 Hazari, Jhang District, \nPunjab, Pakistan."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900 mb-1">Office Hours</h4>
                    <p className="text-gray-500 font-medium leading-relaxed whitespace-pre-line">
                      {mainCampus?.officeHours || "Monday - Saturday: 08:00 AM - 04:00 PM \nSunday: Closed"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900 mb-1">Direct Contact</h4>
                    <p className="text-gray-500 font-medium leading-relaxed">
                      Main Desk: {mainCampus?.phone || "+92 301 989 0076"} <br/>
                      Email: {mainCampus?.email || "info@globalcollege.edu.pk"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <a href={mainCampus?.mapUrl || "https://www.google.com/maps/place/GLOBAL+COLLEGE+OF+COMPUTER+SCIENCE+18+HAZARI+JHANG/@31.1619472,72.0953338,17z"} target="_blank" rel="noreferrer">
                  <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black flex items-center gap-3 transition-all">
                    Get Directions <ChevronRight className="h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Google Map Iframe */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
              <div className="relative h-[600px] w-full rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl">
                <iframe
                  title="Global College Main Campus Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3403.220123456789!2d72.0953338!3d31.1619472!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39238334fa95cf0b%3A0x8d18e20da5992720!2sGLOBAL%20COLLEGE%20OF%20COMPUTER%20SCIENCE%2018%20HAZARI%20JHANG!5e0!3m2!1sen!2spk!4v1715830000000!5m2!1sen!2spk"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Other Campuses Carousel ────────────────────────────────────────── */}
      <section className="py-14 bg-slate-50 border-y border-gray-100 overflow-hidden">
        <div className="w-full px-4 md:px-10 lg:px-16 mb-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3">
                <Globe className="h-8 w-8 text-primary" />
                Explore Our Sub Campuses
              </h3>
              <p className="text-gray-500 font-medium mt-2">Connecting students across Pakistan with world-class facilities</p>
            </div>
            <Link href="/branches">
              <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5 rounded-xl gap-2">
                See All Locations <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="w-full px-4 md:px-10 lg:px-16">
          {displayBranches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <Globe className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <h4 className="text-lg font-black text-slate-900">No campuses listed yet</h4>
              <p className="text-sm text-slate-500 mt-2">
                Add active campuses from the admin portal to show them here.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {displayBranches.map((branch: any) => (
              <div key={branch.id}>
                <Card className="bg-white border-0 shadow-xl shadow-slate-100 hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden group/branch border border-slate-50 h-full">
                  <CardContent className="p-6">
                    {/* Header: Image, Title, Badge */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex gap-4">
                        <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 shadow-sm border border-slate-100 flex-shrink-0">
                          <img 
                            src={branch.image || "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=200"} 
                            alt={branch.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg font-black text-emerald-600 mb-0.5 tracking-tight truncate-multiline line-clamp-1">{branch.name}</h4>
                          <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px]">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{branch.city || "Active Location"}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-600 border-0 flex items-center gap-1.5 px-3 py-1 font-bold text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-slate-600 text-[13px] font-medium leading-relaxed mb-6 px-1 line-clamp-2">
                      {branch.description || `Empowering people of ${branch.name} with world-class eCommerce training.`}
                    </p>

                    {/* Info Box (Grey) */}
                    <div className="bg-slate-50/80 rounded-xl p-4 space-y-3 mb-6 border border-slate-100/50">
                      {branch.headName && (
                        <div className="flex items-center justify-between text-[12px]">
                          <div className="flex items-center gap-3 text-slate-500 font-bold">
                            <User2 className="h-4 w-4" />
                            <span>City Leader:</span>
                          </div>
                          <span className="text-slate-900 font-black">{branch.headName}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3 text-slate-500 font-bold">
                          <TrendingUp className="h-4 w-4" />
                          <span>Students:</span>
                        </div>
                        <span className="text-emerald-600 font-black">
                          {Number(branch.studentCount ?? branch.manualStudentCount ?? 0).toLocaleString()}
                        </span>
                      </div>
                      {branch.phone && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3 text-slate-500 font-bold">
                            <Phone className="h-4 w-4" />
                            <span>Phone:</span>
                          </div>
                          <span className="text-slate-900 font-black">{branch.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button className="w-full h-11 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 group/btn" asChild>
                        <a href={branch.mapUrl || "#"} target="_blank" rel="noreferrer">
                          View Details <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </a>
                      </Button>
                      <Button variant="outline" className="w-full h-11 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-black text-sm rounded-xl" asChild>
                        <Link href="/register">Apply Now</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* ── Get Work With Us — Franchise Section ──────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-[#0f2c6f] to-[#1a4d3a] relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(26,77,58,0.4),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(15,44,111,0.4),transparent_60%)]" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

        <div className="w-full px-4 md:px-10 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-8">
                <Handshake className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300 text-sm font-bold uppercase tracking-widest">Franchise Opportunity</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                Get Work With Us —
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mt-1">
                  Own a Global College Franchise
                </span>
              </h2>

              <p className="text-slate-300 text-lg leading-relaxed mb-10 font-medium">
                Join Pakistan's fastest-growing digital education network. Open your own Global College campus in your city and be part of an ecosystem that has already trained 4,500+ students.
              </p>

              <div className="space-y-5 mb-10">
                {[
                  { icon: CheckCircle2, text: "Full training & onboarding support from our core team" },
                  { icon: CheckCircle2, text: "Proven curriculum & certified diploma programs" },
                  { icon: CheckCircle2, text: "Marketing materials, brand rights & student referrals" },
                  { icon: CheckCircle2, text: "Access to our LMS, admin portal & student management tools" },
                  { icon: CheckCircle2, text: "Ongoing mentorship and revenue-sharing model" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <item.icon className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setFranchiseOpen(true); setFranchiseSuccess(false); setFranchiseError(""); }}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-lg px-10 py-5 rounded-2xl shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
              >
                <Briefcase className="h-6 w-6" />
                Apply for Franchise
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Right: Stats Cards */}
            <div className="grid grid-cols-2 gap-5">
              {[
                { value: "4,500+", label: "Students Trained", icon: Users, color: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/20", iconColor: "text-emerald-400" },
                { value: "10+", label: "Active Campuses", icon: Building2, color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20", iconColor: "text-blue-400" },
                { value: "95%", label: "Success Rate", icon: Trophy, color: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/20", iconColor: "text-amber-400" },
                { value: "PKR 0", label: "No Royalty Fee*", icon: DollarSign, color: "from-rose-500/20 to-rose-600/10", border: "border-rose-500/20", iconColor: "text-rose-400" },
              ].map((stat, i) => (
                <div key={i} className={`p-6 rounded-2xl bg-gradient-to-br ${stat.color} border ${stat.border} backdrop-blur-sm`}>
                  <stat.icon className={`h-8 w-8 ${stat.iconColor} mb-4`} />
                  <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Franchise Application Modal */}
        {franchiseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setFranchiseOpen(false); setFranchiseSuccess(false); }} />
            <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#0f2c6f] to-[#1a4d3a] px-8 py-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-emerald-300 text-xs font-black uppercase tracking-widest mb-1">Franchise Application</p>
                    <h3 className="text-white text-2xl font-black">Get Work With Us</h3>
                    <p className="text-slate-300 text-sm font-medium mt-1">Fill in your details and we'll contact you within 24 hours.</p>
                  </div>
                  <button onClick={() => { setFranchiseOpen(false); setFranchiseSuccess(false); }} className="text-white/60 hover:text-white transition-colors mt-1">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                {franchiseSuccess ? (
                  <div className="text-center py-8">
                    <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-3">Application Submitted!</h4>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto">
                      Thank you for your interest! Our team will review your application and contact you within 24 hours.
                    </p>
                    <button
                      onClick={() => { setFranchiseOpen(false); setFranchiseSuccess(false); }}
                      className="mt-8 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFranchiseSubmit} className="space-y-5">
                    {franchiseError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
                        {franchiseError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Full Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Muhammad Ali"
                          value={franchiseForm.name}
                          onChange={e => setFranchiseForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-medium text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Phone Number <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          placeholder="+92 300 1234567"
                          value={franchiseForm.phone}
                          onChange={e => setFranchiseForm(p => ({ ...p, phone: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-medium text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Email Address <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        placeholder="yourname@email.com"
                        value={franchiseForm.email}
                        onChange={e => setFranchiseForm(p => ({ ...p, email: e.target.value }))}
                        className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-medium text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">City <span className="text-slate-400">(Optional)</span></label>
                        <input
                          type="text"
                          placeholder="Lahore, Karachi..."
                          value={franchiseForm.city}
                          onChange={e => setFranchiseForm(p => ({ ...p, city: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-medium text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Full Address <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Street, Area, City"
                          value={franchiseForm.address}
                          onChange={e => setFranchiseForm(p => ({ ...p, address: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-medium text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Tell Us About Yourself <span className="text-red-500">*</span></label>
                      <textarea
                        placeholder="Describe your background, experience, why you want to open a franchise, and your business goals..."
                        value={franchiseForm.description}
                        onChange={e => setFranchiseForm(p => ({ ...p, description: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-medium text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={franchiseSubmitting}
                      className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-black text-base rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
                    >
                      {franchiseSubmitting ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Submitting Application...</>
                      ) : (
                        <><Briefcase className="h-5 w-5" /> Submit Franchise Application</>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-14 bg-gradient-to-r from-[#0f2c6f] to-[#1a47b8] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join Global College today and take the first step towards a
            successful career. New batches start every month!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-10 animate-attention-seeker"
              >
                Register Free
              </Button>

            </Link>
            <a href="https://wa.me/923019890076" target="_blank" rel="noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 font-semibold px-10"
              >
                💬 WhatsApp Us
              </Button>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-blue-100">
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> info@globalcollege.edu.pk
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> +92 301 989 0076
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> 18 Hazari, Jhang District, Punjab
            </span>
          </div>
        </div>
      </section>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-none shadow-2xl">
          {selectedStory && (() => {
            const renderBlogContent = (content: string) => {
              if (!content) return null;
              const lines = content.split("\n");
              return lines.map((line, idx) => {
                const trimmed = line.trim();
                if (trimmed.startsWith("###")) {
                  return (
                    <h4 key={idx} className="text-base font-extrabold text-slate-800 mt-5 mb-2 text-left">
                      {trimmed.replace(/^###\s*/, "")}
                    </h4>
                  );
                }
                if (trimmed.startsWith("##")) {
                  return (
                    <h3 key={idx} className="text-lg md:text-xl font-black text-slate-900 mt-6 mb-3 text-left border-b pb-1 border-slate-100">
                      {trimmed.replace(/^##\s*/, "")}
                    </h3>
                  );
                }
                if (trimmed.startsWith("#")) {
                  return (
                    <h2 key={idx} className="text-xl md:text-2xl font-black text-slate-900 mt-8 mb-4 text-left border-b pb-2 border-slate-100">
                      {trimmed.replace(/^#\s*/, "")}
                    </h2>
                  );
                }
                if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                  return (
                    <li key={idx} className="text-slate-600 text-sm leading-relaxed text-left ml-6 list-disc mb-1">
                      {trimmed.replace(/^[-*]\s*/, "")}
                    </li>
                  );
                }
                if (!trimmed) {
                  return <div key={idx} className="h-3" />;
                }
                return (
                  <p key={idx} className="text-slate-600 text-sm leading-relaxed text-left mb-3">
                    {trimmed}
                  </p>
                );
              });
            };

            return (
              <div className="flex flex-col">
                {/* Header */}
                <div className="bg-[#0b965c] p-8 text-white relative">
                  <div className="flex items-center gap-5">
                    <div className="h-20 w-20 rounded-full border-4 border-white/20 overflow-hidden shadow-lg bg-white/10 flex-shrink-0 flex items-center justify-center">
                      {selectedStory.image ? (
                        <img src={selectedStory.image} alt={selectedStory.studentName || selectedStory.name} className="h-full w-full object-cover" />
                      ) : (
                        <Users className="h-10 w-10 text-white/60" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-extrabold text-2xl leading-tight">{selectedStory.studentName || selectedStory.name}</h3>
                      <p className="text-emerald-100 text-base font-semibold mt-1">{selectedStory.title || selectedStory.role}</p>
                      <div className="flex items-center gap-0.5 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6 bg-slate-50/50">
                  {selectedStory.achievement && (
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                      <p className="text-slate-800 font-extrabold text-base leading-relaxed italic text-center">
                        "{selectedStory.achievement}"
                      </p>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                      <div className="flex items-center justify-center text-emerald-600 font-semibold mb-2">
                        <DollarSign className="h-6 w-6" />
                      </div>
                      <span className="text-base font-black text-slate-800 block">{selectedStory.metric1Value || selectedStory.income || "100%"}</span>
                      <span className="text-xs text-slate-400 font-bold uppercase mt-1 block">{selectedStory.metric1Label || "Earned"}</span>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                      <div className="flex items-center justify-center text-blue-600 font-semibold mb-2">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <span className="text-base font-black text-slate-800 block">{selectedStory.metric2Value || "Active"}</span>
                      <span className="text-xs text-slate-400 font-bold uppercase mt-1 block">{selectedStory.metric2Label || "Timeline"}</span>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                      <div className="flex items-center justify-center text-purple-600 font-semibold mb-2">
                        <Award className="h-6 w-6" />
                      </div>
                      <span className="text-base font-black text-slate-800 block">{selectedStory.metric3Value || "Elite"}</span>
                      <span className="text-xs text-slate-400 font-bold uppercase mt-1 block">{selectedStory.metric3Label || "Results"}</span>
                    </div>
                  </div>

                  {/* Detailed Narrative */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                    <h4 className="font-extrabold text-emerald-600 text-xs uppercase tracking-widest text-left">
                      {selectedStory.storyContent ? "The Success Story / Blog Post" : "The Journey"}
                    </h4>
                    <div className="prose prose-slate max-w-none">
                      {selectedStory.storyContent ? (
                        renderBlogContent(selectedStory.storyContent)
                      ) : (
                        <p className="text-slate-600 text-sm leading-relaxed text-left whitespace-pre-line">
                          {selectedStory.description || selectedStory.story}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-2">
                      {selectedStory.course && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-100">
                          {selectedStory.course}
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 px-4 py-2 rounded-full text-xs">
                      {categories?.find((c: any) => c.id === selectedStory.categoryId)?.name || selectedStory.category || "Achiever"}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Announcements Timeline Modal ── */}
      <Dialog open={announcementsOpen} onOpenChange={setAnnouncementsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-8 rounded-3xl border-none shadow-2xl bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black text-white leading-tight">All Academic Announcements</h3>
              <p className="text-xs text-slate-400 mt-1">Official updates and notices from the administration</p>
            </div>
          </div>

          <div className="h-px bg-slate-800 mb-6" />

          {announcements.length > 0 ? (
            <div className="space-y-6 text-left">
              {announcements.map((ann) => (
                <div key={ann.id} className="relative pl-6 border-l-2 border-slate-700/60 pb-6 last:pb-0 last:border-l-0">
                  {/* Timeline dot */}
                  <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]" />
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(ann.sentAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                    <Badge className="border-blue-500/30 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
                      By {ann.sentBy || "Admin"}
                    </Badge>
                  </div>

                  <h4 className="text-base font-bold text-white mb-2">{ann.title}</h4>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                    {ann.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 font-medium">
              <Bell className="h-10 w-10 mx-auto text-slate-600 mb-3" />
              No announcements uploaded yet.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
