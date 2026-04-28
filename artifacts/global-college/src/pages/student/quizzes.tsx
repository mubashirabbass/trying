import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/AuthContext";
import { useListQuizzes, getListQuizzesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, CheckSquare, Clock, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentQuizzes() {
  const { user } = useAuth();
  
  const { data: quizzes, isLoading } = useListQuizzes(
    {}, 
    { query: { queryKey: getListQuizzesQueryKey({}) } }
  );

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
        <h1 className="text-2xl font-bold">Quizzes</h1>
        <p className="text-gray-500">Test your knowledge and earn marks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes?.map((quiz) => (
          <Card key={quiz.id}>
            <CardHeader>
              <CardTitle className="text-lg">{quiz.title}</CardTitle>
              <p className="text-sm text-gray-500">Course ID: {quiz.courseId}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span>Total Marks: {quiz.totalMarks}</span>
                </div>
                {quiz.timeLimit && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Time Limit: {quiz.timeLimit} minutes</span>
                  </div>
                )}
                {quiz.questions && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <span>Questions: {quiz.questions.length}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button className="w-full">
                Start Quiz
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {quizzes?.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border">
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900">No quizzes available</h3>
            <p className="text-gray-500">There are no quizzes assigned to you right now.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
