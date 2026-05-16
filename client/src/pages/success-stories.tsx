import { useState, useMemo } from "react";
import { MainLayout } from "@/components/MainLayout";
import { 
  useListSuccessStories, 
  useListSuccessStoryCategories 
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, TrendingUp, DollarSign, ShoppingCart, ArrowRight, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SuccessStories() {
  const { data: successStories, isLoading: storiesLoading } = useListSuccessStories();
  const { data: categories, isLoading: catsLoading } = useListSuccessStoryCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");

  const displaySuccessStories = (successStories && successStories.length > 0) ? successStories : [
    {
      id: 1,
      studentName: "Saif Ur Rehman",
      title: "Amazon FBA Expert",
      description: "Successfully built a 7-figure Amazon business within 12 months of joining our course.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      course: "Amazon FBA",
      achievement: "Top Rated Seller",
      rating: "5",
      category: "Amazon",
      metric1Value: "$10k+",
      metric1Label: "Monthly Sales",
      metric2Value: "500+",
      metric2Label: "Orders/Month",
      metric3Value: "4.8",
      metric3Label: "Avg Rating"
    },
    {
      id: 2,
      studentName: "Ayesha Khan",
      title: "eBay Growth Specialist",
      description: "Scaled her eBay store to over 100 orders per day using our dropshipping strategies.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      course: "eBay Mastery",
      achievement: "Power Seller",
      rating: "5",
      category: "eBay",
      metric1Value: "100+",
      metric1Label: "Daily Orders",
      metric2Value: "95%",
      metric2Label: "Growth Rate",
      metric3Value: "Top",
      metric3Label: "Seller Tier"
    }
  ];

  const filteredStories = useMemo(() => {
    return displaySuccessStories.filter((story: any) => {
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
                  <Card className="group relative overflow-hidden bg-white border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl h-full flex flex-col">
                    {/* Top Accent Line */}
                    <div className="h-2 w-full bg-primary absolute top-0 left-0" />
                    
                    {/* Image Header */}
                    <div className="relative h-64 overflow-hidden">
                      {story.image ? (
                        <img 
                          src={story.image} 
                          alt={story.studentName} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <User className="h-20 w-20 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Floating Badge */}
                      <div className="absolute bottom-4 left-4">
                        <Badge className="bg-white/90 backdrop-blur text-primary font-bold shadow-lg text-[10px] uppercase tracking-wider px-3 py-1 border-none">
                          {categories?.find((c: any) => c.id === story.categoryId)?.name || story.category || "Achiever"}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-8 flex-1 flex flex-col">
                      {/* Header */}
                      <div className="mb-6">
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {story.studentName}
                        </h3>
                        <p className="text-primary font-semibold text-sm">
                          {story.title}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 mb-8 line-clamp-3 leading-relaxed italic">
                        "{story.description}"
                      </p>

                      {/* Stats Section */}
                      <div className="mt-auto pt-8 border-t border-gray-100 grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-50 mx-auto mb-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="text-sm font-extrabold text-gray-900">
                            {story.metric1Value || "100%"}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium uppercase truncate">
                            {story.metric1Label || "Success"}
                          </div>
                        </div>
                        
                        <div className="text-center border-x border-gray-100">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 mx-auto mb-2">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="text-sm font-extrabold text-gray-900">
                            {story.metric2Value || "Top"}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium uppercase truncate">
                            {story.metric2Label || "Earner"}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-50 mx-auto mb-2">
                            <ShoppingCart className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="text-sm font-extrabold text-gray-900">
                            {story.metric3Value || "Elite"}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium uppercase truncate">
                            {story.metric3Label || "Orders"}
                          </div>
                        </div>
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
    </MainLayout>
  );
}
