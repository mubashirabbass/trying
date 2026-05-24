# Quiz Single Attempt Feature

## Overview
Implemented a system to ensure students can only attempt each quiz once. This prevents multiple submissions and maintains quiz integrity.

## Changes Made

### 1. Backend - Quiz Submission Validation (`server/src/routes/quizzes.ts`)

#### Added Duplicate Attempt Check
Before processing a quiz submission, the system now checks if the student has already attempted the quiz.

**Code Changes:**
```typescript
// Added 'and' import from drizzle-orm
import { eq, and } from "drizzle-orm";

// In POST /quizzes/:id/submit route:
// Check if user has already attempted this quiz
const existingAttempt = await db.select().from(quizResultsTable)
  .where(and(
    eq(quizResultsTable.quizId, quizId),
    eq(quizResultsTable.userId, userId)
  ));

if (existingAttempt.length > 0) {
  res.status(403).json({ 
    error: "You have already attempted this quiz. Each quiz can only be attempted once." 
  });
  return;
}
```

**Response:**
- **Status**: 403 Forbidden
- **Error Message**: "You have already attempted this quiz. Each quiz can only be attempted once."

### 2. Frontend - Quiz Player (`client/src/pages/student/quiz-player.tsx`)

#### Added Attempt Detection
The quiz player now checks if a student has already attempted the quiz before allowing them to start.

**Code Changes:**
```typescript
// Import useListQuizResults to get student's quiz history
import { useListQuizResults } from "@workspace/api-client-react";

// Check if quiz has been attempted
const { data: results = [], isLoading: resultsLoading } = useListQuizResults();
const hasAttempted = results.some(r => r.quizId === Number(id));
const existingResult = results.find(r => r.quizId === Number(id));
```

#### Added "Already Attempted" Screen
If a student tries to access a quiz they've already completed, they see:
- **Warning message**: "Quiz Already Attempted"
- **Explanation**: "You have already completed this quiz. Each quiz can only be attempted once."
- **Their previous score**: Score, percentage, and pass/fail status
- **Action buttons**:
  - "Back to Quizzes" - Returns to quiz list
  - "View Detailed Results" - Shows full quiz review with correct/incorrect answers

**UI Features:**
- Amber-themed warning card
- Alert icon
- Score summary (score/total, percentage, pass/fail badge)
- Clear call-to-action buttons

### 3. Frontend - Quiz List (`client/src/pages/student/quizzes.tsx`)

#### Added Visual Indicators for Completed Quizzes
The quiz list now shows which quizzes have been attempted.

**Visual Changes:**
- **Icon Change**: Completed quizzes show a checkmark icon instead of question mark
- **"Completed" Badge**: Green badge for passed, red badge for failed
- **Score Display**: Shows student's score directly on the quiz card
- **Button Change**: "Start Quiz" becomes "View Results" for completed quizzes
- **Muted Colors**: Completed quiz icons are grayed out

**Code Changes:**
```typescript
const hasAttempted = results.some(r => r.quizId === quiz.id);
const result = results.find(r => r.quizId === quiz.id);

// Conditional rendering based on attempt status
{hasAttempted ? (
  <Button variant="outline" onClick={() => setLocation(`/dashboard/quizzes/results/${result?.id}`)}>
    View Results
  </Button>
) : (
  <Button onClick={() => setLocation(`/dashboard/quizzes/${quiz.id}`)}>
    Start Quiz
  </Button>
)}
```

## User Experience Flow

### First-Time Quiz Attempt
1. Student navigates to Quizzes page
2. Sees available quizzes with "Start Quiz" button
3. Clicks "Start Quiz"
4. Takes the quiz
5. Submits answers
6. Sees results screen
7. Quiz is marked as "Completed" in the list

### Attempting to Retake a Quiz
1. Student navigates to Quizzes page
2. Sees completed quizzes with:
   - Checkmark icon
   - "Completed" badge
   - Their score displayed
   - "View Results" button
3. If they click "View Results", they see their previous attempt
4. If they try to access the quiz URL directly, they see the "Already Attempted" warning screen

## Database Structure

### Quiz Results Table
The `quiz_results` table stores all quiz attempts:

```typescript
{
  id: serial,
  quizId: integer (FK to quizzes),
  userId: integer (FK to users),
  score: integer,
  totalMarks: integer,
  percentage: integer,
  passed: boolean,
  answers: jsonb, // Array of answer details
  submittedAt: timestamp
}
```

**Indexes:**
- `quiz_result_quiz_id_idx` on `quizId`
- `quiz_result_user_id_idx` on `userId`

These indexes ensure fast lookups when checking for existing attempts.

## API Endpoints

### POST /api/quizzes/:id/submit
Submits quiz answers and creates a result record.

**Authorization**: Requires authentication

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": 1,
      "selectedOption": 2
    }
  ]
}
```

**Success Response (201):**
```json
{
  "id": 1,
  "quizId": 5,
  "userId": 10,
  "score": 8,
  "totalMarks": 10,
  "percentage": 80,
  "passed": true,
  "answers": [...],
  "submittedAt": "2024-01-15T10:30:00Z"
}
```

**Error Response (403) - Already Attempted:**
```json
{
  "error": "You have already attempted this quiz. Each quiz can only be attempted once."
}
```

### GET /api/quizzes/results
Gets all quiz results for the current user.

**Authorization**: Requires authentication

**Response:**
```json
[
  {
    "id": 1,
    "quizId": 5,
    "score": 8,
    "totalMarks": 10,
    "percentage": 80,
    "passed": true,
    "submittedAt": "2024-01-15T10:30:00Z",
    "quizTitle": "JavaScript Basics"
  }
]
```

## Security Considerations

### Backend Validation
- ✅ Server-side check prevents duplicate submissions
- ✅ User ID from JWT token (cannot be spoofed)
- ✅ Quiz ID validated from URL parameters
- ✅ Database query uses indexed columns for performance

### Frontend Protection
- ✅ UI prevents navigation to quiz player for completed quizzes
- ✅ Visual indicators show completion status
- ✅ Graceful error handling if backend rejects submission

### Edge Cases Handled
1. **Direct URL Access**: If student bookmarks quiz URL and tries to access after completion, they see the "Already Attempted" screen
2. **Multiple Tabs**: If student opens quiz in multiple tabs, only the first submission succeeds
3. **Network Errors**: If submission fails, student can retry (no result is saved)
4. **Partial Completion**: If student closes browser mid-quiz, they can resume (no result saved until submission)

## Testing Checklist

### Backend Testing
- [ ] Submit quiz for first time - should succeed
- [ ] Try to submit same quiz again - should return 403 error
- [ ] Check error message is clear and helpful
- [ ] Verify database only has one result per user per quiz

### Frontend Testing
- [ ] View quiz list - completed quizzes show checkmark and badge
- [ ] Click "Start Quiz" on new quiz - should open quiz player
- [ ] Complete quiz and submit - should show results
- [ ] Return to quiz list - quiz should now show as completed
- [ ] Click "View Results" on completed quiz - should show results page
- [ ] Try to access quiz URL directly after completion - should show "Already Attempted" screen
- [ ] Verify score is displayed on quiz card
- [ ] Verify "Start Quiz" button changes to "View Results"

### User Experience Testing
- [ ] Clear messaging when quiz is already attempted
- [ ] Easy access to view previous results
- [ ] No confusion about why quiz can't be retaken
- [ ] Visual distinction between available and completed quizzes

## Future Enhancements

### Potential Features
1. **Multiple Attempts with Limits**: Allow 2-3 attempts per quiz
2. **Best Score Tracking**: Keep only the highest score
3. **Time-Based Retakes**: Allow retake after X days
4. **Teacher Override**: Allow teachers to reset student attempts
5. **Practice Mode**: Unlimited attempts in practice mode (doesn't count toward grade)
6. **Attempt History**: Show all attempts with timestamps
7. **Quiz Analytics**: Track average attempts, completion rates

### Implementation Considerations
If multiple attempts are needed:
```typescript
// Add to quiz schema
maxAttempts: integer // null = unlimited, 1 = current behavior

// Modify backend check
const attemptCount = existingAttempts.length;
if (quiz.maxAttempts && attemptCount >= quiz.maxAttempts) {
  res.status(403).json({ 
    error: `Maximum attempts (${quiz.maxAttempts}) reached for this quiz.` 
  });
  return;
}
```

## Benefits

### For Students
- ✅ Clear indication of which quizzes are completed
- ✅ Easy access to review previous attempts
- ✅ No accidental re-submission
- ✅ Transparent scoring system

### For Teachers
- ✅ Quiz integrity maintained
- ✅ Accurate assessment of student knowledge
- ✅ No need to manually check for duplicate submissions
- ✅ Fair evaluation for all students

### For System
- ✅ Prevents database bloat from multiple attempts
- ✅ Cleaner analytics and reporting
- ✅ Reduced server load from repeated submissions
- ✅ Better data quality for grade calculations

## Related Files
- `server/src/routes/quizzes.ts` - Backend quiz routes
- `client/src/pages/student/quiz-player.tsx` - Quiz taking interface
- `client/src/pages/student/quizzes.tsx` - Quiz list page
- `client/src/pages/student/quiz-result.tsx` - Results review page
- `db/src/schema/quizzes.ts` - Database schema
- `shared/api-zod/src/generated/api.ts` - API types

## Notes
- This feature enforces a strict one-attempt policy
- Students can still view their results unlimited times
- Teachers can see all student attempts in their dashboard
- The system is designed to be easily extended for multiple attempts if needed
