import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { useState, useRef } from "react";

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
    title: "Live Online Classes",
    desc: "Attend classes from anywhere with our interactive live streaming platform.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Wifi,
    title: "Offline Study Material",
    desc: "Download PDF notes and video lectures to study without internet.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: ShieldCheck,
    title: "Verified Certificates",
    desc: "Earn recognized certificates upon completion, verifiable via CNIC.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: TrendingUp,
    title: "Career Placement",
    desc: "Our dedicated team helps graduates find freelance and full-time jobs.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: Award,
    title: "Expert Instructors",
    desc: "Learn from industry professionals with 10+ years of real-world experience.",
    color: "bg-pink-50 text-pink-600",
  },
  {
    icon: Users,
    title: "Active Community",
    desc: "Join a thriving community of 2,500+ students and alumni across Pakistan.",
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

export default function Home() {
  const { data: courses } = useListCourses(
    { featured: "true" },
    { query: { queryKey: getListCoursesQueryKey({ featured: "true" }) } }
  );

  const { data: testimonials } = useListTestimonials({
    query: { queryKey: getListTestimonialsQueryKey() },
  });

  const { data: successStories } = useListSuccessStories({
    query: { queryKey: getListSuccessStoriesQueryKey() },
  });

  const { data: branches } = useListBranches({
    query: { queryKey: getListBranchesQueryKey() },
  });

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
      {/* ── Hero with Video Background ──────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
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
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Popular Courses
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Professionally designed courses crafted to help you land a job or
              launch your freelancing career in record time.
            </p>
          </div>

          <div className="relative group/carousel px-20 -mx-4">
            {/* Navigation Buttons - Shshifted further away */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
              <Button 
                variant="outline" 
                size="icon"
                disabled={!canScrollLeft}
                onClick={() => scroll("left")}
                className={`rounded-full h-14 w-14 border-gray-200 bg-white shadow-xl transition-all hover:scale-110 ${!canScrollLeft ? 'opacity-20 cursor-not-allowed' : 'hover:bg-primary hover:text-white hover:border-primary'}`}
              >
                <ChevronLeft className="h-7 w-7" />
              </Button>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
              <Button 
                variant="outline" 
                size="icon"
                disabled={!canScrollRight}
                onClick={() => scroll("right")}
                className={`rounded-full h-14 w-14 border-gray-200 bg-white shadow-xl transition-all hover:scale-110 ${!canScrollRight ? 'opacity-20 cursor-not-allowed' : 'hover:bg-primary hover:text-white hover:border-primary'}`}
              >
                <ChevronRight className="h-7 w-7" />
              </Button>
            </div>

            <div 
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-8 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-8"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayCourses.map((course: any) => {
                const gradient =
                  CATEGORY_COLORS[course.category] || CATEGORY_COLORS.Default;
                return (
                  <div key={course.id} className="min-w-[300px] md:min-w-[calc((100%-6rem)/4)] snap-start">
                    <Card
                      className="overflow-hidden h-full hover:shadow-xl transition-all duration-300 group/card border-0 shadow-md"
                    >
                      <div
                        className={`h-48 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}
                      >
                        <BookOpen className="h-16 w-16 text-white/30 group-hover/card:scale-110 transition-transform" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className="bg-white/20 text-white border-white/30 text-xs">
                            {course.category}
                          </Badge>
                          {course.isFeatured && (
                            <Badge className="bg-orange-500 text-white border-0 text-xs">
                              ⭐ Featured
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 min-h-[56px]">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">
                          {course.description}
                        </p>
                        <div className="flex items-center justify-between text-sm mb-6">
                          <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                            <Clock className="h-4 w-4 text-primary" />
                            {course.duration}
                          </span>
                          <span className="font-bold text-lg text-primary">
                            {course.isFree ? (
                              <span className="text-emerald-600">Free</span>
                            ) : (
                              `Rs. ${course.fee?.toLocaleString()}`
                            )}
                          </span>
                        </div>
                        <Link href={`/courses/${course.id}`}>
                          <Button className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-semibold rounded-xl">
                            View Details
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-center mt-10">
            <Link href="/courses">
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white rounded-xl h-14 px-10"
              >
                View All Courses <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-emerald-50 text-emerald-700 border-emerald-200">
              Why Global College
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              We go beyond teaching — we build careers. Here's what makes us
              different from every other institute.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow bg-white group"
              >
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Success Stories ───────────────────────────────────────────────── */}
      {(successStories?.length ?? 0) > 0 && (
        <section className="py-20 bg-gradient-to-br from-[#0f2c6f] to-[#1a47b8] text-white overflow-hidden">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <div className="text-center mb-12">
              <Badge className="mb-3 bg-white/10 text-white border-white/20">
                Success Stories
              </Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Our Students Are Thriving
              </h2>
              <p className="text-blue-200 max-w-2xl mx-auto">
                Real stories from real graduates who transformed their lives with
                Global College.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {successStories!.slice(0, 3).map((story: any) => (
                <div
                  key={story.id}
                  className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-300 text-2xl font-bold border border-orange-400/30">
                      {story.name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p className="font-bold text-white">{story.name}</p>
                      <p className="text-sm text-blue-200">{story.currentJob}</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-100 italic leading-relaxed mb-4">
                    "{story.story}"
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <Badge className="bg-white/10 text-blue-200 border-white/20">
                      {story.course}
                    </Badge>
                    {story.income && (
                      <span className="text-emerald-300 font-semibold">
                        💰 {story.income}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      {(displayTestimonials?.length ?? 0) > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <div className="text-center mb-12">
              <Badge className="mb-3 bg-yellow-50 text-yellow-700 border-yellow-200">
                Testimonials
              </Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                What Our Students Say
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Hear directly from students who have completed our courses and
                changed their careers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {displayTestimonials.map((t: any) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition-shadow"
                >
                  <StarRating rating={t.rating ?? 5} />
                  <p className="text-gray-600 italic my-4 text-sm leading-relaxed">
                    "{t.content}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {t.name?.charAt(0) ?? "S"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-400">{t.course}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Branches ─────────────────────────────────────────────────────── */}
      {(branches?.length ?? 0) > 0 && (
        <section className="py-20 bg-white">
          <div className="w-full px-4 md:px-10 lg:px-16">
            <div className="text-center mb-12">
              <Badge className="mb-3 bg-purple-50 text-purple-700 border-purple-200">
                Our Campuses
              </Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                Branches Across Pakistan
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Visit your nearest campus for in-person classes or register
                online — the choice is yours.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {branches!.map((branch: any) => (
                <div
                  key={branch.id}
                  className="rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-shadow bg-white group"
                >
                  <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{branch.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {branch.address}
                  </p>
                  {branch.phone && (
                    <a
                      href={`tel:${branch.phone}`}
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      <Phone className="h-3 w-3" /> {branch.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Payment Methods ───────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">
              Flexible Payment Options
            </h2>
            <p className="text-gray-500 mt-2">
              We accept multiple payment methods for your convenience
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { name: "EasyPaisa", color: "bg-green-100 text-green-700 border-green-200", emoji: "📱" },
              { name: "JazzCash", color: "bg-red-100 text-red-700 border-red-200", emoji: "📲" },
              { name: "Bank Transfer", color: "bg-blue-100 text-blue-700 border-blue-200", emoji: "🏦" },
              { name: "Cash Payment", color: "bg-yellow-100 text-yellow-700 border-yellow-200", emoji: "💵" },
              { name: "Installments", color: "bg-purple-100 text-purple-700 border-purple-200", emoji: "📅" },
            ].map(({ name, color, emoji }) => (
              <div
                key={name}
                className={`flex items-center gap-2 px-6 py-3 rounded-full border font-semibold text-sm ${color} hover:shadow-md transition`}
              >
                <span>{emoji}</span>
                {name}
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
            <a href="https://wa.me/923001234567" target="_blank" rel="noreferrer">
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
              <Phone className="h-4 w-4" /> +92 300 1234567
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Lahore, Karachi, Islamabad, Peshawar
            </span>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
