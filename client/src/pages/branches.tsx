import { useListBranches } from "@workspace/api-client-react";
import { Loader2, MapPin, Phone, Building2, CheckCircle2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Reuse the public Navbar from home — import it or inline a simple one
function PublicNav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-black text-gray-900 text-sm leading-tight">Global College</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">of Emerging Technologies</p>
          </div>
        </a>
        <div className="flex items-center gap-4">
          <a href="/courses" className="text-sm font-bold text-gray-600 hover:text-primary transition-colors">Courses</a>
          <a href="/about" className="text-sm font-bold text-gray-600 hover:text-primary transition-colors">About</a>
          <a href="/contact" className="text-sm font-bold text-gray-600 hover:text-primary transition-colors">Contact</a>
          <a href="/login" className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
            Login
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function BranchesPage() {
  const { data: branches = [], isLoading } = useListBranches();

  const activeBranches = branches.filter((b: any) => b.isActive !== false);

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />

      {/* Hero */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-blue-900/20 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <Badge className="bg-primary/20 text-primary border-primary/30 font-bold uppercase tracking-widest mb-6 px-4 py-1.5">
            Our Campuses
          </Badge>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-6">
            We're Available <br />
            <span className="text-primary">Across Pakistan</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Global College has {activeBranches.length} active campuses serving students across major cities.
            Find your nearest branch and start your learning journey today.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Active Campuses", value: activeBranches.length, icon: Building2 },
              { label: "Cities Covered", value: new Set(activeBranches.map((b: any) => b.city)).size, icon: MapPin },
              { label: "Total Students", value: "5,000+", icon: Users },
              { label: "Courses Available", value: "20+", icon: CheckCircle2 },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-black text-gray-900">{stat.value}</div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Branches Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
          </div>
        ) : activeBranches.length === 0 ? (
          <div className="text-center py-24">
            <Building2 className="h-16 w-16 text-gray-200 mx-auto mb-6" />
            <p className="text-gray-400 font-bold text-xl">No campuses listed yet.</p>
            <p className="text-gray-400 mt-2">Please check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBranches.map((branch: any, idx: number) => (
              <Card
                key={branch.id}
                className="border-none shadow-sm ring-1 ring-gray-100 rounded-[28px] overflow-hidden hover:ring-primary/30 hover:shadow-xl transition-all group"
              >
                {/* Color bar */}
                <div className={`h-2 ${idx % 3 === 0 ? "bg-primary" : idx % 3 === 1 ? "bg-indigo-500" : "bg-emerald-500"}`} />

                <CardContent className="p-7">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      idx % 3 === 0 ? "bg-primary/10 text-primary" :
                      idx % 3 === 1 ? "bg-indigo-50 text-indigo-600" :
                      "bg-emerald-50 text-emerald-600"
                    }`}>
                      <Building2 className="h-7 w-7" />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </Badge>
                  </div>

                  <h2 className="text-xl font-black text-gray-900 mb-1 group-hover:text-primary transition-colors">
                    {branch.name}
                  </h2>
                  <p className="text-sm font-bold text-gray-400 mb-5 uppercase tracking-widest">{branch.city}</p>

                  <div className="space-y-3">
                    {branch.address && (
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">{branch.address}</p>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <a href={`tel:${branch.phone}`} className="text-sm text-gray-600 font-bold hover:text-primary transition-colors">
                          {branch.phone}
                        </a>
                      </div>
                    )}
                    {branch.studentCount !== undefined && (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-bold">
                          {branch.studentCount.toLocaleString()} Students Enrolled
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-50">
                    <a href="/contact" className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                      idx % 3 === 0 ? "bg-primary/10 text-primary hover:bg-primary hover:text-white" :
                      idx % 3 === 1 ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white" :
                      "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                    }`}>
                      <MapPin className="h-4 w-4" />
                      Get Directions
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-primary text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black mb-4">Ready to Start Learning?</h2>
          <p className="text-primary-foreground/80 text-lg font-medium mb-8 max-w-xl mx-auto">
            Visit your nearest campus or enroll online today. Our courses are available both in-person and remotely.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/courses" className="px-8 py-3.5 rounded-xl bg-white text-primary font-black hover:bg-white/90 transition-colors">
              Browse Courses
            </a>
            <a href="/register" className="px-8 py-3.5 rounded-xl bg-white/10 border border-white/30 text-white font-black hover:bg-white/20 transition-colors">
              Register Free
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
