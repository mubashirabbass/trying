import { DashboardLayout } from "@/components/DashboardLayout";
import {
  useListSuccessStories,
  useCreateSuccessStory,
  useDeleteSuccessStory,
  getListSuccessStoriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSuccessStories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    course: "",
    story: "",
    currentJob: "",
    income: "",
    photoUrl: "",
  });

  const { data: stories, isLoading } = useListSuccessStories({
    query: { queryKey: getListSuccessStoriesQueryKey() },
  });

  const createMutation = useCreateSuccessStory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuccessStoriesQueryKey() });
        setOpen(false);
        setForm({ name: "", course: "", story: "", currentJob: "", income: "", photoUrl: "" });
        toast({ title: "Success story added!" });
      },
      onError: () => toast({ title: "Failed to add story", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteSuccessStory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuccessStoriesQueryKey() });
        toast({ title: "Story deleted" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: form });
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Success Stories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showcase graduate achievements on the homepage
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Story
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Success Story</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Student Name *</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Course *</Label>
                  <Input
                    required
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                    placeholder="Course completed"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Their Story *</Label>
                <Textarea
                  required
                  value={form.story}
                  onChange={(e) => setForm({ ...form, story: e.target.value })}
                  placeholder="How Global College changed their life..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Job</Label>
                  <Input
                    value={form.currentJob}
                    onChange={(e) => setForm({ ...form, currentJob: e.target.value })}
                    placeholder="e.g. Freelance Designer"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Monthly Income</Label>
                  <Input
                    value={form.income}
                    onChange={(e) => setForm({ ...form, income: e.target.value })}
                    placeholder="e.g. Rs. 50,000/month"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Photo URL</Label>
                <Input
                  value={form.photoUrl}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Add Story
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories?.map((story: any) => (
            <Card key={story.id} className="hover:shadow-md transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-[#0f2c6f] to-[#1a47b8] text-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold">
                      {story.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{story.name}</p>
                      <p className="text-xs text-blue-200">{story.currentJob}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => deleteMutation.mutate({ id: story.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-sm text-gray-600 italic line-clamp-3 mb-3">
                  "{story.story}"
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    {story.course}
                  </Badge>
                  {story.income && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Trophy className="h-3 w-3" /> {story.income}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {(!stories || stories.length === 0) && (
            <div className="col-span-3 text-center py-16 bg-white rounded-xl border border-gray-200">
              <Trophy className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No success stories yet.</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
