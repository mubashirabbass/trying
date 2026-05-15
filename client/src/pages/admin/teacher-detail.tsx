import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, Link } from "wouter";
import { 
  useGetUser, 
  useListCourses 
} from "@workspace/api-client-react";
import { 
  Loader2, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  BookOpen, 
  Users, 
  Star,
  CheckCircle2,
  GraduationCap,
  AlertCircle,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminTeacherDetail() {
  const { id } = useParams();
  const teacherId = id ? Number(id) : 0;

  const { data: teacher, isLoading: userLoading } = useGetUser({ id: teacherId });
  
  // Filter courses by teacherId
  const { data: allCourses = [], isLoading: coursesLoading } = useListCourses({});
  const teacherCourses = allCourses.filter((c: any) => c.teacherId === teacherId);

  if (userLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!teacher || teacher.role !== 'teacher') {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Teacher Not Found</h2>
          <p className="text-gray-500 mt-2">The teacher you are looking for does not exist or is not registered as faculty.</p>
          <Link href="/admin/teachers">
            <Button className="mt-6">Back to Teachers</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link href="/admin/teachers">
          <Button variant="ghost" className="mb-4 text-gray-500 hover:text-gray-900 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Faculty List
          </Button>
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-[32px] bg-indigo-50 flex items-center justify-center text-indigo-600 text-4xl font-black shadow-inner">
              {teacher.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-gray-900">{teacher.name}</h1>
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100">
                  Teacher
                </Badge>
              </div>
              <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                Faculty ID: #INST-{teacher.id} • Registered {new Date(teacher.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl font-bold">Edit Faculty Info</Button>
            <Button variant="outline" className="rounded-xl font-bold text-primary border-primary/20 hover:bg-primary/5">Reset Password</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Faculty Statistics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-2xl font-black text-gray-900">{teacherCourses.length}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Courses Taught</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-2xl font-black text-gray-900">
                  {teacherCourses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0)}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Students</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Email Address</p>
                  <p className="font-bold text-gray-900 text-sm">{teacher.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Phone Number</p>
                  <p className="font-bold text-gray-900 text-sm">{teacher.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Primary Branch</p>
                  <p className="font-bold text-gray-900 text-sm">{teacher.branchName || "Main Campus"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Assigned Courses */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-gray-50 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-black text-gray-900">Assigned Courses</CardTitle>
              <Badge className="bg-primary/10 text-primary font-bold">{teacherCourses.length} Courses</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest pl-6">Course Details</TableHead>
                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Category</TableHead>
                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Students</TableHead>
                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coursesLoading ? (
                    <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
                  ) : teacherCourses.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-gray-500 font-medium">No courses assigned to this teacher.</TableCell></TableRow>
                  ) : (
                    teacherCourses.map((course: any) => (
                      <tr key={course.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <BookOpen className="h-5 w-5 text-gray-400" />
                            </div>
                            <span className="font-bold text-gray-900">{course.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{course.category}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-gray-700">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            {course.enrolledCount || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={
                            course.status === 'live' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            course.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-gray-50 text-gray-500 border-gray-100"
                          }>
                            {course.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/courses/${course.id}/edit`}>
                            <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/5 rounded-xl">View Details</Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
