import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Menu, X, BookOpen, Phone, Mail, Facebook, Instagram, Youtube } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Verify Certificate", path: "/verify-certificate" },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="bg-[#0f2c6f] text-white text-xs py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="tel:+923001234567" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
              <Phone className="h-3 w-3" /> +92 300 1234567
            </a>
            <a href="mailto:info@globalcollege.edu.pk" className="flex items-center gap-1.5 hover:text-blue-200 transition-colors">
              <Mail className="h-3 w-3" /> info@globalcollege.edu.pk
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-300">Follow us:</span>
            <a href="#" className="hover:text-blue-200 transition-colors"><Facebook className="h-3.5 w-3.5" /></a>
            <a href="#" className="hover:text-blue-200 transition-colors"><Instagram className="h-3.5 w-3.5" /></a>
            <a href="#" className="hover:text-blue-200 transition-colors"><Youtube className="h-3.5 w-3.5" /></a>
            <a
              href="https://wa.me/923001234567"
              target="_blank"
              rel="noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-0.5 rounded-full text-xs font-semibold transition-colors"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="font-extrabold text-lg text-gray-900 leading-tight block">Global College</span>
                  <span className="text-xs text-gray-500 leading-tight block">Learning Management System</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === link.path
                      ? "text-primary border-b-2 border-primary pb-0.5"
                      : "text-gray-600"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Hi, <span className="font-semibold text-gray-900">{user.name.split(" ")[0]}</span>
                  </span>
                  <Link href={user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/dashboard"}>
                    <Button variant="outline" size="sm">Dashboard</Button>
                  </Link>
                  <Button onClick={logout} variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Log in</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
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
                      onClick={() => { logout(); setIsOpen(false); }}
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
