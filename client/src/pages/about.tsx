import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Link } from "wouter";
import {
  Loader2, User, X, Mail, BookOpen, Briefcase, Award,
  Target, Eye, Heart, Users, Globe, Trophy, GraduationCap,
  CheckCircle, ArrowRight, Zap, ShieldCheck, TrendingUp
} from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const STATS = [
  { value: "4,500+", label: "Students Trained", icon: Users, color: "text-emerald-400" },
  { value: "50+",    label: "Expert Courses",   icon: BookOpen, color: "text-blue-400" },
  { value: "4+",     label: "Global Campuses",  icon: Globe, color: "text-amber-400" },
  { value: "95%",    label: "Success Rate",     icon: Trophy, color: "text-rose-400" },
];

const VALUES = [
  { icon: Target,     title: "Excellence",   desc: "We set the highest standard in every course, mentor session, and student interaction we deliver.", color: "bg-emerald-50 text-emerald-600" },
  { icon: Heart,      title: "Passion",      desc: "Our instructors don't just teach — they have lived the journey and bring real results to the classroom.", color: "bg-rose-50 text-rose-600" },
  { icon: ShieldCheck,title: "Integrity",    desc: "Transparent fees, honest learning outcomes, and zero empty promises — that is our commitment.", color: "bg-blue-50 text-blue-600" },
  { icon: TrendingUp, title: "Growth",       desc: "We celebrate every milestone. From first dollar earned to seven-figure businesses, we grow together.", color: "bg-amber-50 text-amber-600" },
  { icon: Globe,      title: "Global Reach", desc: "Our sellers operate across eBay, Etsy, Amazon and more — earning in USD, GBP, AUD every day.", color: "bg-purple-50 text-purple-600" },
  { icon: Zap,        title: "Innovation",   desc: "Curriculum updated every quarter to match the market. We teach what works today, not yesterday.", color: "bg-cyan-50 text-cyan-600" },
];

const MILESTONES = [
  { year: "2018", title: "Global College Founded", desc: "Started with 12 students and one goal: create Pakistan's first eBay-focused training institute." },
  { year: "2020", title: "First 500 Graduates",    desc: "Crossed 500 certified graduates earning internationally across 15+ countries." },
  { year: "2022", title: "4 Campuses Opened",      desc: "Expanded to Lahore, Faisalabad, Rawalpindi and Karachi to serve more students nationwide." },
  { year: "2024", title: "4,500+ Success Stories", desc: "Over four thousand students now earning confidently in the global digital economy." },
];

export default function About() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/teachers/public`)
      .then(res => res.json())
      .then(data => { setTeachers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const loopTeachers = teachers.length < 5 ? [...teachers, ...teachers, ...teachers] : teachers;

  return (
    <MainLayout>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2c6f] via-slate-900 to-emerald-950 opacity-90" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl -z-0" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full">
              About Global College
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-tight">
              We Don't Just Teach.<br />
              <span className="text-emerald-400">We Create Earners.</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-lg">
              Since 2018, Global College has been Pakistan's most trusted name in eBay, Etsy, and eCommerce education — turning beginners into six and seven-figure earners.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/courses">
                <button className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                  Explore Courses <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href="/contact">
                <button className="border border-white/20 bg-white/10 backdrop-blur text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-all">
                  Get in Touch
                </button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all">
                <s.icon className={`h-8 w-8 mx-auto mb-3 ${s.color}`} />
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION & VISION ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Our Purpose</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Built on one belief — that every Pakistani deserves a world-class shot at financial freedom through digital skills.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-gradient-to-br from-[#0f2c6f] to-slate-800 text-white rounded-3xl p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl" />
              <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Target className="h-7 w-7 text-blue-300" />
              </div>
              <h3 className="text-2xl font-black mb-4">Our Mission</h3>
              <p className="text-slate-300 leading-relaxed text-base">
                To equip every student with the real skills, proven strategies, and ongoing mentorship they need to build sustainable income through global eCommerce platforms — regardless of their background.
              </p>
              <ul className="mt-6 space-y-2">
                {["Industry-ready curriculum", "Hands-on project learning", "Lifetime community access"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-emerald-300 font-semibold">
                    <CheckCircle className="h-4 w-4 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Vision */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Eye className="h-7 w-7 text-emerald-100" />
              </div>
              <h3 className="text-2xl font-black mb-4">Our Vision</h3>
              <p className="text-emerald-50 leading-relaxed text-base">
                To become South Asia's #1 eCommerce education ecosystem — where 100,000+ students launch profitable international businesses, earn in foreign currency, and achieve true economic independence.
              </p>
              <ul className="mt-6 space-y-2">
                {["100K+ graduates by 2030", "Global seller community", "Pakistan's economic impact"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-emerald-100 font-semibold">
                    <CheckCircle className="h-4 w-4 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ──────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">What We Stand For</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Six principles that guide every decision we make — from curriculum design to student support.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-5 ${color} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOURNEY / TIMELINE ───────────────────────────────────────── */}
      <section className="py-24 bg-slate-900 overflow-hidden relative">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2c6f]/80 via-slate-900 to-emerald-950/60" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="text-center mb-16 px-6">
            <span className="inline-block bg-white/10 text-white/60 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 mb-4">
              Where We Started & Where We're Going
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Our Journey</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              From a single room to Pakistan's most recognized eCommerce training institute.
            </p>
          </div>

          {/* Horizontal scrollable timeline */}
          <div className="relative px-6 md:px-16">
            {/* Connector line */}
            <div className="absolute top-[88px] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent hidden md:block" />

            <div className="flex flex-col md:flex-row gap-6 md:gap-0 overflow-x-auto hide-scrollbar pb-4">
              {MILESTONES.map((m, i) => {
                const colors = [
                  { ring: "ring-blue-400",   dot: "bg-blue-400",   badge: "bg-blue-400/20 text-blue-300 border-blue-400/30",   num: "text-blue-300",  card: "from-blue-500/10 to-transparent",  icon: "bg-blue-400" },
                  { ring: "ring-emerald-400", dot: "bg-emerald-400", badge: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30", num: "text-emerald-300", card: "from-emerald-500/10 to-transparent", icon: "bg-emerald-400" },
                  { ring: "ring-amber-400",  dot: "bg-amber-400",   badge: "bg-amber-400/20 text-amber-300 border-amber-400/30",   num: "text-amber-300",  card: "from-amber-500/10 to-transparent",  icon: "bg-amber-400" },
                  { ring: "ring-rose-400",   dot: "bg-rose-400",    badge: "bg-rose-400/20 text-rose-300 border-rose-400/30",      num: "text-rose-300",   card: "from-rose-500/10 to-transparent",   icon: "bg-rose-400" },
                ];
                const c = colors[i % colors.length];
                return (
                  <div key={m.year} className="flex-1 min-w-[260px] md:min-w-0 flex flex-col items-center relative group px-4">
                    {/* Year badge + dot */}
                    <div className="flex flex-col items-center mb-6 relative z-10">
                      <span className={`text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${c.badge} mb-3`}>
                        {m.year}
                      </span>
                      <div className={`h-5 w-5 rounded-full ${c.dot} ring-4 ring-slate-900 shadow-lg group-hover:scale-125 transition-transform duration-300`} />
                    </div>

                    {/* Card */}
                    <div className={`w-full bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm text-center hover:bg-white/10 hover:border-white/20 transition-all duration-300 group-hover:-translate-y-1 bg-gradient-to-b ${c.card}`}>
                      <h3 className={`text-lg font-black mb-3 ${c.num}`}>{m.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{m.desc}</p>
                    </div>

                    {/* Connecting arrow between cards (not last) */}
                    {i < MILESTONES.length - 1 && (
                      <div className="hidden md:flex absolute top-[88px] -right-3 z-20 items-center">
                        <div className="h-0.5 w-6 bg-white/20" />
                        <div className="border-t-4 border-b-4 border-l-6 border-transparent border-l-white/20 w-0 h-0" style={{ borderLeftWidth: 8, borderTopWidth: 5, borderBottomWidth: 5 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA strip */}
          <div className="text-center mt-14 px-6">
            <p className="text-slate-400 text-base mb-4">And our story is far from over.</p>
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-6 py-3 text-white font-bold text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Currently training the next wave of global earners
            </div>
          </div>
        </div>
      </section>

      {/* ── FACULTY MARQUEE ──────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 mb-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Meet Our Experts</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">Real practitioners, real results. Our faculty are active international sellers and digital entrepreneurs.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : teachers.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Faculty details coming soon.</p>
        ) : (
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
            <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused] py-4">
              {[...loopTeachers, ...loopTeachers].map((teacher, idx) => (
                <div
                  key={`t-${teacher.id}-${idx}`}
                  onClick={() => setSelectedTeacher(teacher)}
                  className="w-[260px] shrink-0 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center cursor-pointer group"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-0.5 mb-4 shadow-md overflow-hidden">
                    {teacher.avatar
                      ? <img src={teacher.avatar} alt={teacher.name} className="w-full h-full rounded-full object-cover bg-white" />
                      : <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center"><User className="h-10 w-10 text-slate-400" /></div>
                    }
                  </div>
                  <h3 className="font-black text-slate-900 mb-1 group-hover:text-primary transition-colors line-clamp-1">{teacher.name}</h3>
                  <p className="text-primary text-xs font-bold uppercase tracking-wider px-3 py-0.5 bg-primary/10 rounded-full mb-2">{teacher.designation || "Instructor"}</p>
                  <p className="text-slate-400 text-xs line-clamp-2">{teacher.specialization || "Expert Faculty Member"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#0f2c6f] to-emerald-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff fill-opacity=0.4%3E%3Cpath d=M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6">
          <GraduationCap className="h-16 w-16 mx-auto text-emerald-300" />
          <h2 className="text-3xl md:text-5xl font-black leading-tight">
            Ready to Join the<br /><span className="text-emerald-300">Global Earners?</span>
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Enroll in a course today and take your first step toward building a real, sustainable income from anywhere in Pakistan.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/courses">
              <button className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black px-10 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2">
                Start Learning Now <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            <Link href="/contact">
              <button className="border border-white/30 bg-white/10 backdrop-blur text-white font-bold px-10 py-4 rounded-xl hover:bg-white/20 transition-all">
                Talk to an Advisor
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TEACHER MODAL ────────────────────────────────────────────── */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setSelectedTeacher(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedTeacher(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors z-10">
              <X className="h-5 w-5" />
            </button>
            <div className="md:w-2/5 bg-gradient-to-b from-primary/10 to-white p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-100">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[3px] shadow-xl overflow-hidden mb-4">
                {selectedTeacher.avatar
                  ? <img src={selectedTeacher.avatar} alt={selectedTeacher.name} className="w-full h-full rounded-full object-cover" />
                  : <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center"><User className="h-12 w-12 text-slate-400" /></div>
                }
              </div>
              <h4 className="text-xl font-extrabold text-slate-900 mb-1">{selectedTeacher.name}</h4>
              <span className="text-primary font-bold text-xs uppercase tracking-wider px-3 py-1 bg-primary/10 rounded-full mb-3 inline-block">{selectedTeacher.designation || "Instructor"}</span>
              {selectedTeacher.experience && (
                <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full">
                  <Briefcase className="h-3.5 w-3.5 text-primary" /> {selectedTeacher.experience} Experience
                </div>
              )}
            </div>
            <div className="md:w-3/5 p-8 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2 mb-3"><Award className="h-5 w-5 text-primary" /> Professional Profile</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{`${selectedTeacher.name} serves as ${selectedTeacher.designation || "a key faculty member"} at Global College, delivering hands-on training that bridges theory with real-world eCommerce practice.`}</p>
              </div>
              {selectedTeacher.specialization && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1"><BookOpen className="h-4 w-4 text-primary" /> Core Specialization</h4>
                  <p className="text-slate-500 text-sm ml-6">{selectedTeacher.specialization}</p>
                </div>
              )}
              {selectedTeacher.email && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1"><Mail className="h-4 w-4 text-primary" /> Email</h4>
                  <a href={`mailto:${selectedTeacher.email}`} className="text-primary text-sm ml-6 hover:underline font-semibold">{selectedTeacher.email}</a>
                </div>
              )}
              <div className="pt-4 border-t flex justify-end">
                <button onClick={() => setSelectedTeacher(null)} className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-primary transition-all">Close Profile</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
