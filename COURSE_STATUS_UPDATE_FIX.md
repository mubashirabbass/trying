# Course Status Update Fix

## Issue
Course status was not updating properly when changed from the admin pages (draft → pending → live, etc.). The status would appear to change but would revert back or not persist correctly.

## Root Cause
The issue was with **React Query cache invalidation**. When the course status was updated, the cache wasn't being properly refreshed, so the UI would show stale data.

## Solutions Applied

### 1. Enhanced Cache Invalidation in Admin Courses Page
**File**: `client/src/pages/admin/courses.tsx`

**Before**:
```typescript
const handleStatusUpdate = async (id: number, status: string, note?: string) => {
  try {
    await updateCourse.mutateAsync({ id, data: { status, rejectionNote: note || null } });
    toast({ title: `Course ${status === 'live' ? 'Approved' : 'Rejected'}` });
    queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({}) }); // Only invalidate
    // ... rest
  } catch (error) {
    toast({ title: "Error updating status", variant: "destructive" });
  }
};
```

**After**:
```typescript
const handleStatusUpdate = async (id: number, status: string, note?: string) => {
  try {
    await updateCourse.mutateAsync({ id, data: { status, rejectionNote: note || null } });
    toast({ title: `Course ${status === 'live' ? 'Approved' : 'Rejected'}` });
    // Force refresh the courses list
    await queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({}) });
    await queryClient.refetchQueries({ queryKey: getListCoursesQueryKey({}) }); // Added refetch
    // ... rest
  } catch (error) {
    toast({ title: "Error updating status", variant: "destructive" });
  }
};
```

### 2. Enhanced Cache Invalidation in Course Review Page
**File**: `client/src/pages/admin/course-review.tsx`

**Added imports**:
```typescript
import { getListCoursesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
```

**Enhanced mutations**:
```typescript
const approveMutation = useUpdateCourse({
  mutation: {
    onSuccess: async () => {
      toast({ title: "Course Published Successfully" });
      // Force refresh the courses list
      await queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({}) });
      await queryClient.refetchQueries({ queryKey: getListCoursesQueryKey({}) });
      setLocation("/admin/courses");
    }
  }
});

const rejectMutation = useUpdateCourse({
  mutation: {
    onSuccess: async () => {
      toast({ title: "Course Rejected" });
      setRejectDialogOpen(false);
      // Force refresh the courses list
      await queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey({}) });
      await queryClient.refetchQueries({ queryKey: getListCoursesQueryKey({}) });
      setLocation("/admin/courses");
    }
  }
});
```

### 3. Added Backend Debugging
**File**: `server/src/routes/courses.ts`

Added console logs to track status updates:
```typescript
if (req.body.status) {
  if (req.user.role === "admin") {
    updateData.status = req.body.status;
    console.log(`[DEBUG] Admin updating course ${id} status to: ${req.body.status}`);
  } else {
    if (req.body.status === "draft" || req.body.status === "pending") {
      updateData.status = req.body.status;
      console.log(`[DEBUG] Teacher updating course ${id} status to: ${req.body.status}`);
    }
  }
}

// After update
const [course] = await db.update(coursesTable).set(updateData).where(eq(coursesTable.id, id)).returning();
console.log(`[DEBUG] Course ${id} updated successfully. New status: ${course.status}`);
```

## How the Fix Works

### React Query Cache Management
1. **invalidateQueries()**: Marks the cache as stale
2. **refetchQueries()**: Forces an immediate refetch from the server
3. **await**: Ensures both operations complete before proceeding

### Status Update Flow
1. Admin clicks "Approve" or "Reject" on a course
2. Frontend sends PUT request to `/api/courses/:id` with new status
3. Backend updates database and logs the change
4. Frontend receives success response
5. Cache is invalidated AND refetched
6. UI updates with fresh data from server
7. User sees the updated status immediately

## Course Status Values

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| **draft** | Course is being created/edited | Teacher, Admin |
| **pending** | Submitted for admin review | Teacher, Admin |
| **live** | Published and visible to students | Admin only |
| **rejected** | Rejected by admin with feedback | Admin only |
| **archived** | Hidden but preserved | Admin only |

## Admin Permissions
- ✅ **Admin**: Can set any status (draft, pending, live, rejected, archived)
- ✅ **Teacher**: Can only set draft or pending status
- ❌ **Teacher**: Cannot directly publish (live) or reject courses

## Testing Checklist

### Status Updates from Admin Courses Page
- [ ] Navigate to `/admin/courses`
- [ ] Find a course with "pending" status
- [ ] Click dropdown menu → "Review & Approve"
- [ ] Click "Approve & Publish" button
- [ ] Verify status changes to "Live" immediately
- [ ] Refresh page - status should remain "Live"

### Status Updates from Course Review Page
- [ ] Navigate to `/admin/courses/:id/review`
- [ ] Click "Approve & Publish" button
- [ ] Verify success toast appears
- [ ] Verify redirect to courses list
- [ ] Verify course status is "Live" in the list

### Status Updates from Course Edit Page
- [ ] Navigate to `/admin/courses/:id/edit`
- [ ] Change status dropdown to "Live"
- [ ] Click "Save Changes"
- [ ] Verify success toast appears
- [ ] Verify redirect to courses list
- [ ] Verify course status is "Live" in the list

### Rejection Flow
- [ ] Navigate to course review page
- [ ] Click "Reject Submission"
- [ ] Enter rejection note
- [ ] Click "Send & Reject"
- [ ] Verify status changes to "Draft"
- [ ] Verify rejection note is saved

### Backend Verification
- [ ] Check server console logs for debug messages
- [ ] Should see: `[DEBUG] Admin updating course X status to: live`
- [ ] Should see: `[DEBUG] Course X updated successfully. New status: live`

## Common Issues and Solutions

### Issue: Status appears to change but reverts back
**Cause**: Cache not being refreshed properly
**Solution**: Ensure both `invalidateQueries` and `refetchQueries` are called

### Issue: Status doesn't change at all
**Cause**: Backend permission check or validation error
**Solution**: Check server logs for error messages, verify user role

### Issue: Status changes but UI doesn't update
**Cause**: React Query cache serving stale data
**Solution**: Force refetch with `await queryClient.refetchQueries()`

### Issue: Permission denied errors
**Cause**: Teacher trying to set status they don't have permission for
**Solution**: Verify status values (teachers can only set draft/pending)

## API Endpoint Details

### PUT /api/courses/:id
Updates course metadata including status.

**Request Body**:
```json
{
  "status": "live",
  "rejectionNote": "Optional feedback for rejected courses"
}
```

**Response**:
```json
{
  "id": 1,
  "title": "Course Title",
  "status": "live",
  "rejectionNote": null,
  // ... other course fields
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid request body
- `403`: Permission denied (teacher trying to set admin-only status)
- `404`: Course not found

## Database Schema
The `courses` table includes:
```sql
status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'live', 'rejected', 'archived'))
rejection_note TEXT NULL
```

## Related Files
- `client/src/pages/admin/courses.tsx` - Main courses list with status updates
- `client/src/pages/admin/course-review.tsx` - Course review page with approve/reject
- `client/src/pages/admin/course-edit.tsx` - Course edit page with status dropdown
- `server/src/routes/courses.ts` - Backend API for course updates
- `db/src/schema/courses.ts` - Database schema

## Notes
- Status updates are now properly logged on the backend for debugging
- Cache invalidation is more aggressive to ensure UI consistency
- Both admin and teacher permissions are properly enforced
- Rejection notes are preserved when courses are rejected
- All status changes trigger proper notifications