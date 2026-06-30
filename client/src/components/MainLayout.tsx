import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Link } from "wouter";
import { WhatsAppButton } from "./WhatsAppButton";
import { useSettings } from "@/lib/SettingsContext";
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react";

export function MainLayout({ children }: { children: ReactNode }) {
  const { get } = useSettings();

  const siteName    = get("site_name",    "Global College");
  const sitePhone   = get("site_phone",   "+92 300 1234567");
  const siteEmail   = get("site_email",   "info@globalcollege.edu.pk");
  const siteAddress = get("site_address", "123 Education Street, Lahore");
  const siteFacebook  = get("site_facebook",  "#");
  const siteInstagram = get("site_instagram", "#");
  const siteYoutube   = get("site_youtube",   "#");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow flex flex-col">{children}</main>
      
      {/* Dynamic WhatsApp Float Button — fetches number from admin settings */}
      <WhatsAppButton />

      <footer className="bg-[#0b1e4a] text-gray-300 py-14 border-t border-[#1a3570] mt-auto">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white text-sm font-bold">GC</span>
                </div>
                {siteName}
              </h3>
              <p className="text-sm text-gray-400">
                Empowering students with world-class education in IT, Graphics, and AI.
              </p>
              <div className="flex space-x-4">
                <a href={siteFacebook} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
                <a href={siteInstagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
                <a href={siteYoutube} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors"><Youtube className="h-5 w-5" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/courses" className="hover:text-white transition-colors">Browse Courses</Link></li>
                <li><Link href="/branches" className="hover:text-white transition-colors">Our Campuses</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/verify-certificate" className="hover:text-white transition-colors">Verify Certificate</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Popular Courses</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/courses?category=IT" className="hover:text-white transition-colors">Computer Basics</Link></li>
                <li><Link href="/courses?category=Graphics" className="hover:text-white transition-colors">Graphic Design</Link></li>
                <li><Link href="/courses?category=Freelancing" className="hover:text-white transition-colors">Freelancing</Link></li>
                <li><Link href="/courses?category=AI" className="hover:text-white transition-colors">Artificial Intelligence</Link></li>
                <li><Link href="/courses?category=Web" className="hover:text-white transition-colors">Web Development</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Contact Info</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <span>{siteAddress}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <a href={`tel:${sitePhone.replace(/\s/g, "")}`} className="hover:text-white transition-colors">{sitePhone}</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <a href={`mailto:${siteEmail}`} className="hover:text-white transition-colors">{siteEmail}</a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} {siteName} LMS. All rights reserved. | Developed by <a href="#" className="hover:text-white transition-colors font-semibold">MB soft and tech</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
