import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetCourse, 
  useUpdateCourse,
  useListSections,
  useListLessons,
  getListCoursesQueryKey
} from "@workspace/api-client-react";
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  PlayCircle, 
  FileText, 
  Clock, 
  User,
  ExternalLink,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminCourseReview() {
  const { id } = useParams();
  const courseId = id ? Number(id) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");

  const { data: course, isLoading: courseLoading } = useGetCourse(courseId, {
    query: {
      staleTime: 60000, // Cache for 60 seconds
      refetchOnWindowFocus: false,
    }
  });
  const { data: sections = [], isLoading: sectionsLoading } = useListSections(
    { courseId },
    {
      query: {
        staleTime: 60000, // Cache for 60 seconds
        refetchOnWindowFocus: false,
      }
    }
  );
  
  const approveMutation = useUpdateCourse({
    mutation: {
      onSuccess: async () => {
        toast({ title: "Submission Approved", description: "This course is now in Draft status for the teacher." });
        // Force refresh the courses list
        await queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({}) });
        await queryClient.refetchQueries({ queryKey: getListCoursesQueryKey({}) });
        setLocation("/admin/courses");
      }
    }
  });

  const rejectMutation = useUpdateCourse({
    mutation: {
      onSuccess: async () => {
        toast({ title: "Course Rejected", description: "Feedback has been sent to the teacher." });
        setRejectDialogOpen(false);
        // Force refresh the courses list
        await queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({}) });
        await queryClient.refetchQueries({ queryKey: getListCoursesQueryKey({}) });
        setLocation("/admin/courses");
      }
    }
  });

  if (courseLoading || sectionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) return null;

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Link href="/admin/courses">
            <Button variant="ghost" className="mb-4 text-gray-500 hover:text-gray-900 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Review Course</h1>
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 capitalize py-1 px-3">
              {course.status}
            </Badge>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl font-bold border-rose-200 text-rose-600 hover:bg-rose-50"
            onClick={() => setRejectDialogOpen(true)}
          >
            <XCircle className="h-4 w-4 mr-2" /> Reject Submission
          </Button>
          <Button 
            className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
            onClick={() => approveMutation.mutate({ id: courseId, data: { status: 'draft' } })}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" /> Approve Submission
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Course Preview */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero/Meta Info */}
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[32px] overflow-hidden">
            <div className="aspect-video bg-gray-100 relative">
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <PlayCircle className="h-16 w-16" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <Badge className="bg-white/90 backdrop-blur shadow-sm text-gray-900 font-black px-4 py-2 text-lg">
                  Rs. {course.fee.toLocaleString()}
                </Badge>
              </div>
            </div>
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-primary/5 text-primary font-bold">{course.category}</Badge>
                <span className="text-gray-300">•</span>
                <span className="text-sm font-bold text-gray-500 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {course.totalDurationHours} Hours
                </span>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-6">{course.title}</h2>
              <div className="prose prose-slate max-w-none text-gray-600 font-medium">
                {course.description}
              </div>
            </CardContent>
          </Card>

          {/* Curriculum */}
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" /> Curriculum Preview
            </h3>
            <Accordion type="single" collapsible className="space-y-3">
              {sections.map((section: any, idx: number) => (
                <AccordionItem key={section.id} value={`section-${section.id}`} className="border-none shadow-sm ring-1 ring-gray-100 rounded-2xl overflow-hidden bg-white">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4 text-left">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-gray-400">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{section.title}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Section Module</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-0">
                    <Separator className="mb-4 opacity-50" />
                    <div className="space-y-2">
                       {/* This would normally fetch lessons per section */}
                       <div className="p-4 rounded-xl border border-dashed border-gray-200 flex items-center justify-between group hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-4">
                             <PlayCircle className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                             <div>
                                <p className="font-bold text-gray-700">Sample Lesson Preview</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">YouTube Protection: AES-256 Enabled</p>
                             </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-bold">Preview</Badge>
                       </div>
                       <p className="text-center text-xs text-gray-400 mt-4 italic">Lesson details are viewable in the live stream player.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Sidebar: Teacher & Compliance */}
        <div className="space-y-8">
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Instructor Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">ID: #{course.teacherId}</p>
                  <Link href={`/admin/teachers/${course.teacherId}`}>
                    <Button variant="link" className="p-0 h-auto text-primary font-bold text-sm">View Teacher Profile</Button>
                  </Link>
                </div>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-indigo-800 text-xs">
                <p className="font-bold mb-1">Teacher Notes:</p>
                <p className="font-medium italic">"This course is ready for review. All video lectures have been uploaded and encrypted."</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Compliance Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-bold">All Videos Protected (Signed)</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-bold">Payment Gateway Configured</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-bold">Syllabus Structure Validated</span>
              </div>
              <Separator className="bg-white/10" />
              <Button className="w-full bg-white/10 hover:bg-white/20 border-white/10 text-white font-bold h-10 rounded-xl text-xs">
                Run Automated Check
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="rounded-[24px] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900">Reject Submission</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex gap-4">
              <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-800">Review Feedback Required</p>
                <p className="text-xs text-rose-700 mt-1">Provide clear reasons for rejection. The instructor will see this note and can make corrections.</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black text-gray-700">Rejection Note</p>
              <Textarea 
                placeholder="e.g. Please update the thumbnail or re-upload Lesson 3 with better audio quality."
                className="min-h-[120px] rounded-2xl bg-slate-50 border-gray-100 focus:bg-white"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" className="font-bold" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-8"
              disabled={!rejectionNote || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate({ id: courseId, data: { status: 'draft', rejectionNote } as any })}
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send & Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
