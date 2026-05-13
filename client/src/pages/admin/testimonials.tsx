import { DashboardLayout } from "@/components/DashboardLayout";
import {
  useListTestimonials,
  useCreateTestimonial,
  useDeleteTestimonial,
  getListTestimonialsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Star, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`h-8 w-8 rounded ${
            i <= value ? "text-yellow-400" : "text-gray-300"
          } hover:text-yellow-400 transition-colors`}
        >
          <Star className={`h-6 w-6 ${i <= value ? "fill-yellow-400" : ""}`} />
        </button>
      ))}
    </div>
  );
}

export default function AdminTestimonials() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    course: "",
    content: "",
    rating: 5,
    photoUrl: "",
  });

  const { data: testimonials, isLoading } = useListTestimonials({
    query: { queryKey: getListTestimonialsQueryKey() },
  });

  const createMutation = useCreateTestimonial({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
        setOpen(false);
        setForm({ name: "", course: "", content: "", rating: 5, photoUrl: "" });
        toast({ title: "Testimonial added!" });
      },
      onError: () => toast({ title: "Failed to add testimonial", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteTestimonial({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
        toast({ title: "Testimonial deleted" });
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
          <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage student reviews displayed on the homepage
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Student Testimonial</DialogTitle>
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
                    placeholder="Course name"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Rating *</Label>
                <div className="mt-2">
                  <StarPicker
                    value={form.rating}
                    onChange={(v) => setForm({ ...form, rating: v })}
                  />
                </div>
              </div>
              <div>
                <Label>Their Review *</Label>
                <Textarea
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="What did the student say about us?"
                  rows={4}
                  className="mt-1"
                />
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
                  Add Testimonial
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
          {testimonials?.map((t: any) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i <= (t.rating ?? 5)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-1"
                    onClick={() => deleteMutation.mutate({ id: t.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 italic leading-relaxed mb-4">
                  "{t.content}"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                    {t.name?.charAt(0) ?? "S"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.course}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!testimonials || testimonials.length === 0) && (
            <div className="col-span-3 text-center py-16 bg-white rounded-xl border border-gray-200">
              <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No testimonials yet.</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
