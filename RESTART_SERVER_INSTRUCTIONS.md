# Server Restart Required - Manual Payment Fix

## Issue
When admin clicks "Record Payment" for a student, the payment is being created under the **admin's user ID** instead of the **student's user ID**.

## Root Cause
The backend code has been updated to fix this, but the **server needs to be restarted** for changes to take effect.

## What Was Fixed
✅ Backend: `server/src/routes/payments.ts` now accepts `userId` from request body
✅ Client: Frontend already sends correct `userId: student.userId`
✅ Build: Server successfully compiled

## 🔥 ACTION REQUIRED: Restart the Server

### Step 1: Stop the Current Server
If your server is running, stop it by pressing:
- **Ctrl + C** in the terminal where the server is running

### Step 2: Rebuild (Already Done)
```bash
cd "e:\running projects\Edu-Sphere\server"
npm run build
```
✅ This is already complete

### Step 3: Start the Server
```bash
cd "e:\running projects\Edu-Sphere"
npm run dev
```

OR if running separately:
```bash
cd "e:\running projects\Edu-Sphere\server"
npm start
```

---

## How to Test After Restart

1. Login as **Admin**
2. Go to **Admin Portal → Payments**
3. Select a **Course** (e.g., "Web Development")
4. Select a **Month** (e.g., "January 2024")
5. Find a student with **UNPAID** status (e.g., "saeed ahmad")
6. Click **"Record Payment"** button
7. Enter amount and click **"Record & Mark Paid"**

### Expected Result ✅
- Payment should appear under **"saeed ahmad"** in the table
- Student's month status should change to **"PAID"**
- Payment record should show `userId: 5` (student's ID), not `userId: 1` (admin's ID)

### Before Fix ❌
- Payment appeared under **"Admin User"**
- Wrong userId was stored

---

## Technical Details

### Backend Change
**File:** `server/src/routes/payments.ts`

```typescript
// OLD (BROKEN)
const userId = req.user?.id;  // Always admin's ID ❌

// NEW (FIXED)
const { userId: requestUserId } = req.body;
const userId = requestUserId ? Number(requestUserId) : authenticatedUserId;  // Use student's ID ✓
```

### How It Works
- **Admin recording payment**: Uses `userId` from request body (student's ID)
- **Student submitting payment**: Uses `userId` from auth token (their own ID)

---

## Verification Steps

After restarting, check the database or payment history:

1. Record a payment for "saeed ahmad"
2. Check payments table: `SELECT * FROM payments WHERE courseId = X ORDER BY id DESC LIMIT 1;`
3. Verify `userId` matches the student's ID (not admin's ID)

---

## Next Steps After Fix

Once the server is restarted and the bug is confirmed fixed:
1. ✅ Manual payment recording works correctly
2. Continue with Dynamic Fee Installment System improvements
3. Test full workflow: enrollment → payment → verification → ledger display

---

*Last Updated: June 24, 2026*
*Status: 🔴 Server restart required to apply fix*
