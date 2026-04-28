import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  return (
    <MainLayout>
      <div className="bg-primary text-white py-24 text-center">
        <h1 className="text-5xl font-bold mb-6">Empower Your Future with Global College</h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of students building their careers in IT, Graphic Design, Freelancing, and AI.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/courses">
            <Button size="lg" variant="secondary" className="font-semibold">Enroll Now</Button>
          </Link>
          <Link href="/courses">
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10 font-semibold">Watch Free Videos</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
            <h3 className="text-xl font-bold mb-2">Expert Instructors</h3>
            <p className="text-gray-600">Learn from industry professionals with years of real-world experience.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
            <h3 className="text-xl font-bold mb-2">Practical Projects</h3>
            <p className="text-gray-600">Build a strong portfolio with hands-on assignments and real client work.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
            <h3 className="text-xl font-bold mb-2">Verified Certification</h3>
            <p className="text-gray-600">Get a prestigious certificate upon completion, verifiable online anytime.</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
