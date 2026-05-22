# Current Issues and Status

## Issue 1: Assignments Not Showing in Row-Wise Format ✅ FIXED

**Status**: The row-wise format is implemented correctly.

**How to View**:
1. Go to **Grading Hub** in teacher sidebar
2. **Select a course** from the dropdown (this is required!)
3. You'll see assignments displayed as cards (row-wise)

**Important**: You must select a course first. The page shows a landing screen until you select a course.

**If no assignments show**:
- Make sure students have submitted assignments for the selected course
- Check that the course has assignments created
- Verify you're logged in as a teacher assigned to that course

---

## Issue 2: Quiz CRUD Operations ❌ INCOMPLETE

**Current Status**:
- ✅ **Create**: Working (can create quizzes in course builder)
- ❌ **Read**: Working (can view quizzes)
- ❌ **Update**: NOT IMPLEMENTED
- ❌ **Delete**: NOT IMPLEMENTED

**Problem**: The backend API only has a CREATE endpoint for quizzes. There are no UPDATE or DELETE endpoints.

**What's Missing**:

### Backend (Server):
1. **Update Quiz Endpoint**: `PUT /quizzes/:id`
2. **Delete Quiz Endpoint**: `DELETE /quizzes/:id`

### Frontend:
1. **Edit Quiz Dialog**: Ability to edit existing quiz
2. **Delete Quiz Button**: Ability to delete quiz
3. **API Hooks**: `useUpdateQuiz`, `useDeleteQuiz`

---

## How to Fix Quiz CRUD

### Step 1: Add Backend Endpoints

**File**: `server/src/routes/quizzes.ts`

Need to add:
```typescript
// Update quiz
router.put("/quizzes/:id", authorize("admin", "teacher"), async (req, res) => {
  // Check if teacher owns the course
  // Update quiz
});

// Delete quiz
router.delete("/quizzes/:id", authorize("admin", "teacher"), async (req, res) => {
  // Check if teacher owns the course
  // Delete quiz and all attempts
});
```

### Step 2: Update OpenAPI Spec

**File**: `shared/api-spec/openapi.yaml`

Add endpoints:
```yaml
/quizzes/{id}:
  put:
    operationId: updateQuiz
    ...
  delete:
    operationId: deleteQuiz
    ...
```

### Step 3: Regenerate API Client

```bash
cd shared/api-spec
npm run codegen
```

### Step 4: Update Course Builder UI

**File**: `client/src/pages/teacher/course-builder.tsx`

Add:
- Edit button for each quiz
- Delete button for each quiz
- Edit quiz dialog (similar to create)
- State management for editing

---

## Current Grading Hub Status

### ✅ What's Working:
1. **Course Selection**: Must select course first
2. **Row-Wise Display**: Assignments show as cards
3. **Statistics**: Total, Pending, Graded counts
4. **Filtering**: Search and status filters
5. **Grading Dialog**: Can grade assignments
6. **Export CSV**: Can export grading data

### 📊 Display Format:
```
┌─────────────────────────────────────────────────────┐
│ [Avatar] Student Name                    [Status]   │
│          Assignment Title                           │
│          Submitted: Date/Time  [LATE]              │
│          [View File] Note: "..."                   │
│                                                     │
│                              Score    [Grade Now]  │
│                               85                    │
│                                                     │
│ Feedback: "Great work..."                          │
└─────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### For Grading Hub:
- [ ] Login as teacher
- [ ] Go to Grading Hub
- [ ] Select a course from dropdown
- [ ] Verify assignments show in row-wise cards
- [ ] Click "Grade Now" on an assignment
- [ ] Enter marks and feedback
- [ ] Submit grade
- [ ] Verify grade appears in card

### For Quiz CRUD (After Implementation):
- [ ] Go to My Courses → Select Course → Quizzes Tab
- [ ] Create a quiz (already working)
- [ ] Edit the quiz (needs implementation)
- [ ] Delete the quiz (needs implementation)

---

## Quick Fixes

### If Assignments Not Showing:

**Check 1**: Did you select a course?
```
The page requires course selection first.
Look for the dropdown at the top.
```

**Check 2**: Are there any submissions?
```
Students must submit assignments first.
Check the course builder to see if assignments exist.
```

**Check 3**: Are you the course teacher?
```
Only teachers assigned to the course can see submissions.
```

### If Quiz Edit/Delete Not Working:

**Expected**: These features don't exist yet.

**Solution**: Need to implement backend endpoints first, then frontend UI.

---

## Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Grading Hub - Row Display | ✅ Working | Must select course first |
| Assignment Grading | ✅ Working | Full CRUD available |
| Quiz Creation | ✅ Working | Can create quizzes |
| Quiz Editing | ❌ Missing | Backend endpoint needed |
| Quiz Deletion | ❌ Missing | Backend endpoint needed |
| Course Selection | ✅ Working | Required before viewing |
| Export CSV | ✅ Working | Exports grading data |

---

## Next Steps

1. **Verify Grading Hub**: Select a course and check if assignments appear
2. **Implement Quiz Update/Delete**: Add backend endpoints → Update API spec → Regenerate client → Update UI
3. **Test Full Workflow**: Create assignment → Student submits → Teacher grades

**Priority**: The grading hub is working correctly. The quiz CRUD is a separate feature that needs backend implementation.
