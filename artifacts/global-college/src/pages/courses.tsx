import { MainLayout } from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useListCourses, getListCoursesQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { Loader2, Search, Clock, GraduationCap, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Courses() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  
  const { data: courses, isLoading } = useListCourses(
    { search: search || undefined, category },
    { query: { queryKey: getListCoursesQueryKey({ search: search || undefined, category }) } }
  );

  const categories = ["IT", "Graphics", "Freelancing", "AI", "MS Office"];

  return (
    <MainLayout>
      <div className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Our Courses</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Discover a wide range of professional courses designed to boost your career.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search courses..." 
              className="pl-10 h-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto hide-scrollbar">
            <Button 
              variant={category === undefined ? "default" : "outline"}
              onClick={() => setCategory(undefined)}
              className="whitespace-nowrap"
            >
              All
            </Button>
            {categories.map(c => (
              <Button 
                key={c}
                variant={category === c ? "default" : "outline"}
                onClick={() => setCategory(c)}
                className="whitespace-nowrap"
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : courses?.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-xl border border-gray-200">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses?.map((course) => (
              <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                      <BookOpenIcon className="h-12 w-12 opacity-50" />
                    </div>
                  )}
                  {course.isFeatured && (
                    <Badge className="absolute top-4 right-4 bg-yellow-500 hover:bg-yellow-600 text-white border-none">
                      Featured
                    </Badge>
                  )}
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                      {course.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <p className="text-gray-600 line-clamp-3 mb-6">{course.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold text-gray-900">
                        {course.isFree ? "Free" : `Rs. ${course.fee}`}
                      </span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-4 border-t">
                  <Link href={`/courses/${course.id}`} className="w-full">
                    <Button className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// Inline icon component to avoid extra imports if not available
function BookOpenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
