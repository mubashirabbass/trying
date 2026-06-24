# Attendance Page - Enrolled Courses Display Fix

## Issue
Students enrolled in courses were not seeing those courses in the attendance section if no attendance records had been marked yet by teachers.

## Root Cause
The attendance page was only displaying courses that had attendance records in the `summary` array returned from `/api/attendance/my`. If a student was enrolled in a course but the teacher hadn't marked any attendance yet, the course wouldn't appear.

## Solution
Implemented a merge strategy that:
1. Fetches enrolled courses from `/api/enrollments?userId={id}`
2. Fetches attendance records from `/api/attendance/my`
3. Merges both datasets to show ALL enrolled courses
4. For courses without attendance records, displays them with 0 attendance
5. Adds clear visual indicators for courses pending attendance

## Changes Made

### File: `client/src/pages/student/attendance.tsx`

#### 1. Added Enrollment Fetching
```typescript
// New interface
interface Enrollment {
  id: number;
  courseId: number;
  courseName?: string;
  progress: number;
  status: string;
}

// New query to fetch enrollments
const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
  queryKey: ['my-enrollments', user?.id],
  enabled: !!token && !!user?.id,
  queryFn: async () => {
    const res = await fetch(`${BASE}/api/enrollments?userId=${user?.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch enrollments");
    return res.json();
  }
});
```

#### 2. Merged Enrollments with Attendance
```typescript
const mergedSummary: CourseSummary[] = enrollments.map(enrollment => {
  const existingSummary = summary.find(s => s.courseId === enrollment.courseId);
  
  if (existingSummary) {
    return existingSummary;  // Use existing attendance data
  }
  
  // No attendance records yet - create empty summary
  return {
    courseId: enrollment.courseId,
    courseName: enrollment.courseName || `Course #${enrollment.courseId}`,
    present: 0,
    total: 0,
    percentage: 0,
  };
});
```

#### 3. Updated All References
- Changed `summary` to `mergedSummary` throughout the component
- Updated statistics calculations to use merged data
- Updated course list rendering to use merged data

#### 4. Added Visual Indicators
```typescript
// Blue info box for courses with no attendance yet
{courseSummary.total === 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
    <AlertCircle className="h-4 w-4 text-blue-600" />
    <p className="text-xs font-bold text-blue-900">No Classes Recorded Yet</p>
    <p className="text-[10px] text-blue-700">
      Your teacher hasn't started marking attendance for this course.
    </p>
  </div>
)}

// Pending status for progress bar
{courseSummary.total > 0 ? (
  // Show normal progress bar
) : (
  // Show "Pending" status
  <span className="text-slate-400">Pending</span>
)}
```

## Features Added

### 1. All Enrolled Courses Visible
- ✅ Shows ALL courses student is enrolled in
- ✅ Includes courses with attendance records
- ✅ Includes courses without attendance records yet
- ✅ Proper course names from enrollment data

### 2. Clear Visual States

#### Course WITH Attendance:
- Shows total classes, present days, absent days
- Displays attendance percentage
- Shows progress bar (green/amber/red)
- Shows "Good Standing" or "At Risk" status
- Has "View Class-by-Class Calendar" button

#### Course WITHOUT Attendance:
- Shows 0 sessions, 0 days for all stats
- Displays 0% attendance
- Shows blue info box: "No Classes Recorded Yet"
- Shows "Pending" status instead of risk level
- Empty progress bar (gray)
- Button still works but shows empty state in dialog

### 3. Loading States
- Waits for both attendance AND enrollments to load
- Shows unified loading spinner
- Prevents partial data display

## User Experience

### Before Fix:
❌ Student enrolled in Course A, Course B, Course C  
❌ Teacher marked attendance only for Course A  
❌ Attendance page shows ONLY Course A  
❌ Student confused: "Where are my other courses?"

### After Fix:
✅ Student enrolled in Course A, Course B, Course C  
✅ Teacher marked attendance only for Course A  
✅ Attendance page shows ALL three courses:
- **Course A**: Shows attendance data (e.g., 85%)
- **Course B**: Shows "No Classes Recorded Yet" (0%)
- **Course C**: Shows "No Classes Recorded Yet" (0%)  
✅ Student understands: "I'm enrolled, but teacher hasn't marked yet"

## Technical Details

### API Endpoints Used
```
GET /api/attendance/my         - Fetch attendance records
GET /api/enrollments?userId=X  - Fetch enrolled courses
```

### Data Flow
```
1. Component Mounts
   ↓
2. Fetch Attendance (existing)
   ↓
3. Fetch Enrollments (new)
   ↓
4. Merge Data (new logic)
   ↓
5. Render All Courses
```

### Merge Logic
```typescript
For each enrolled course:
  If attendance data exists → Use it
  Else → Create empty summary (0%, 0 classes)
```

## Edge Cases Handled

1. **No Enrollments**: Shows "No Enrolled Courses Found" message
2. **No Attendance for Any Course**: All courses show 0% with info boxes
3. **Partial Attendance**: Some courses have data, others don't - all visible
4. **Course Name Missing**: Falls back to "Course #X"
5. **Loading State**: Shows spinner until both queries complete
6. **API Errors**: Gracefully handles failures

## Testing Checklist
- ✅ Student with no enrollments sees empty state
- ✅ Student with enrollments but no attendance sees all courses at 0%
- ✅ Student with partial attendance sees mixed states
- ✅ Student with full attendance sees normal data
- ✅ Course cards show proper visual indicators
- ✅ Blue info box appears for pending courses
- ✅ Progress bars work correctly
- ✅ Statistics calculate properly
- ✅ "View Calendar" dialog handles empty state
- ✅ Loading states work properly

## Benefits

### For Students:
- 📚 See ALL enrolled courses in one place
- 📊 Clear understanding of attendance status
- ⏳ Know which courses are pending attendance
- ✅ No confusion about "missing" courses

### For Teachers:
- 🎯 Students aware of which courses need attention
- 📢 Clear communication of pending status
- 📝 Easier to explain attendance system

### For Admins:
- 🔍 Better visibility into attendance tracking
- 📈 Accurate enrollment-to-attendance mapping
- 🛠️ Fewer support tickets about "missing courses"

## Future Enhancements (Optional)
- [ ] Show enrollment date on course cards
- [ ] Add "Request Attendance" button for pending courses
- [ ] Email notifications when first attendance is marked
- [ ] Filter: "All / With Attendance / Pending"
- [ ] Sort by: Name / Attendance % / Status
- [ ] Export attendance report including pending courses

---

**Status**: ✅ Complete and Production Ready  
**Created**: June 23, 2026  
**Version**: 1.0.0  
**File**: `client/src/pages/student/attendance.tsx`
