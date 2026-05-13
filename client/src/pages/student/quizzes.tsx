import { DashboardLayout } from "@/components/DashboardLayout";
import { useListQuizzes } from "@workspace/api-client-react";
import { 
  Loader2, 
  HelpCircle, 
  Clock, 
  Play, 
  Trophy,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function StudentQuizzes() {
  const [, setLocation] = useLocation();
  const { data: quizzes, isLoading } = useListQuizzes();

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
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Quizzes</h1>
        <p className="text-muted-foreground mt-2 font-medium">Test your knowledge and track your academic progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {quizzes?.map((quiz) => (
          <Card key={quiz.id} className="group border-2 border-slate-100 hover:border-primary/20 transition-all hover:shadow-xl hover:shadow-primary/5 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-widest px-3">
                  {quiz.timeLimit} Mins
                </Badge>
              </div>
              <CardTitle className="text-xl font-black text-slate-900 leading-tight">
                {quiz.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                  <Play className="h-3.5 w-3.5" />
                  {quiz.questions.length} Questions
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                  <Trophy className="h-3.5 w-3.5" />
                  {quiz.totalMarks} Total Marks
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-6 border-t border-slate-50 mt-4 bg-slate-50/50">
              <Button 
                className="w-full h-12 font-bold text-md rounded-2xl shadow-lg shadow-primary/10"
                onClick={() => setLocation(`/dashboard/quizzes/${quiz.id}`)}
              >
                Start Quiz
              </Button>
            </CardFooter>
          </Card>
        ))}

        {quizzes?.length === 0 && (
          <div className="col-span-full py-24 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
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
    </DashboardLayout>
  );
}
