/**
 * WhatsApp Floating Button Component
 * Spec requirement: floating WhatsApp button on all public pages
 * Uses the whatsappNumber from admin settings if available, otherwise falls back to env/default.
 */

import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const DEFAULT_WA_NUMBER = "923001234567"; // fallback

export function WhatsAppButton() {
  const [waNumber, setWaNumber] = useState(DEFAULT_WA_NUMBER);
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Fetch WhatsApp number from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const r = await fetch(`${BASE}/api/settings`);
        if (r.ok) {
          const settings: { key: string; value: string }[] = await r.json();
          const wa = settings.find(s => s.key === "site_whatsapp");
          if (wa?.value) {
            // Normalize: remove spaces, dashes, +
            setWaNumber(wa.value.replace(/[\s\-+]/g, ""));
          }
        }
      } catch { /* use default */ }
    };
    fetchSettings();
  }, []);

  // Show button after scroll
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Show immediately after mount delay
    const t = setTimeout(() => setVisible(true), 800);
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(t); };
  }, []);

  // Stop pulse after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hello! I'm interested in learning more about Global College courses.")}`;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
          Chat with us on WhatsApp
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      </div>

      <a
        href={waUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="group relative flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full shadow-2xl shadow-green-500/40 transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {/* Pulse ring */}
        {pulse && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 animation-delay-200" />
          </>
        )}

        {/* Icon only (compact) */}
        <div className="h-14 w-14 rounded-full flex items-center justify-center shrink-0">
          {/* WhatsApp SVG Icon */}
          <svg viewBox="0 0 32 32" className="h-8 w-8 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.004 2.667C8.636 2.667 2.667 8.636 2.667 16c0 2.35.634 4.55 1.74 6.445L2.667 29.333l7.098-1.713A13.28 13.28 0 0 0 16.004 29.333c7.368 0 13.329-5.97 13.329-13.333 0-7.364-5.961-13.333-13.329-13.333zm0 24c-2.18 0-4.213-.64-5.92-1.736l-.424-.264-4.212 1.017 1.055-4.084-.278-.44A10.62 10.62 0 0 1 5.334 16c0-5.88 4.789-10.667 10.67-10.667 5.878 0 10.666 4.787 10.666 10.667S21.882 26.667 16.004 26.667zm5.84-7.99c-.32-.16-1.89-.934-2.184-1.04-.294-.107-.508-.16-.722.16-.213.32-.826 1.04-.987 1.253-.16.213-.373.24-.693.08-.32-.16-1.354-.5-2.58-1.587-.954-.847-1.598-1.894-1.784-2.214-.187-.32-.02-.493.14-.653.146-.146.32-.374.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.734-1.013-2.374-.267-.626-.533-.534-.72-.547h-.614c-.213 0-.56.08-.853.4-.294.32-1.12 1.093-1.12 2.667s1.147 3.094 1.307 3.307c.16.213 2.254 3.44 5.467 4.826.763.33 1.36.527 1.826.674.77.24 1.467.213 2.02.133.613-.094 1.89-.773 2.16-1.52.266-.747.266-1.387.187-1.52-.08-.133-.28-.213-.6-.373z"/>
          </svg>
        </div>
      </a>
    </div>
  );
}
