import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useGetQuizResult } from "@workspace/api-client-react";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Trophy,
  ArrowLeft,
  Calendar,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function QuizResultPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const { data: result, isLoading: loading } = useGetQuizResult(Number(id));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!result) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Result not found</h2>
          <Button className="mt-4" onClick={() => setLocation("/dashboard/quizzes")}>Back to Quizzes</Button>
        </div>
      </DashboardLayout>
    );
  }

  const { quiz } = result as any;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
        <Button 
          variant="ghost" 
          className="mb-6 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          onClick={() => setLocation("/dashboard/quizzes")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quizzes
        </Button>

        <Card className="border-none shadow-2xl ring-1 ring-slate-100 rounded-[32px] overflow-hidden">
          <div className={`h-3 ${result.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <CardHeader className="text-center pb-8 pt-12">
            <div className="flex justify-center mb-6">
              <div className={`h-24 w-24 rounded-[32px] flex items-center justify-center ${result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} shadow-lg`}>
                {result.passed ? <Trophy className="h-12 w-12" /> : <XCircle className="h-12 w-12" />}
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">
              {quiz.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date((result as any).createdAt).toLocaleDateString()}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Detailed Report</span>
            </div>
          </CardHeader>

          <CardContent className="px-10 pb-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Score</p>
                <p className="text-3xl font-black text-slate-800">{result.score}/{result.totalMarks}</p>
              </div>
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Percentage</p>
                <p className="text-3xl font-black text-slate-800">{result.percentage}%</p>
              </div>
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-center flex flex-col items-center justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Result</p>
                <Badge className={`text-xs font-black px-5 py-1.5 rounded-full ${result.passed ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-rose-500 shadow-lg shadow-rose-500/20'}`}>
                  {result.passed ? "PASSED" : "FAILED"}
                </Badge>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-primary" /> Question Review
              </h3>
              
              {(result.answers || []).map((answer: any, index: number) => {
                const question = quiz.questions.find((q: any) => q.id === answer.questionId);
                return (
                  <div key={index} className={`p-6 rounded-[24px] border-2 transition-all hover:shadow-md ${answer.correct ? 'border-emerald-100 bg-emerald-50/20' : 'border-rose-100 bg-rose-50/20'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {index + 1}</span>
                      {answer.correct ? (
                        <Badge className="bg-emerald-500 border-none flex gap-1.5 items-center font-bold px-3"><CheckCircle2 className="h-3.5 w-3.5" /> Correct</Badge>
                      ) : (
                        <Badge className="bg-rose-500 border-none flex gap-1.5 items-center font-bold px-3"><XCircle className="h-3.5 w-3.5" /> Incorrect</Badge>
                      )}
                    </div>
                    <p className="font-bold text-slate-800 text-lg mb-6 leading-snug">{question?.question}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {question?.options.map((opt: string, oIndex: number) => {
                        const isSelected = answer.selectedOption === oIndex;
                        const isCorrect = answer.correctOption === oIndex;
                        
                        let borderColor = "border-slate-100";
                        let bgColor = "bg-white";
                        let textColor = "text-slate-500";
                        
                        if (isCorrect) {
                          borderColor = "border-emerald-500";
                          bgColor = "bg-emerald-50";
                          textColor = "text-emerald-700 font-bold";
                        } else if (isSelected && !isCorrect) {
                          borderColor = "border-rose-500";
                          bgColor = "bg-rose-50";
                          textColor = "text-rose-700 font-bold";
                        }

                        return (
                          <div key={oIndex} className={`p-4 rounded-2xl border-2 text-sm flex justify-between items-center ${borderColor} ${bgColor} ${textColor}`}>
                            <div className="flex items-center gap-3">
                              <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {String.fromCharCode(65 + oIndex)}
                              </div>
                              {opt}
                            </div>
                            {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                            {isSelected && !isCorrect && <XCircle className="h-4 w-4 text-rose-500" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 p-10 border-t border-slate-100 flex justify-center">
            <Button size="lg" className="px-12 font-black text-lg h-14 rounded-2xl shadow-xl shadow-primary/10" onClick={() => setLocation("/dashboard/quizzes")}>
              Return to Quizzes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
