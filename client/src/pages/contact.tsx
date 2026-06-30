import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { useSettings } from "@/lib/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function Contact() {
  const { toast } = useToast();
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const { get } = useSettings();

  const sitePhone = get("site_phone", "+92 300 1234567");
  const siteWhatsapp = get("site_whatsapp", "923001234567");
  const siteEmail = get("site_email", "info@globalcollege.edu.pk");
  const siteAddress = get("site_address", "18 Hazari, Jhang District, Punjab, Pakistan");

  useEffect(() => {
    fetch(`${BASE_URL}/api/branches`)
      .then(res => res.json())
      .then(data => {
        setBranches(data);
        setLoadingBranches(false);
      })
      .catch(() => setLoadingBranches(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message sent!",
      description: "We will get back to you as soon as possible.",
    });
    // Reset form logic would go here
  };

  return (
    <MainLayout>
      <div className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Have questions? We're here to help you start your educational journey.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Get In Touch</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Main Campus</h3>
                  <p className="text-gray-600 mt-1">{siteAddress}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Phone & WhatsApp</h3>
                  <p className="text-gray-600 mt-1">
                    <a href={`tel:${sitePhone.replace(/\s/g, "")}`} className="hover:underline">{sitePhone}</a>
                    <br />
                    <a href={`https://wa.me/${siteWhatsapp}`} className="hover:underline" target="_blank" rel="noreferrer">WhatsApp: {sitePhone}</a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Email</h3>
                  <p className="text-gray-600 mt-1">
                    <a href={`mailto:${siteEmail}`} className="hover:underline">{siteEmail}</a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Office Hours</h3>
                  <p className="text-gray-600 mt-1">Monday - Saturday: 8:00 AM - 4:00 PM<br />Sunday: Closed</p>
                </div>
              </div>
            </div>
            
            {/* Map Embed Section */}
            <div className="mt-10 bg-gray-200 h-64 rounded-xl w-full flex items-center justify-center text-gray-500 overflow-hidden border">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3403.220123456789!2d72.0953338!3d31.1619472!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39238334fa95cf0b%3A0x8d18e20da5992720!2sGLOBAL%20COLLEGE%20OF%20COMPUTER%20SCIENCE%2018%20HAZARI%20JHANG!5e0!3m2!1sen!2spk!4v1715830000000!5m2!1sen!2spk" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-xl border shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" required placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" required placeholder="Doe" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" required placeholder="john@example.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+92 300 1234567" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" required placeholder="Course Inquiry" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  required 
                  placeholder="How can we help you?" 
                  rows={5}
                />
              </div>
              
              <Button type="submit" className="w-full" size="lg">Send Message</Button>
            </form>
          </div>

        </div>
      </div>

      {/* Sub Campuses Section */}
      <div className="bg-slate-50 border-t border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black mb-4">We Are Also Available Here</h2>
          <p className="text-gray-500 max-w-2xl mx-auto mb-12">
            Visit any of our physical sub-campuses and physical incubators across Pakistan for in-person support, registration, and training.
          </p>
          
          {loadingBranches ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : branches.length === 0 ? (
            <div className="text-gray-400">No sub-campuses available at the moment.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {branches.map(branch => (
                <div key={branch.id} className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all flex items-start gap-4 group">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{branch.name}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{branch.address}, {branch.city}</p>
                    <div className="flex items-center gap-2 mt-3 text-sm font-semibold text-emerald-600">
                      <Phone className="h-4 w-4" /> {branch.phone}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
