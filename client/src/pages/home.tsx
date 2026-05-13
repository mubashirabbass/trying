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
  Mail,
} from "lucide-react";

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

  const displayCourses = courses?.slice(0, 6) ?? [];
  const displayTestimonials = testimonials?.slice(0, 3) ?? [];

  return (
    <MainLayout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f2c6f] via-[#1a47b8] to-[#2563eb] text-white">
        {/* background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-orange-500/10" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <Badge className="mb-4 bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30 text-sm px-3 py-1">
              🎓 Pakistan's #1 Online Learning Platform
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Build Your Future
              <span className="block text-orange-400">With Global College</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-xl">
              Join thousands of students mastering IT, Graphic Design, AI,
              Freelancing &amp; more — with live classes, offline notes, and job
              placement support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/courses">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 shadow-lg"
                >
                  Enroll Now <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 font-semibold px-8"
                >
                  Browse Free Courses
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats card cluster */}
          <div className="flex-shrink-0 grid grid-cols-2 gap-4 w-full md:w-auto">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div
                key={label}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-center hover:bg-white/15 transition"
              >
                <Icon className="h-6 w-6 mx-auto mb-2 text-orange-300" />
                <p className="text-2xl font-extrabold">{value}</p>
                <p className="text-xs text-blue-200 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Announcement Bar ──────────────────────────────────────────────── */}
      <div className="bg-orange-500 text-white text-sm py-2 overflow-hidden">
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

      {/* ── Popular Courses ───────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-blue-50 text-blue-700 border-blue-200">
              Our Courses
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Popular Courses
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Professionally designed courses crafted to help you land a job or
              launch your freelancing career in record time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(displayCourses.length > 0
              ? displayCourses
              : [
                  {
                    id: 1,
                    title: "MS Office Complete Course",
                    category: "MS Office",
                    duration: "3 Months",
                    isFree: false,
                    fee: 5000,
                    isFeatured: true,
                    description:
                      "Master Word, Excel, PowerPoint and more with hands-on projects.",
                  },
                  {
                    id: 2,
                    title: "Graphic Design with Canva & Photoshop",
                    category: "Graphics",
                    duration: "4 Months",
                    isFree: false,
                    fee: 8000,
                    isFeatured: true,
                    description:
                      "Design logos, posters, and social media content professionally.",
                  },
                  {
                    id: 3,
                    title: "Freelancing Mastery",
                    category: "Freelancing",
                    duration: "2 Months",
                    isFree: false,
                    fee: 6000,
                    isFeatured: false,
                    description:
                      "Start earning on Upwork, Fiverr, and Freelancer from day one.",
                  },
                ]
            ).map((course: any) => {
              const gradient =
                CATEGORY_COLORS[course.category] || CATEGORY_COLORS.Default;
              return (
                <Card
                  key={course.id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-md"
                >
                  <div
                    className={`h-44 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}
                  >
                    <BookOpen className="h-16 w-16 text-white/30 group-hover:scale-110 transition-transform" />
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

                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                      <span className="font-bold text-primary">
                        {course.isFree ? (
                          <span className="text-emerald-600">Free</span>
                        ) : (
                          `Rs. ${course.fee?.toLocaleString()}`
                        )}
                      </span>
                    </div>
                    <Link href={`/courses/${course.id}`}>
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/courses">
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                View All Courses <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-orange-100 text-lg mb-8">
            Join Global College today and take the first step towards a
            successful career. New batches start every month!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-orange-50 font-semibold px-10"
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

          <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-orange-100">
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
