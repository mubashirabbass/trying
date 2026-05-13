import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Medal, Award, BookOpen, GraduationCap, Star } from "lucide-react";

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

export default function Leaderboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/leaderboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const myEntry = data.find(e => e.id === user?.id);
  const top3 = data.slice(0, 3);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-sm text-gray-500 mt-1">Top students ranked by engagement and achievement</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          {/* My rank card */}
          {myEntry && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white text-lg font-bold shrink-0">
                  #{myEntry.rank}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Your Rank</p>
                  <p className="text-sm text-gray-500">
                    Score: <span className="font-semibold text-primary">{myEntry.score}</span> pts ·
                    {myEntry.enrolledCourses} courses · {myEntry.certificates} certificates
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-base px-3 py-1">
                  #{myEntry.rank} of {data.length}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Top 3 podium */}
          {top3.length >= 1 && (
            <div className="grid grid-cols-3 gap-4">
              {[1, 0, 2].map((idx) => {
                const entry = top3[idx];
                if (!entry) return <div key={idx} />;
                const cfg = RANK_ICONS[entry.rank - 1] ?? RANK_ICONS[2];
                const Icon = cfg.icon;
                const heights = { 0: "pt-8", 1: "pt-0", 2: "pt-12" };
                return (
                  <div key={entry.id} className={`flex flex-col items-center ${heights[idx as keyof typeof heights] || ""}`}>
                    <div className={`h-14 w-14 rounded-full ${cfg.bg} flex items-center justify-center mb-2`}>
                      <Icon className={`h-7 w-7 ${cfg.color}`} />
                    </div>
                    <div className={`w-full rounded-xl p-4 text-center ${cfg.bg} border ${entry.id === user?.id ? "ring-2 ring-primary" : ""}`}>
                      <div className="h-10 w-10 rounded-full bg-white mx-auto mb-2 flex items-center justify-center font-bold text-gray-700 shadow">
                        {entry.name.charAt(0)}
                      </div>
                      <p className="font-bold text-sm text-gray-900 truncate">{entry.name}</p>
                      <p className={`text-lg font-extrabold ${cfg.color}`}>{entry.score}</p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Full Rankings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {data.map((entry) => {
                  const isMe = entry.id === user?.id;
                  const rankIcon = entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : null;
                  return (
                    <div key={entry.id} className={`flex items-center gap-4 px-6 py-3 ${isMe ? "bg-primary/5" : "hover:bg-gray-50"} transition-colors`}>
                      <div className={`w-8 text-center font-bold text-sm ${entry.rank <= 3 ? rankIcon!.color : "text-gray-500"}`}>
                        {entry.rank <= 3 && rankIcon ? <rankIcon.icon className="h-5 w-5 mx-auto" /> : `#${entry.rank}`}
                      </div>
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                        {entry.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${isMe ? "text-primary" : "text-gray-900"}`}>
                          {entry.name} {isMe && <span className="text-xs font-normal text-primary">(You)</span>}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {entry.enrolledCourses} courses</span>
                          <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {entry.certificates} certs</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900">{entry.score}</p>
                        <p className="text-xs text-gray-400">pts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* How scoring works */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> How Points Are Calculated</h3>
              <div className="grid grid-cols-3 gap-4 text-sm text-center">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-2xl font-bold text-primary">+10</p>
                  <p className="text-gray-500 text-xs mt-1">per Enrolled Course</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-2xl font-bold text-emerald-600">+5</p>
                  <p className="text-gray-500 text-xs mt-1">per Lesson Watched</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-2xl font-bold text-orange-500">+50</p>
                  <p className="text-gray-500 text-xs mt-1">per Certificate Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
