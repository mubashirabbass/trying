import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  Loader2, 
  MessageSquare, 
  Plus, 
  ThumbsUp, 
  Pin, 
  ChevronRight, 
  ArrowLeft, 
  Send, 
  BookOpen, 
  User,
  MoreVertical,
  Flag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useListEnrollments, 
  useListForumPosts, 
  useCreateForumPost,
  useListForumReplies,
  useCreateForumReply,
  useUpvoteForumPost,
  useListCourses,
  getListForumPostsQueryKey,
  getListForumRepliesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function StudentForum() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", body: "" });
  const [replyBody, setReplyBody] = useState("");

  const isFaculty = user?.role === 'teacher' || user?.role === 'admin';
  const { data: enrollments } = useListEnrollments(
    undefined,
    { query: { enabled: !isFaculty } }
  );
  const { data: allCourses } = useListCourses();
  
  const coursesToDisplay = isFaculty ? allCourses : enrollments?.map(e => ({ id: e.courseId, title: e.courseName }));
  const { data: posts, isLoading: postsLoading } = useListForumPosts(
    selectedCourseId as number,
    { query: { enabled: !!selectedCourseId } }
  );

  const { data: replies, isLoading: repliesLoading } = useListForumReplies(
    selectedPostId as number,
    { query: { enabled: !!selectedPostId } }
  );

  const createPostMutation = useCreateForumPost();
  const createReplyMutation = useCreateForumReply();
  const upvoteMutation = useUpvoteForumPost();

  const selectedPost = posts?.find(p => p.id === selectedPostId);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !newPost.title || !newPost.body) return;

    try {
      await createPostMutation.mutateAsync({
        courseId: selectedCourseId,
        data: {
          userId: user?.id as number,
          title: newPost.title,
          body: newPost.body
        }
      });
      toast({ title: "Post published successfully" });
      setNewPost({ title: "", body: "" });
      setIsNewPostOpen(false);
      queryClient.invalidateQueries({ queryKey: getListForumPostsQueryKey(selectedCourseId) });
    } catch (error) {
      toast({ title: "Failed to create post", variant: "destructive" });
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
      toast({ title: "Failed to send reply", variant: "destructive" });
    }
  };

  const handleUpvote = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    try {
      await upvoteMutation.mutateAsync({ postId });
      queryClient.invalidateQueries({ queryKey: getListForumPostsQueryKey(selectedCourseId as number) });
    } catch (error) {
      // Ignore error for UX
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-200px)]">
        {/* Course Navigation Sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="sticky top-8 space-y-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                {isFaculty ? "Course Discussions" : "Forum"}
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                {isFaculty ? "Join any course forum and start discussions" : "Collaborate with your peers"}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">
                {isFaculty ? "All Courses" : "Your Courses"}
              </p>
              {coursesToDisplay?.map((course: any) => (
                <button
                  key={course.id}
                  onClick={() => { setSelectedCourseId(course.id); setSelectedPostId(null); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    selectedCourseId === course.id
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <BookOpen className={`h-4 w-4 ${selectedCourseId === course.id ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{course.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Discussion Area */}
        <div className="flex-1 min-w-0">
          {!selectedCourseId ? (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 p-12 text-center">
              <div className="h-20 w-20 rounded-[30px] bg-white shadow-sm flex items-center justify-center mb-6 text-slate-200">
                <MessageSquare className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Join the Conversation</h3>
                <p className="text-slate-500 font-medium max-w-sm">
                  {isFaculty
                    ? "Select any course forum to post announcements, answer questions, or start a discussion."
                    : "Select a course from the sidebar to view active discussions and ask questions."}
                </p>
            </div>
          ) : selectedPostId && selectedPost ? (
            <div className="flex flex-col h-full bg-white rounded-[32px] border-2 border-slate-100 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <Button variant="ghost" onClick={() => setSelectedPostId(null)} className="font-bold text-slate-600 hover:bg-white">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Threads
                </Button>
                <div className="flex items-center gap-2">
                  {selectedPost.isPinned && <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Pin className="h-3 w-3 mr-1" /> Pinned</Badge>}
                  <Button variant="ghost" size="icon" className="rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Original Post */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {selectedPost.authorName?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{selectedPost.authorName}</span>
                        {selectedPost.authorRole === 'teacher' && <Badge className="bg-primary text-white text-[10px] h-4">Teacher</Badge>}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(selectedPost.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedPost.title}</h2>
                  <div className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedPost.body}
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Replies */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    {replies?.length || 0} Responses
                  </h3>
                  {repliesLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : (
                    replies?.map((reply) => (
                      <div key={reply.id} className="flex gap-4 group">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          reply.authorRole === 'teacher' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {reply.authorName?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-slate-900">{reply.authorName}</span>
                            {reply.authorRole === 'teacher' && <Badge className="bg-primary/5 text-primary border-primary/10 text-[9px] h-4">Teacher</Badge>}
                            <span className="text-[10px] font-bold text-slate-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                            reply.authorRole === 'teacher' ? 'bg-primary/5 text-slate-700 border border-primary/10' : 'bg-slate-50 text-slate-600'
                          }`}>
                            {reply.body}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <form onSubmit={handleSendReply} className="flex gap-3">
                  <Input 
                    value={replyBody} 
                    onChange={(e) => setReplyBody(e.target.value)} 
                    placeholder="Join the discussion..." 
                    className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus-visible:ring-primary"
                  />
                  <Button type="submit" size="icon" disabled={!replyBody.trim() || createReplyMutation.isPending} className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20">
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Threads</h2>
                <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-2xl font-bold shadow-lg shadow-primary/20">
                      <Plus className="h-4 w-4 mr-2" /> {isFaculty ? "Add Post" : "Start Discussion"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px] rounded-[32px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black">{isFaculty ? "Add Forum Post" : "New Discussion"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreatePost} className="space-y-6 py-4">
                      <div className="space-y-3">
                        <Label className="font-bold text-slate-700">Topic Title</Label>
                        <Input 
                          required 
                          value={newPost.title} 
                          onChange={(e) => setNewPost({...newPost, title: e.target.value})} 
                          placeholder="What would you like to discuss?"
                          className="h-12 rounded-xl border-slate-200"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="font-bold text-slate-700">Description</Label>
                        <Textarea 
                          required 
                          rows={6}
                          value={newPost.body} 
                          onChange={(e) => setNewPost({...newPost, body: e.target.value})} 
                          placeholder={isFaculty ? "Write a course update, prompt, answer, or discussion starter..." : "Provide details for your peers and instructors..."}
                          className="rounded-xl border-slate-200"
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full h-12 font-bold text-lg" disabled={createPostMutation.isPending}>
                          {createPostMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : isFaculty ? "Publish Post" : "Post to Forum"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {postsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : posts?.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                  <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No threads yet. Start the first discussion!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {posts?.map((post) => (
                    <Card 
                      key={post.id} 
                      onClick={() => setSelectedPostId(post.id)}
                      className="group cursor-pointer hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all rounded-[28px] border-2 border-slate-100 overflow-hidden"
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex flex-col items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                            <button 
                              onClick={(e) => handleUpvote(e, post.id)}
                              className="text-slate-400 group-hover:text-primary transition-colors flex flex-col items-center"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span className="text-[10px] font-black mt-1">{post.upvotes}</span>
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {post.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
                              <h3 className="font-black text-slate-900 group-hover:text-primary transition-colors truncate">
                                {post.title}
                              </h3>
                            </div>
                            <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-4">{post.body}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="h-5 w-5 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                    {post.authorName?.charAt(0)}
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.authorName}</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                  {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
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
      </div>
    </DashboardLayout>
  );
}
