import { MainLayout } from "@/components/MainLayout";
import { Shield, Lock, Eye, FileText, ChevronRight } from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "May 15, 2026";

  const sections = [
    {
      title: "1. Information We Collect",
      icon: Eye,
      content: "We collect information you provide directly to us when you create an account, enroll in a course, or communicate with us. This includes your name, email address, phone number, CNIC/Form-B for identity verification, and payment receipts."
    },
    {
      title: "2. How We Use Your Information",
      icon: FileText,
      content: "We use the information we collect to provide, maintain, and improve our services, including processing enrollments, verifying identities for certification, and sending you technical notices, updates, and security alerts."
    },
    {
      title: "3. Data Security",
      icon: Shield,
      content: "We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. Your YouTube video access is protected via signed tokens and AES-256 encryption."
    },
    {
      title: "4. Your Choices",
      icon: Lock,
      content: "You may update your profile information at any time by logging into your account. You can also request the deletion of your personal data, subject to certain legal obligations."
    }
  ];

  return (
    <MainLayout>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-gray-500 font-medium text-lg">Last Updated: {lastUpdated}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-slate max-w-none">
          <p className="text-gray-600 text-lg leading-relaxed mb-12">
            At Global College, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our Learning Management System.
          </p>

          <div className="space-y-12">
            {sections.map((section, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <section.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 m-0">{section.title}</h2>
                </div>
                <div className="pl-16">
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {section.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-gray-50 rounded-[32px] border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h3>
            <p className="text-gray-600 mb-6">
              If you have any questions about this Privacy Policy, please contact our data protection team:
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span className="font-bold text-gray-900">privacy@globalcollege.edu.pk</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <span className="font-bold text-gray-900">+92 300 1234567</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
