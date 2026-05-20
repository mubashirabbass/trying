import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { 
  useGetLesson, 
  getGetLessonQueryKey, 
  useListLessons, 
  getListLessonsQueryKey, 
  useUpdateLessonProgress,
  useListSections,
  getListSectionsQueryKey,
  useGetLessonStreamToken,
  useGetLessonEmbed
} from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, PlayCircle, FileText, CheckCircle2, Circle, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function LessonPlayer() {
  const [, params] = useRoute("/dashboard/lessons/:courseId");
  const courseId = params?.courseId ? parseInt(params.courseId) : 0;
  
  const [, lessonParams] = useRoute("/dashboard/lessons/:courseId/:lessonId");
  const lessonIdParam = lessonParams?.lessonId ? parseInt(lessonParams.lessonId) : 0;

  const { data: sections, isLoading: isLoadingSections } = useListSections(
    { courseId },
    { query: { enabled: !!courseId, queryKey: getListSectionsQueryKey({ courseId }) } }
  );

  const { data: lessons, isLoading: isLoadingLessons } = useListLessons(
    { courseId },
    { query: { enabled: !!courseId, queryKey: getListLessonsQueryKey({ courseId }) } }
  );

  const currentLessonId = lessonIdParam || (lessons?.[0]?.id ?? 0);

  const { data: lesson, isLoading: isLoadingLesson } = useGetLesson(currentLessonId, {
    query: { enabled: !!currentLessonId, queryKey: getGetLessonQueryKey(currentLessonId) }
  });

  const updateProgress = useUpdateLessonProgress();

  const { data: streamToken } = useGetLessonStreamToken(currentLessonId, {
    query: { enabled: !!currentLessonId }
  });

  const { data: embedData, isLoading: isLoadingEmbed } = useGetLessonEmbed(
    currentLessonId, 
    { token: streamToken?.token || "" },
    { query: { enabled: !!streamToken?.token } }
  );

  const handleMarkComplete = () => {
    if (!lesson) return;
    updateProgress.mutate({
      data: { isCompleted: true }
    });
  };

  if (isLoadingLessons || isLoadingLesson || isLoadingSections) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Group lessons by section
  const lessonsBySection = sections?.map(section => ({
    ...section,
    lessons: lessons?.filter(l => l.sectionId === section.id) || []
  })) || [];

  // Lessons without a section (fallback)
  const orphanedLessons = lessons?.filter(l => !l.sectionId) || [];
  if (orphanedLessons.length > 0) {
    lessonsBySection.push({
      id: 0,
      title: "Course Materials",
      order: 999,
      courseId,
      createdAt: "",
      updatedAt: "",
      lessons: orphanedLessons
    });
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
          {lesson ? (
            <>
              <div className="aspect-video bg-black rounded-2xl overflow-hidden relative shadow-2xl shadow-slate-900/30">
                {isLoadingEmbed ? (
                  <div className="w-full h-full flex items-center justify-center text-primary">
                    <Loader2 className="h-12 w-12 animate-spin" />
                  </div>
                ) : embedData?.url ? (() => {
                  const url = embedData.url;
                  // YouTube detection
                  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
                  if (ytMatch) {
                    return (
                      <iframe
                        key={url}
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&autoplay=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={lesson.title}
                      />
                    );
                  }
                  // Vimeo detection
                  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                  if (vimeoMatch) {
                    return (
                      <iframe
                        key={url}
                        className="w-full h-full"
                        src={`https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&autoplay=1`}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={lesson.title}
                      />
                    );
                  }
                  // Direct video file fallback
                  return (
                    <video
                      key={url}
                      src={url}
                      controls
                      autoPlay
                      className="w-full h-full"
                      controlsList="nodownload"
                    />
                  );
                })() : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-slate-900">
                    <PlayCircle className="h-16 w-16 mb-4 opacity-30" />
                    <p className="font-bold text-lg">No video available</p>
                    <p className="text-sm opacity-60 mt-1">Check the PDF resources below</p>
                  </div>
                )}
              </div>

              <div className="bg-white p-8 rounded-xl border shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{lesson.title}</h1>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-slate-50">Lesson {lesson.orderIndex}</Badge>
                      {lesson.duration && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {Math.floor(lesson.duration / 60)} mins
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={handleMarkComplete}
                    size="lg"
                    variant={lesson.isCompleted ? "outline" : "default"}
                    className={lesson.isCompleted ? "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100" : "px-8 shadow-md"}
                    disabled={lesson.isCompleted || updateProgress.isPending}
                  >
                    {updateProgress.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : lesson.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    ) : null}
                    {lesson.isCompleted ? "Completed" : "Mark as Complete"}
                  </Button>
                </div>
                
                <div className="h-px bg-slate-100 w-full mb-8" />
                
                {lesson.description && (
                  <div className="prose max-w-none text-slate-600 leading-relaxed">
                    {lesson.description}
                  </div>
                )}

                {lesson.pdfUrl && (
                  <div className="mt-10 pt-8 border-t border-dashed">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" /> Learning Resources
                    </h3>
                    <a 
                      href={lesson.pdfUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-4 px-6 py-4 bg-slate-50 border rounded-xl hover:bg-slate-100 transition-all group border-slate-200"
                    >
                      <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Lesson Materials</p>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">PDF DOCUMENT</p>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <div className="text-center opacity-50">
                <PlayCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">Select a lesson to begin your journey</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Curriculum */}
        <Card className="w-full lg:w-96 shrink-0 flex flex-col h-full border-l shadow-xl rounded-none lg:rounded-l-xl overflow-hidden bg-slate-50/50">
          <div className="p-6 border-b bg-white shrink-0">
            <h2 className="font-bold text-xl text-slate-900">Course Curriculum</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${(lessons?.filter(l => l.isCompleted).length || 0) / (lessons?.length || 1) * 100}%` }} 
                />
              </div>
              <span className="text-xs font-bold text-slate-500">
                {Math.round((lessons?.filter(l => l.isCompleted).length || 0) / (lessons?.length || 1) * 100)}%
              </span>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <Accordion type="multiple" defaultValue={[`section-${lesson?.sectionId}`]} className="w-full">
              {lessonsBySection.map((section) => (
                <AccordionItem key={section.id} value={`section-${section.id}`} className="border-b-0 px-2">
                  <AccordionTrigger className="hover:no-underline py-4 px-4 font-bold text-slate-700 text-sm hover:bg-slate-100/50 transition-colors rounded-lg group">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center group-data-[state=open]:bg-primary/10 group-data-[state=open]:text-primary transition-colors">
                        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                      </div>
                      <span className="text-left">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 px-2">
                    <div className="space-y-1 pl-2 border-l-2 border-slate-100 ml-7 py-2">
                      {section.lessons.map((l, index) => {
                        const isActive = l.id === currentLessonId;
                        return (
                          <Link 
                            key={l.id}
                            href={`/dashboard/lessons/${courseId}/${l.id}`}
                            className={`
                              flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                              ${isActive ? "bg-white border shadow-sm ring-1 ring-primary/5" : "hover:bg-slate-100"}
                            `}
                          >
                            <div className="shrink-0">
                              {l.isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : isActive ? (
                                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${isActive ? "text-primary" : "text-slate-600"}`}>
                                {l.title}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Clock(props: any) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variant === 'outline' ? 'border-slate-200 text-slate-600' : 'bg-primary text-primary-foreground'} ${className}`}>
      {children}
    </span>
  )
}
