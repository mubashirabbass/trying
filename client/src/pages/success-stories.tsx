import { useState, useMemo } from "react";
import { MainLayout } from "@/components/MainLayout";
import { 
  useListSuccessStories, 
  useListSuccessStoryCategories 
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, TrendingUp, DollarSign, ShoppingCart, ArrowRight, User, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function SuccessStories() {
  const { data: successStories, isLoading: storiesLoading } = useListSuccessStories();
  const { data: categories, isLoading: catsLoading } = useListSuccessStoryCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const displaySuccessStories = successStories || [];

  const filteredStories = useMemo(() => {
    return displaySuccessStories.filter((story: any) => {
      if (story.isHidden) return false; // Extra safety — API already filters these
      if (selectedCategoryId === "all") return true;
      return Number(story.categoryId) === Number(selectedCategoryId);
    });
  }, [displaySuccessStories, selectedCategoryId]);

  return (
    <MainLayout>
      {/* ── Hero Section ── */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-[#0f172a]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent" />
        <div className="max-w-screen-xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-4 py-1 mb-6 text-sm">
              Student Hall of Fame
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Real People. <span className="text-primary">Real Results.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Discover how our students transitioned from beginners to professional digital entrepreneurs 
              and global top-rated freelancers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Filter Bar ── */}
      <div className="sticky top-[60px] z-40 bg-white border-b py-4 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 overflow-x-auto">
          <div className="flex items-center gap-2 pb-1">
            <button
              onClick={() => setSelectedCategoryId("all")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                selectedCategoryId === "all"
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Stories
            </button>
            {categories?.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedCategoryId === cat.id
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stories Grid ── */}
      <section className="py-20 bg-gray-50 min-h-[600px]">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredStories.map((story: any) => (
                <motion.div
                  key={story.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card 
                    className="group relative overflow-hidden bg-white border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl h-full flex flex-col cursor-pointer transform hover:-translate-y-2"
                    onClick={() => {
                      if (story.externalLink && (story.externalLink.startsWith("http://") || story.externalLink.startsWith("https://"))) {
                        window.open(story.externalLink, "_blank");
                      } else {
                        setSelectedStory(story);
                        setDetailOpen(true);
                      }
                    }}
                  >
                    {/* Top Green Profile Header */}
                    <div className="bg-[#0b965c] p-6 text-white flex flex-col justify-between relative overflow-hidden">
                      {/* Subtle micro-animation background radial highlight */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-60 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                      
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="h-16 w-16 rounded-full border-2 border-white overflow-hidden shadow-lg bg-white/10 flex-shrink-0 flex items-center justify-center">
                          {story.image ? (
                            <img 
                              src={story.image} 
                              alt={story.studentName} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-8 w-8 text-white/60" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-white font-extrabold text-lg leading-tight tracking-wide">{story.studentName}</h4>
                          <p className="text-emerald-100 text-xs font-semibold mt-0.5">{story.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 mt-4 relative z-10">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>

                    <CardContent className="p-6 flex-1 flex flex-col justify-between">
                      {/* Italic Achievement Bold Quote */}
                      <div className="mb-4">
                        <p className="text-slate-800 font-bold text-base leading-relaxed text-left italic">
                          "{story.achievement || "Remarkable Career Growth"}"
                        </p>
                      </div>

                      {/* Three Stat Cards Grid */}
                      <div className="grid grid-cols-3 gap-2.5 my-4">
                        {/* Stat Card 1 */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 text-center flex flex-col justify-between min-h-[90px] hover:bg-white hover:border-emerald-100 hover:shadow-sm transition-all">
                          <div className="flex items-center justify-center text-emerald-600 font-bold mb-1">
                            <DollarSign className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-black text-slate-800 leading-tight block truncate">{story.metric1Value || "100%"}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-normal block truncate">{story.metric1Label || "Earned"}</span>
                        </div>
                        {/* Stat Card 2 */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 text-center flex flex-col justify-between min-h-[90px] hover:bg-white hover:border-emerald-100 hover:shadow-sm transition-all">
                          <div className="flex items-center justify-center text-blue-600 font-bold mb-1">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-black text-slate-800 leading-tight block truncate">{story.metric2Value || "Active"}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-normal block truncate">{story.metric2Label || "Timeline"}</span>
                        </div>
                        {/* Stat Card 3 */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 text-center flex flex-col justify-between min-h-[90px] hover:bg-white hover:border-emerald-100 hover:shadow-sm transition-all">
                          <div className="flex items-center justify-center text-purple-600 font-bold mb-1">
                            <Award className="h-5 w-5 fill-purple-100" />
                          </div>
                          <span className="text-xs font-black text-slate-800 leading-tight block truncate">{story.metric3Value || "Elite"}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-normal block truncate">{story.metric3Label || "Results"}</span>
                        </div>
                      </div>

                      {/* Description Paragraph */}
                      <p className="text-slate-600 text-sm leading-relaxed text-left line-clamp-3 mb-6">
                        {story.description}
                      </p>

                      {/* Footer Badge and Link Indicators */}
                      <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-auto">
                        <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1 group-hover:text-emerald-700 transition-colors">
                          {story.externalLink ? "Open Post" : "Read Further"} <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <Badge className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 hover:bg-emerald-100/50 transition-colors px-3 py-1 rounded-full text-[10px]">
                          {categories?.find((c: any) => c.id === story.categoryId)?.name || story.category || "eBay Success"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {filteredStories.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border-2 border-dashed border-gray-200">
              <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Stories in this Category yet</h3>
              <p className="text-gray-500">We're currently scaling more success stories in this niche. Stay tuned!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Call to Action ── */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="max-w-screen-xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8">
            Start Your Own Success Story Today
          </h2>
          <p className="text-white/80 text-lg mb-12 max-w-2xl mx-auto">
            Join thousands of successful entrepreneurs who started their journey with Global College. 
            Your breakthrough is just one course away.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="bg-white text-primary hover:bg-gray-100 font-bold px-10 py-4 rounded-full text-lg shadow-2xl transition-transform hover:scale-105 active:scale-95">
              Explore All Courses
            </button>
            <button className="bg-orange-500 text-white hover:bg-orange-600 font-bold px-10 py-4 rounded-full text-lg shadow-2xl transition-transform hover:scale-105 active:scale-95">
              Get Free Consultation
            </button>
          </div>
        </div>
      </section>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0 rounded-3xl border-none shadow-2xl">
          {selectedStory && (
            <div className="flex flex-col">
              {/* Header */}
              <div className="bg-[#0b965c] p-8 text-white relative">
                <div className="flex items-center gap-5">
                  <div className="h-20 w-20 rounded-full border-4 border-white/20 overflow-hidden shadow-lg bg-white/10 flex-shrink-0 flex items-center justify-center">
                    {selectedStory.image ? (
                      <img src={selectedStory.image} alt={selectedStory.studentName} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-white/60" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold text-2xl leading-tight">{selectedStory.studentName}</h3>
                    <p className="text-emerald-100 text-base font-semibold mt-1">{selectedStory.title}</p>
                    <div className="flex items-center gap-0.5 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto bg-slate-50/50">
                {selectedStory.achievement && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <p className="text-slate-800 font-extrabold text-lg leading-relaxed italic text-center">
                      "{selectedStory.achievement}"
                    </p>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                    <div className="flex items-center justify-center text-emerald-600 font-semibold mb-2">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <span className="text-base font-black text-slate-800 block">{selectedStory.metric1Value || "100%"}</span>
                    <span className="text-xs text-slate-400 font-bold uppercase mt-1 block">{selectedStory.metric1Label || "Earned"}</span>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                    <div className="flex items-center justify-center text-blue-600 font-semibold mb-2">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <span className="text-base font-black text-slate-800 block">{selectedStory.metric2Value || "Active"}</span>
                    <span className="text-xs text-slate-400 font-bold uppercase mt-1 block">{selectedStory.metric2Label || "Timeline"}</span>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                    <div className="flex items-center justify-center text-purple-600 font-semibold mb-2">
                      <Award className="h-6 w-6" />
                    </div>
                    <span className="text-base font-black text-slate-800 block">{selectedStory.metric3Value || "Elite"}</span>
                    <span className="text-xs text-slate-400 font-bold uppercase mt-1 block">{selectedStory.metric3Label || "Results"}</span>
                  </div>
                </div>

                {/* Detailed Narrative */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">The Journey</h4>
                  <p className="text-slate-600 text-base leading-relaxed whitespace-pre-line">
                    {selectedStory.description}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-2">
                    {selectedStory.course && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-100">
                        {selectedStory.course}
                      </Badge>
                    )}
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 px-4 py-1 rounded-full text-xs">
                    {categories?.find((c: any) => c.id === selectedStory.categoryId)?.name || selectedStory.category || "Achiever"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
