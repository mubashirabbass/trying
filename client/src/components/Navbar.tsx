import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Menu, X, BookOpen, Phone, Mail, Facebook, Instagram, Youtube, Linkedin, MessageSquare, MessageCircle } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Trainings", path: "/trainings" },
    { name: "Success Stories", path: "/success-stories" },
    { name: "Contact", path: "/contact" },
    { name: "Resources", path: "/resources" },
    { name: "Incubators", path: "/incubators" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Feedback", path: "/feedback" },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="bg-[#0f2c6f] text-white text-[10px] sm:text-xs py-2 hidden md:block border-b border-white/10">
        <div className="w-full px-4 md:px-10 lg:px-16 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <a href="tel:+923001234567" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
              <Phone className="h-3 w-3" /> <span className="hidden lg:inline">Call:</span> +92 300 1234567
            </a>
            <a href="sms:+923001234567" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
              <MessageSquare className="h-3 w-3" /> <span className="hidden lg:inline">SMS:</span> +92 300 1234567
            </a>
            <a href="https://wa.me/923001234567" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
              <MessageCircle className="h-3.5 w-3.5" /> <span className="hidden lg:inline">WhatsApp:</span> +92 300 1234567
            </a>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-blue-200 transition-colors" title="Facebook"><Facebook className="h-3.5 w-3.5" /></a>
              <a href="#" className="hover:text-blue-200 transition-colors" title="Instagram"><Instagram className="h-3.5 w-3.5" /></a>
              <a href="#" className="hover:text-blue-200 transition-colors" title="YouTube"><Youtube className="h-3.5 w-3.5" /></a>
              <a href="#" className="hover:text-blue-200 transition-colors" title="LinkedIn"><Linkedin className="h-3.5 w-3.5" /></a>
            </div>
            <div className="h-3 w-[1px] bg-white/20 mx-1 hidden sm:block" />
            <a href="mailto:info@globalcollege.edu.pk" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors hidden sm:flex">
              <Mail className="h-3 w-3" /> info@globalcollege.edu.pk
            </a>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="flex items-center h-20">
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shadow-md">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="font-black text-2xl text-gray-900 leading-none block">Global College</span>
                  <span className="text-sm font-semibold text-gray-500 leading-none block mt-1">Learning Management System</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Shifted Right with a large gap */}
            <div className="hidden md:flex items-center space-x-8 ml-20">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-base font-bold transition-all hover:text-primary relative group ${
                    location === link.path
                      ? "text-primary"
                      : "text-gray-600"
                  }`}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full ${location === link.path ? 'w-full' : ''}`} />
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-4 ml-auto">
              {user ? (
                <>
                  <div className="flex flex-col items-end mr-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Welcome back</span>
                    <span className="text-sm font-bold text-gray-900">{user.name.split(" ")[0]}</span>
                  </div>
                  <Link href={user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/dashboard"}>
                    <Button variant="outline" size="default" className="font-bold border-2 rounded-xl">Dashboard</Button>
                  </Link>
                  <Button 
                    onClick={() => {
                      logout();
                      setTimeout(() => {
                        window.location.href = "/login";
                      }, 100);
                    }} 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="font-bold text-gray-600 hover:text-primary">Log in</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-black px-10 h-12 rounded-xl shadow-lg shadow-orange-500/20">
                      Enroll Free
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t bg-white shadow-lg">
            <div className="px-4 pt-3 pb-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                    location === link.path
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Mobile contact info */}
              <div className="pt-3 pb-1 border-t border-gray-100 space-y-2 text-xs text-gray-500 px-3">
                <a href="tel:+923001234567" className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-primary" /> +92 300 1234567
                </a>
              </div>

              <div className="pt-2 flex flex-col gap-2 px-1">
                {user ? (
                  <>
                    <Link
                      href={user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/dashboard"}
                      onClick={() => setIsOpen(false)}
                    >
                      <Button variant="outline" className="w-full">Dashboard</Button>
                    </Link>
                    <Button
                      onClick={() => { 
                        console.log("Mobile logout clicked");
                        logout(); 
                        setIsOpen(false); 
                        setTimeout(() => {
                          window.location.href = "/login";
                        }, 100);
                      }}
                      variant="ghost"
                      className="w-full text-red-500"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">Log in</Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                        Enroll Free
                      </Button>
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
