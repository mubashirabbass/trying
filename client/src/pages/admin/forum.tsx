import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  useListForumPosts, 
  useDeleteForumPost,
  useUpdateForumPost,
  getListForumPostsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, 
  MessageSquare, 
  Trash2, 
  Pin, 
  MoreHorizontal,
  User,
  AlertCircle,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AdminForum() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: posts = [], isLoading } = useListForumPosts({ courseId: 0 }); // Fetch all posts if possible or just latest

  const deleteMutation = useDeleteForumPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListForumPostsQueryKey({ courseId: 0 }) });
        toast({ title: "Post deleted" });
      }
    }
  });

  const pinMutation = useUpdateForumPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListForumPostsQueryKey({ courseId: 0 }) });
        toast({ title: "Post status updated" });
      }
    }
  });

  const filteredPosts = posts.filter((p: any) => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Forum Moderation</h1>
        <p className="text-gray-500 mt-1">Manage community discussions, pin important threads, and remove inappropriate content.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search discussions by title or author..." 
            className="pl-10 h-11 rounded-xl border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl font-bold gap-2">
          <Filter className="h-4 w-4" /> Filter by Course
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest pl-6">Discussion</TableHead>
                <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Author</TableHead>
                <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Stats</TableHead>
                <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
              ) : filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-bold text-lg">No Discussions Found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post: any) => (
                  <tr key={post.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {post.isPinned && <Pin className="h-4 w-4 text-amber-500 mt-1 shrink-0" />}
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-primary transition-colors cursor-pointer">{post.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium line-clamp-1">{post.body}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                          {post.userName?.charAt(0) ?? "U"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-xs">{post.userName}</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Student</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 text-sm">{post.replyCount || 0}</span>
                          <span className="text-[9px] font-black text-gray-400 uppercase">Replies</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 text-sm">{post.upvotes || 0}</span>
                          <span className="text-[9px] font-black text-gray-400 uppercase">Votes</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.isPinned ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold">Pinned</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400 border-gray-100">Normal</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-xl">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                          <DropdownMenuItem 
                            className="cursor-pointer font-bold"
                            onClick={() => pinMutation.mutate({ id: post.id, data: { isPinned: !post.isPinned } as any })}
                          >
                            <Pin className="h-4 w-4 mr-2" /> {post.isPinned ? "Unpin Post" : "Pin Post"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-bold text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => {
                              if (confirm("Are you sure? This will permanently remove this discussion.")) {
                                deleteMutation.mutate({ id: post.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
