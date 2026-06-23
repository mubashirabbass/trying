import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Menu, X, BookOpen, Phone, Mail, Facebook, Instagram, Youtube, Linkedin, MessageSquare, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Typing Effect State for Logo Text on Home Page
  const [typedTitle, setTypedTitle] = useState("");
  const [typedSubtitle, setTypedSubtitle] = useState("");

  useEffect(() => {
    if (location !== "/") {
      setTypedTitle("Global College");
      setTypedSubtitle("Learning Management System");
      return;
    }

    setTypedTitle("");
    setTypedSubtitle("");

    const titleText = "Global College";
    const subtitleText = "Learning Management System";
    
    let titleIdx = 0;
    let subtitleIdx = 0;
    let titleTimer: NodeJS.Timeout;
    let subtitleTimer: NodeJS.Timeout;

    const typeTitle = () => {
      if (titleIdx < titleText.length) {
        setTypedTitle(titleText.slice(0, titleIdx + 1));
        titleIdx++;
        titleTimer = setTimeout(typeTitle, 100);
      } else {
        typeSubtitle();
      }
    };

    const typeSubtitle = () => {
      if (subtitleIdx < subtitleText.length) {
        setTypedSubtitle(subtitleText.slice(0, subtitleIdx + 1));
        subtitleIdx++;
        subtitleTimer = setTimeout(typeSubtitle, 50);
      }
    };

    titleTimer = setTimeout(typeTitle, 400);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(subtitleTimer);
    };
  }, [location]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: "Success Stories", path: "/success-stories" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Feedback", path: "/feedback" },
  ];


  return (
    <>
      {/* ── Top info bar (only lg+) ── */}
      <div className="bg-[#0f2c6f] text-white text-[11px] py-1.5 hidden lg:block border-b border-white/10">
        <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="tel:+923001234567" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
              <Phone className="h-3 w-3" /> Call: +92 300 1234567
            </a>
            <a href="sms:+923001234567" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
              <MessageSquare className="h-3 w-3" /> SMS: +92 300 1234567
            </a>
            <a href="https://wa.me/923001234567" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
              <MessageCircle className="h-3 w-3" /> WhatsApp: +92 300 1234567
            </a>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-blue-200 transition-colors"><Facebook className="h-3 w-3" /></a>
              <a href="#" className="hover:text-blue-200 transition-colors"><Instagram className="h-3 w-3" /></a>
              <a href="#" className="hover:text-blue-200 transition-colors"><Youtube className="h-3 w-3" /></a>
              <a href="#" className="hover:text-blue-200 transition-colors"><Linkedin className="h-3 w-3" /></a>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <a href="mailto:info@globalcollege.edu.pk" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
              <Mail className="h-3 w-3" /> info@globalcollege.edu.pk
            </a>
          </div>
        </div>
      </div>

      {/* ── Main navbar ── */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
          <div className="flex items-center h-[60px] gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className={`h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-sm shrink-0 ${location === "/" ? "animate-logo-pulse" : ""}`}>
                <BookOpen className={`h-[18px] w-[18px] text-white ${location === "/" ? "animate-logo-circle" : ""}`} />
              </div>
              <div className="hidden sm:block w-[180px] shrink-0">
                <span className={`font-extrabold text-[16px] leading-none block ${location === "/" ? "animate-text-flow" : "text-gray-900"}`}>
                  {typedTitle}
                  {location === "/" && typedTitle.length < "Global College".length && (
                    <span className="animate-pulse ml-0.5 font-normal text-gray-400">|</span>
                  )}
                </span>
                <span className="text-[9px] font-medium text-gray-400 leading-none block mt-0.5">
                  {typedSubtitle}
                  {location === "/" && typedTitle.length === "Global College".length && typedSubtitle.length < "Learning Management System".length && (
                    <span className="animate-pulse ml-0.5 text-gray-400">|</span>
                  )}
                </span>
              </div>
            </Link>

            {/* ── Nav Links (desktop) ── */}
            <div className="hidden md:flex flex-1 items-center justify-center min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`relative px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors group ${
                      location === link.path
                        ? "text-primary font-semibold"
                        : "text-gray-600 hover:text-primary"
                    }`}
                  >
                    <span>{link.name}</span>
                    <span className={`absolute bottom-0 left-3 right-3 h-0.5 bg-primary transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 ${
                      location === link.path ? "scale-x-100" : ""
                    }`} />
                  </Link>
                ))}
              </div>
            </div>


            {/* ── Action Buttons (desktop) — separated by a border ── */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0 border-l border-gray-200 pl-3">
              {user ? (
                <>
                  <span className="text-xs text-gray-500 hidden lg:block">
                    Hi, <strong className="text-gray-800">{user.name.split(" ")[0]}</strong>
                  </span>
                  <Link href={user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/dashboard"}>
                    <Button variant="outline" size="sm"
                      className="text-xs font-semibold h-8 px-3 rounded-lg border-gray-300 hover:border-primary hover:text-primary">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    onClick={() => { logout(); setTimeout(() => { window.location.href = "/login"; }, 100); }}
                    variant="ghost" size="sm"
                    className="text-xs font-semibold h-8 px-3 rounded-lg text-red-500 hover:bg-red-50"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm"
                      className="text-[13px] font-medium h-8 px-3 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold h-9 px-5 rounded-lg shadow-sm text-[13px] whitespace-nowrap animate-attention-seeker">
                      Enroll Free
                    </Button>
                  </Link>

                </>
              )}
            </div>

            {/* ── Mobile Hamburger ── */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden ml-auto p-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown menu ── */}
        {isOpen && (
          <div className="md:hidden border-t bg-white shadow-lg">
            <div className="px-4 py-3 space-y-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location === link.path
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-3 mt-1 border-t border-gray-100 text-xs text-gray-500 px-3">
                <a href="tel:+923001234567" className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-primary" /> +92 300 1234567
                </a>
              </div>

              <div className="pt-2 flex flex-col gap-2 px-1">
                {user ? (
                  <>
                    <Link href={user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/dashboard"} onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full text-sm font-semibold">Dashboard</Button>
                    </Link>
                    <Button
                      onClick={() => { logout(); setIsOpen(false); setTimeout(() => { window.location.href = "/login"; }, 100); }}
                      variant="ghost" className="w-full text-sm font-semibold text-red-500"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full text-sm font-semibold">Log in</Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold animate-attention-seeker">Enroll Free</Button>
                    </Link>

                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
