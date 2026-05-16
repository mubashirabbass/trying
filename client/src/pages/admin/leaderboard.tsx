import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Medal, Award, BookOpen, GraduationCap, Star, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface LeaderboardEntry {
  id: number; name: string; avatar?: string; enrolledCourses: number;
  certificates: number; completedLessons: number; score: number; rank: number;
}

const RANK_ICONS = [
  { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-50" },
  { icon: Medal, color: "text-gray-400", bg: "bg-gray-50" },
  { icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
];

export default function AdminLeaderboard() {
  const { token } = useAuth();
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/leaderboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const filteredData = data.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  const top3 = data.slice(0, 3);

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Student Leaderboard</h1>
          <p className="text-slate-500 font-medium mt-1">Global rankings across all branches and courses</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search students..." 
            className="pl-10 h-11 rounded-2xl border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
      ) : (
        <div className="space-y-8">
          {/* Top 3 podium */}
          {!search && top3.length >= 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 0, 2].map((idx) => {
                const entry = top3[idx];
                if (!entry) return <div key={idx} className="hidden md:block" />;
                const cfg = RANK_ICONS[entry.rank - 1] ?? RANK_ICONS[2];
                const Icon = cfg.icon;
                const heights = { 0: "md:mt-8", 1: "md:mt-0", 2: "md:mt-16" };
                return (
                  <Card key={entry.id} className={`border-none shadow-xl ring-1 ring-slate-100 rounded-[32px] overflow-hidden bg-white transition-all hover:scale-105 ${heights[idx as keyof typeof heights] || ""}`}>
                    <div className={`h-24 ${cfg.bg} flex items-center justify-center`}>
                      <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                        <Icon className={`h-6 w-6 ${cfg.color}`} />
                      </div>
                    </div>
                    <CardContent className="p-6 text-center -mt-8">
                      <div className="h-16 w-16 rounded-[24px] bg-slate-900 mx-auto mb-4 flex items-center justify-center font-black text-white text-xl shadow-2xl border-4 border-white">
                        {entry.name.charAt(0)}
                      </div>
                      <h3 className="font-black text-slate-900 truncate">{entry.name}</h3>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Badge variant="outline" className="font-black text-primary border-primary/20 bg-primary/5">#{entry.rank}</Badge>
                        <span className="text-2xl font-black text-slate-900">{entry.score}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">pts</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div>
                          <p className="text-slate-900 text-sm">{entry.enrolledCourses}</p>
                          <p>Courses</p>
                        </div>
                        <div>
                          <p className="text-slate-900 text-sm">{entry.certificates}</p>
                          <p>Certs</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <Card className="border-none shadow-2xl ring-1 ring-slate-100 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black text-slate-900">Full Rankings</CardTitle>
              <Badge variant="secondary" className="font-black rounded-lg">{filteredData.length} Students</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                      <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Stats</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredData.map((entry) => {
                      const rankIcon = entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : null;
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${entry.rank <= 3 ? rankIcon!.bg + " " + rankIcon!.color : "bg-slate-50 text-slate-400"}`}>
                              {entry.rank <= 3 && rankIcon ? <rankIcon.icon className="h-5 w-5" /> : `#${entry.rank}`}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center font-black text-white shrink-0 group-hover:scale-110 transition-transform">
                                {entry.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 leading-tight">{entry.name}</p>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">ID: GC-{entry.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-center gap-6">
                              <div className="text-center">
                                <p className="text-sm font-black text-slate-900">{entry.enrolledCourses}</p>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Courses</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-black text-slate-900">{entry.certificates}</p>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Certs</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-black text-slate-900">{entry.completedLessons}</p>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Lessons</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="inline-flex flex-col items-end">
                              <span className="text-xl font-black text-slate-900">{entry.score}</span>
                              <span className="text-[9px] font-black text-primary uppercase tracking-widest">Points</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Scoring Guide */}
          <Card className="bg-slate-900 border-none rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Star className="h-40 w-40" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-6">Scoring Algorithm</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <p className="text-3xl font-black text-primary">+10</p>
                  <p className="text-sm font-bold text-slate-300 mt-2 uppercase tracking-widest">Course Enrollment</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <p className="text-3xl font-black text-emerald-400">+5</p>
                  <p className="text-sm font-bold text-slate-300 mt-2 uppercase tracking-widest">Lesson Completed</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <p className="text-3xl font-black text-orange-400">+50</p>
                  <p className="text-sm font-bold text-slate-300 mt-2 uppercase tracking-widest">Certificate Earned</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
