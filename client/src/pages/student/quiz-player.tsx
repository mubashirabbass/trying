import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import {
  useListQuizzes,
  useSubmitQuiz,
  useListQuizResults,
} from "@workspace/api-client-react";
import {
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Trophy,
  ListChecks,
  Flag,
  Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// ─── Anti-cheat: disable text selection globally during quiz ─────────────────
const NO_SELECT_STYLE: React.CSSProperties = {
  userSelect: "none",
  WebkitUserSelect: "none",
};

export default function QuizPlayer() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: quizzes, isLoading: quizLoading } = useListQuizzes();
  const { data: results = [], isLoading: resultsLoading } = useListQuizResults();
  const quiz = quizzes?.find((q) => q.id === Number(id));

  // Check if this quiz has already been attempted
  const hasAttempted = results.some((r) => r.quizId === Number(id));
  const existingResult = results.find((r) => r.quizId === Number(id));

  const submitMutation = useSubmitQuiz();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // answers: map from questionId -> selected option index
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // ── Timer state ──────────────────────────────────────────────────────────────
  const [perQuestionTime, setPerQuestionTime] = useState<number | null>(null); // seconds per question
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null); // countdown for current Q
  const [totalTimeLeft, setTotalTimeLeft] = useState<number | null>(null);      // overall countdown
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  // Ref to avoid stale closures inside timer callbacks
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  const isFinishedRef = useRef(isFinished);
  useEffect(() => { isFinishedRef.current = isFinished; }, [isFinished]);

  // ── Initialise timers once quiz loads ─────────────────────────────────────────
  useEffect(() => {
    if (!quiz || perQuestionTime !== null) return;
    const totalSeconds = (quiz.timeLimit || 30) * 60;
    const numQuestions = quiz.questions?.length ?? 0;
    if (numQuestions === 0) return;
    const perQ = Math.floor(totalSeconds / numQuestions);
    setPerQuestionTime(perQ);
    setQuestionTimeLeft(perQ);
    setTotalTimeLeft(totalSeconds);
  }, [quiz]);

  // ── Quiz submit helper ────────────────────────────────────────────────────────
  const finishQuiz = useCallback(
    async (currentAnswers?: Record<number, number>) => {
      if (!quiz || isFinishedRef.current) return;
      setIsFinished(true);
      isFinishedRef.current = true;
      setIsSubmitting(true);

      const latestAnswers = currentAnswers ?? answersRef.current;
      const submissionAnswers = (quiz.questions || []).map((q: any) => ({
        questionId: q.id,
        selectedOption: latestAnswers[q.id] ?? -1,
      }));

      try {
        const result = await submitMutation.mutateAsync({
          id: quiz.id,
          data: { answers: submissionAnswers },
        });
        setQuizResult(result);
      } catch (error: any) {
        const msg =
          error?.response?.data?.error || error?.message || "Submission failed";
        toast({ title: "Failed to submit quiz", description: msg, variant: "destructive" });
        setIsFinished(false);
        isFinishedRef.current = false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [quiz, submitMutation]
  );

  // ── Per-question timer countdown ──────────────────────────────────────────────
  useEffect(() => {
    if (questionTimeLeft === null || isFinished || !quiz) return;

    if (questionTimeLeft <= 0) {
      // Time's up for this question
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex >= (quiz.questions || []).length) {
        // Last question — auto-submit
        toast({ title: "⏰ Time's up! Auto-submitting quiz...", variant: "destructive" });
        finishQuiz(answersRef.current);
      } else {
        // Auto-advance to next question
        toast({
          title: `⏱️ Time's up for Q${currentQuestionIndex + 1} — moving to next`,
          variant: "default",
        });
        setCurrentQuestionIndex(nextIndex);
        setQuestionTimeLeft(perQuestionTime!);
      }
      return;
    }

    const t = setInterval(
      () => setQuestionTimeLeft((prev) => (prev !== null ? prev - 1 : null)),
      1000
    );
    return () => clearInterval(t);
  }, [questionTimeLeft, isFinished]);

  // ── Total timer countdown (displayed as reference) ────────────────────────────
  useEffect(() => {
    if (totalTimeLeft === null || isFinished) return;
    if (totalTimeLeft <= 0) {
      if (!isFinishedRef.current) {
        toast({ title: "⏰ Total time exhausted! Auto-submitting...", variant: "destructive" });
        finishQuiz(answersRef.current);
      }
      return;
    }
    const t = setInterval(
      () => setTotalTimeLeft((prev) => (prev !== null ? prev - 1 : null)),
      1000
    );
    return () => clearInterval(t);
  }, [totalTimeLeft, isFinished]);

  // ── Reset per-question timer when student manually navigates questions ─────────
  // (only resets if the student clicks Prev/Next — NOT on auto-advance since that's
  //  handled inside the timer callback above)
  const navigateQuestion = (newIndex: number) => {
    if (isFinished || isSubmitting) return;
    setCurrentQuestionIndex(newIndex);
    setQuestionTimeLeft(perQuestionTime!);
  };

  // ── Option selection ──────────────────────────────────────────────────────────
  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    if (isFinished || isSubmitting) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
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
          <Button className="mt-4" onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Already attempted ─────────────────────────────────────────────────────────
  if (hasAttempted && existingResult && !quizResult) {
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
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      Your Score
                    </p>
                    <p className="text-2xl font-black text-slate-800">
                      {existingResult.score}/{existingResult.totalMarks}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      Percentage
                    </p>
                    <p className="text-2xl font-black text-slate-800">
                      {existingResult.percentage}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      Status
                    </p>
                    <Badge
                      className={`text-xs font-black ${
                        existingResult.passed ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    >
                      {existingResult.passed ? "PASSED" : "FAILED"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-white p-8 flex gap-3 justify-center border-t border-amber-100">
              <Button
                variant="outline"
                size="lg"
                className="px-8 font-bold"
                onClick={() => setLocation("/dashboard/quizzes")}
              >
                Back to Quizzes
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ── Result screen ─────────────────────────────────────────────────────────────
  if (quizResult) {
    const answeredCorrectly =
      quizResult.answers?.filter((a: any) => a.correct).length ?? 0;
    const totalAnswered = quizResult.answers?.length ?? 0;

    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-8" style={NO_SELECT_STYLE}>
          <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
            <div
              className={`h-3 ${quizResult.passed ? "bg-emerald-500" : "bg-rose-500"}`}
            />
            <CardHeader className="text-center pb-8 pt-10">
              <div className="flex justify-center mb-6">
                <div
                  className={`h-24 w-24 rounded-full flex items-center justify-center ${
                    quizResult.passed
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-rose-100 text-rose-600"
                  } animate-bounce`}
                >
                  {quizResult.passed ? (
                    <Trophy className="h-12 w-12" />
                  ) : (
                    <XCircle className="h-12 w-12" />
                  )}
                </div>
              </div>
              <CardTitle className="text-4xl font-black text-slate-900 mb-2">
                {quizResult.passed ? "Congratulations! 🎉" : "Keep Practicing!"}
              </CardTitle>
              <p className="text-slate-500 font-bold text-lg uppercase tracking-widest">
                You scored {quizResult.score} out of {quizResult.totalMarks}
              </p>
            </CardHeader>

            <CardContent className="px-10 pb-10">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Percentage
                  </p>
                  <p className="text-3xl font-black text-slate-800">
                    {quizResult.percentage}%
                  </p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Status
                  </p>
                  <Badge
                    className={`text-sm font-black px-4 py-1 ${
                      quizResult.passed ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  >
                    {quizResult.passed ? "PASSED" : "FAILED"}
                  </Badge>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Accuracy
                  </p>
                  <p className="text-3xl font-black text-slate-800">
                    {answeredCorrectly}/{totalAnswered}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>Score progress</span>
                  <span>{quizResult.percentage}%</span>
                </div>
                <Progress value={quizResult.percentage} className="h-3" />
              </div>

              {/* Per-question summary — NO correct answers revealed */}
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <ListChecks className="h-4 w-4" /> Question Summary
                </h3>
                {quizResult.answers?.map((answer: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 text-sm ${
                      answer.correct
                        ? "border-emerald-100 bg-emerald-50/50 text-emerald-700"
                        : answer.selectedOption === -1
                        ? "border-slate-100 bg-slate-50 text-slate-400"
                        : "border-rose-100 bg-rose-50/50 text-rose-700"
                    }`}
                  >
                    <span className="font-bold">Q{index + 1}</span>
                    <span className="font-semibold">
                      {answer.selectedOption === -1
                        ? "Not answered"
                        : answer.correct
                        ? "Correct"
                        : "Incorrect"}
                    </span>
                    {answer.correct ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : answer.selectedOption === -1 ? (
                      <Flag className="h-4 w-4 text-slate-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50 p-8 flex justify-center border-t border-slate-100">
              <Button
                size="lg"
                className="px-10 font-bold text-lg h-14"
                onClick={() => setLocation("/dashboard/quizzes")}
              >
                Return to Quizzes
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ── Active quiz ───────────────────────────────────────────────────────────────
  const currentQuestion = (quiz.questions || [])[currentQuestionIndex] as any;
  const totalQuestions = (quiz.questions || []).length;
  const questionProgress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  const answeredCount = Object.keys(answers).length;
  const currentAnswer = answers[currentQuestion.id];

  // Per-question timer display helpers
  const pqTotal = perQuestionTime ?? 1;
  const pqLeft = questionTimeLeft ?? pqTotal;
  const pqPercent = Math.max(0, Math.min(100, (pqLeft / pqTotal) * 100));
  const isUrgent = pqLeft <= Math.min(10, Math.floor(pqTotal * 0.2)); // last 20% or 10s
  const isWarning = pqLeft <= Math.min(30, Math.floor(pqTotal * 0.4)); // last 40% or 30s

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pt-6 pb-10" style={NO_SELECT_STYLE}>

        {/* ── Top header bar ────────────────────────────────────────────────── */}
        <div className="flex justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {quiz.title}
            </h1>
            <div className="flex items-center flex-wrap gap-2 text-sm text-slate-500 mt-1 font-semibold">
              <span>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-slate-300">•</span>
              <Badge variant="outline" className="bg-white font-bold">
                {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? "s" : ""}
              </Badge>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-bold">
                {answeredCount}/{totalQuestions} answered
              </span>
            </div>
          </div>

          {/* Total time reference (top-right) */}
          <div
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-sm transition-all ${
              totalTimeLeft !== null && totalTimeLeft < 60
                ? "border-rose-200 bg-rose-50 text-rose-600 animate-pulse"
                : totalTimeLeft !== null && totalTimeLeft < 120
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-slate-100 bg-white text-slate-500"
            }`}
          >
            <Timer className="h-4 w-4 opacity-60" />
            <span className="font-bold text-xs uppercase tracking-widest mr-1 opacity-60">
              Total
            </span>
            <span className="font-black text-base">
              {totalTimeLeft !== null ? formatTime(totalTimeLeft) : "--:--"}
            </span>
          </div>
        </div>

        {/* ── Quiz overall progress bar ──────────────────────────────────────── */}
        <Progress value={questionProgress} className="h-2 bg-slate-100 mb-2" />
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
          <span>Progress</span>
          <span>{Math.round(questionProgress)}%</span>
        </div>

        {/* ── Per-question countdown ring + bar ─────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock
                className={`h-4 w-4 ${
                  isUrgent ? "text-rose-500 animate-pulse" : isWarning ? "text-amber-500" : "text-indigo-500"
                }`}
              />
              <span
                className={`text-xs font-black uppercase tracking-widest ${
                  isUrgent ? "text-rose-500" : isWarning ? "text-amber-600" : "text-indigo-600"
                }`}
              >
                Time for this question
              </span>
            </div>
            <span
              className={`font-black text-xl font-mono ${
                isUrgent
                  ? "text-rose-500 animate-pulse"
                  : isWarning
                  ? "text-amber-600"
                  : "text-slate-800"
              }`}
            >
              {pqLeft > 0 ? formatTime(pqLeft) : "0:00"}
            </span>
          </div>
          {/* Countdown bar */}
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                isUrgent
                  ? "bg-rose-500"
                  : isWarning
                  ? "bg-amber-400"
                  : "bg-indigo-500"
              }`}
              style={{ width: `${pqPercent}%` }}
            />
          </div>
          {isUrgent && (
            <p className="text-[10px] text-rose-500 font-bold mt-1 animate-pulse text-right">
              ⚡ Auto-advancing in {pqLeft}s!
            </p>
          )}
        </div>

        {/* ── Question card ─────────────────────────────────────────────────── */}
        <Card className="border-2 border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardContent className="p-8 md:p-10">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug mb-8">
              <span className="text-primary font-black mr-2">
                {currentQuestionIndex + 1}.
              </span>
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {(currentQuestion.options as string[]).map((option, index) => {
                const isSelected = currentAnswer === index;
                return (
                  <button
                    key={`${currentQuestion.id}-${index}`}
                    type="button"
                    disabled={isFinished || isSubmitting}
                    onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                    className={`w-full flex items-center p-4 md:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-150 text-left
                      active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                      ${
                        isSelected
                          ? "border-primary bg-primary/[0.05] text-primary shadow-md shadow-primary/10 scale-[1.005]"
                          : "border-slate-100 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <div
                      className={`h-9 w-9 shrink-0 rounded-full border-2 flex items-center justify-center mr-4 font-black text-sm transition-colors ${
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-base font-semibold leading-snug">
                      {option}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>

          <CardFooter className="bg-slate-50/70 p-6 md:p-8 border-t border-slate-100 flex justify-between items-center gap-3">
            <Button
              variant="outline"
              className="h-11 px-6 font-bold text-slate-600 border-slate-200"
              disabled={currentQuestionIndex === 0 || isSubmitting}
              onClick={() => navigateQuestion(currentQuestionIndex - 1)}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Previous
            </Button>

            {/* Question dot navigator */}
            <div className="hidden md:flex gap-1.5 items-center flex-wrap justify-center max-w-xs">
              {(quiz.questions || []).map((_: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => navigateQuestion(i)}
                  className={`h-3 w-3 rounded-full transition-all ${
                    i === currentQuestionIndex
                      ? "bg-primary scale-125 ring-2 ring-primary/30"
                      : answers[((quiz.questions || [])[i] as any).id] !== undefined
                      ? "bg-emerald-400 hover:bg-emerald-500"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                  title={`Q${i + 1}${
                    answers[((quiz.questions || [])[i] as any).id] !== undefined
                      ? " ✓"
                      : ""
                  }`}
                />
              ))}
            </div>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                size="lg"
                className="h-11 px-8 font-bold shadow-lg shadow-primary/20"
                onClick={() => finishQuiz()}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />{" "}
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4 mr-2" /> Finish Quiz
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                className="h-11 px-8 font-bold"
                onClick={() => navigateQuestion(currentQuestionIndex + 1)}
                disabled={isSubmitting}
              >
                Next <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* ── Unanswered warning ───────────────────────────────────────────── */}
        {answeredCount < totalQuestions && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-sm">
            <span className="text-amber-700 font-semibold">
              ⚠️{" "}
              {totalQuestions - answeredCount} question
              {totalQuestions - answeredCount !== 1 ? "s" : ""} unanswered
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 font-bold h-8"
              onClick={() => finishQuiz()}
              disabled={isSubmitting}
            >
              Submit Anyway
            </Button>
          </div>
        )}

        {/* ── Per-question allocation info ─────────────────────────────────── */}
        {perQuestionTime !== null && (
          <p className="text-center text-[11px] text-slate-400 font-semibold mt-3">
            Time per question: {formatTime(perQuestionTime)} &nbsp;•&nbsp; Total quiz time:{" "}
            {formatTime((quiz.timeLimit || 30) * 60)}
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
