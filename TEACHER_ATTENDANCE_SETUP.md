# Teacher Attendance System - Setup Instructions

## Issue: "No teachers found" message

This message appears when:
1. ❌ The database migration hasn't been run yet
2. ❌ There are no teachers registered in the system
3. ❌ The API endpoint is not connecting properly

## Solution Steps:

### Step 1: Run Database Migration (REQUIRED)

The `teacher_attendance` table needs to be created in the database.

```bash
# Navigate to the db folder
cd db

# Generate the migration
npm run db:generate

# Push changes to the database
npm run db:push
```

### Step 2: Verify Teachers Exist in Database

Open your browser's Developer Console (F12) and check:

1. Go to `/admin/teacher-attendance`
2. Open Console tab
3. Look for these messages:
   - `Fetch teachers response status: 200` (Success)
   - `Teachers fetched: [...]` (Shows teacher data)

If you see:
- `Status: 404` → Route not registered
- `Status: 500` → Database error
- `Status: 401/403` → Authentication issue
- Empty array `[]` → No teachers in database

### Step 3: Check if Teachers Exist

Run this query in your database:

```sql
SELECT id, name, email, role FROM users WHERE role = 'teacher';
```

If no teachers exist, create one:

1. Go to `/admin/users` or `/admin/teachers`
2. Create a new teacher account
3. Return to `/admin/teacher-attendance`

### Step 4: Verify API Route is Registered

Check the server console for:
```
Server started successfully
Routes registered: /api/teacher-attendance/...
```

If routes are not showing, verify:
- `server/src/routes/index.ts` includes `teacherAttendanceRouter`
- Server was restarted after adding the new routes

### Step 5: Test the API Directly

Open browser and test:
```
http://localhost:5000/api/teacher-attendance/teachers
```

Or use curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/teacher-attendance/teachers
```

Expected response:
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "branchId": null
  }
]
```

## Common Issues and Fixes:

### Issue 1: "401 Unauthorized"
**Cause**: Not logged in or token expired
**Fix**: Logout and login again as admin

### Issue 2: "403 Forbidden"
**Cause**: Not logged in as admin
**Fix**: Login with admin account

### Issue 3: "404 Not Found"
**Cause**: Route not registered or server not restarted
**Fix**: 
```bash
# Stop the server (Ctrl+C)
# Restart the server
npm run dev
```

### Issue 4: "500 Internal Server Error"
**Cause**: Database table doesn't exist
**Fix**: Run database migration (Step 1 above)

### Issue 5: Empty array but teachers exist
**Cause**: Database connection issue
**Fix**: 
- Check `.env` file has correct database credentials
- Verify database is running
- Check server console for connection errors

## Quick Verification Checklist:

- [ ] Database migration run successfully
- [ ] At least one teacher account exists in database
- [ ] Logged in as admin
- [ ] Server is running without errors
- [ ] Browser console shows no errors
- [ ] API endpoint returns teacher data

## Manual Test in Browser Console:

Open Developer Console (F12) on `/admin/teacher-attendance` page and run:

```javascript
// Test API call
fetch('/api/teacher-attendance/teachers', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('Teachers:', data))
.catch(err => console.error('Error:', err));
```

This will show you exactly what the API returns.

## If Still Not Working:

1. Check server console for errors
2. Check browser console for errors
3. Verify database has teacher_attendance table
4. Verify users table has teachers with role='teacher'
5. Test API endpoint directly with Postman or curl
6. Share error messages for further debugging

## Expected Behavior After Fix:

✅ Page loads successfully
✅ Teachers list appears with names and emails
✅ Each teacher has attendance controls (status dropdown, time inputs)
✅ "Save Attendance" button is visible
✅ Can switch to "View History" tab

---

**Note**: The teachers shown in the attendance system are pulled from the `users` table where `role = 'teacher'`. If you don't see any teachers, create teacher accounts first through the admin panel.
