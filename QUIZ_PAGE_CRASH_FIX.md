# Quiz Page Crash Fix

## Issue
The quiz page was crashing when trying to display quiz results in the "My Results" tab.

## Root Cause
**Field Name Mismatch**: The frontend was trying to access `result.createdAt` but the backend API returns `submittedAt`.

### Backend Response (`/api/quizzes/results`)
```typescript
const results = await db.select({
  id: quizResultsTable.id,
  quizId: quizResultsTable.quizId,
  score: quizResultsTable.score,
  totalMarks: quizResultsTable.totalMarks,
  percentage: quizResultsTable.percentage,
  passed: quizResultsTable.passed,
  submittedAt: quizResultsTable.submittedAt,  // ← Returns submittedAt
  quizTitle: quizzesTable.title,
})
```

### Frontend Code (Before Fix)
```tsx
<span className="text-xs text-slate-400 font-bold">
  {new Date(result.createdAt).toLocaleDateString()}  // ← Trying to access createdAt
</span>
```

**Error**: `result.createdAt` is `undefined`, causing `new Date(undefined)` which results in "Invalid Date" and crashes the component.

## Solution
Changed the frontend to use the correct field name `submittedAt` instead of `createdAt`.

### Frontend Code (After Fix)
```tsx
<span className="text-xs text-slate-400 font-bold">
  {new Date(result.submittedAt).toLocaleDateString()}  // ✅ Now using submittedAt
</span>
```

## File Changed
- `client/src/pages/student/quizzes.tsx` (Line ~213)

## Testing
1. Navigate to `/dashboard/quizzes`
2. Click on "My Results" tab
3. Page should load without crashing
4. Quiz results should display with correct submission dates

## Database Schema Reference
From `db/src/schema/quizzes.ts`:
```typescript
export const quizResultsTable = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  userId: integer("user_id").notNull(),
  score: integer("score").notNull().default(0),
  totalMarks: integer("total_marks").notNull(),
  percentage: integer("percentage").notNull().default(0),
  passed: boolean("passed").notNull().default(false),
  answers: jsonb("answers").notNull().default([]),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),  // ← Field name
});
```

The database table uses `submittedAt` (not `createdAt`), which is the timestamp when the student submitted their quiz answers.

## Prevention
To prevent similar issues in the future:
1. Always check the API response structure before using fields
2. Use TypeScript types from the API client
3. Test both tabs (Active Quizzes and My Results) after making changes
4. Consider adding runtime validation for critical data fields

## Related Files
- `client/src/pages/student/quizzes.tsx` - Quiz list page (fixed)
- `server/src/routes/quizzes.ts` - Quiz API routes
- `db/src/schema/quizzes.ts` - Database schema
- `shared/api-zod/src/generated/api.ts` - API types
