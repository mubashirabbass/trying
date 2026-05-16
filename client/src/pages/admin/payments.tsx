import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useListPayments, useVerifyPayment, getListPaymentsQueryKey } from "@workspace/api-client-react";
import { Loader2, CheckCircle2, XCircle, Clock, Eye, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: payments, isLoading } = useListPayments({}, { query: { queryKey: getListPaymentsQueryKey({}) } });
  const verifyPayment = useVerifyPayment();

  const [reviewPayment, setReviewPayment] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const handleVerify = async (id: number, status: "verified" | "rejected") => {
    try {
      await verifyPayment.mutateAsync({
        id,
        data: { status, notes }
      });
      toast({ title: `Payment ${status === 'verified' ? 'Verified' : 'Rejected'}` });
      queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
      setIsReviewOpen(false);
      setReviewPayment(null);
      setNotes("");
    } catch (error) {
      toast({ title: "Verification failed", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none"><CheckCircle2 className="h-3 w-3 mr-1" /> Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="border-none"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-gray-500">Verify and manage student payment receipts</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.userName || `User #${payment.userId}`}</TableCell>
                  <TableCell>{payment.courseName || `Course #${payment.courseId}`}</TableCell>
                  <TableCell>Rs. {payment.amount}</TableCell>
                  <TableCell className="uppercase text-xs font-bold text-muted-foreground">{payment.method}</TableCell>
                  <TableCell className="text-sm text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => {
                      setReviewPayment(payment);
                      setIsReviewOpen(true);
                      setNotes(payment.notes || "");
                    }}>
                      {payment.status === 'pending' ? 'Review' : 'View'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {payments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">No payments found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Payment Receipt</DialogTitle>
            <DialogDescription>
              Verify the transaction details from the provided receipt.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="aspect-[3/4] bg-slate-900 rounded-3xl overflow-hidden border-8 border-slate-900 relative group shadow-2xl">
                {reviewPayment?.receiptUrl ? (
                  <>
                    <div className="w-full h-full overflow-hidden cursor-zoom-in relative">
                      <img 
                        src={reviewPayment.receiptUrl} 
                        alt="Payment Receipt" 
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-150 origin-center"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <p className="text-white text-xs font-black uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                          Hover to Zoom
                        </p>
                      </div>
                    </div>
                    <a 
                      href={reviewPayment.receiptUrl} 
                      target="_blank" 
                      className="absolute top-4 right-4 h-10 w-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl border border-white/20"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 italic text-sm gap-3">
                    <XCircle className="h-10 w-10 opacity-20" />
                    No receipt image provided
                  </div>
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                Review receipt details before verification
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2 pb-2 border-b">
                  <span className="text-muted-foreground">Student:</span>
                  <span className="font-medium">{reviewPayment?.userName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pb-2 border-b">
                  <span className="text-muted-foreground">Course:</span>
                  <span className="font-medium">{reviewPayment?.courseName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pb-2 border-b">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">Rs. {reviewPayment?.amount}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pb-2 border-b">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="font-medium uppercase">{reviewPayment?.method}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea 
                  placeholder="Internal notes or reason for rejection..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {reviewPayment?.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button variant="destructive" className="flex-1" onClick={() => handleVerify(reviewPayment.id, "rejected")}>
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleVerify(reviewPayment.id, "verified")}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Verify
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
