import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useGetLesson, getGetLessonQueryKey, useListLessons, getListLessonsQueryKey, useUpdateLessonProgress } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, PlayCircle, FileText, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function LessonPlayer() {
  const [, params] = useRoute("/dashboard/lessons/:courseId");
  const courseId = params?.courseId ? parseInt(params.courseId) : 0;
  // In a real app we'd get the specific lesson ID from URL or state, 
  // but for simplicity let's just use the first lesson or a selected one
  const [, lessonParams] = useRoute("/dashboard/lessons/:courseId/:lessonId");
  const lessonIdParam = lessonParams?.lessonId ? parseInt(lessonParams.lessonId) : 0;

  const { data: lessons, isLoading: isLoadingLessons } = useListLessons(
    { courseId },
    { query: { enabled: !!courseId, queryKey: getListLessonsQueryKey({ courseId }) } }
  );

  const currentLessonId = lessonIdParam || (lessons?.[0]?.id ?? 0);

  const { data: lesson, isLoading: isLoadingLesson } = useGetLesson(currentLessonId, {
    query: { enabled: !!currentLessonId, queryKey: getGetLessonQueryKey(currentLessonId) }
  });

  const updateProgress = useUpdateLessonProgress();

  const handleMarkComplete = () => {
    if (!lesson) return;
    updateProgress.mutate({
      data: { isCompleted: true }
    });
  };

  if (isLoadingLessons || isLoadingLesson) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
          {lesson ? (
            <>
              <div className="aspect-video bg-black rounded-xl overflow-hidden relative shadow-lg">
                {lesson.videoUrl ? (
                  <video 
                    src={lesson.videoUrl} 
                    controls 
                    className="w-full h-full"
                    controlsList="nodownload"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <PlayCircle className="h-16 w-16 mb-4 opacity-50" />
                    <p>Video content will appear here</p>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
                    <p className="text-gray-500 mt-1">Lesson {lesson.orderIndex}</p>
                  </div>
                  <Button 
                    onClick={handleMarkComplete}
                    variant={lesson.isCompleted ? "outline" : "default"}
                    className={lesson.isCompleted ? "text-green-600 border-green-200 bg-green-50" : ""}
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
                
                {lesson.description && (
                  <div className="prose max-w-none text-gray-600 mt-6">
                    {lesson.description}
                  </div>
                )}

                {lesson.pdfUrl && (
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" /> Resources
                    </h3>
                    <a 
                      href={lesson.pdfUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      Lesson Notes (PDF)
                    </a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-white rounded-xl border">
              <p className="text-gray-500">Select a lesson to begin</p>
            </div>
          )}
        </div>

        {/* Sidebar Timeline */}
        <Card className="w-full lg:w-80 shrink-0 flex flex-col h-full border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 shrink-0">
            <h2 className="font-bold text-lg">Course Content</h2>
            <p className="text-sm text-gray-500">
              {lessons?.filter(l => l.isCompleted).length || 0} / {lessons?.length || 0} completed
            </p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-1">
              {lessons?.map((l, index) => {
                const isActive = l.id === currentLessonId;
                const isNext = !l.isCompleted && (index === 0 || lessons[index - 1]?.isCompleted);
                
                return (
                  <a 
                    key={l.id}
                    href={`/dashboard/lessons/${courseId}/${l.id}`}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer
                      ${isActive ? "bg-primary/10 border-primary/20" : "hover:bg-gray-50"}
                      ${isNext && !isActive ? "ring-1 ring-primary/30 shadow-sm bg-white" : ""}
                    `}
                  >
                    <div className="mt-0.5 shrink-0">
                      {l.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : isActive ? (
                        <PlayCircle className="h-5 w-5 text-primary" />
                      ) : isNext ? (
                        <Circle className="h-5 w-5 text-primary animate-pulse" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium leading-tight ${isActive ? "text-primary" : "text-gray-700"}`}>
                        {index + 1}. {l.title}
                      </p>
                      {l.duration && (
                        <p className="text-xs text-gray-500 mt-1">{Math.floor(l.duration / 60)} mins</p>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </DashboardLayout>
  );
}
