import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useListCourses, getListCoursesQueryKey } from "@workspace/api-client-react";
import { 
  CheckCircle2, 
  MessageSquare, 
  AlertCircle, 
  Send, 
  Search,
  Star,
  Loader2,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

type FeedbackType = "course" | "complaint" | "general";

interface Complaint {
  id: string;
  type: string;
  subject: string;
  status: "pending" | "investigating" | "resolved";
  date: string;
  response?: string;
}

export default function Feedback() {
  const [activeTab, setActiveTab] = useState("submit");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("course");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastTicketId, setLastTicketId] = useState<string | null>(null);
  const [searchTicket, setSearchTicket] = useState("");

  const { data: courses } = useListCourses(
    {},
    { query: { queryKey: getListCoursesQueryKey() } }
  );
  
  const displayCourses = courses || [
    { id: "1", title: "eBay Business Course (EBC)" },
    { id: "2", title: "Amazon FBA Mastery" },
    { id: "3", title: "Graphics & Logo Design" },
    { id: "4", title: "Freelancing Bootcamp" }
  ];

  const [mockComplaints, setMockComplaints] = useState<Complaint[]>([
    {
      id: "GC-8241-9021",
      type: "Course Access",
      subject: "Unable to access Week 3 videos",
      status: "resolved",
      date: "2026-05-10",
      response: "The server issue has been fixed. You can now access all videos."
    },
    {
      id: "GC-1932-5582",
      type: "Payment",
      subject: "Installment update delay",
      status: "investigating",
      date: "2026-05-14"
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const ticketId = `GC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Simulate Email Protocol and Backend Processing
    setTimeout(() => {
      setIsSubmitting(false);
      setLastTicketId(ticketId);
      toast.success("Feedback submitted successfully!");
      
      const newComplaint: Complaint = {
        id: ticketId,
        type: feedbackType === 'course' ? 'Course Feedback' : feedbackType === 'complaint' ? 'Official Complaint' : 'General Feedback',
        subject: (e.target as any).subject?.value || "Feedback Submission",
        status: "pending",
        date: new Date().toISOString().split('T')[0]
      };
      setMockComplaints([newComplaint, ...mockComplaints]);
    }, 2000);
  };

  const filteredComplaints = searchTicket 
    ? mockComplaints.filter(c => c.id.toLowerCase().includes(searchTicket.toLowerCase()))
    : [];

  if (lastTicketId) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center px-4 bg-slate-50">
          <Card className="max-w-lg w-full text-center p-10 border-0 shadow-2xl rounded-[3rem] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
            <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Ticket Generated!</h2>
            <p className="text-gray-500 mb-8 font-medium">
              Your feedback has been logged in our system. Please save your ticket ID for future reference.
            </p>
            
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 relative group">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Your Unique Ticket ID</span>
              <div className="text-2xl font-black text-primary font-mono tracking-tighter">
                {lastTicketId}
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(lastTicketId);
                  toast.success("Ticket ID copied!");
                }}
                className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 underline flex items-center justify-center gap-1 mx-auto"
              >
                Copy ID
              </button>
            </div>

            <div className="space-y-4">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 h-16 rounded-2xl text-lg font-black shadow-xl shadow-primary/20"
                onClick={() => {
                  setLastTicketId(null);
                  setActiveTab("track");
                }}
              >
                Track This Ticket
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-gray-400 font-bold h-12"
                onClick={() => setLastTicketId(null)}
              >
                Submit New Feedback
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-20 bg-slate-50 min-h-screen">
        <div className="w-full px-4 md:px-10 lg:px-16">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200 px-4 py-1.5 rounded-full font-bold">
              Student Voice
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Help Us <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Improve</span>
            </h1>
            <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">
              Your feedback shapes the future of Global College. Whether it's a success story or a concern, we're listening.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-12 p-1 bg-white shadow-sm border border-gray-100 rounded-2xl h-16">
                <TabsTrigger value="submit" className="rounded-xl font-bold text-base data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                  Submit Feedback
                </TabsTrigger>
                <TabsTrigger value="track" className="rounded-xl font-bold text-base data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                  Track Complaints
                </TabsTrigger>
              </TabsList>

              <TabsContent value="submit">
                <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                  <div className="bg-gradient-to-r from-primary to-blue-600 p-8 text-white">
                    <h3 className="text-2xl font-black mb-2">Feedback Form</h3>
                    <p className="text-blue-100 font-medium">Please fill in the details below</p>
                  </div>
                  <CardContent className="p-8 md:p-12">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="name" className="text-sm font-black text-gray-700 uppercase">Your Name</Label>
                          <Input id="name" placeholder="Enter your full name" required className="h-14 rounded-xl border-gray-100 bg-slate-50 focus:bg-white focus:ring-primary/20 transition-all" />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="email" className="text-sm font-black text-gray-700 uppercase">Student Email</Label>
                          <Input id="email" type="email" placeholder="email@example.com" required className="h-14 rounded-xl border-gray-100 bg-slate-50 focus:bg-white focus:ring-primary/20 transition-all" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-black text-gray-700 uppercase">What would you like to share?</Label>
                        <Select value={feedbackType} onValueChange={(val) => setFeedbackType(val as FeedbackType)}>
                          <SelectTrigger className="h-14 rounded-xl border-gray-100 bg-slate-50 focus:bg-white transition-all">
                            <SelectValue placeholder="Select feedback type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                            <SelectItem value="course">Course Feedback</SelectItem>
                            <SelectItem value="complaint">Submit a Complaint</SelectItem>
                            <SelectItem value="general">General Feedback</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {feedbackType === "course" && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-8">
                          <div className="space-y-3">
                            <Label htmlFor="course" className="text-sm font-black text-gray-700 uppercase">Select Course</Label>
                            <Select required>
                              <SelectTrigger className="h-14 rounded-xl border-gray-100 bg-slate-50 focus:bg-white transition-all">
                                <SelectValue placeholder="Choose your course" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                {displayCourses.map((course: any) => (
                                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-4">
                            <Label className="text-sm font-black text-gray-700 uppercase text-center block">Rate Course Quality</Label>
                            <div className="flex justify-center gap-4">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  className={`p-2 transition-all duration-300 ${rating >= star ? 'scale-125' : 'grayscale opacity-30 hover:opacity-100'}`}
                                >
                                  <Star className={`h-10 w-10 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label htmlFor="subject" className="text-sm font-black text-gray-700 uppercase">Subject</Label>
                        <Input id="subject" name="subject" placeholder="What is this about?" required className="h-14 rounded-xl border-gray-100 bg-slate-50 focus:bg-white focus:ring-primary/20 transition-all" />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="message" className="text-sm font-black text-gray-700 uppercase">Message / Issue Details</Label>
                        <Textarea 
                          id="message" 
                          placeholder="Please describe your feedback or issue in detail..." 
                          required 
                          className="min-h-[150px] rounded-2xl border-gray-100 bg-slate-50 focus:bg-white focus:ring-primary/20 transition-all p-6 text-base"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary/90 h-16 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 gap-2 group transition-all"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <>
                            Send Feedback <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="track">
                <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
                    <h3 className="text-2xl font-black mb-2">Complaint Tracking</h3>
                    <p className="text-emerald-50 font-medium">Monitor the status of your reported issues</p>
                  </div>
                  <CardContent className="p-8">
                    {/* Ticket Search */}
                    <div className="relative mb-8">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input 
                        placeholder="Search by Ticket ID (e.g. GC-XXXX-XXXX)..." 
                        value={searchTicket}
                        onChange={(e) => setSearchTicket(e.target.value)}
                        className="h-14 pl-12 rounded-xl border-gray-100 bg-slate-50 focus:bg-white focus:ring-primary/20 transition-all text-base font-bold"
                      />
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-50">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-100">
                            <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase">Ticket ID</th>
                            <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase">Issue</th>
                            <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase">Date</th>
                            <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase">Status</th>
                            <th className="px-8 py-6"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredComplaints.length > 0 ? filteredComplaints.map((complaint) => (
                            <tr key={complaint.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-6 font-mono font-bold text-primary">{complaint.id}</td>
                              <td className="px-8 py-6">
                                <p className="font-black text-gray-900">{complaint.type}</p>
                                <p className="text-sm text-gray-500">{complaint.subject}</p>
                              </td>
                              <td className="px-8 py-6 text-sm text-gray-500">{complaint.date}</td>
                              <td className="px-8 py-6">
                                <Badge className={`rounded-lg px-3 py-1 font-bold ${
                                  complaint.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                                  complaint.status === 'investigating' ? 'bg-blue-50 text-blue-700' :
                                  'bg-amber-50 text-amber-700'
                                }`}>
                                  {complaint.status}
                                </Badge>
                              </td>
                              <td className="px-8 py-6">
                                {complaint.response && (
                                  <div className="group relative">
                                    <MessageSquare className="h-5 w-5 text-gray-300 hover:text-primary cursor-help" />
                                    <div className="absolute bottom-full right-0 mb-2 w-64 p-4 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-2xl pointer-events-none">
                                      <p className="font-bold mb-1 text-primary">Admin Response:</p>
                                      {complaint.response}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-medium">
                                <div className="flex flex-col items-center gap-4">
                                  {searchTicket ? (
                                    <>
                                      <AlertCircle className="h-10 w-10 opacity-20" />
                                      <p>No complaints found with Ticket ID: <span className="font-bold text-gray-900">"{searchTicket}"</span></p>
                                    </>
                                  ) : (
                                    <>
                                      <Search className="h-10 w-10 opacity-20" />
                                      <p>Enter your <span className="font-bold text-gray-900">Ticket ID</span> above to track your complaint status.</p>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
