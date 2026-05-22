# Assignment Workflow - Complete Guide

## Overview
The assignment system allows teachers to create assignments for their courses, students to submit their work, and teachers to grade submissions. This document explains the complete workflow.

---

## 🎯 Complete Workflow

### Step 1: Teacher Creates Assignment
**Location:** Teacher Portal → Assignments (sidebar)

**Process:**
1. Teacher clicks "New Assignment" button
2. Fills in the form:
   - **Course** (required): Select from teacher's own courses
   - **Title** (required): e.g., "Week 3 — React Hooks Practice"
   - **Description**: Instructions for students
   - **Due Date & Time**: Optional deadline
   - **Total Marks**: Default 100
   - **Assignment Sheet (PDF)**: Optional file upload or URL
3. Clicks "Create Assignment"
4. Assignment is immediately visible to all students enrolled in that course

**Features:**
- Filter assignments by course
- Edit existing assignments
- Delete assignments (removes all submissions)
- View assignment statistics (Total, Active, Courses)
- Direct link to grading hub from each assignment card

---

### Step 2: Student Views & Submits Assignment
**Location:** Student Portal → Assignments (sidebar)

**Process:**
1. Student sees all assignments from enrolled courses
2. Each assignment card shows:
   - Title and description
   - Due date and total marks
   - Assignment sheet download link (if provided)
   - Submission status (Not Submitted / Submitted / Graded)
3. Student clicks "Start Submission"
4. Fills in submission form:
   - **Upload PDF**: Either paste Google Drive link or upload PDF directly
   - **Submission Notes**: Optional explanation or login details
5. Clicks "Complete Submission"
6. Status changes to "Submitted" with "Waiting for instructor review" message

**Features:**
- Late submission detection (shows "LATE" badge if submitted after due date)
- View submitted file
- See graded marks and feedback once teacher grades

---

### Step 3: Teacher Grades Submission
**Location:** Teacher Portal → Grading Hub (sidebar)

**Process:**
1. Teacher sees all submissions from their courses
2. Dashboard shows:
   - **Total Submissions**: All submissions
   - **Pending**: Awaiting grading
   - **Graded**: Already reviewed
3. Filter by:
   - Course (only teacher's courses)
   - Status (All / Pending / Graded)
   - Search by student name or assignment title
4. Click "Grade Now" on any submission
5. Grading dialog shows:
   - Student name and assignment title
   - Student's submission notes
   - Submitted file with preview (for PDFs)
   - Late submission indicator
6. Teacher enters:
   - **Marks Awarded**: Numeric score
   - **Feedback**: Comments for student
7. Clicks "Submit Grade"
8. Student immediately sees marks and feedback in their Assignments page

**Features:**
- PDF preview in grading dialog
- Edit grades after initial grading
- Export all submissions to CSV
- Late submission detection
- Notification sent to student when graded

---

## 🔐 Authorization & Security

### Teacher Permissions:
- Can only create assignments for courses they teach
- Can only edit/delete their own course assignments
- Can only grade submissions for their courses
- Cannot access other teachers' assignments

### Student Permissions:
- Can only view assignments from enrolled courses
- Can only submit to assignments once
- Cannot edit submission after submitting
- Can view their own grades and feedback

### Admin Permissions:
- Full access to all assignments and submissions
- Can create assignments for any course
- Can grade any submission

---

## 📊 Current Implementation Status

### ✅ Completed Features:
1. **Teacher Assignments Page** (`client/src/pages/teacher/assignments.tsx`)
   - Create, edit, delete assignments
   - Course filtering
   - PDF upload for assignment sheets
   - Statistics dashboard
   - Link to grading hub

2. **Teacher Grading Hub** (`client/src/pages/teacher/grading.tsx`)
   - View all submissions
   - Filter by course, status, search
   - Grade submissions with marks and feedback
   - PDF preview
   - Late submission detection
   - Export to CSV

3. **Student Assignments Page** (`client/src/pages/student/assignments.tsx`)
   - View all assignments from enrolled courses
   - Submit assignments with PDF upload
   - View submission status
   - View grades and feedback
   - Late submission indicator

4. **Backend API** (`server/src/routes/assignments.ts`)
   - GET /assignments - List all assignments (with optional courseId filter)
   - POST /assignments - Create assignment (admin/teacher only)
   - PUT /assignments/:id - Update assignment (admin/teacher only)
   - DELETE /assignments/:id - Delete assignment (admin/teacher only)
   - POST /assignments/:id/submit - Submit assignment (student)
   - GET /assignments/submissions - List all submissions (with filters)
   - GET /assignments/submissions/me - Student's own submissions
   - POST /assignments/:id/grade - Grade submission (admin/teacher only)

5. **Authorization Checks:**
   - Teachers can only manage assignments for their courses
   - Teachers can only grade submissions for their courses
   - Students can only view/submit assignments from enrolled courses

---

## 🧪 Testing the Workflow

### Test as Teacher:
1. Login as teacher
2. Go to Assignments → Click "New Assignment"
3. Select a course you teach
4. Fill in title, description, due date, marks
5. Upload a PDF assignment sheet (optional)
6. Click "Create Assignment"
7. Verify assignment appears in the list
8. Go to Grading Hub → Verify no submissions yet

### Test as Student:
1. Login as student enrolled in the course
2. Go to Assignments
3. Verify the new assignment appears
4. Click "Start Submission"
5. Upload a PDF or paste a link
6. Add submission notes
7. Click "Complete Submission"
8. Verify status changes to "Submitted"

### Test Grading:
1. Login as teacher
2. Go to Grading Hub
3. Verify the submission appears in "Pending"
4. Click "Grade Now"
5. Enter marks and feedback
6. Click "Submit Grade"
7. Login as student → Go to Assignments
8. Verify marks and feedback are visible

---

## 🐛 Known Issues & Troubleshooting

### Issue: "error save assignment"
**Status:** Need to test - dev server was stopped previously

**Possible Causes:**
1. Authorization error (teacher not allowed to create for that course)
2. Missing required fields (title, courseId)
3. Invalid course ID
4. Database connection issue

**How to Debug:**
1. Check browser console for error messages
2. Check server logs for API errors
3. Verify teacher is assigned to the selected course
4. Verify all required fields are filled

### Issue: Delete button not working (Live Classes)
**Status:** Separate issue - ECONNRESET during authentication

**Next Steps:**
1. Check authentication middleware
2. Verify database migration for created_by columns
3. Test delete endpoint separately

---

## 📁 File Structure

```
client/src/pages/
├── teacher/
│   ├── assignments.tsx      # Create, edit, delete assignments
│   └── grading.tsx          # Grade student submissions
└── student/
    └── assignments.tsx      # View assignments, submit work, see grades

server/src/routes/
└── assignments.ts           # All assignment & submission API endpoints

db/src/schema/
├── assignments.ts           # Assignment table schema
└── assignment_submissions.ts # Submission table schema
```

---

## 🚀 Next Steps

1. **Test Assignment Creation:**
   - Login as teacher
   - Try creating an assignment
   - Check for any errors in console or server logs

2. **Test Full Workflow:**
   - Create assignment as teacher
   - Submit as student
   - Grade as teacher
   - Verify student sees grade

3. **Fix Live Classes Delete Issue:**
   - Investigate ECONNRESET error
   - Check authentication middleware
   - Verify database migration

4. **Additional Features (Future):**
   - Allow students to resubmit assignments
   - Add assignment categories/tags
   - Bulk grading
   - Assignment templates
   - Rubric-based grading
   - File type restrictions
   - Plagiarism detection integration
