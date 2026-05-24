import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { 
  useListQuizzes, 
  useSubmitQuiz,
  useListQuizResults
} from "@workspace/api-client-react";
import { 
  Loader2, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  ChevronLeft,
  Trophy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function QuizPlayer() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: quizzes, isLoading: quizLoading } = useListQuizzes();
  const { data: results = [], isLoading: resultsLoading } = useListQuizResults();
  const quiz = quizzes?.find(q => q.id === Number(id));
  
  // Check if this quiz has already been attempted
  const hasAttempted = results.some(r => r.quizId === Number(id));
  const existingResult = results.find(r => r.quizId === Number(id));
  
  const submitMutation = useSubmitQuiz();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    if (quiz && timeLeft === null) {
      setTimeLeft((quiz.timeLimit || 30) * 60);
    }
  }, [quiz]);

  useEffect(() => {
    if (timeLeft === null || isFinished) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    if (!quiz || isFinished) return;
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleAutoSubmit = () => {
    toast({ title: "Time is up! Submitting your quiz...", variant: "destructive" });
    finishQuiz();
  };

  const finishQuiz = async () => {
    if (!quiz) return;
    setIsFinished(true);
    
    const submissionAnswers = quiz.questions.map(q => ({
      questionId: q.id,
      selectedOption: answers[q.id] ?? -1 // -1 for unanswered
    }));

    try {
      const result = await submitMutation.mutateAsync({
        id: quiz.id,
        data: { answers: submissionAnswers }
      });
      setQuizResult(result);
    } catch (error) {
      toast({ title: "Failed to submit quiz", variant: "destructive" });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (quizLoading || resultsLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Quiz not found</h2>
          <Button className="mt-4" onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  // If quiz has already been attempted, redirect to results
  if (hasAttempted && existingResult) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12">
          <Card className="border-2 border-amber-200 bg-amber-50/30 shadow-xl overflow-hidden">
            <div className="h-3 bg-amber-500" />
            <CardHeader className="text-center pb-6 pt-10">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full flex items-center justify-center bg-amber-100 text-amber-600">
                  <AlertCircle className="h-10 w-10" />
                </div>
              </div>
              <CardTitle className="text-3xl font-black text-slate-900 mb-2">
                Quiz Already Attempted
              </CardTitle>
              <p className="text-slate-600 font-medium text-lg">
                You have already completed this quiz. Each quiz can only be attempted once.
              </p>
            </CardHeader>
            <CardContent className="px-10 pb-8">
              <div className="bg-white p-6 rounded-2xl border-2 border-amber-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Your Score</p>
                    <p className="text-2xl font-black text-slate-800">{existingResult.score}/{existingResult.totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                    <p className="text-2xl font-black text-slate-800">{existingResult.percentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <Badge className={`text-xs font-black ${existingResult.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                      {existingResult.passed ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-white p-8 flex gap-3 justify-center border-t border-amber-100">
              <Button variant="outline" size="lg" className="px-8 font-bold" onClick={() => setLocation("/dashboard/quizzes")}>
                Back to Quizzes
              </Button>
              <Button size="lg" className="px-8 font-bold" onClick={() => setLocation(`/dashboard/quizzes/results/${existingResult.id}`)}>
                View Detailed Results
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (quizResult) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-8">
          <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
            <div className={`h-3 ${quizResult.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <CardHeader className="text-center pb-8 pt-10">
              <div className="flex justify-center mb-6">
                <div className={`h-24 w-24 rounded-full flex items-center justify-center ${quizResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} animate-bounce`}>
                  {quizResult.passed ? <Trophy className="h-12 w-12" /> : <XCircle className="h-12 w-12" />}
                </div>
              </div>
              <CardTitle className="text-4xl font-black text-slate-900 mb-2">
                {quizResult.passed ? "Congratulations!" : "Keep Practicing!"}
              </CardTitle>
              <p className="text-slate-500 font-bold text-lg uppercase tracking-widest">
                You scored {quizResult.score} out of {quizResult.totalMarks}
              </p>
            </CardHeader>
            <CardContent className="px-10 pb-10">
              <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                  <p className="text-3xl font-black text-slate-800">{quizResult.percentage}%</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <Badge className={`text-sm font-black px-4 py-1 ${quizResult.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {quizResult.passed ? "PASSED" : "FAILED"}
                  </Badge>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                  <p className="text-3xl font-black text-slate-800">
                    {quizResult.answers.filter((a: any) => a.correct).length}/{quizResult.answers.length}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Review Answers</h3>
                {quizResult.answers.map((answer: any, index: number) => {
                  const question = quiz.questions.find(q => q.id === answer.questionId);
                  return (
                    <div key={index} className={`p-5 rounded-xl border-2 ${answer.correct ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-black text-slate-400 uppercase">Question {index + 1}</span>
                        {answer.correct ? (
                          <Badge className="bg-emerald-500 flex gap-1 items-center"><CheckCircle2 className="h-3 w-3" /> Correct</Badge>
                        ) : (
                          <Badge className="bg-rose-500 flex gap-1 items-center"><XCircle className="h-3 w-3" /> Incorrect</Badge>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 mb-4">{question?.question}</p>
                      <div className="grid grid-cols-1 gap-2">
                        {question?.options.map((opt, oIndex) => {
                          const isSelected = answer.selectedOption === oIndex;
                          const isCorrect = answer.correctOption === oIndex;
                          
                          let borderColor = "border-slate-200";
                          let bgColor = "bg-white";
                          let textColor = "text-slate-600";
                          
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
                            <div key={oIndex} className={`p-3 rounded-lg border-2 text-sm flex justify-between items-center ${borderColor} ${bgColor} ${textColor}`}>
                              {opt}
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
            <CardFooter className="bg-slate-50 p-8 flex justify-center">
              <Button size="lg" className="px-10 font-bold text-lg h-14" onClick={() => setLocation("/dashboard/quizzes")}>
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pt-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{quiz.title}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 font-bold">
              <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
              <span className="text-slate-300">•</span>
              <Badge variant="outline" className="bg-white">{currentQuestion.marks} Marks</Badge>
            </div>
          </div>
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-colors ${timeLeft && timeLeft < 60 ? 'border-rose-200 bg-rose-50 text-rose-600 animate-pulse' : 'border-slate-100 bg-white text-slate-700'}`}>
            <Clock className="h-5 w-5" />
            <span className="text-xl font-black font-mono">
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </span>
          </div>
        </div>

        <div className="mb-10">
          <Progress value={progress} className="h-3 bg-slate-100" />
        </div>

        <Card className="border-2 border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardContent className="p-10">
            <h2 className="text-2xl font-bold text-slate-800 leading-snug mb-10">
              {currentQuestion.question}
            </h2>

            <RadioGroup 
              value={answers[currentQuestion.id]?.toString()} 
              onValueChange={(val) => handleAnswerSelect(currentQuestion.id, parseInt(val))}
              className="space-y-4"
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index}>
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`option-${index}`} 
                    className="sr-only" 
                  />
                  <Label 
                    htmlFor={`option-${index}`}
                    className={`flex items-center p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                      answers[currentQuestion.id] === index 
                      ? 'border-primary bg-primary/[0.03] text-primary shadow-md shadow-primary/10' 
                      : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center mr-4 font-black transition-colors ${
                      answers[currentQuestion.id] === index 
                      ? 'bg-primary border-primary text-white' 
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-lg font-bold">{option}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="bg-slate-50/50 p-8 border-t border-slate-100 flex justify-between">
            <Button 
              variant="outline" 
              className="h-12 px-6 font-bold text-slate-600 border-slate-200"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            >
              <ChevronLeft className="h-5 w-5 mr-2" /> Previous
            </Button>
            
            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <Button 
                size="lg" 
                className="h-12 px-10 font-bold text-lg shadow-lg shadow-primary/20"
                onClick={finishQuiz}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Finish Quiz"}
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="h-12 px-10 font-bold text-lg"
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              >
                Next Question <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
