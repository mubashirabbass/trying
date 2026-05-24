# Student Profile Gender & Address Persistence Fix

## Problem
Students were unable to properly save and persist gender and address fields in their profile. When changing these fields and saving:
- The changes appeared to save initially
- On page reload, the changes were not displayed

## Root Causes Identified

1. **Frontend Data Sync Issue**: The profile form was not being immediately updated with the API response data, relying instead on a delayed `refreshUser()` call that might not complete before rendering.

2. **Backend NULL/Empty String Handling**: The backend wasn't explicitly handling empty strings vs NULL values for optional fields like gender and address.

3. **Form State Management**: The form data wasn't being properly synchronized after API responses, especially for optional fields.

## Solutions Implemented

### 1. Frontend Changes - Student Profile Component
**File**: `client/src/pages/student/profile.tsx`

#### Change 1: Updated `handleSaveProfile` Function
- Explicitly includes gender and address in the payload (converts empty strings to null)
- Immediately updates the local `profileForm` state with the API response data
- This ensures the UI reflects changes immediately, regardless of AuthContext updates
- Calls `refreshUser()` to update AuthContext asynchronously

**Before**:
```tsx
const r = await fetch(`${BASE}/api/users/${user?.id}`, {
  method: "PUT",
  headers,
  body: JSON.stringify(profileForm),
});
if (r.ok) {
  await refreshUser?.();
  // ... toast
}
```

**After**:
```tsx
const payload = {
  name: profileForm.name,
  phone: profileForm.phone || null,
  cnic: profileForm.cnic || null,
  dob: profileForm.dob || null,
  gender: profileForm.gender || null,
  address: profileForm.address || null,
};

const r = await fetch(`${BASE}/api/users/${user?.id}`, {
  method: "PUT",
  headers,
  body: JSON.stringify(payload),
});

if (r.ok) {
  const updatedUserData = await r.json();
  
  // Immediately update form with response
  setProfileForm({
    name: updatedUserData.name || "",
    phone: updatedUserData.phone || "",
    cnic: updatedUserData.cnic || "",
    dob: updatedUserData.dob || "",
    gender: updatedUserData.gender || "",
    address: updatedUserData.address || "",
  });
  
  // Update AuthContext separately
  refreshUser?.();
}
```

#### Change 2: Reordered Initial Fetch useEffect
- Forms are now updated with fetched data BEFORE calling `refreshUser()`
- This ensures data displays immediately on page load
- Prevents race conditions between multiple state updates

### 2. Backend Changes - User Routes
**File**: `server/src/routes/users.ts`

#### Change: Enhanced PUT `/api/v1/users/:id` Endpoint
- Explicitly handles gender and address field conversions
- Empty strings are converted to null for consistency
- Ensures these fields are always returned in the response
- Prevents data loss due to type mismatches

**Added**:
```ts
// Explicitly preserve gender and address (handle null/empty string properly)
if (updateData.gender !== undefined) {
  updateData.gender = updateData.gender || null;
}
if (updateData.address !== undefined) {
  updateData.address = updateData.address || null;
}
```

## Database Schema
The database schema in `db/src/schema/users.ts` already has the required columns:
```ts
address: text("address"),
gender: text("gender"),
```

These fields are optional (nullable) and can store text values.

## Testing Steps

1. **Login as a Student**
   - Navigate to Student Profile page
   - Scroll to the Profile Information tab

2. **Update Gender and Address**
   - Select a gender (Male/Female/Other)
   - Enter a complete address in the Address field
   - Click "Save Changes" button
   - Verify toast notification shows success

3. **Verify Persistence**
   - Reload the page (F5 or Ctrl+R)
   - Gender and address values should display correctly
   - Navigate away and back to the profile
   - Values should persist

4. **Check in Browser Storage**
   - Open DevTools (F12)
   - Go to Application → Local Storage or Session Storage
   - Check the "user" entry contains gender and address in JSON

## API Response Format
After updating, the API returns the full user object including:
```json
{
  "id": 123,
  "name": "Student Name",
  "email": "student@example.com",
  ...
  "gender": "male",
  "address": "123 Main Street, City, Country",
  ...
}
```

## Related Components
- ✅ **Teacher Profile**: Already implements proper handling (uses response data + login() update)
- ✅ **Backend GET /users/:id**: Correctly returns all fields including gender and address
- ✅ **AuthContext**: Properly stores and manages user data with storage sync

## Files Modified
1. `client/src/pages/student/profile.tsx` - Frontend form save and sync logic
2. `server/src/routes/users.ts` - Backend PUT endpoint data handling

## Notes
- Gender and address are optional fields (represented as NULL in database, empty string in UI)
- The fix maintains backward compatibility with existing data
- All other profile fields (name, phone, CNIC, DOB, education, etc.) were already working correctly
