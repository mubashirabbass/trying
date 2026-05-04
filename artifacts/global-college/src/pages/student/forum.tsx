import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, MessageSquare, Plus, ThumbsUp, Pin, ChevronRight, ArrowLeft, Send, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useListEnrollments, getListEnrollmentsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Post { id: number; title: string; body: string; isPinned: boolean; upvotes: number; createdAt: string; authorName?: string; authorRole?: string; courseId: number; }
interface Reply { id: number; body: string; createdAt: string; authorName?: string; authorRole?: string; }

export default function StudentForum() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState(""); const [newBody, setNewBody] = useState(""); const [replyBody, setReplyBody] = useState("");
  const [postOpen, setPostOpen] = useState(false); const [posting, setPosting] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const { data: enrollments } = useListEnrollments(
    { userId: user?.id },
    { query: { queryKey: getListEnrollmentsQueryKey({ userId: user?.id }) } }
  );

  const fetchPosts = async (courseId: number) => {
    setLoading(true);
    const r = await fetch(`${BASE}/api/forum/courses/${courseId}/posts`, { headers });
    if (r.ok) setPosts(await r.json());
    setLoading(false);
  };

  const fetchReplies = async (postId: number) => {
    const r = await fetch(`${BASE}/api/forum/posts/${postId}/replies`, { headers });
    if (r.ok) setReplies(await r.json());
  };

  const selectCourse = (id: number) => { setSelectedCourseId(id); setSelectedPost(null); fetchPosts(id); };
  const selectPost = (post: Post) => { setSelectedPost(post); fetchReplies(post.id); };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim() || !selectedCourseId) return;
    setPosting(true);
    const r = await fetch(`${BASE}/api/forum/courses/${selectedCourseId}/posts`, {
      method: "POST", headers, body: JSON.stringify({ userId: user?.id, title: newTitle, body: newBody }),
    });
    if (r.ok) { toast({ title: "Post created!" }); setNewTitle(""); setNewBody(""); setPostOpen(false); fetchPosts(selectedCourseId); }
    setPosting(false);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !selectedPost) return;
    const r = await fetch(`${BASE}/api/forum/posts/${selectedPost.id}/replies`, {
      method: "POST", headers, body: JSON.stringify({ userId: user?.id, body: replyBody }),
    });
    if (r.ok) { setReplyBody(""); fetchReplies(selectedPost.id); }
  };

  const upvote = async (postId: number) => {
    await fetch(`${BASE}/api/forum/posts/${postId}/upvote`, { method: "PATCH", headers });
    if (selectedCourseId) fetchPosts(selectedCourseId);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discussion Forum</h1>
          <p className="text-sm text-gray-500 mt-1">Ask questions, share knowledge with your batch</p>
        </div>
        {selectedCourseId && !selectedPost && (
          <Dialog open={postOpen} onOpenChange={setPostOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Post</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create a New Post</DialogTitle></DialogHeader>
              <form onSubmit={createPost} className="space-y-4 mt-2">
                <div><Label>Title *</Label><Input required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="mt-1" placeholder="Your question or topic..." /></div>
                <div><Label>Details *</Label><Textarea required rows={5} value={newBody} onChange={e => setNewBody(e.target.value)} className="mt-1" placeholder="Describe your question in detail..." /></div>
                <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setPostOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={posting}>{posting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Post</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4 min-h-[500px]">
        {/* Course sidebar */}
        <div className="w-56 shrink-0 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-3">My Courses</p>
          {!enrollments || enrollments.length === 0 ? (
            <p className="text-sm text-gray-400 px-2">No enrolled courses.</p>
          ) : (
            enrollments.map((e: any) => (
              <button key={e.courseId} onClick={() => selectCourse(e.courseId)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${selectedCourseId === e.courseId ? "bg-primary text-white" : "hover:bg-gray-100 text-gray-700"}`}>
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="truncate">{e.courseName ?? `Course #${e.courseId}`}</span>
              </button>
            ))
          )}
        </div>

        {/* Main area */}
        <div className="flex-1">
          {!selectedCourseId ? (
            <div className="bg-white rounded-xl border border-gray-200 h-full flex items-center justify-center">
              <div className="text-center"><MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Select a course to view its discussion forum</p></div>
            </div>
          ) : selectedPost ? (
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full">
              <div className="p-4 border-b flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedPost(null)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                {selectedPost.isPinned && <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Pin className="h-3 w-3 mr-1" /> Pinned</Badge>}
              </div>
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedPost.title}</h2>
                <p className="text-gray-600 mb-4">{selectedPost.body}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>By <span className="font-medium text-gray-700">{selectedPost.authorName}</span></span>
                  <span>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                  <button onClick={() => upvote(selectedPost.id)} className="flex items-center gap-1 hover:text-primary">
                    <ThumbsUp className="h-4 w-4" /> {selectedPost.upvotes}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <h3 className="font-semibold text-gray-700 text-sm">{replies.length} {replies.length === 1 ? "Reply" : "Replies"}</h3>
                {replies.map(r => (
                  <div key={r.id} className={`flex gap-3 ${r.authorRole === "teacher" || r.authorRole === "admin" ? "bg-blue-50 rounded-lg p-3 -mx-3" : ""}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${r.authorRole === "teacher" || r.authorRole === "admin" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}>
                      {r.authorName?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{r.authorName}</span>
                        {(r.authorRole === "teacher" || r.authorRole === "admin") && <Badge className="bg-primary/10 text-primary text-xs py-0">Instructor</Badge>}
                        <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700">{r.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendReply} className="p-4 border-t flex gap-3">
                <Input value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="Write a reply..." className="flex-1" />
                <Button type="submit" disabled={!replyBody.trim()}><Send className="h-4 w-4" /></Button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No posts yet. Be the first to ask a question!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {posts.map(post => (
                    <button key={post.id} onClick={() => selectPost(post)}
                      className="w-full text-left p-5 hover:bg-gray-50 transition-colors flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {post.isPinned && <Pin className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                          <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">{post.body}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>{post.authorName}</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {post.upvotes}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 mt-1 shrink-0" />
                    </button>
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
