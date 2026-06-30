/**
 * Multi-Channel Chat Widget
 * - "Chat via Live Chat" opens embedded Tawk.to iframe INSIDE the panel (no extra bubble)
 * - WhatsApp, Facebook, Instagram open in new tab
 * - All channel URLs pulled from admin settings
 */

import { useState, useEffect } from "react";
import { ChevronDown, ChevronLeft, X } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const DEFAULT_WA            = "923019890076";
const DEFAULT_TAWK_PROPERTY = "6a0d64b5eb79041c2f204f14";
const DEFAULT_TAWK_WIDGET   = "1jp252pdn";

declare global {
  interface Window {
    Tawk_API?: { hideWidget?: () => void; onLoad?: () => void };
    Tawk_LoadStart?: Date;
  }
}

/* ─── Small SVG icons ─────────────────────────────────────────────────── */
const WaSvg = () => (
  <svg viewBox="0 0 32 32" className="h-5 w-5 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.004 2.667C8.636 2.667 2.667 8.636 2.667 16c0 2.35.634 4.55 1.74 6.445L2.667 29.333l7.098-1.713A13.28 13.28 0 0 0 16.004 29.333c7.368 0 13.329-5.97 13.329-13.333 0-7.364-5.961-13.333-13.329-13.333zm0 24c-2.18 0-4.213-.64-5.92-1.736l-.424-.264-4.212 1.017 1.055-4.084-.278-.44A10.62 10.62 0 0 1 5.334 16c0-5.88 4.789-10.667 10.67-10.667 5.878 0 10.666 4.787 10.666 10.667S21.882 26.667 16.004 26.667zm5.84-7.99c-.32-.16-1.89-.934-2.184-1.04-.294-.107-.508-.16-.722.16-.213.32-.826 1.04-.987 1.253-.16.213-.373.24-.693.08-.32-.16-1.354-.5-2.58-1.587-.954-.847-1.598-1.894-1.784-2.214-.187-.32-.02-.493.14-.653.146-.146.32-.374.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.734-1.013-2.374-.267-.626-.533-.534-.72-.547h-.614c-.213 0-.56.08-.853.4-.294.32-1.12 1.093-1.12 2.667s1.147 3.094 1.307 3.307c.16.213 2.254 3.44 5.467 4.826.763.33 1.36.527 1.826.674.77.24 1.467.213 2.02.133.613-.094 1.89-.773 2.16-1.52.266-.747.266-1.387.187-1.52-.08-.133-.28-.213-.6-.373z"/>
  </svg>
);

const FbSvg = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#1877F2]" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

const IgSvg = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ig-g2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433"/>
        <stop offset="50%" stopColor="#dc2743"/>
        <stop offset="100%" stopColor="#bc1888"/>
      </linearGradient>
    </defs>
    <path fill="url(#ig-g2)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

/* ─── Inline live-chat icon ───────────────────────────────────────────── */
const LiveChatIcon = () => (
  <span className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-emerald-600" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C6.477 3 2 6.925 2 11.75c0 2.162.88 4.14 2.33 5.67L3 21l3.75-1.4A10.3 10.3 0 0 0 12 20.5c5.523 0 10-3.925 10-8.75S17.523 3 12 3zm0 15.5c-1.5 0-2.93-.36-4.17-1l-.3-.17-2.23.83.72-2.18-.2-.3A7.16 7.16 0 0 1 4 11.75C4 8.022 7.582 5 12 5s8 3.022 8 6.75S16.418 18.5 12 18.5z"/>
    </svg>
  </span>
);

export function WhatsAppButton() {
  const { get } = useSettings();

  const rawWa       = get("site_whatsapp", DEFAULT_WA);
  const waNumber    = rawWa.replace(/[\s\-+]/g, "") || DEFAULT_WA;
  const fbUrl       = get("site_facebook",  "https://m.me/globalcollege");
  const igUrl       = get("site_instagram", "https://instagram.com/globalcollege");
  const tawkProp    = get("tawk_property_id", DEFAULT_TAWK_PROPERTY);
  const tawkWid     = get("tawk_widget_id",   DEFAULT_TAWK_WIDGET);

  const [open, setOpen]           = useState(false);
  const [view, setView]           = useState<"menu" | "livechat">("menu");
  const [visible, setVisible]     = useState(false);


  /* ── Show button after mount ── */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  /* ── Hide the default Tawk.to floating button ── */
  useEffect(() => {
    // Inject Tawk with widget hidden — we manage it ourselves
    window.Tawk_API = window.Tawk_API || {};
    const existingOnLoad = window.Tawk_API.onLoad;
    window.Tawk_API.onLoad = function () {
      if (existingOnLoad) existingOnLoad();
      window.Tawk_API?.hideWidget?.();
    };
    window.Tawk_LoadStart = new Date();
    if (!document.querySelector(`script[src*="tawk.to"]`)) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://embed.tawk.to/${DEFAULT_TAWK_PROPERTY}/${DEFAULT_TAWK_WIDGET}`;
      s.charset = "UTF-8";
      s.setAttribute("crossorigin", "*");
      document.head.appendChild(s);
    }
  }, []);

  /* ── Derived URLs ── */
  const waUrl     = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hi! I have a question about Global College.")}`;
  const igDirect  = igUrl.includes("ig.me") ? igUrl : `https://ig.me/m/${igUrl.split("/").filter(Boolean).pop()}`;
  const tawkFrame = `https://tawk.to/chat/${tawkProp}/${tawkWid}`;

  const handleClose = () => { setOpen(false); setView("menu"); };

  return (
    <div
      className={`fixed bottom-6 right-5 z-[9999] flex flex-col items-end gap-3 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      {/* ══════════════ EXPANDABLE PANEL ══════════════ */}
      {open && (
        <div
          className="w-[320px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ height: view === "livechat" ? 480 : "auto" }}
        >
          {/* ── Header ── */}
          <div className="bg-[#1a4d3a] px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {view === "livechat" && (
                <button
                  onClick={() => setView("menu")}
                  className="text-white/70 hover:text-white transition-colors mr-1"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <span className="text-white font-bold text-[14px]">
                {view === "livechat" ? "Live Chat" : "Have a question?"}
              </span>
              {view === "livechat" && (
                <span className="flex items-center gap-1 text-emerald-300 text-[10px] font-bold ml-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                </span>
              )}
            </div>
            <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── MENU VIEW ── */}
          {view === "menu" && (
            <>
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                <p className="text-slate-500 text-xs">Choose a chat option to get started.</p>
              </div>

              <div className="px-3 py-3 space-y-2 bg-white">
                {/* Live Chat — opens inline */}
                <button
                  onClick={() => setView("livechat")}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all duration-150 group text-left"
                >
                  <LiveChatIcon />
                  <div className="flex-1">
                    <p className="text-slate-700 font-semibold text-sm group-hover:text-slate-900">Chat via Live Chat</p>
                    <p className="text-[10px] text-emerald-500 font-bold">● Agent available</p>
                  </div>
                </button>

                {/* WhatsApp */}
                <a href={waUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-100 hover:border-green-200 hover:bg-green-50/40 transition-all duration-150 group">
                  <span className="h-9 w-9 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0"><WaSvg /></span>
                  <p className="text-slate-700 font-semibold text-sm group-hover:text-slate-900">Chat with WhatsApp</p>
                </a>

                {/* Facebook */}
                <a href={fbUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all duration-150 group">
                  <span className="h-9 w-9 rounded-full bg-[#1877F2]/10 flex items-center justify-center shrink-0"><FbSvg /></span>
                  <p className="text-slate-700 font-semibold text-sm group-hover:text-slate-900">Chat with Facebook</p>
                </a>

                {/* Instagram */}
                <a href={igDirect} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-100 hover:border-pink-200 hover:bg-pink-50/40 transition-all duration-150 group">
                  <span className="h-9 w-9 rounded-full bg-gradient-to-br from-[#f09433]/20 to-[#bc1888]/20 flex items-center justify-center shrink-0"><IgSvg /></span>
                  <p className="text-slate-700 font-semibold text-sm group-hover:text-slate-900">Chat with Instagram</p>
                </a>
              </div>

              <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400">
                  Powered by{" "}
                  <span className="text-emerald-600 font-semibold">
                    Global College of Computer Science &amp; Commerce
                  </span>
                </p>
              </div>
            </>
          )}

          {/* ── LIVE CHAT VIEW — embedded Tawk.to iframe ── */}
          {view === "livechat" && (
            <iframe
              src={tawkFrame}
              title="Live Chat"
              className="w-full flex-1 border-0"
              style={{ height: "calc(480px - 52px)" }}
              allow="microphone"
            />
          )}
        </div>
      )}

      {/* ══════════════ TOGGLE BUTTON ══════════════ */}
      <button
        onClick={() => { setOpen(p => !p); if (open) setView("menu"); }}
        aria-label="Toggle chat"
        className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 ${
          open ? "bg-slate-800 hover:bg-slate-700" : "bg-[#25D366] hover:bg-[#1ebe5d] animate-blinking-pulse"
        }`}
      >
        {open ? (
          <ChevronDown className="h-6 w-6 text-white" />
        ) : (
          <svg viewBox="0 0 32 32" className="h-8 w-8 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.004 2.667C8.636 2.667 2.667 8.636 2.667 16c0 2.35.634 4.55 1.74 6.445L2.667 29.333l7.098-1.713A13.28 13.28 0 0 0 16.004 29.333c7.368 0 13.329-5.97 13.329-13.333 0-7.364-5.961-13.333-13.329-13.333zm0 24c-2.18 0-4.213-.64-5.92-1.736l-.424-.264-4.212 1.017 1.055-4.084-.278-.44A10.62 10.62 0 0 1 5.334 16c0-5.88 4.789-10.667 10.67-10.667 5.878 0 10.666 4.787 10.666 10.667S21.882 26.667 16.004 26.667zm5.84-7.99c-.32-.16-1.89-.934-2.184-1.04-.294-.107-.508-.16-.722.16-.213.32-.826 1.04-.987 1.253-.16.213-.373.24-.693.08-.32-.16-1.354-.5-2.58-1.587-.954-.847-1.598-1.894-1.784-2.214-.187-.32-.02-.493.14-.653.146-.146.32-.374.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.734-1.013-2.374-.267-.626-.533-.534-.72-.547h-.614c-.213 0-.56.08-.853.4-.294.32-1.12 1.093-1.12 2.667s1.147 3.094 1.307 3.307c.16.213 2.254 3.44 5.467 4.826.763.33 1.36.527 1.826.674.77.24 1.467.213 2.02.133.613-.094 1.89-.773 2.16-1.52.266-.747.266-1.387.187-1.52-.08-.133-.28-.213-.6-.373z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
