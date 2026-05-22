# Fee Payment Workflow - Manual Enrollment

## Overview
When an admin manually enrolls a student in a course, they can choose to:
1. **Mark as Pending Payment** - Student must upload fee receipt for admin approval
2. **Mark as Paid** - Course is immediately activated for learning

## Workflow Steps

### 1. Admin Manual Enrollment
- Admin navigates to **Admin Portal → Student Module → Manual Enrollment**
- Admin searches for a student by name, CNIC, or ID
- Admin selects a course to enroll the student in
- **NEW:** Admin selects payment status:
  - **Pending Payment** - Student uploads receipt, admin approves
  - **Mark as Paid** - Course immediately active for learning

### 2A. Pending Payment Flow
When admin selects "Pending Payment":
- Enrollment record created with status `"pending"`
- Payment record created with status `"pending"`
- Student sees alert on dashboard: "Pending Fee Payment"
- Student clicks "Upload Receipt" button
- Student submits payment proof
- Admin verifies payment in Fee Payment tab
- Admin clicks "Verify" → Course becomes "Learn"

### 2B. Paid Flow
When admin selects "Mark as Paid":
- Enrollment record created with status `"active"` (immediately)
- Payment record created with status `"verified"`
- Student account activated (`isActive = true`)
- Course immediately appears as "Learn" in student portal
- No payment verification needed

### 3. Student Portal - Fee Payment Alert
For pending payments, student sees:
- **Pending Fee Payment Alert** on dashboard
- Shows course name and amount due
- **"Upload Receipt"** button to submit payment proof

### 4. Student Uploads Fee Receipt (Pending Flow Only)
- Student clicks **"Upload Receipt"** button
- Redirected to payment page for that course
- Student selects payment method (EasyPaisa, JazzCash, Bank Transfer)
- Student uploads receipt image URL
- Submits payment details

### 5. Admin Verification (Pending Flow Only)
- Admin navigates to **Admin Portal → Student Module → Fee Payment**
- Admin reviews pending payments
- Admin verifies the receipt and clicks **"Verify"**
- System automatically:
  - Updates payment status to `"verified"`
  - Updates enrollment status to `"active"`
  - Activates student account (`isActive = true`)
  - Sends notification to student

### 6. Student Enrollment Activated
- Student can now access the course
- Course appears in their **"Enrolled Courses"** section
- Course shows as "Learn" status
- Student can start learning

## Database Changes

### Enrollments Table
- Status: `"pending"` → `"active"` (after payment verification or if marked as paid)

### Payments Table
- New record created automatically when admin enrolls student
- Status: `"pending"` → `"verified"` (after admin approval or if marked as paid)
- Method: `"manual_enrollment"` (identifies admin-created payments)

## API Endpoints

### POST /api/enrollments
**When called:** Admin manually enrolls a student
**Parameters:**
- `userId` (required): Student ID
- `courseId` (required): Course ID
- `paymentStatus` (optional): "pending" or "paid" (default: "pending")

**Behavior:**
- If `paymentStatus = "pending"`:
  - Creates enrollment with status `"pending"`
  - Creates payment with status `"pending"`
  - Student must upload receipt
- If `paymentStatus = "paid"`:
  - Creates enrollment with status `"active"`
  - Creates payment with status `"verified"`
  - Activates student account
  - Course immediately available for learning

### POST /api/payments/:id/verify
**When called:** Admin verifies payment receipt
**Behavior:**
- Updates payment status to `"verified"`
- Updates enrollment status to `"active"`
- Activates student account
- Sends notification to student

## Frontend Components

### Admin Manual Enrollment (`/admin/users` → Manual Enrollment tab)
- **Step 1:** Search and select student
- **Step 2:** Select course
- **NEW Step 3:** Choose payment status
  - "Pending Payment" - Student uploads receipt
  - "Mark as Paid" - Activate immediately
- Button text changes based on selection:
  - "Enroll & Request Payment" (pending)
  - "Enroll & Activate Course" (paid)

### Student Dashboard (`/dashboard`)
- **Pending Fee Payment Alert** section (only if pending payments exist)
- Shows all pending payments for the student
- Each payment shows:
  - Course name
  - Amount due
  - "Upload Receipt" button

### Student Payment Page (`/dashboard/payment/:courseId`)
- Payment method selection
- Payment instructions
- Receipt upload form
- Submission confirmation

### Admin Fee Payment Tab (`/admin/users` → Fee Payment tab)
- List of all pending payments
- Student name, course, amount
- "Verify" button to approve payment
- "Reject" button to decline payment

## Key Features

✅ **Flexible Payment Options** - Admin can choose payment status during enrollment
✅ **Immediate Activation** - Mark as paid = instant course access
✅ **Automatic Payment Creation** - No manual admin action needed
✅ **Student Notification** - Clear alert on dashboard for pending payments
✅ **Easy Receipt Upload** - Simple form to submit proof
✅ **Admin Verification** - One-click approval process
✅ **Automatic Activation** - Student account activated on verification
✅ **Status Tracking** - Clear status indicators throughout workflow

## Testing Checklist

- [ ] Admin can manually enroll a student with "Pending Payment"
- [ ] Admin can manually enroll a student with "Mark as Paid"
- [ ] Payment record is created automatically
- [ ] For pending: Student sees alert on dashboard
- [ ] For pending: Student can upload receipt
- [ ] For pending: Admin can verify payment
- [ ] For pending: Enrollment status changes to "active"
- [ ] For paid: Course immediately shows as "Learn"
- [ ] For paid: Student account is activated
- [ ] For paid: No payment verification needed
- [ ] Student can access course
- [ ] Notification is sent to student
