# Test Teacher Attendance API

## Quick Browser Console Test

Copy and paste this in your browser console (F12) while on the admin page:

```javascript
// Test 1: Check if you're logged in
console.log('Token:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');

// Test 2: Fetch teachers
fetch('/api/teacher-attendance/teachers', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log('Response Status:', res.status);
  return res.json();
})
.then(data => {
  console.log('Teachers Data:', data);
  console.log('Number of teachers:', Array.isArray(data) ? data.length : 0);
})
.catch(err => console.error('ERROR:', err));
```

## Expected Output:

### If Working:
```
Token: EXISTS
Response Status: 200
Teachers Data: [{id: 1, name: "John Doe", email: "john@example.com", branchId: null}, ...]
Number of teachers: 3
```

### If Broken:

#### 404 Error:
```
Response Status: 404
Teachers Data: {error: "Not found"}
```
**Fix**: Server needs restart. The new route isn't registered.

#### 401 Error:
```
Response Status: 401
Teachers Data: {error: "Unauthorized"}
```
**Fix**: Login again as admin

#### 500 Error:
```
Response Status: 500
Teachers Data: {error: "Internal server error"}
```
**Fix**: Check server console for database errors

---

## If 404 Error - Server Needs Restart:

The most common issue is that the server is still running with old code and doesn't have the new routes.

**Stop the server** (if running):
- Press `Ctrl+C` in the terminal where server is running

**Restart the server**:
```bash
npm run dev
```

Wait for:
```
Server listening on port 5000
Database connected successfully
```

Then refresh the browser and try again.
