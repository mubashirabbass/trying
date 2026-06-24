import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { 
  useGetLesson, 
  useListLessons, 
  useUpdateLessonProgress,
  useListSections,
  useGetLessonStreamToken,
  useGetLessonEmbed,
  useGetCourse,
  useListForumPosts,
  useCreateForumPost,
  useListForumReplies,
  useCreateForumReply,
  useUpvoteForumPost,
  getListForumPostsQueryKey,
  getListForumRepliesQueryKey,
  useListEnrollments,
} from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { 
  Loader2, PlayCircle, FileText, CheckCircle2, 
  ChevronRight, ChevronLeft, Menu, X, Download, 
  BookOpen, Clock, Award, MessageSquare, ThumbsUp, 
  Pin, Send, Plus, Search, ShieldAlert, Edit2, 
  Trash2, Lock, Star, Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface UserNote {
  id: string;
  lessonId: number;
  timeSeconds: number;
  timeString: string;
  content: string;
  createdAt: string;
}

const getYoutubeVideoId = (value?: string | null) => {
  if (!value) return null;

  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId) return watchId;

      const parts = url.pathname.split("/").filter(Boolean);
      const idIndex = parts.findIndex((part) => ["embed", "shorts", "live", "v"].includes(part));
      if (idIndex >= 0 && parts[idIndex + 1]) return parts[idIndex + 1];
    }
  } catch {
    const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/|\/v\/)([a-zA-Z0-9_-]{11})/);
    return match?.[1] || null;
  }

  return null;
};

export default function LessonPlayerPro() {
  const [, params] = useRoute("/dashboard/lessons/:courseId");
  const [, lessonParams] = useRoute("/dashboard/lessons/:courseId/:lessonId");
  
  const courseId = lessonParams?.courseId 
    ? parseInt(lessonParams.courseId) 
    : (params?.courseId ? parseInt(params.courseId) : 0);
  
  const lessonIdParam = lessonParams?.lessonId ? parseInt(lessonParams.lessonId) : 0;

  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Custom DRM right-click warning state
  const [showDrmWarning, setShowDrmWarning] = useState(false);

  // Notes States
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Q&A Forum States
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", body: "" });
  const [replyBody, setReplyBody] = useState("");

  // YouTube IFrame API States
  const [playerInstance, setPlayerInstance] = useState<any>(null);
  const [playState, setPlayState] = useState<string>("unstarted");
  const playerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<any>(null);

  // Feedback Modal States
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackHoverRating, setFeedbackHoverRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleSubmitFeedback = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (feedbackRating < 1 || feedbackRating > 5) {
      toast({
        title: "Rating required",
        description: "Please rate the lesson by selecting stars.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const response = await fetch(`/api/lessons/${currentLessonId}/feedback`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your feedback! The next lesson is now unlocked.",
      });

      setShowFeedbackModal(false);
      queryClient.invalidateQueries();
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "There was a problem submitting your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Fetch course metadata
  const { data: course } = useGetCourse(courseId, {
    query: { 
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000,
    }
  } as any);

  // Check enrollment status to block access if needed
  const { data: enrollments } = useListEnrollments(
    { userId: user?.id } as any,
    { query: { enabled: !!user?.id } } as any
  );
  const currentEnrollment = enrollments?.find((e: any) => e.courseId === courseId);
  const isEnrollmentBlocked = currentEnrollment?.status === "blocked";
  
  // Fetch sections
  const { data: sections } = useListSections({ courseId }, {
    query: { 
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000,
    }
  } as any);
  
  // Fetch lessons
  const { data: lessons, isLoading: lessonsLoading } = useListLessons({ courseId }, {
    query: { 
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000,
    }
  } as any);

  const currentLessonId = lessonIdParam || (lessons?.[0]?.id ?? 0);
  
  // Fetch specific active lesson
  const { data: lesson, isLoading: isLoadingLesson } = useGetLesson(currentLessonId, {
    query: { 
      enabled: !!currentLessonId,
    }
  } as any);
  
  const updateProgress = useUpdateLessonProgress();

  // Fetch secure streaming tokens & embeds
  const { data: streamToken } = useGetLessonStreamToken(currentLessonId, {
    query: { enabled: !!currentLessonId }
  } as any);

  const { data: embedData, isLoading: isLoadingEmbed } = useGetLessonEmbed(
    currentLessonId, 
    { token: streamToken?.token || "" },
    { query: { enabled: !!streamToken?.token } } as any
  );

  const youtubeVideoId = getYoutubeVideoId(embedData?.url);
  const isYoutube = !!youtubeVideoId;

  // Fetch Q&A Forum Posts directly embedded in Player
  const { data: forumPosts, isLoading: forumLoading } = useListForumPosts(
    courseId,
    { query: { enabled: !!courseId } } as any
  );

  const { data: forumReplies, isLoading: repliesLoading } = useListForumReplies(
    selectedPostId as number,
    { query: { enabled: !!selectedPostId } } as any
  );

  const createPostMutation = useCreateForumPost();
  const createReplyMutation = useCreateForumReply();
  const upvoteMutation = useUpvoteForumPost();

  const selectedPost = forumPosts?.find(p => p.id === selectedPostId) as any;

  // YouTube API loading state check
  const [ytReady, setYtReady] = useState(typeof window !== "undefined" && !!(window as any).YT && !!(window as any).YT.Player);

  // Reset states when lesson changes
  useEffect(() => {
    setActiveTab("overview");
    setSelectedPostId(null);
    setNoteContent("");
    setEditingNoteId(null);
    
    // Load local notes
    if (user?.id) {
      const storedNotes = localStorage.getItem(`GC_NOTES_${courseId}_${currentLessonId}_${user.id}`);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      } else {
        setNotes([]);
      }
    }
  }, [currentLessonId, courseId, user?.id]);

  // Load YouTube IFrame API Script
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Poll for YT API availability
  useEffect(() => {
    if (ytReady) return;

    const checkYT = setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player) {
        setYtReady(true);
        clearInterval(checkYT);
      }
    }, 200);

    return () => clearInterval(checkYT);
  }, [ytReady]);

  // Initialize YT Player Instance when embed URL resolves and YT API is ready
  useEffect(() => {
    let player: any = null;
    
    // Guard: Only initialize if lesson is unlocked, we are NOT loading, have a valid url, and the YT API is ready
    if (!isLessonLocked(currentLessonId) && !isLoadingLesson && !isLoadingEmbed && embedData?.url && ytReady && (window as any).YT && (window as any).YT.Player) {
      if (youtubeVideoId) {
        // Clean up previous container element and state safely
        if (playerInstance) {
          try {
            if (typeof playerInstance.destroy === "function") {
              playerInstance.destroy();
            }
          } catch (e) {
            console.warn("Error destroying previous playerInstance:", e);
          }
          setPlayerInstance(null);
        }
        
        // Create player container target dynamically
        if (playerRef.current) {
          playerRef.current.innerHTML = '<div id="yt-player" class="w-full h-full"></div>';
          
          try {
            player = new (window as any).YT.Player("yt-player", {
              videoId: youtubeVideoId,
              playerVars: {
                rel: 0,
                modestbranding: 1,
                controls: 1,
                autoplay: 0,
                disablekb: 0
              },
              events: {
                onReady: (event: any) => {
                  setPlayerInstance(event.target);
                  // Seek to last saved position if available
                  if ((lesson as any)?.lastPositionSeconds) {
                    event.target.seekTo((lesson as any).lastPositionSeconds, true);
                  }
                },
                onStateChange: (event: any) => {
                  if (event.data === 1) {
                    setPlayState("playing");
                    startProgressPolling(event.target);
                  } else if (event.data === 2) {
                    setPlayState("paused");
                    stopProgressPolling();
                    saveProgressImmediately(event.target);
                  } else if (event.data === 0) {
                    setPlayState("ended");
                    stopProgressPolling();
                    if (!lesson?.isCompleted) {
                      setShowFeedbackModal(true);
                    }
                  }
                }
              }
            });
          } catch (e) {
            console.error("Error creating YouTube player:", e);
          }
        }
      }
    }

    return () => {
      stopProgressPolling();
      if (player) {
        try {
          if (typeof player.destroy === "function") {
            player.destroy();
          }
        } catch (e) {
          console.warn("Error destroying player in cleanup:", e);
        }
      }
    };
  }, [embedData?.url, youtubeVideoId, currentLessonId, ytReady, isLoadingLesson, isLoadingEmbed]);

  const startProgressPolling = (player: any) => {
    stopProgressPolling();
    let tickCount = 0;

    progressInterval.current = setInterval(() => {
      if (player && typeof player.getCurrentTime === "function" && typeof player.getDuration === "function") {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        
        if (duration > 0) {
          const watchedPercent = Math.min(100, Math.round((currentTime / duration) * 100));
          tickCount += 5;

          if (tickCount >= 10) {
            tickCount = 0;
            updateProgress.mutate({
              id: currentLessonId,
              data: {
                watchedPercent: watchedPercent,
                isCompleted: watchedPercent >= ((lesson as any)?.completionThreshold || 80)
              } as any
            });
          }
        }
      }
    }, 5000);
  };

  const stopProgressPolling = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const saveProgressImmediately = (player: any) => {
    if (player && typeof player.getCurrentTime === "function" && typeof player.getDuration === "function") {
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      if (duration > 0) {
        const watchedPercent = Math.min(100, Math.round((currentTime / duration) * 100));
        updateProgress.mutate({
          id: currentLessonId,
          data: {
            watchedPercent: watchedPercent,
            isCompleted: watchedPercent >= ((lesson as any)?.completionThreshold || 80)
          } as any
        });
      }
    }
  };

  const lessonsBySection = sections?.map(section => ({
    ...section,
    lessons: lessons?.filter(l => (l as any).sectionId === section.id) || []
  })) || [];

  const orphanedLessons = lessons?.filter(l => !(l as any).sectionId) || [];
  if (orphanedLessons.length > 0) {
    lessonsBySection.push({
      id: 0,
      title: "Additional Lectures",
      order: 999,
      courseId,
      createdAt: "",
      updatedAt: "",
      lessons: orphanedLessons
    } as any);
  }

  const currentLessonIndex = lessons?.findIndex(l => l.id === currentLessonId) ?? -1;
  const nextLesson = lessons?.[currentLessonIndex + 1];
  const prevLesson = lessons?.[currentLessonIndex - 1];

  const completedLessons = lessons?.filter(l => (l as any).isCompleted).length || 0;
  const totalLessons = lessons?.length || 1;
  const courseProgress = Math.round((completedLessons / totalLessons) * 100);

  const getSequentialLessons = () => {
    const list: any[] = [];
    lessonsBySection.forEach(sec => {
      list.push(...sec.lessons);
    });
    return list;
  };

  const getStudyMaterials = () => {
    const list: any[] = [];
    lessons?.forEach((les, index) => {
      if (les.pdfUrl) {
        list.push({
          id: `pdf-${les.id}`,
          title: `Lecture ${index + 1} Reference Handout`,
          type: "PDF Document",
          url: les.pdfUrl,
          lessonId: les.id,
          lessonName: les.title,
          size: "2.1 MB"
        });
      }
      if (les.resources) {
        list.push({
          id: `res-${les.id}`,
          title: `Module ${index + 1} Additional References`,
          type: "External Web Resource",
          url: les.resources,
          lessonId: les.id,
          lessonName: les.title,
          size: "Web Resource"
        });
      }
      if (les.notes) {
        list.push({
          id: `note-${les.id}`,
          title: `Lesson ${index + 1} Written Guide Notes`,
          type: "Written Notes Handout",
          content: les.notes,
          lessonId: les.id,
          lessonName: les.title,
          size: "Text Note"
        });
      }
    });
    
    if (list.length === 0) {
      return [
        {
          id: "def-1",
          title: "Course Overview Slides & Getting Started Guide",
          type: "PDF Document",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          lessonId: 0,
          lessonName: "General Reference",
          size: "1.6 MB"
        },
        {
          id: "def-2",
          title: "Curated Coursework Workbook & Exercise Sheets",
          type: "PDF Document",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          lessonId: 0,
          lessonName: "General Reference",
          size: "3.4 MB"
        }
      ];
    }
    return list;
  };


  const isLessonLocked = (lessonToCheckId: number) => {
    const isStaff = user?.role === "admin" || user?.role === "teacher";
    if (isStaff) return false;

    const sequential = getSequentialLessons();
    const targetIndex = sequential.findIndex(l => l.id === lessonToCheckId);
    if (targetIndex <= 0) return false;

    for (let i = 0; i < targetIndex; i++) {
      if (!sequential[i].isCompleted) return true;
    }
    return false;
  };

  const handleMarkComplete = () => {
    if (!lesson) return;
    updateProgress.mutate({
      id: currentLessonId,
      data: { isCompleted: true } as any
    });
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !user?.id) return;

    let timeSeconds = 0;
    if (playerInstance && typeof playerInstance.getCurrentTime === "function") {
      timeSeconds = Math.floor(playerInstance.getCurrentTime());
    }

    let updatedNotes: UserNote[] = [];

    if (editingNoteId) {
      updatedNotes = notes.map(n => 
        n.id === editingNoteId 
          ? { ...n, content: noteContent, createdAt: new Date().toISOString() } 
          : n
      );
      setEditingNoteId(null);
      toast({ title: "Note updated successfully" });
    } else {
      const newNote: UserNote = {
        id: Math.random().toString(36).substring(2, 9),
        lessonId: currentLessonId,
        timeSeconds: timeSeconds,
        timeString: formatTime(timeSeconds),
        content: noteContent,
        createdAt: new Date().toISOString()
      };
      updatedNotes = [newNote, ...notes];
      toast({ title: "Note saved at " + newNote.timeString });
    }

    setNotes(updatedNotes);
    localStorage.setItem(`GC_NOTES_${courseId}_${currentLessonId}_${user.id}`, JSON.stringify(updatedNotes));
    setNoteContent("");
  };

  const handleSeekToNote = (seconds: number) => {
    if (playerInstance && typeof playerInstance.seekTo === "function") {
      playerInstance.seekTo(seconds, true);
      playerInstance.playVideo();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    if (user?.id) {
      localStorage.setItem(`GC_NOTES_${courseId}_${currentLessonId}_${user.id}`, JSON.stringify(updated));
    }
    toast({ title: "Note deleted" });
  };

  const handleEditNote = (note: UserNote) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDrmWarning(true);
    setTimeout(() => setShowDrmWarning(false), 4000);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !newPost.title || !newPost.body) return;

    try {
      await createPostMutation.mutateAsync({
        courseId,
        data: {
          userId: user?.id as number,
          title: newPost.title,
          body: newPost.body
        }
      });
      toast({ title: "Question posted successfully" });
      setNewPost({ title: "", body: "" });
      setIsNewPostOpen(false);
      queryClient.invalidateQueries({ queryKey: getListForumPostsQueryKey(courseId) });
    } catch (error) {
      toast({ title: "Failed to publish question", variant: "destructive" });
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostId || !replyBody.trim()) return;

    try {
      await createReplyMutation.mutateAsync({
        postId: selectedPostId,
        data: {
          userId: user?.id as number,
          body: replyBody
        }
      });
      setReplyBody("");
      queryClient.invalidateQueries({ queryKey: getListForumRepliesQueryKey(selectedPostId) });
    } catch (error) {
      toast({ title: "Failed to send response", variant: "destructive" });
    }
  };

  const handleUpvote = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    try {
      await upvoteMutation.mutateAsync({ postId });
      queryClient.invalidateQueries({ queryKey: getListForumPostsQueryKey(courseId) });
    } catch (error) {}
  };

  const filteredPosts = forumPosts?.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (lessonsLoading && !lessons) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Enrollment blocked — show full-screen access denied
  if (isEnrollmentBlocked) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center text-slate-100">
        <div className="text-center max-w-md px-6">
          <div className="h-20 w-20 rounded-full bg-rose-950 border-2 border-rose-700 flex items-center justify-center mx-auto mb-6">
            <Ban className="h-10 w-10 text-rose-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 mb-2">Course Access Blocked</h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
            Your access to this course has been suspended by the administrator due to outstanding fee payments. 
            Please clear your dues and contact support to restore access.
          </p>
          <a
            href="/dashboard/fees"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            View Fee Details
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 flex-col md:flex-row" onContextMenu={handleContextMenu}>
      {/* Main Content Area (Left) */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Dynamic DRM Protection Warning Box */}
        {showDrmWarning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 transition-all duration-300">
            <div className="bg-slate-900/90 border border-red-500/30 p-6 rounded-2xl max-w-sm text-center shadow-2xl flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-red-500 animate-bounce">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-100">Content Protected</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Right-click operations are disabled to protect course property. Recording or downloading this content violates terms of service.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/courses">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Courses
              </Button>
            </Link>
            
            <div className="hidden md:block">
              <h1 className="font-extrabold text-sm text-slate-100 line-clamp-1">
                {course?.title}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Lesson {currentLessonIndex + 1} of {totalLessons} — {lesson?.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!lesson?.isCompleted && (
              <Button
                onClick={handleMarkComplete}
                disabled={updateProgress.isPending || isLessonLocked(currentLessonId)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-lg"
              >
                {updateProgress.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Mark Complete
              </Button>
            )}
            {lesson?.isCompleted && (
              <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold h-9 px-3 text-xs flex items-center gap-1.5 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 bg-slate-900/50"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Cinema Video Canvas */}
        <div className="bg-slate-950 flex-1 flex flex-col justify-center items-center relative overflow-hidden group">
          <div className="w-full h-full p-4 md:p-8 flex items-center justify-center bg-slate-950">
            <div className="aspect-video w-full max-w-5xl max-h-[70vh] bg-slate-900/40 border border-slate-800 rounded-2xl relative shadow-2xl shadow-black/50 overflow-hidden flex items-center justify-center">
              
              {/* Lock Shield Overlay */}
              {isLessonLocked(currentLessonId) ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md z-30 text-center px-6">
                  <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-850/60 flex items-center justify-center text-primary animate-pulse shadow-2xl mb-4">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-100 uppercase tracking-wider">Lecture Locked</h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed font-semibold">
                    Please complete the previous lecture in the course sequence to unlock and play this lesson.
                  </p>
                </div>
              ) : (
                <>
                  {/* 1. Loading Overlay */}
                  {(isLoadingLesson || isLoadingEmbed) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-30">
                      <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-slate-400 text-xs font-semibold">Generating stream credentials...</p>
                      </div>
                    </div>
                  )}

                  {/* 2. YouTube Player Container (Keep mounted to avoid unmount crashes during destruction/loading transitions) */}
                  <div 
                    ref={playerRef} 
                    className={`w-full h-full relative z-10 ${(!isLoadingLesson && !isLoadingEmbed && embedData?.url && isYoutube) ? 'block' : 'hidden'}`}
                    onContextMenu={handleContextMenu}
                  >
                    <div id="yt-player" className="w-full h-full"></div>
                  </div>

                  {/* 3. HTML5 Video Player Container */}
                  {!isLoadingLesson && !isLoadingEmbed && embedData?.url && !isYoutube && (
                    <div className="w-full h-full relative z-10" onContextMenu={handleContextMenu}>
                      <video
                        src={embedData.url}
                        controls
                        className="w-full h-full rounded-2xl"
                        controlsList="nodownload"
                        onEnded={() => {
                          setPlayState("ended");
                          if (!lesson?.isCompleted) {
                            setShowFeedbackModal(true);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* 4. Fallback if no media available */}
                  {!isLoadingLesson && !isLoadingEmbed && !embedData?.url && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-950 absolute inset-0 z-0">
                      <PlayCircle className="h-14 w-14 mb-3 opacity-20" />
                      <p className="font-bold text-sm">No lecture media available</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cinema Tabs Panel */}
        <div className="bg-slate-950 border-t border-slate-900 overflow-y-auto max-h-[40vh] shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-slate-900 px-6 py-2 bg-slate-950">
              <TabsList className="bg-slate-900 border border-slate-800/40 h-auto p-1 space-x-2 rounded-xl">
                <TabsTrigger 
                  value="overview"
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-1.5 text-xs font-bold transition-all"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="outline"
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-1.5 text-xs font-bold transition-all"
                >
                  Course Outline
                </TabsTrigger>
                <TabsTrigger 
                  value="materials"
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-1.5 text-xs font-bold transition-all"
                >
                  Study Materials
                </TabsTrigger>
                <TabsTrigger 
                  value="notes"
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-1.5 text-xs font-bold transition-all"
                >
                  Notes
                </TabsTrigger>
                <TabsTrigger 
                  value="qa"
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-1.5 text-xs font-bold transition-all"
                >
                  Q&A Discussion
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 bg-slate-950">
              <TabsContent value="overview" className="mt-0">
                <div className="max-w-4xl">
                  <h2 className="text-lg font-extrabold text-slate-100 mb-3">
                    {lesson?.title}
                  </h2>
                  
                  {lesson?.description ? (
                    <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed font-medium">
                      <p>{lesson.description}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No lecture description provided.
                    </p>
                  )}

                  {(lesson as any)?.notes && (
                    <div className="mt-6 p-5 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm shadow-xl space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <FileText className="h-4 w-4" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">Teacher's Written Notes</h4>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                        {(lesson as any).notes}
                      </div>
                    </div>
                  )}

                  {/* Navigation Footer */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-900">
                    {prevLesson ? (
                      <Link href={`/dashboard/lessons/${courseId}/${prevLesson.id}`}>
                        <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 text-xs">
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous Lesson
                        </Button>
                      </Link>
                    ) : (
                      <div />
                    )}

                    {nextLesson ? (
                      <Link href={`/dashboard/lessons/${courseId}/${nextLesson.id}`}>
                        <Button size="sm" className="bg-primary hover:bg-primary-dark font-bold text-xs text-white">
                          Next Lesson
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      <Button disabled size="sm" className="bg-slate-800 text-slate-400 text-xs">
                        Course Complete
                        <Award className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="outline" className="mt-0 animate-in fade-in duration-150">
                <div className="max-w-4xl space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm shadow-xl justify-between items-start sm:items-center">
                    <div className="flex gap-3 items-center">
                      <div className="h-10 w-10 bg-red-950/40 border border-red-800/30 rounded-xl flex items-center justify-center text-red-500 shrink-0 shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200 text-xs leading-snug">Official Syllabus & Course Outline</h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Format: PDF Document • Approved by Academic Board</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        const link = course?.syllabus || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
                        window.open(link, "_blank");
                      }}
                      className="h-9 font-bold text-[11px] bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 self-stretch sm:self-auto justify-center"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Outline PDF
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Curriculum Syllabus Map</h4>
                    <div className="border border-slate-800 rounded-2xl max-h-60 overflow-y-auto divide-y divide-slate-800/60 p-1.5 bg-slate-900/20">
                      {lessons?.map((les, idx) => {
                        const isActive = les.id === currentLessonId;
                        return (
                          <div key={les.id} className={`p-3 rounded-xl transition-colors flex gap-3 text-xs leading-snug items-center ${isActive ? 'bg-slate-900/60 border border-slate-800' : 'hover:bg-slate-900/20'}`}>
                            <span className={`font-black text-[10px] px-1.5 py-0.5 rounded shrink-0 ${isActive ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-400'}`}>
                              L{idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className={`font-bold text-xs block ${isActive ? 'text-white' : 'text-slate-300'}`}>{les.title}</span>
                              {les.description && (
                                <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block leading-normal line-clamp-1">
                                  {les.description}
                                </span>
                              )}
                            </div>
                            {les.isCompleted && (
                              <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[9px] font-bold shrink-0">
                                Completed
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="materials" className="mt-0 animate-in fade-in duration-150">
                <div className="max-w-4xl space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-300">Study Materials & Lecture References</h3>
                    <Badge variant="outline" className="border-slate-800 text-[10px] font-bold bg-slate-900 text-slate-400">
                      {getStudyMaterials().length} Assets
                    </Badge>
                  </div>
                  
                  <div className="border border-slate-850 rounded-2xl divide-y divide-slate-850/60 bg-slate-900/10 overflow-hidden shadow-xl">
                    {getStudyMaterials().map((m) => {
                      const isCurrent = m.lessonId === currentLessonId;
                      return (
                        <div key={m.id} className={`p-4 transition-colors flex justify-between items-center gap-4 ${isCurrent ? 'bg-slate-900/40 border-y border-slate-800/50' : 'hover:bg-slate-900/10'}`}>
                          <div className="flex gap-3 items-start min-w-0">
                            <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${
                              m.type.includes("PDF") 
                                ? "bg-red-950/40 border-red-800/40 text-red-500" 
                                : "bg-blue-950/40 border-blue-800/40 text-blue-500"
                            }`}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <span className="font-bold text-slate-200 text-xs block leading-snug line-clamp-1">
                                {m.title}
                              </span>
                              <span className="text-[9px] text-slate-500 font-semibold block uppercase tracking-wider">
                                Topic: {m.lessonName} • {m.type} ({m.size})
                              </span>
                              {isCurrent && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] bg-primary/20 text-primary border border-primary/30 px-1 py-0.25 rounded font-black mt-1">
                                  ★ Recommended for current lesson
                                </span>
                              )}
                            </div>
                          </div>

                          {m.content ? (
                            <Button 
                              onClick={() => {
                                alert(`Written Handout Notes:\n\n${m.content}`);
                              }}
                              className="h-8 font-bold text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg shrink-0 cursor-pointer shadow-none border border-slate-700"
                            >
                              Read Handout
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => {
                                window.open(m.url, "_blank");
                              }}
                              className="h-8 font-bold text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer border border-slate-700 shadow-none"
                            >
                              <Download className="h-3 w-3" /> Get File
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <div className="max-w-4xl space-y-6">
                  <h3 className="text-sm font-bold text-slate-300">
                    My Lesson Notes
                  </h3>
                  
                  <form onSubmit={handleSaveNote} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-300 text-xs flex justify-between items-center">
                        <span>Write a Note</span>
                        {playerInstance && typeof playerInstance.getCurrentTime === "function" && (
                          <Badge className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold">
                            <Clock className="h-3 w-3 mr-1" />
                            Capture note at {formatTime(Math.floor(playerInstance.getCurrentTime()))}
                          </Badge>
                        )}
                      </Label>
                      <Textarea
                        required
                        disabled={isLessonLocked(currentLessonId)}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder={isLessonLocked(currentLessonId) ? "Notes are locked for this lesson." : "Capture key concepts, code snippets, or timestamped pointers..."}
                        className="rounded-lg border-slate-800 bg-slate-900 text-slate-100 text-xs focus-visible:ring-primary focus-visible:ring-offset-slate-900"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      {editingNoteId && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { setEditingNoteId(null); setNoteContent(""); }}
                          className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button type="submit" size="sm" disabled={isLessonLocked(currentLessonId)} className="font-bold text-xs bg-primary hover:bg-primary-dark">
                        {editingNoteId ? "Update Note" : "Save Note"}
                      </Button>
                    </div>
                  </form>

                  <div className="h-px bg-slate-900" />

                  {notes.length === 0 ? (
                    <div className="text-center py-10 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                      <BookOpen className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold text-sm">No notes captured yet</p>
                      <p className="text-slate-500 text-xs mt-1">Start typing above to save private timestamped notes.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                      {notes.map((note) => (
                        <div key={note.id} className="p-4 rounded-xl border border-slate-850 bg-slate-900/30 space-y-2 relative group shadow-sm">
                          <div className="flex items-center justify-between">
                            <Badge 
                              onClick={() => handleSeekToNote(note.timeSeconds)}
                              className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white cursor-pointer transition-colors text-[10px] font-extrabold flex items-center gap-1"
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                              {note.timeString}
                            </Badge>
                            
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditNote(note)}
                                className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded transition-colors"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button 
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-slate-400 hover:text-red-400 p-1 hover:bg-slate-855 rounded transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                            {note.content}
                          </p>
                          <div className="text-[9px] text-slate-500 text-right">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Course Q&A Forum Tab */}
              <TabsContent value="qa" className="mt-0">
                <div className="max-w-4xl">
                  {selectedPostId && selectedPost ? (
                    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedPostId(null)} className="font-bold text-slate-300 hover:text-white hover:bg-slate-805">
                          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Q&A List
                        </Button>
                        {selectedPost.isPinned && (
                          <Badge className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px]">
                            <Pin className="h-3 w-3 mr-1" /> Pinned
                          </Badge>
                        )}
                      </div>
                      
                      <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                              {selectedPost.authorName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-100 text-sm">{selectedPost.authorName}</span>
                                {selectedPost.authorRole === 'teacher' && <Badge className="bg-primary/20 text-primary border border-primary/30 text-[9px] h-4">Teacher</Badge>}
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {new Date(selectedPost.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <h4 className="text-lg font-extrabold text-slate-100 leading-tight">{selectedPost.title}</h4>
                          <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                            {selectedPost.body}
                          </p>
                        </div>

                        <div className="h-px bg-slate-800" />

                        <div className="space-y-4">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {forumReplies?.length || 0} Responses
                          </h5>
                          {repliesLoading ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                          ) : (
                            (forumReplies as any[])?.map((reply: any) => (
                              <div key={reply.id} className="flex gap-3 group">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                  reply.authorRole === 'teacher' ? 'bg-primary/20 border border-primary/30 text-primary' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {reply.authorName?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-xs text-slate-200">{reply.authorName}</span>
                                    {reply.authorRole === 'teacher' && <Badge className="bg-primary/20 text-primary border border-primary/30 text-[8px] h-3.5 px-1.5">Teacher</Badge>}
                                    <span className="text-[9px] text-slate-500">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className={`p-3.5 rounded-xl text-xs font-medium leading-relaxed ${
                                    reply.authorRole === 'teacher' ? 'bg-primary/5 text-slate-200 border border-primary/10' : 'bg-slate-900/60 text-slate-300 border border-slate-800/40'
                                  }`}>
                                    {reply.body}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950/60 border-t border-slate-800">
                        <form onSubmit={handleSendReply} className="flex gap-2">
                          <Input 
                            value={replyBody} 
                            onChange={(e) => setReplyBody(e.target.value)} 
                            placeholder="Type response..." 
                            className="h-10 rounded-xl border-slate-800 bg-slate-900 text-slate-100 text-xs shadow-sm focus-visible:ring-primary focus-visible:ring-offset-slate-900"
                          />
                          <Button type="submit" size="icon" disabled={!replyBody.trim() || createReplyMutation.isPending} className="h-10 w-10 rounded-xl shadow-lg shadow-primary/20">
                            <Send className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                          <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search discussions..."
                            className="pl-9 h-9 rounded-xl border-slate-800 bg-slate-900 text-slate-100 text-xs focus-visible:ring-primary focus-visible:ring-offset-slate-900"
                          />
                        </div>
                        
                        <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="rounded-xl font-bold bg-primary hover:bg-primary-dark shadow-md text-xs">
                              <Plus className="h-3.5 w-3.5 mr-1" /> Ask a Question
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-extrabold text-slate-100">Ask a New Question</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreatePost} className="space-y-5 py-2">
                              <div className="space-y-2">
                                <Label className="font-bold text-slate-300 text-xs">Title or Summary</Label>
                                <Input 
                                  required 
                                  value={newPost.title} 
                                  onChange={(e) => setNewPost({...newPost, title: e.target.value})} 
                                  placeholder="e.g. Can someone clarify the difference between props and state?"
                                  className="h-11 rounded-lg border-slate-800 bg-slate-950 text-slate-100 text-xs"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="font-bold text-slate-300 text-xs">Details</Label>
                                <Textarea 
                                  required 
                                  rows={5}
                                  value={newPost.body} 
                                  onChange={(e) => setNewPost({...newPost, body: e.target.value})} 
                                  placeholder="Describe what you are trying to solve or discuss in detail..."
                                  className="rounded-lg border-slate-800 bg-slate-950 text-slate-100 text-xs"
                                />
                              </div>
                              <DialogFooter>
                                <Button type="submit" className="w-full h-10 font-bold text-xs" disabled={createPostMutation.isPending}>
                                  {createPostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Post Question"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {forumLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                      ) : filteredPosts?.length === 0 ? (
                        <div className="text-center py-12 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-6">
                          <MessageSquare className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400 font-bold text-sm">No discussions yet</p>
                          <p className="text-slate-500 text-xs mt-1">Be the first to ask a question in this course!</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                          {filteredPosts?.map((post: any) => (
                            <Card 
                              key={post.id} 
                              onClick={() => setSelectedPostId(post.id)}
                              className="group cursor-pointer hover:border-primary/40 hover:bg-slate-900/30 transition-all rounded-xl border border-slate-800 bg-slate-900/10 overflow-hidden shadow-sm"
                            >
                              <CardContent className="p-4 flex gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                                  <button 
                                    onClick={(e) => handleUpvote(e, post.id)}
                                    className="text-slate-400 group-hover:text-primary transition-colors flex flex-col items-center"
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                    <span className="text-[9px] font-black mt-0.5">{post.upvotes}</span>
                                  </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    {post.isPinned && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
                                    <h4 className="font-bold text-slate-200 group-hover:text-primary transition-colors truncate text-sm">
                                      {post.title}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-slate-400 font-medium line-clamp-1 mb-2">{post.body}</p>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                                    <div className="flex items-center gap-2">
                                      <div className="h-4 w-4 rounded bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">
                                        {post.authorName?.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="font-semibold text-slate-400">{post.authorName}</span>
                                      <span>•</span>
                                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Playlist Sidebar (Right - Collapsible Sliding Panel) */}
      <div 
        className={`
          ${sidebarOpen ? 'w-full md:w-96 border-l' : 'w-0 border-none'} 
          transition-all duration-300 ease-in-out
          bg-slate-900 border-slate-800 flex flex-col
          overflow-hidden relative shrink-0 z-20 h-full
        `}
      >
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <Link href="/dashboard/courses">
              <span className="text-[11px] text-slate-400 hover:text-primary font-extrabold flex items-center cursor-pointer transition-colors">
                <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                Back to Dashboard
              </span>
            </Link>
          </div>
          
          <h2 className="font-extrabold text-sm text-slate-100 mb-3 line-clamp-2">
            {course?.title}
          </h2>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-400">Course Completion</span>
              <span className="font-extrabold text-primary">{courseProgress}%</span>
            </div>
            <Progress value={courseProgress} className="h-1.5 bg-slate-800" />
            <p className="text-[10px] text-slate-400 font-semibold">
              {completedLessons} of {totalLessons} lessons completed
            </p>

            {/* Download Course Outline Syllabus in Sidebar */}
            <div className="pt-2.5 mt-1">
              <Button
                onClick={() => {
                  const link = course?.syllabus || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
                  window.open(link, "_blank");
                }}
                className="w-full h-8 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg flex items-center justify-center gap-1.5 font-bold text-[10px] shadow-sm cursor-pointer transition-all"
              >
                <FileText className="h-3.5 w-3.5 text-red-500" />
                Download Course Outline
              </Button>
            </div>
          </div>
        </div>

        {/* Video Playlist */}
        <ScrollArea className="flex-1 bg-slate-900/40">
          <div className="p-2 space-y-3">
            {lessonsBySection.map((section) => {
              const sectionLessons = section.lessons;
              const completedInSection = sectionLessons.filter(l => l.isCompleted).length;
              
              return (
                <div key={section.id} className="mb-2">
                  {/* Section Title Header */}
                  <div className="px-3 py-1.5 mb-1 bg-slate-900/80 rounded-lg flex items-center justify-between border border-slate-800/40">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate max-w-[70%]">
                      {section.title}
                    </span>
                    <Badge variant="outline" className="text-[9px] font-bold text-slate-500 border-slate-800 px-1.5 py-0">
                      {completedInSection}/{sectionLessons.length}
                    </Badge>
                  </div>

                  {/* Video List Items */}
                  <div className="space-y-1 mt-1">
                    {(sectionLessons as any[]).map((l: any) => {
                      const isActive = l.id === currentLessonId;
                      const lessonNumber = (lessons?.findIndex(lesson => lesson.id === l.id) ?? -1) + 1;
                      const locked = isLessonLocked(l.id);
                      
                      if (locked) {
                        return (
                          <div 
                            key={l.id}
                            onClick={() => {
                              toast({
                                title: "Lecture Locked",
                                description: "Please complete all prior lessons in the course sequence to unlock this lecture.",
                                variant: "destructive"
                              });
                            }}
                            className="group flex items-center gap-3 p-2.5 mx-1 rounded-xl cursor-not-allowed bg-slate-900/10 border border-slate-900 opacity-60 text-slate-500 select-none hover:bg-slate-950/20"
                          >
                            <div className="flex items-center gap-2 shrink-0">
                              <Lock className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold leading-tight line-clamp-2 text-slate-500 font-medium">
                                {l.title}
                              </p>
                              {l.duration && (
                                <p className="text-[9px] mt-0.5 flex items-center gap-1 font-semibold text-slate-600 font-semibold">
                                  <Clock className="h-2.5 w-2.5" />
                                  {Math.floor(l.duration / 60)} min
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <Link 
                           key={l.id}
                           href={`/dashboard/lessons/${courseId}/${l.id}`}
                        >
                           <div
                            className={`
                              group flex items-center gap-3 p-2.5 mx-1 rounded-xl cursor-pointer
                              transition-all duration-200 border
                              ${isActive 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 border-primary' 
                                : 'bg-slate-900/20 hover:bg-slate-900/90 border-slate-900 hover:border-slate-800 text-slate-300'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`
                                text-[10px] font-extrabold w-5 text-center
                                ${isActive ? 'text-white' : 'text-slate-500'}
                              `}>
                                {lessonNumber}
                              </span>
                              
                              {l.isCompleted ? (
                                <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : 'bg-emerald-950 border border-emerald-800 text-emerald-400'}`}>
                                  <CheckCircle2 className="h-3 w-3" />
                                </div>
                              ) : isActive ? (
                                <div className="h-4.5 w-4.5 rounded-full bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
                                  <PlayCircle className="h-3 w-3 text-white" />
                                </div>
                              ) : (
                                <div className="h-4.5 w-4.5 rounded-full border border-slate-800 group-hover:border-slate-600 shrink-0" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`
                                text-xs font-bold leading-tight line-clamp-2
                                ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-primary transition-colors'}
                              `}>
                                {l.title}
                              </p>
                              {l.duration && (
                                <p className={`
                                  text-[9px] mt-0.5 flex items-center gap-1 font-semibold
                                  ${isActive ? 'text-white/80' : 'text-slate-500'}
                                `}>
                                  <Clock className="h-2.5 w-2.5" />
                                  {Math.floor(l.duration / 60)} min
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
      {/* Premium Non-Dismissible Lesson Feedback Modal */}
      <Dialog open={showFeedbackModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[450px] border-slate-800 bg-slate-900 text-slate-100 shadow-2xl rounded-3xl p-6 pointer-events-auto">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse shadow-xl">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-slate-100">
                Lecture Finished!
              </DialogTitle>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Please leave your feedback to unlock the next lecture in the sequence.
              </p>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmitFeedback} className="space-y-6 mt-4">
            {/* Star Rating Section */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                Rate this Video Lesson
              </span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= (feedbackHoverRating || feedbackRating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      onMouseEnter={() => setFeedbackHoverRating(star)}
                      onMouseLeave={() => setFeedbackHoverRating(0)}
                      className="p-1 transition-all duration-150 hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`h-9 w-9 transition-colors ${
                          isFilled
                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                            : "text-slate-700 hover:text-slate-500"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {feedbackRating > 0 && (
                <span className="text-xs font-bold text-amber-400 animate-in fade-in duration-200">
                  {feedbackRating === 5 && "⭐ Outstanding / Clear Explanation!"}
                  {feedbackRating === 4 && "👍 Very Informative & Helpful!"}
                  {feedbackRating === 3 && "👌 Good Lesson / Well Explained."}
                  {feedbackRating === 2 && "👉 Average / Could Be Better."}
                  {feedbackRating === 1 && "⚠️ Needs Improvement."}
                </span>
              )}
            </div>

            {/* Comment Section */}
            <div className="space-y-2">
              <Label className="font-extrabold text-slate-350 text-xs">
                Write your review / comments (Optional)
              </Label>
              <Textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="What did you learn? Tell us what you liked or what could be improved..."
                className="rounded-2xl border-slate-800 bg-slate-950 text-slate-100 text-xs focus-visible:ring-amber-500 focus-visible:ring-offset-slate-900 leading-relaxed font-semibold placeholder:text-slate-600"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={feedbackRating === 0 || isSubmittingFeedback}
              className={`w-full h-11 rounded-2xl font-black text-xs text-white transition-all ${
                feedbackRating > 0
                  ? "bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-500/20 active:scale-95 animate-in fade-in zoom-in-95 duration-200"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isSubmittingFeedback ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Submitting Review...
                </span>
              ) : (
                "Submit & Unlock Next Lecture"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
