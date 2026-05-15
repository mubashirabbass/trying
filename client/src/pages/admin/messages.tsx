import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  useListMessageThreads, 
  useGetMessageThread,
  MessageThread
} from "@workspace/api-client-react";
import { 
  Loader2, 
  Search, 
  MessageCircle, 
  User, 
  UserCheck,
  Calendar,
  MoreHorizontal,
  ChevronRight,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "wouter";

export default function AdminMessages() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: threads = [], isLoading } = useListMessageThreads({});

  const filteredThreads = threads.filter((t: MessageThread) => 
    t.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Message Explorer</h1>
        <p className="text-gray-500 mt-1">Monitor communication between students and faculty to ensure quality of support.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by student, teacher or course name..." 
            className="pl-10 h-11 rounded-xl border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl font-bold gap-2">
          <Filter className="h-4 w-4" /> Filter by Date
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
        ) : filteredThreads.length === 0 ? (
          <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px]">
            <CardContent className="py-20 text-center">
              <MessageCircle className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="font-bold text-gray-400">No message threads found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredThreads.map((thread: MessageThread) => (
            <Card key={thread.id} className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden hover:ring-primary/20 transition-all group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-stretch">
                  {/* Participants Column */}
                  <div className="md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-gray-50 bg-slate-50/30">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Student</span>
                        <span className="font-bold text-gray-900 leading-tight">{thread.studentName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Teacher</span>
                        <span className="font-bold text-gray-900 leading-tight">{thread.teacherName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Message Detail Column */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold border-none">
                          Course: {thread.courseName}
                        </Badge>
                        <span className="text-[10px] font-black text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                          <Calendar className="h-3 w-3" /> Last Active: {new Date(thread.lastMessageAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-medium line-clamp-2 italic">
                        "{thread.lastMessagePreview || "Click to view full conversation history."}"
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-slate-200" />
                        ))}
                        <div className="h-7 w-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                          +{thread.messageCount || 0}
                        </div>
                      </div>
                      <Button className="rounded-xl font-bold gap-2 group-hover:bg-primary group-hover:text-white transition-all">
                        View Chat History <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
