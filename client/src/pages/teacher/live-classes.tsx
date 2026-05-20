import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2, Video, Calendar, Clock, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";

const ensureAbsoluteUrl = (url: string) => {
  if (!url) return "";
  if (/^(https?:\/\/|mailto:|tel:|sms:|zoom:|teams:)/i.test(url)) {
    return url;
  }
  return `https://${url}`;
};

export default function TeacherLiveClasses() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const r = await fetch("/api/live-classes", { headers });
      if (r.ok) {
        const data = await r.json();
        setClasses(data);
      }
    } catch {
      toast({ title: "Failed to load live sessions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-7 w-7 text-primary animate-pulse" /> Assigned Live Streams
          </h1>
          <p className="text-gray-500">Monitor scheduled classes, launch meeting invites, and conduct emergency boards</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchLiveClasses} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex gap-3 items-start text-sm">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-900">Note for Instructors:</span> Live class schedules, targeted notifications, and public course log histories are curated and designed by the administration. In case of schedule revisions, please contact the Registrar's Office.
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : classes.length === 0 ? (
        <Card className="border-dashed border-2 text-center py-16">
          <CardContent className="space-y-4">
            <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
              <Video className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">No Scheduled Live Classes</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                No active live streams have been scheduled by the administration for your courses yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((c) => {
            const scheduledDate = new Date(c.scheduledAt);
            const isLive = new Date() >= scheduledDate && !c.isCompleted;

            return (
              <Card 
                key={c.id} 
                className={`relative flex flex-col justify-between overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg border-2 ${
                  isLive ? "border-emerald-500/80 shadow-emerald-500/5 bg-emerald-50/10" : "border-border"
                }`}
              >
                {/* Visual live pulse indicator */}
                {isLive && (
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3.5 rounded-bl-lg flex items-center gap-1.5 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-white block" />
                    Live Now
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="w-max mb-2">
                      {c.courseTitle || "General Broadcast"}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl line-clamp-1">{c.title}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px] mt-1.5">
                    {c.description || "No agenda details provided for this live lecture."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Timeline block */}
                  <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        {scheduledDate.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "long",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold">
                        {scheduledDate.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    {c.targetType === "student" && (
                      <div className="text-xs text-amber-700 font-semibold mt-1">
                        Individual session with: {c.studentName || "Selected Student"}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <a 
                      href={ensureAbsoluteUrl(c.meetingLink)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full"
                    >
                      <Button 
                        className={`w-full gap-2 font-semibold transition-all ${
                          isLive 
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-bounce-slow" 
                            : "bg-primary hover:bg-primary/95 text-white"
                        }`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {isLive ? "LAUNCH STREAM NOW" : "LAUNCH MEETING"}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
