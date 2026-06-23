import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useListCourses, useListEnrollments, useCreateEnrollment, getListEnrollmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import {
  Loader2,
  Search,
  BookOpen,
  Clock,
  Users,
  Star,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
  Tag,
} from "lucide-react";

// Fetch CATEGORIES dynamically from the server inside the component

export default function StudentBrowse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState("newest");

  const { data: dbCategories = [] } = useQuery<any[]>({
    queryKey: ["course-categories"],
    queryFn: async () => {
      const res = await fetch("/api/course-categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    }
  });

  const categoriesList = ["All Categories", ...dbCategories.map((c: any) => c.name)];

  const { data: courses = [], isLoading: coursesLoading } = useListCourses();
  const { data: myEnrollments = [], isLoading: enrollLoading } = useListEnrollments({ userId: user?.id });

  const enrollMutation = useCreateEnrollment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({ userId: user?.id }) });
        toast({ title: "Enrolled successfully! 🎉" });
      },
      onError: (err: any) => {
        toast({ title: err?.response?.data?.message || "Enrollment failed", variant: "destructive" });
      },
    },
  });

  const enrolledCourseIds = new Set(myEnrollments.map((e: any) => e.courseId));

  // Filter & sort
  const filtered = courses
    .filter((c: any) => c.status === "live")
    .filter((c: any) => {
      const matchSearch =
        !search || c.title.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All Categories" || c.category === category;
      const matchFree = !freeOnly || c.isFree;
      return matchSearch && matchCat && matchFree;
    })
    .sort((a: any, b: any) => {
      if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "popular") return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
      if (sort === "price-low") return (a.fee || 0) - (b.fee || 0);
      if (sort === "price-high") return (b.fee || 0) - (a.fee || 0);
      return 0;
    });

  const isLoading = coursesLoading || enrollLoading;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          Browse Courses <Sparkles className="h-7 w-7 text-amber-400" />
        </h1>
        <p className="text-gray-500 mt-1">
          Discover and enroll in new courses. {filtered.length} courses available.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 h-11 rounded-xl border-gray-200"
            placeholder="Search courses by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-52 h-11 rounded-xl border-gray-200 font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoriesList.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full md:w-48 h-11 rounded-xl border-gray-200 font-bold">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={freeOnly ? "default" : "outline"}
          className="h-11 rounded-xl font-bold gap-2 shrink-0"
          onClick={() => setFreeOnly(!freeOnly)}
        >
          <Tag className="h-4 w-4" /> Free Only
        </Button>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
          <CardContent className="py-24 text-center">
            <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-gray-400 text-lg">No courses found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course: any) => {
            const isEnrolled = enrolledCourseIds.has(course.id);

            return (
              <Card
                key={course.id}
                className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden hover:ring-primary/20 hover:shadow-xl transition-all group flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative h-44 bg-gray-100 overflow-hidden">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-gray-200" />
                    </div>
                  )}

                  {/* Badges overlay */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {course.isFree ? (
                      <Badge className="bg-emerald-500 text-white font-black shadow-lg">FREE</Badge>
                    ) : (
                      <Badge className="bg-slate-900/80 text-white font-black shadow-lg backdrop-blur-sm">
                        Rs. {Number(course.fee).toLocaleString()}
                      </Badge>
                    )}
                    {isEnrolled && (
                      <Badge className="bg-primary text-white font-black shadow-lg gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Enrolled
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-5 flex flex-col flex-1 gap-3">
                  {/* Category */}
                  <Badge variant="outline" className="self-start text-[10px] font-black uppercase tracking-wider border-gray-200">
                    {course.category}
                  </Badge>

                  {/* Title */}
                  <h3 className="font-black text-gray-900 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>

                  {/* Teacher */}
                  {course.teacherName && (
                    <p className="text-xs text-gray-400 font-bold">by {course.teacherName}</p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-bold">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {course.totalDurationHours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {course.enrollmentCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 4.8
                    </span>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Action */}
                  <div className="flex gap-2 mt-1">
                    <Link href={`/courses/${course.slug || course.id}`} className="flex-1">
                      <Button variant="outline" className="w-full rounded-xl font-bold h-10 text-sm">
                        View Details
                      </Button>
                    </Link>

                    {isEnrolled ? (
                      <Link href={`/dashboard/lessons/${course.id}`} className="flex-1">
                        <Button className="w-full rounded-xl font-bold h-10 text-sm">
                          Continue <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    ) : course.isFree ? (
                      <Button
                        className="flex-1 rounded-xl font-bold h-10 text-sm"
                        disabled={enrollMutation.isPending}
                        onClick={() => enrollMutation.mutate({ data: { courseId: course.id, userId: user?.id } as any })}
                      >
                        {enrollMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Enroll Free"
                        )}
                      </Button>
                    ) : (
                      <Link href={`/dashboard/payment/${course.id}`} className="flex-1">
                        <Button className="w-full rounded-xl font-bold h-10 text-sm">
                          Enroll Now
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
