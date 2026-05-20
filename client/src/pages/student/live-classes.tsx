import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2, Video, Calendar, Link2, ExternalLink, RefreshCw, HelpCircle, Bell, Clock } from "lucide-react";
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

export default function StudentLiveClasses() {
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
            <Video className="h-7 w-7 text-primary animate-pulse" /> Live Streaming Classes
          </h1>
          <p className="text-gray-500">Access your scheduled Zoom, Google Meet, or Teams live emergency boards</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchLiveClasses} disabled={loading} title="Refresh Sessions">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
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
                Excellent! You are all caught up. The admin has not scheduled any active live sessions targeting your profile at this moment.
              </p>
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 bg-gray-50 max-w-xs mx-auto py-2 px-3 rounded-lg border border-gray-100">
              <Bell className="h-3.5 w-3.5 text-primary" />
              <span>Real-time notifications will alert you instantly.</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {classes.map((c) => {
            const scheduledDate = new Date(c.scheduledAt);
            const isLive = new Date() >= scheduledDate && !c.isCompleted;

            return (
              <Card 
                key={c.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-md border flex flex-col md:flex-row md:items-center p-5 gap-5 ${
                  isLive 
                    ? "border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/5" 
                    : "border-border hover:border-primary/20 bg-card"
                }`}
              >
                {/* Visual live pulse indicator on the side */}
                {isLive && (
                  <div className="absolute top-0 right-0 md:top-auto md:bottom-0 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-bl-lg md:rounded-bl-none md:rounded-tr-lg flex items-center gap-1.5 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-white block" />
                    Live Now
                  </div>
                )}

                {/* Section 1: Left - Icon & Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={isLive ? "default" : "outline"} className={isLive ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""}>
                      {isLive ? "● Active Now" : "Scheduled Session"}
                    </Badge>
                    {c.courseTitle && (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10 select-none font-medium">
                        {c.courseTitle}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 truncate">{c.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 max-w-2xl">
                    {c.description || "No agenda details provided for this live lecture."}
                  </p>
                </div>

                {/* Section 2: Middle - Date & Time */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 p-3 rounded-lg bg-gray-50/80 border border-gray-100/60 text-sm shrink-0 md:w-56 justify-center">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">
                      {scheduledDate.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-gray-800">
                      {scheduledDate.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>

                {/* Section 3: Right - Join Link */}
                <div className="shrink-0 w-full md:w-auto">
                  <a 
                    href={ensureAbsoluteUrl(c.meetingLink)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block w-full md:w-auto"
                  >
                    <Button 
                      className={`w-full md:w-44 gap-2 font-semibold transition-all shadow-sm ${
                        isLive 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-500/20" 
                          : "bg-primary hover:bg-primary/95 text-white hover:shadow-primary/20"
                      }`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {isLive ? "JOIN LIVE STREAM" : "JOIN CLASS"}
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
