import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";

const SESSION_KEY = "critical_popup_dismissed_v2";

export function CriticalAnnouncementPopup() {
  const { get, loading } = useSettings();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const enabled = get("critical_popup_enabled", "false");
  const title   = get("critical_popup_title",   "Important Announcement");
  const message = get("critical_popup_message", "");

  useEffect(() => {
    // Don't show again if already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY) === "true") return;
    // Wait until settings have loaded
    if (loading) return;

    if (enabled === "true" && message.trim()) {
      setVisible(true);
      // Trigger slide-in animation after a small delay
      setTimeout(() => setAnimateIn(true), 50);
    }
  }, [loading, enabled, message]);

  const handleClose = () => {
    setAnimateIn(false);
    // Wait for the slide-out animation before hiding
    setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "true");
      setVisible(false);
    }, 350);
  };

  if (!visible) return null;

  return (
    <>
      {/* Full-screen notification overlay — background stays visible, banner slides in from top */}
      <div
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{
          backgroundColor: animateIn ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)",
          transition: "background-color 0.35s ease",
        }}
      />

      {/* The notification banner — slides in from the top */}
      <div
        className="fixed left-0 right-0 z-[10000] flex justify-center px-4 pointer-events-auto"
        style={{
          top: animateIn ? "24px" : "-300px",
          transition: "top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div
          className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
            border: "1px solid rgba(99,102,241,0.4)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.2)",
          }}
        >
          {/* Animated accent bar */}
          <div
            className="h-1 w-full"
            style={{
              background: "linear-gradient(90deg, #ef4444, #f97316, #eab308, #ef4444)",
              backgroundSize: "200% 100%",
              animation: "announcement-shimmer 2s linear infinite",
            }}
          />

          {/* Header row */}
          <div className="flex items-start gap-3 px-5 pt-5 pb-3">
            <div
              className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)" }}
            >
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400">Critical Update</span>
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <h2 className="text-base font-black text-white leading-snug">{title}</h2>
            </div>
            {/* Close X button */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(255,255,255,0.1)" }}
              aria-label="Close announcement"
            >
              <X className="h-3.5 w-3.5 text-white/70" />
            </button>
          </div>

          {/* Message body */}
          <div className="px-5 pb-4">
            <div
              className="rounded-xl p-4 text-sm leading-relaxed text-white/80 font-medium whitespace-pre-wrap max-h-[200px] overflow-y-auto sidebar-scroll"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {message}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 pb-5 gap-3">
            <p className="text-[10px] text-white/25 font-medium">From administration</p>
            <button
              onClick={handleClose}
              className="shrink-0 h-8 px-5 font-bold text-xs rounded-lg text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              I Understand
            </button>
          </div>
        </div>
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes announcement-shimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
      `}</style>
    </>
  );
}
