import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail } from "lucide-react";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow flex flex-col">{children}</main>
      
      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/1234567890"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-50 flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </a>

      <footer className="bg-[#0b1e4a] text-gray-300 py-14 border-t border-[#1a3570] mt-auto">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white text-sm font-bold">GC</span>
                </div>
                Global College
              </h3>
              <p className="text-sm text-gray-400">
                Empowering students with world-class education in IT, Graphics, and AI.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white"><Facebook className="h-5 w-5" /></a>
                <a href="#" className="text-gray-400 hover:text-white"><Instagram className="h-5 w-5" /></a>
                <a href="#" className="text-gray-400 hover:text-white"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="text-gray-400 hover:text-white"><Youtube className="h-5 w-5" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/courses" className="hover:text-white transition-colors">Browse Courses</Link></li>
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
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Contact Info</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <span>123 Education Street, Tech Block, Lahore, Pakistan</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <span>+92 300 1234567</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <span>info@globalcollege.edu.pk</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Global College LMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
