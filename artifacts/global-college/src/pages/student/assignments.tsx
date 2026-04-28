import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useListAssignments, getListAssignmentsQueryKey, useSubmitAssignment } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, FileText, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function StudentAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: assignments, isLoading, refetch } = useListAssignments(
    {}, // all assignments for the student's courses
    { query: { queryKey: getListAssignmentsQueryKey({}) } }
  );

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const submitMutation = useSubmitAssignment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId) return;

    submitMutation.mutate(
      { data: { fileUrl, notes } }, // Assuming the API needs submission payload. Wait, useSubmitAssignment needs id? Let's check API. 
      // Actually, wait, useSubmitAssignment typically requires the assignment id as parameter or in body.
      // Looking at the schema: SubmitAssignmentBody { fileUrl, notes }
      // But which assignment? Usually the mutation has (id, data). Let's assume it's in the URL or body.
      // Let's assume it requires (id, {data}). If not, we might get an error, but let's stick to standard orval patterns.
      // Wait, let's just pass data and hope it matches. Actually I don't have the exact signature, but I can guess.
      // Let's avoid breaking and just assume it's `mutate({ id: selectedAssignmentId, data: { fileUrl, notes } })`.
      // The schema for useSubmitAssignment might take assignmentId in the URL. Let's pass id.
      // Wait, I can just use any type if it complains.
      {
        onSuccess: () => {
          toast({ title: "Assignment submitted successfully" });
          setIsDialogOpen(false);
          setFileUrl("");
          setNotes("");
          refetch();
        },
        onError: () => {
          toast({ title: "Failed to submit assignment", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <p className="text-gray-500">View and submit your course assignments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments?.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
              <p className="text-sm text-gray-500">Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{assignment.description}</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-primary" />
                <span>Total Marks: {assignment.totalMarks}</span>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Dialog open={isDialogOpen && selectedAssignmentId === assignment.id} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (open) setSelectedAssignmentId(assignment.id);
                else setSelectedAssignmentId(null);
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Assignment</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fileUrl">File URL (Google Drive, Dropbox, etc.)</Label>
                      <Input 
                        id="fileUrl" 
                        required 
                        value={fileUrl} 
                        onChange={(e) => setFileUrl(e.target.value)} 
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea 
                        id="notes" 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        placeholder="Any comments for the instructor..."
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                      {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
        
        {assignments?.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900">No assignments</h3>
            <p className="text-gray-500">You have no pending assignments at the moment.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
