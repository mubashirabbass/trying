import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useListQuizzes } from "@workspace/api-client-react";
import { useAuth } from "@/lib/AuthContext";
import { 
  Loader2, 
  HelpCircle, 
  Clock, 
  Play, 
  Trophy,
  CheckCircle2,
  XCircle,
  BarChart3,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function StudentQuizzes() {
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const { data: quizzes, isLoading: quizzesLoading } = useListQuizzes();
  const [results, setResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const r = await fetch(`${BASE}/api/quizzes/results`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          setResults(await r.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setResultsLoading(false);
      }
    };
    if (token) fetchResults();
  }, [token]);

  const isLoading = quizzesLoading || resultsLoading;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Quizzes</h1>
        <p className="text-muted-foreground mt-2 font-medium text-lg">Test your knowledge and track your academic progress</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-2xl mb-8">
          <TabsTrigger value="active" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Play className="h-4 w-4 mr-2" /> Active Quizzes
          </TabsTrigger>
          <TabsTrigger value="results" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Trophy className="h-4 w-4 mr-2" /> My Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {quizzesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {quizzes?.map((quiz) => (
                <Card key={quiz.id} className="group border-none shadow-sm ring-1 ring-slate-100 hover:ring-primary/20 transition-all hover:shadow-xl hover:shadow-primary/5 rounded-[32px] overflow-hidden bg-white flex flex-col">
                  <CardHeader className="pb-4 pt-8 px-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <HelpCircle className="h-7 w-7" />
                      </div>
                      <Badge variant="secondary" className="font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-50 text-slate-500 border-none">
                        {quiz.timeLimit} Mins
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 leading-tight">
                      {quiz.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 flex-grow">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                        <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center"><Play className="h-4 w-4" /></div>
                        {quiz.questions.length} Questions
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                        <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center"><Trophy className="h-4 w-4" /></div>
                        {quiz.totalMarks} Total Marks
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-8 pt-4">
                    <Button 
                      className="w-full h-14 font-black text-md rounded-2xl shadow-xl shadow-primary/10 transition-all active:scale-[0.98]"
                      onClick={() => setLocation(`/dashboard/quizzes/${quiz.id}`)}
                    >
                      Start Quiz <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {quizzes?.length === 0 && (
                <div className="col-span-full py-24 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
                  <div className="h-20 w-20 rounded-[30px] bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <HelpCircle className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">No active quizzes</h3>
                  <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto px-6">
                    Your instructors haven't posted any quizzes for your courses yet. Keep checking back!
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results">
          {resultsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.id} className="border-none shadow-sm ring-1 ring-slate-100 hover:ring-primary/20 transition-all rounded-[24px] overflow-hidden bg-white group cursor-pointer" onClick={() => setLocation(`/dashboard/quizzes/results/${result.id}`)}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                      <div className={`h-16 w-16 rounded-[20px] flex items-center justify-center shrink-0 ${result.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {result.passed ? <Trophy className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border-none ${result.passed ? 'bg-emerald-500 shadow-sm' : 'bg-rose-500 shadow-sm'}`}>
                            {result.passed ? 'Passed' : 'Failed'}
                          </Badge>
                          <span className="text-xs text-slate-400 font-bold">{new Date(result.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 truncate group-hover:text-primary transition-colors">
                          {result.quizTitle || 'Quiz Result'}
                        </h3>
                      </div>

                      <div className="flex items-center gap-12 shrink-0">
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                          <p className="text-xl font-black text-slate-800">{result.score}/{result.totalMarks}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Grade</p>
                          <p className={`text-xl font-black ${result.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{result.percentage}%</p>
                        </div>
                        <Button variant="ghost" className="rounded-full h-12 w-12 p-0 text-slate-400 group-hover:text-primary group-hover:bg-primary/5">
                          <BarChart3 className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {results.length === 0 && (
                <div className="py-24 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
                  <div className="h-20 w-20 rounded-[30px] bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <Trophy className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">No results yet</h3>
                  <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto px-6">
                    Complete your first quiz to see your performance analysis here!
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
