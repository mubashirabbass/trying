import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, Link } from "wouter";
import { 
  useGetUser, 
  useListEnrollments, 
  useListPayments,
  useDeleteEnrollment,
  getListEnrollmentsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  BookOpen, 
  CreditCard, 
  FileText, 
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminStudentDetail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { id } = useParams();
  const studentId = id ? Number(id) : 0;

  const { data: student, isLoading: userLoading } = useGetUser({ id: studentId });
  
  const { data: enrollments = [], isLoading: enrollLoading } = useListEnrollments({ userId: studentId });
  const { data: payments = [], isLoading: payLoading } = useListPayments({ userId: studentId });

  const unenrollMutation = useDeleteEnrollment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey({ userId: studentId }) });
        toast({ title: "Student unenrolled successfully" });
      },
      onError: (err: any) => toast({ title: err?.response?.data?.message || "Failed to unenroll", variant: "destructive" }),
    }
  });

  const handleUnenroll = (enrollId: number) => {
    if (confirm("Are you sure you want to unenroll this student? This action cannot be undone.")) {
      unenrollMutation.mutate({ id: enrollId });
    }
  };

  if (userLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Student Not Found</h2>
          <p className="text-gray-500 mt-2">The student you are looking for does not exist or has been removed.</p>
          <Link href="/admin/users">
            <Button className="mt-6">Back to Students</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link href="/admin/users">
          <Button variant="ghost" className="mb-4 text-gray-500 hover:text-gray-900 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Student List
          </Button>
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary text-4xl font-black shadow-inner">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-gray-900">{student.name}</h1>
                <Badge className={student.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}>
                  {student.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                Student ID: #STU-{student.id} • Joined {new Date(student.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl font-bold">Edit Profile</Button>
            <Button className={student.isActive ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border-none font-bold shadow-none" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none font-bold shadow-none"}>
              {student.isActive ? "Deactivate Account" : "Activate Account"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info Cards */}
        <div className="space-y-6">
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
                  <p className="font-bold text-gray-900">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Phone Number</p>
                  <p className="font-bold text-gray-900">{student.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Campus Branch</p>
                  <p className="font-bold text-gray-900">{student.branchName || "Global / Online"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Identity Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`h-6 w-6 ${student.isIdentityVerified ? "text-emerald-400" : "text-amber-400"}`} />
                  <div>
                    <p className="font-bold">{student.isIdentityVerified ? "Verified" : "Unverified"}</p>
                    <p className="text-xs text-slate-400">Identity Documents</p>
                  </div>
                </div>
                {!student.isIdentityVerified && (
                  <Button size="sm" variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10 h-8 text-xs font-bold">
                    Verify Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Content Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="enrollments" className="space-y-6">
            <TabsList className="bg-white p-1 rounded-2xl shadow-sm ring-1 ring-gray-100 w-full justify-start h-14">
              <TabsTrigger value="enrollments" className="rounded-xl h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                <BookOpen className="h-4 w-4 mr-2" /> Enrollments
              </TabsTrigger>
              <TabsTrigger value="payments" className="rounded-xl h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                <CreditCard className="h-4 w-4 mr-2" /> Payments
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-xl h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                <Clock className="h-4 w-4 mr-2" /> Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enrollments">
              <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Course</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Enrolled Date</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Progress</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollLoading ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
                    ) : enrollments.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center text-gray-500 font-medium">No courses enrolled yet.</TableCell></TableRow>
                    ) : (
                      enrollments.map((enr: any) => (
                        <tr key={enr.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4 font-bold text-gray-900">{enr.courseName || `Course #${enr.courseId}`}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">{new Date(enr.enrolledAt).toLocaleDateString()}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${enr.progress || 0}%` }} />
                              </div>
                              <span className="text-xs font-black text-primary">{enr.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-rose-600 font-bold hover:bg-rose-50 rounded-xl"
                              onClick={() => handleUnenroll(enr.id)}
                              disabled={unenrollMutation.isPending}
                            >
                              {unenrollMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unenroll"}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Payment ID</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Amount</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Method</TableHead>
                      <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payLoading ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
                    ) : payments.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center text-gray-500 font-medium">No payment history found.</TableCell></TableRow>
                    ) : (
                      payments.map((pay: any) => (
                        <tr key={pay.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4 font-mono text-xs font-bold text-gray-500 uppercase">#PAY-{pay.id}</td>
                          <td className="px-4 py-4 font-black text-gray-900">Rs. {pay.amount.toLocaleString()}</td>
                          <td className="px-4 py-4">
                            <Badge variant="outline" className="capitalize border-slate-200">{pay.method?.replace('_', ' ') || 'Unknown'}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={
                              pay.status === 'approved' ? "bg-emerald-50 text-emerald-700" :
                              pay.status === 'pending' ? "bg-amber-50 text-amber-700" :
                              "bg-rose-50 text-rose-700"
                            }>
                              {pay.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
               <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] p-8 text-center text-gray-400">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  <p className="font-bold">Coming Soon</p>
                  <p className="text-sm">Detailed student activity logs will be available here.</p>
               </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
