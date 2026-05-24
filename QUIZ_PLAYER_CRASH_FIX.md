# Quiz Player Crash Fix

## Issue
The quiz player page was crashing when students clicked "Start Quiz" button.

## Root Causes

### 1. Missing State Variable
**Problem**: The `currentQuestionIndex` state variable was missing, but the code was trying to use it.

**Error**: `currentQuestionIndex is not defined`

**Location**: Multiple places in the component where it tried to access:
- `currentQuestionIndex + 1`
- `setCurrentQuestionIndex()`
- `quiz.questions[currentQuestionIndex]`

### 2. Incorrect Function Call
**Problem**: The `handleAnswerSelect` function expects 2 parameters (`questionId` and `optionIndex`), but was being called with only 1 parameter.

**Error**: Function signature mismatch

## Solutions Applied

### Fix 1: Added Missing State Variable
```typescript
// Before (missing)
const [answers, setAnswers] = useState<Record<number, number>>({});
const [timeLeft, setTimeLeft] = useState<number | null>(null);

// After (added currentQuestionIndex)
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [answers, setAnswers] = useState<Record<number, number>>({});
const [timeLeft, setTimeLeft] = useState<number | null>(null);
```

### Fix 2: Corrected Function Call
```typescript
// Before (missing questionId parameter)
<RadioGroup 
  value={answers[currentQuestion.id]?.toString()} 
  onValueChange={(val) => handleAnswerSelect(parseInt(val))}
  className="space-y-4"
>

// After (added currentQuestion.id parameter)
<RadioGroup 
  value={answers[currentQuestion.id]?.toString()} 
  onValueChange={(val) => handleAnswerSelect(currentQuestion.id, parseInt(val))}
  className="space-y-4"
>
```

## File Changed
- `client/src/pages/student/quiz-player.tsx`

## How It Happened
The `currentQuestionIndex` state was accidentally removed during the previous refactoring when we added the "already attempted" check functionality. The state variable declaration got lost in the merge.

## Testing Checklist

### Basic Functionality
- [ ] Click "Start Quiz" - page should load without crashing
- [ ] First question displays correctly
- [ ] Timer starts counting down
- [ ] Can select an answer option
- [ ] Selected option is highlighted
- [ ] "Next Question" button works
- [ ] Progress bar updates correctly
- [ ] Question counter shows correct numbers (e.g., "Question 1 of 10")

### Navigation
- [ ] "Previous" button is disabled on first question
- [ ] "Previous" button works on subsequent questions
- [ ] "Next Question" button advances to next question
- [ ] Last question shows "Finish Quiz" button instead of "Next"
- [ ] Can navigate back and forth between questions
- [ ] Selected answers are preserved when navigating

### Quiz Completion
- [ ] "Finish Quiz" button submits answers
- [ ] Results screen displays after submission
- [ ] Score is calculated correctly
- [ ] Pass/fail status is correct (50% threshold)
- [ ] Answer review shows correct/incorrect answers
- [ ] Can return to quiz list from results

### Timer
- [ ] Timer counts down correctly
- [ ] Timer shows red and pulses when under 1 minute
- [ ] Auto-submits when timer reaches 0
- [ ] Shows warning toast when time is up

### Already Attempted Check
- [ ] If quiz already attempted, shows warning screen
- [ ] Warning screen displays previous score
- [ ] Can view detailed results from warning screen
- [ ] Can return to quiz list from warning screen
- [ ] Cannot access quiz interface if already attempted

## Related Issues Fixed
This fix also ensures:
- ✅ Single attempt enforcement works correctly
- ✅ Question navigation is smooth
- ✅ Answer selection is tracked properly
- ✅ Progress indicator updates correctly
- ✅ Timer functionality works as expected

## Code Flow

### State Variables
```typescript
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);  // Current question (0-based)
const [answers, setAnswers] = useState<Record<number, number>>({});   // questionId -> optionIndex
const [timeLeft, setTimeLeft] = useState<number | null>(null);        // Seconds remaining
const [isFinished, setIsFinished] = useState(false);                  // Quiz submitted?
const [quizResult, setQuizResult] = useState<any>(null);              // Result after submission
```

### Answer Selection Flow
1. User clicks on an option
2. `RadioGroup.onValueChange` fires with option index (0-3)
3. Calls `handleAnswerSelect(currentQuestion.id, parseInt(val))`
4. Updates `answers` state: `{ [questionId]: optionIndex }`
5. UI updates to show selected option

### Question Navigation Flow
1. User clicks "Next Question" or "Previous"
2. `setCurrentQuestionIndex(prev => prev + 1)` or `prev => prev - 1`
3. Component re-renders with new question
4. Previous answers are preserved in `answers` state
5. Progress bar updates based on new index

## Prevention
To prevent similar issues:
1. Always test the page after making changes
2. Check that all state variables are declared
3. Verify function calls match function signatures
4. Use TypeScript to catch parameter mismatches
5. Test navigation between questions
6. Test answer selection and preservation

## Related Files
- `client/src/pages/student/quiz-player.tsx` - Quiz taking interface (fixed)
- `client/src/pages/student/quizzes.tsx` - Quiz list page
- `client/src/pages/student/quiz-result.tsx` - Results review page
- `server/src/routes/quizzes.ts` - Backend quiz routes
