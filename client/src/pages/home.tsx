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
} from "@workspace/api-client-react";
import {
  getListCoursesQueryKey,
  getListTestimonialsQueryKey,
  getListSuccessStoriesQueryKey,
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
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useRef, useEffect } from "react";

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
  const { data: courses } = useListCourses(
    { featured: true },
    { query: { queryKey: getListCoursesQueryKey({ featured: true }) } }
  );

  const { data: testimonials } = useListTestimonials({
    query: { queryKey: getListTestimonialsQueryKey() },
  });

  const { data: successStories } = useListSuccessStories({
    query: { queryKey: getListSuccessStoriesQueryKey() },
  });

  const [articles, setArticles] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);

  useEffect(() => {
    fetchPublic("/api/articles").then(setArticles);
    fetchPublic("/api/faqs").then(setFaqs);
  }, []);

  const displaySuccessStories = (successStories && successStories.length > 0) ? successStories : [
    {
      id: 1,
      studentName: "M. Samam Amir",
      title: "eBay Store Owner",
      achievement: "$5,000+",
      description: "I made my first $1,000 in just 6 weeks after completing the EBC program. The support and training quality is unmatched.",
      rating: 5,
    },
    {
      id: 2,
      studentName: "Ayesha Waseem",
      title: "eBay Consultant",
      achievement: "$500",
      description: "The practical training here is what made the difference. I now manage multiple international client stores with confidence.",
      rating: 5,
    },
    {
      id: 3,
      studentName: "Madiha Sadaf",
      title: "eBay Consultant",
      achievement: "200,000+ PKR",
      description: "Global College gave me the roadmap to financial independence through freelancing. I started with zero and now I'm here.",
      rating: 5,
    },
    {
      id: 4,
      studentName: "Mubashara Liaqat",
      title: "eBay Consultant",
      achievement: "First 6-Figure",
      description: "The ecosystem here is incredible. You don't just learn; you grow with a community of like-minded entrepreneurs.",
      rating: 5,
    },
    {
      id: 5,
      studentName: "Muhammad Tayyab",
      title: "eBay Store Owner",
      achievement: "£ — Multi-Currency Earner",
      description: "Mastering international markets was my goal. Global College made it a reality. I'm now earning in multiple currencies.",
      rating: 5,
    },
  ];

  const [activeAchiever, setActiveAchiever] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      videoRef.current.play().catch((error) => {
        console.log("Autoplay was prevented:", error);
      });
    }
  }, []);

  const { data: branches } = useListBranches({
    query: { queryKey: getListBranchesQueryKey() },
  });

  const displayBranches = (branches && branches.length > 0) ? branches : [
    { 
      id: 1, 
      name: "Multan HQ", 
      leader: "Abuzar Razzaq", 
      phone: "0 30 30 40 9999", 
      students: "Growing", 
      status: "Active",
      location: "Active Location",
      desc: "Empowering People of Multan with world-class Ebay & Etsy Training."
    },
    { 
      id: 2, 
      name: "Lahore", 
      leader: "Abdul Hanan", 
      phone: "0304 9891111", 
      students: "Growing", 
      status: "Active",
      location: "Active Location",
      desc: "Empowering People of Lahore with world-class Ebay & Etsy Training."
    },
    { 
      id: 3, 
      name: "Sialkot", 
      leader: "Faryad Hussain", 
      phone: "+92 301 989 0076", 
      students: "Growing", 
      status: "Active",
      location: "Active Location",
      desc: "Empowering People of Sialkot with world-class Ebay & Etsy Training."
    },
  ];

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  const scrollRef = useRef<HTMLDivElement>(null);

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
      {/* ── Hero Section ──────────────────────────────────────────────────── */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Video Background */}
          <video 
            ref={videoRef}
            autoPlay 
            loop 
            muted 
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover z-0"
          >
            <source src="/assets/videos/eBay-Course-Etsy-Training-Pakistan.mp4" type="video/mp4" />
          </video>
        
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-black/60 z-10" />
        
        {/* Content Container */}
        <div className="relative z-20 w-full px-4 md:px-10 lg:px-16 text-center text-white">
          <div className="mb-8">
            <span className="bg-[#e6fcf5] text-[#0ca678] border border-[#b2f2bb] rounded-md px-6 py-2.5 text-sm md:text-base font-bold shadow-lg uppercase tracking-wider">
              Global College — Redefining Digital Excellence in Pakistan
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-12 drop-shadow-2xl">
            Empowering the Next Generation of <span className="text-[#ffec99]">Digital Leaders Globally</span>
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/courses">
              <Button className="bg-[#20c997] hover:bg-[#12b886] text-white font-bold text-lg px-10 h-16 rounded-xl shadow-xl transition-all hover:scale-105 flex items-center gap-2 border-0">
                Start Your Training <ChevronRight className="h-5 w-5" />
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
      <section className="pt-12 pb-20 bg-gray-50 relative group">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">
              Explore Our Top Courses
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Professional training programs designed by industry experts to help you master high-income digital skills and launch your career globally.
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayCourses.slice(0, 3).map((course: any) => {
                const gradient =
                  CATEGORY_COLORS[course.category] || CATEGORY_COLORS.Default;
                return (
                  <div key={course.id} className="group">
                    <Card
                      className="overflow-hidden h-full rounded-[2.5rem] border border-gray-100 bg-white shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 hover:-translate-y-2 group/card"
                    >
                      <div
                        className={`h-56 bg-gradient-to-br ${gradient} relative flex items-center justify-center overflow-hidden`}
                      >
                        {/* Animated Background Element */}
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                        
                        <BookOpen className="h-20 w-20 text-white/30 group-hover/card:scale-110 transition-transform duration-500" />
                        
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

                      <CardContent className="p-8">
                        <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover/card:text-blue-600 transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-gray-500 font-medium line-clamp-2 mb-8 text-sm leading-relaxed">
                          {course.description}
                        </p>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                          <div className="flex items-center gap-2 text-gray-400">
                            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-blue-500" />
                            </div>
                            <span className="text-sm font-bold">{course.duration}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Investment</p>
                            <p className="font-black text-xl text-gray-900">
                              {course.isFree ? (
                                <span className="text-emerald-600">Free</span>
                              ) : (
                                `Rs. ${course.fee?.toLocaleString()}`
                              )}
                            </p>
                          </div>
                        </div>

                        <Link href={`/courses/${course.id}`}>
                          <Button className="w-full mt-8 bg-slate-900 hover:bg-primary text-white h-14 text-base font-black rounded-2xl shadow-xl shadow-slate-200 transition-all group/btn border-0">
                            View Details
                            <ChevronRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-center mt-16">
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
      <section className="py-24 bg-white relative overflow-hidden">
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


      {/* ── Physical Incubator Network (Temporarily Hidden) ────────────────
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#1a47b8] mb-4">
              Physical Incubator Network
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
              Join our thriving community of entrepreneurs at these established locations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {displayBranches.map((branch: any) => (
              <Card key={branch.id} className="overflow-hidden border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl group border-0 shadow-sm ring-1 ring-gray-100">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
                        <Globe className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-gray-900">{branch.name}</h3>
                        <p className="text-xs text-gray-400 font-bold flex items-center gap-1 uppercase tracking-wider mt-1">
                          <MapPin className="h-3 w-3" /> {branch.location || "Active Location"}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 px-3 py-1 flex items-center gap-1.5 font-bold shadow-none pointer-events-none">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      {branch.status || "Active"}
                    </Badge>
                  </div>

                  <p className="text-gray-500 text-sm leading-relaxed mb-8 min-h-[40px]">
                    {branch.desc || "Empowering people with world-class skills and training."}
                  </p>

                  <div className="space-y-4 mb-10 bg-gray-50/50 p-6 rounded-2xl border border-gray-50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2">
                        <User2 className="h-4 w-4" /> City Leader:
                      </span>
                      <span className="font-bold text-gray-900">{branch.leader || "TBA"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Students:
                      </span>
                      <span className="font-bold text-emerald-600">{branch.students || "Growing"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Phone:
                      </span>
                      <span className="font-bold text-gray-900">{branch.phone}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Link href={`/incubators/${branch.id}`}>
                      <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#10b981] to-[#3b82f6] hover:from-[#059669] hover:to-[#2563eb] text-white font-black text-base shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 group/btn border-0">
                        View Details 
                        <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="outline" className="w-full h-14 rounded-2xl border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-black text-base transition-colors">
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      ────────────────────────────────────────────────────────────────── */}

      {/* ── Edu-Sphere Achievers (Success Stories Redesign) ─────────────── */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
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

          <div className="max-w-6xl mx-auto">
            <div className="relative group/achievers">
              {/* Featured Achiever Card */}
              <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 md:p-16 shadow-2xl shadow-blue-900/5 border border-white relative overflow-hidden min-h-[500px] flex items-center">
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
                        "{ (displaySuccessStories[activeAchiever] as any)?.description || (displaySuccessStories[activeAchiever] as any)?.story || "Success story coming soon..." }"
                      </h3>
                    </div>

                    <div className="mb-6">
                      <p className="text-2xl font-black text-gray-900">{ (displaySuccessStories[activeAchiever] as any)?.studentName || (displaySuccessStories[activeAchiever] as any)?.name || "Global Student" }</p>
                      <p className="text-gray-500 font-bold">{ (displaySuccessStories[activeAchiever] as any)?.title || (displaySuccessStories[activeAchiever] as any)?.role || "Achiever" }</p>
                    </div>

                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 px-4 py-2 text-base font-black rounded-xl pointer-events-none">
                      💰 { (displaySuccessStories[activeAchiever] as any)?.achievement || (displaySuccessStories[activeAchiever] as any)?.income || "Verified Earnings" }
                    </Badge>
                  </div>

                  {/* Right Side: Visual */}
                  <div className="w-full lg:w-[400px] relative animate-in fade-in zoom-in duration-700" key={`img-${activeAchiever}`}>
                    <div className="aspect-[1/1] rounded-full bg-gray-200 overflow-hidden shadow-2xl border-[12px] border-white relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                      <div className="w-full h-full bg-slate-300 flex items-center justify-center">
                        <Users className="h-24 w-24 text-white/50" />
                      </div>
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
                  className="rounded-full h-12 w-12 border-gray-200 bg-white shadow-lg hover:bg-primary hover:text-white transition-all"
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
                  className="rounded-full h-12 w-12 border-gray-200 bg-white shadow-lg hover:bg-primary hover:text-white transition-all"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>

              {/* ── Thumbnail Gallery (User Requested Section) ────────────────── */}
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
                      <div className={`h-20 w-20 rounded-full mb-4 overflow-hidden border-4 transition-colors ${i === activeAchiever ? 'border-emerald-500' : 'border-gray-100'}`}>
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                          <Users className="h-8 w-8 text-slate-400" />
                        </div>
                      </div>
                      <h4 className="font-black text-gray-900 text-sm mb-1">{(achiever as any).studentName || (achiever as any).name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{(achiever as any).title || (achiever as any).role}</p>
                      <p className={`text-xs font-black transition-colors ${i === activeAchiever ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {((achiever as any).achievement || (achiever as any).income || "").split('-')[0]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent Articles (Blog Section) ─────────────────────────────────── */}
      <section className="py-24 bg-white">
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
            {articles.length > 0 ? articles.slice(0, 3).map((article) => (
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
            )) : (
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
      <section className="py-24 bg-gray-50/50">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
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
                  <AccordionTrigger className="text-lg font-black text-gray-900 hover:no-underline py-6 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-500 text-base leading-relaxed pb-6">
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
                    <AccordionTrigger className="text-lg font-black text-gray-900 hover:no-underline py-6 text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 text-base leading-relaxed pb-6">
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
            <a href="https://wa.me/923001234567" target="_blank" rel="noreferrer">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 h-14 rounded-2xl gap-2 shadow-lg shadow-emerald-500/20">
                Ask Our Experts <MessageCircle className="h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Map Section ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Map Info */}
            <div className="max-w-xl">
              <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-100 px-4 py-1.5 text-sm font-bold rounded-full">
                Visit Our Main Campus
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 tracking-tight">
                Global College of Computer Science, <span className="text-primary">18 Hazari</span>
              </h2>
              <div className="space-y-8">
                <div className="flex items-start gap-6 group">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900 mb-1">Campus Address</h4>
                    <p className="text-gray-500 font-medium leading-relaxed">
                      18 Hazari, Jhang District, <br/>
                      Punjab, Pakistan.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900 mb-1">Office Hours</h4>
                    <p className="text-gray-500 font-medium leading-relaxed">
                      Monday - Saturday: 08:00 AM - 04:00 PM <br/>
                      Sunday: Closed
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
                      Main Desk: +92 301 989 0076 <br/>
                      Email: info@globalcollege.edu.pk
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <a href="https://www.google.com/maps/place/GLOBAL+COLLEGE+OF+COMPUTER+SCIENCE+18+HAZARI+JHANG/@31.1619472,72.0953338,17z" target="_blank" rel="noreferrer">
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
      <section className="py-20 bg-slate-50 border-y border-gray-100 overflow-hidden">
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
        
        <div className="relative group/marquee">
          {/* Fading Gradients for Smooth Scroll Look */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

          <div className="flex gap-8 animate-marquee whitespace-nowrap px-4 hover:[animation-play-state:paused]">
            {[...displayBranches, ...displayBranches].map((branch: any, i) => (
              <div key={`${branch.id}-${i}`} className="inline-block min-w-[380px]">
                <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-[2rem] overflow-hidden group/branch border border-transparent hover:border-primary/10">
                  <CardContent className="p-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center text-primary group-hover/branch:bg-primary group-hover/branch:text-white group-hover/branch:scale-110 transition-all duration-500">
                        <MapPin className="h-7 w-7" />
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge className="bg-emerald-50 text-emerald-600 border-0 font-black uppercase text-[10px] tracking-widest px-3 py-1 mb-2">
                          Active Campus
                        </Badge>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Status: Live</span>
                      </div>
                    </div>

                    <h4 className="text-2xl font-black text-gray-900 mb-2 group-hover/branch:text-primary transition-colors">{branch.name}</h4>
                    <p className="text-gray-500 text-sm font-medium mb-8 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-blue-300" />
                      {branch.location || "Regional Hub, Pakistan"}
                    </p>

                    <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Director</p>
                        <p className="text-sm font-black text-gray-900">{branch.leader || "Senior Staff"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Direct Line</p>
                        <p className="text-sm font-black text-primary">{branch.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-[#0f2c6f] to-[#1a47b8] text-white">
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
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-10"
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
    </MainLayout>
  );
}
