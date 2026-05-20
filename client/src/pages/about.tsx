import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Loader2, User, X, Mail, BookOpen, Briefcase, Award } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function About() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/teachers/public`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTeachers(data);
        } else {
          setTeachers([]);
          console.error("API returned non-array:", data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <MainLayout>
      <div className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">About Global College</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Empowering the next generation of digital professionals in Pakistan.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-gray-600 mb-4 text-lg">
              At Global College, we believe that high-quality tech education should be accessible to everyone. Our mission is to bridge the skills gap in Pakistan by providing industry-relevant training in Information Technology, Graphic Design, Freelancing, and Artificial Intelligence.
            </p>
            <p className="text-gray-600 text-lg">
              We focus on practical, hands-on learning that prepares our students for real-world challenges and helps them build successful careers in the global digital economy.
            </p>
          </div>
          <div className="bg-gray-200 aspect-video rounded-xl overflow-hidden relative">
            {/* Placeholder for an image */}
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              [Campus Image]
            </div>
          </div>
        </div>

        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Our Faculty & Leadership</h2>
          
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center text-gray-500">No faculty members found.</div>
          ) : (
            <div className="relative w-full overflow-hidden py-4">
              {/* Premium Gradient Overlays */}
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

              {/* Dynamic Double-Buffer Marquee Container */}
              <div className="flex gap-8 animate-marquee hover:[animation-play-state:paused] py-4">
                {/* Buffer Segment 1 */}
                <div className="flex gap-8 shrink-0">
                  {(teachers.length < 5 ? [...teachers, ...teachers, ...teachers] : teachers).map((teacher, index) => (
                    <div
                      key={`marquee-1-${teacher.id}-${index}`}
                      onClick={() => setSelectedTeacher(teacher)}
                      className="w-[300px] shrink-0 bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center group cursor-pointer"
                    >
                      <div className="w-28 h-28 bg-gradient-to-tr from-primary to-purple-500 rounded-full mb-4 p-[3px] shadow-lg overflow-hidden flex items-center justify-center relative transition-transform duration-500 group-hover:rotate-6">
                        {teacher.avatar ? (
                          <img src={teacher.avatar} alt={teacher.name} className="w-full h-full rounded-full object-cover bg-white" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center">
                            <User className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {teacher.name}
                      </h3>
                      <p className="text-primary font-semibold text-xs uppercase tracking-wider mb-2.5 px-3 py-0.5 bg-primary/10 rounded-full">
                        {teacher.designation || "Instructor"}
                      </p>
                      <p className="text-gray-500 text-xs min-h-[32px] line-clamp-2 px-2 mb-4">
                        {teacher.specialization || "Expert Faculty Member"}
                      </p>
                      {teacher.experience && (
                        <div className="mt-auto text-[11px] text-gray-500 font-semibold bg-gray-50 px-3 py-1 rounded-md border border-gray-100">
                          {teacher.experience} Experience
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Buffer Segment 2 (Identical for seamless loops) */}
                <div className="flex gap-8 shrink-0" aria-hidden="true">
                  {(teachers.length < 5 ? [...teachers, ...teachers, ...teachers] : teachers).map((teacher, index) => (
                    <div
                      key={`marquee-2-${teacher.id}-${index}`}
                      onClick={() => setSelectedTeacher(teacher)}
                      className="w-[300px] shrink-0 bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center group cursor-pointer"
                    >
                      <div className="w-28 h-28 bg-gradient-to-tr from-primary to-purple-500 rounded-full mb-4 p-[3px] shadow-lg overflow-hidden flex items-center justify-center relative transition-transform duration-500 group-hover:rotate-6">
                        {teacher.avatar ? (
                          <img src={teacher.avatar} alt={teacher.name} className="w-full h-full rounded-full object-cover bg-white" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center">
                            <User className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {teacher.name}
                      </h3>
                      <p className="text-primary font-semibold text-xs uppercase tracking-wider mb-2.5 px-3 py-0.5 bg-primary/10 rounded-full">
                        {teacher.designation || "Instructor"}
                      </p>
                      <p className="text-gray-500 text-xs min-h-[32px] line-clamp-2 px-2 mb-4">
                        {teacher.specialization || "Expert Faculty Member"}
                      </p>
                      {teacher.experience && (
                        <div className="mt-auto text-[11px] text-gray-500 font-semibold bg-gray-50 px-3 py-1 rounded-md border border-gray-100">
                          {teacher.experience} Experience
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Teacher Profile Modal */}
      {selectedTeacher && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedTeacher(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative border border-gray-100 flex flex-col md:flex-row transform transition-all duration-300 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedTeacher(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Accent Header (Visual Splendor) */}
            <div className="md:w-2/5 bg-gradient-to-b from-primary/10 via-primary/5 to-white p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-100">
              <div className="w-32 h-32 rounded-full p-[4px] bg-gradient-to-tr from-primary to-purple-500 shadow-xl overflow-hidden mb-4 relative">
                {selectedTeacher.avatar ? (
                  <img src={selectedTeacher.avatar} alt={selectedTeacher.name} className="w-full h-full rounded-full object-cover bg-white" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center">
                    <User className="h-14 w-14 text-gray-400" />
                  </div>
                )}
              </div>

              <h4 className="text-xl font-extrabold text-gray-900 mb-1 leading-snug">{selectedTeacher.name}</h4>
              <span className="text-primary font-bold text-xs uppercase tracking-wider px-3 py-1 bg-primary/10 rounded-full mb-3 inline-block">
                {selectedTeacher.designation || "Instructor"}
              </span>

              {selectedTeacher.experience && (
                <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold bg-gray-100 px-3 py-1 rounded-full">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  <span>{selectedTeacher.experience} Experience</span>
                </div>
              )}
            </div>

            {/* Right Detail Content */}
            <div className="md:w-3/5 p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Professional Profile
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mt-3">
                    {`As an esteemed professional, ${selectedTeacher.name} serves as a ${selectedTeacher.designation || "key faculty member"} at Global College. They are dedicated to delivering a premium, hands-on learning experience that bridges academic principles with advanced industry practices.`}
                  </p>
                </div>

                {selectedTeacher.specialization && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Core Specialization
                    </h4>
                    <p className="text-gray-600 text-sm mt-1 ml-6 font-semibold">
                      {selectedTeacher.specialization}
                    </p>
                  </div>
                )}

                {selectedTeacher.qualification && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Academic Qualification
                    </h4>
                    <p className="text-gray-600 text-sm mt-1 ml-6 font-semibold">
                      {selectedTeacher.qualification}
                    </p>
                  </div>
                )}

                {selectedTeacher.email && (
                  <div className="pt-1">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Contact Email
                    </h4>
                    <a
                      href={`mailto:${selectedTeacher.email}`}
                      className="text-primary text-sm mt-1 ml-6 hover:underline font-semibold inline-block"
                    >
                      {selectedTeacher.email}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-600 active:scale-95 transition-all"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
