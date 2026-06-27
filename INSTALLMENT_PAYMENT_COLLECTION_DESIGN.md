# Installment Payment Collection System - Design Document

## User Requirement

**Student Payment Options:**
1. **Full Payment** - Pay entire course fee upfront (e.g., Rs. 50,000)
2. **Monthly Installments** - Pay in monthly chunks (e.g., Rs. 50,000 ÷ 3 months = Rs. 16,667/month)

**Admin Collection Feature:**
- Admin can collect monthly installment payments until fully paid
- Show **"Collect Fee"** button if installments remain
- Show **"View Receipt"** button for all completed payments
- Each payment updates the remaining balance
- Once fully paid, hide "Collect Fee", only show "View Receipt"

## Current System Analysis

### ✅ What Already Exists:

1. **Payment Schema** (`db/src/schema/payments.ts`):
   ```typescript
   - amount: Amount paid in this transaction
   - totalFee: Full course fee
   - remainingFee: Balance after payment
   - paymentPlan: 'full' | 'monthly'
   - installmentMonths: Total months (e.g., 3, 6)
   - installmentNumber: Which installment (1, 2, 3...)
   - status: 'pending' | 'verified' | 'rejected'
   ```

2. **Admin Manual Payment** (`admin/payments.tsx`):
   - Can record cash/bank payments
   - Creates payment record
   - Auto-verifies payment

3. **Fee Receipt** (`FeeReceipt.tsx`):
   - Shows: Total Fee, Amount Paid, Remaining Balance
   - Displays payment type: "Full Payment" | "Partial Payment" | "Installment #X/Y"

## New Feature Implementation

### 1. **Enrollment Table - Track Payment Progress**

Add to enrolled students section:
- Total Course Fee
- Amount Paid So Far (sum of all verified payments)
- Remaining Balance
- Payment Plan Type (Full/Monthly)
- Installment Progress (e.g., "2/3 paid")

### 2. **Collect Fee Button Logic**

**Show "Collect Fee"** button when:
```typescript
- Payment Plan = "monthly"
- Remaining Balance > 0
- Student enrollment status = "active"
```

**Show "View Receipt"** button when:
```typescript
- At least one verified payment exists
```

**Hide "Collect Fee"** when:
```typescript
- Remaining Balance = 0 (fully paid)
- OR Payment Plan = "full" (single payment)
```

### 3. **Collect Fee Dialog**

When admin clicks "Collect Fee":
```
┌──────────────────────────────────────────────┐
│  Collect Installment Payment                 │
├──────────────────────────────────────────────┤
│  Student: John Doe                           │
│  Course: Web Development                     │
│  Total Fee: Rs. 50,000                       │
│  Already Paid: Rs. 33,334 (2 installments)  │
│  Remaining: Rs. 16,666                       │
│                                              │
│  Installment #: 3 of 3                       │
│  Amount: [16,666] (max: 16,666)              │
│  Method: [Cash ▼]                            │
│  Notes: [Optional notes...]                  │
│                                              │
│  [Cancel]  [Record Payment & Print Receipt]  │
└──────────────────────────────────────────────┘
```

### 4. **Payment Calculation Logic**

```typescript
// When collecting installment
const totalPaid = verifiedPayments
  .filter(p => p.courseId === enrollment.courseId)
  .reduce((sum, p) => sum + p.amount, 0);

const remainingBalance = courseFee - totalPaid;
const nextInstallmentNumber = verifiedPayments.length + 1;
const suggestedAmount = Math.ceil(remainingBalance / (installmentMonths - verifiedPayments.length));
```

### 5. **Payment Record Structure**

Each installment payment creates a new record:
```json
{
  "userId": 123,
  "courseId": 456,
  "amount": 16667,           // Amount collected this time
  "totalFee": 50000,         // Full course fee
  "remainingFee": 0,         // Balance after THIS payment
  "paymentPlan": "monthly",
  "installmentMonths": 3,
  "installmentNumber": 3,    // 3rd installment
  "method": "cash",
  "status": "verified",      // Auto-verified by admin
  "notes": "3rd installment collected by admin"
}
```

### 6. **Enrolled Students Table Layout**

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ #  Student Name    Course         Fee Status          Progress      Actions        │
├────────────────────────────────────────────────────────────────────────────────────┤
│ 1  John Doe        Web Dev        Rs. 33,334/50,000   ████░░ 2/3    💵 Collect    │
│                                   Remaining: 16,666                  📄 Receipt    │
├────────────────────────────────────────────────────────────────────────────────────┤
│ 2  Jane Smith      Graphic        Rs. 50,000/50,000   ██████ PAID   📄 Receipt    │
│                    Design         Fully Paid                                       │
├────────────────────────────────────────────────────────────────────────────────────┤
│ 3  Mike Johnson    Data Sci       Rs. 25,000/75,000   ███░░░ 1/3    💵 Collect    │
│                                   Remaining: 50,000                  📄 Receipt    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Modify Admin Users Page
**File**: `client/src/pages/admin/users.tsx`

1. Calculate payment progress for each enrolled student
2. Add "Collect Fee" button with condition
3. Add "View Receipt" dropdown for all payments
4. Create "Collect Fee" dialog component

### Step 2: Create Collect Fee Function

```typescript
const collectInstallment = async (enrollment) => {
  // 1. Calculate total paid and remaining
  const payments = verifiedPayments.filter(p => 
    p.userId === enrollment.userId && 
    p.courseId === enrollment.courseId
  );
  
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = courseFee - totalPaid;
  
  // 2. Create new payment record
  const newPayment = {
    userId: enrollment.userId,
    courseId: enrollment.courseId,
    amount: collectedAmount,
    totalFee: courseFee,
    remainingFee: remainingBalance - collectedAmount,
    paymentPlan: "monthly",
    installmentMonths: enrollment.installmentMonths,
    installmentNumber: payments.length + 1,
    method: selectedMethod,
    status: "verified",
    notes: `Installment #${payments.length + 1} collected by admin`
  };
  
  // 3. Save to database
  await createPayment(newPayment);
  
  // 4. Show receipt
  showReceipt(newPayment);
};
```

### Step 3: Update Receipt Display

Receipt should show:
- Payment Type: "Installment #3/3"
- Total Course Fee: Rs. 50,000
- Amount Paid (this payment): Rs. 16,667
- Total Paid So Far: Rs. 50,000
- Remaining Balance: Rs. 0

## User Flows

### Flow 1: Student Enrolls with Monthly Plan
1. Student selects course (fee: Rs. 50,000)
2. Student chooses "Monthly Installment" (3 months)
3. Student pays 1st installment: Rs. 16,667
4. Payment verified → Receipt generated
5. Remaining: Rs. 33,333

### Flow 2: Admin Collects 2nd Installment
1. Admin goes to: Users → Enrolled Students
2. Finds student (shows: "2/3 paid, Rs. 33,333 remaining")
3. Clicks "💵 Collect Fee" button
4. Dialog shows: 
   - Already Paid: Rs. 16,667
   - Remaining: Rs. 33,333
   - Installment #2
5. Admin enters amount: Rs. 16,667
6. Selects method: Cash
7. Clicks "Record Payment"
8. Receipt auto-generates and prints
9. Student row updates: "2/3 paid, Rs. 16,666 remaining"

### Flow 3: Final Payment (Fully Paid)
1. Admin collects 3rd installment: Rs. 16,666
2. Remaining balance becomes Rs. 0
3. System marks: **FULLY PAID** ✅
4. "Collect Fee" button disappears
5. Only "View Receipt" dropdown remains
6. Receipt shows: "Payment Complete - Installment #3/3"

## Database Queries

### Get Payment Progress
```sql
SELECT 
  e.userId,
  e.courseId,
  c.fee as totalFee,
  COALESCE(SUM(p.amount), 0) as totalPaid,
  c.fee - COALESCE(SUM(p.amount), 0) as remainingBalance,
  COUNT(p.id) as installmentsPaid
FROM enrollments e
JOIN courses c ON c.id = e.courseId
LEFT JOIN payments p ON p.userId = e.userId 
  AND p.courseId = e.courseId 
  AND p.status = 'verified'
WHERE e.status = 'active'
GROUP BY e.userId, e.courseId, c.fee;
```

### Get Next Installment Number
```sql
SELECT COUNT(*) + 1 as nextInstallment
FROM payments
WHERE userId = ? 
  AND courseId = ? 
  AND status = 'verified';
```

## Benefits

### For Students:
✅ Flexible payment options (full or installments)
✅ Clear visibility of remaining balance
✅ Receipt for every payment
✅ Track payment progress

### For Admin:
✅ Easy installment collection interface
✅ Automatic calculation of remaining balance
✅ One-click payment recording
✅ Instant receipt generation
✅ Clear payment history

### For Accounting:
✅ Complete audit trail
✅ Individual receipts for each installment
✅ Easy reconciliation
✅ Clear payment status tracking

## Edge Cases Handled

1. **Partial Payment**: Admin can collect less than suggested amount
2. **Overpayment Prevention**: Maximum amount = remaining balance
3. **Multiple Courses**: Each course tracked separately
4. **Payment History**: All receipts accessible via dropdown
5. **Fully Paid**: Button changes to "View Receipts Only"
6. **Zero Balance**: Hide collect button, show "PAID" badge

---

**Status**: Ready for Implementation
**Priority**: High (Core Payment Feature)
**Estimated Time**: 3-4 hours
