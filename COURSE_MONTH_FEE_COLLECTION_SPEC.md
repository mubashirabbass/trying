# Course-Wise & Month-Wise Fee Collection System - Specification

## User Requirements
Admin needs a systematic way to collect monthly fees:
1. Select a course
2. Select a month/date
3. View all enrolled students with their payment status (paid/unpaid) for that specific month
4. Review receipts if students submitted online payments
5. Manually record cash/offline payments received from students

## System Flow

### Step 1: Course Selection
```
Admin opens Fee Management page
→ Sees dropdown: "Select Course"
→ Dropdown shows all courses with enrolled students
→ Admin selects "Web Development Course"
```

### Step 2: Month Selection
```
After course selection:
→ Month dropdown becomes enabled
→ Shows: "Month #1", "Month #2", ... "Month #12"
→ Admin selects "Month #3"
```

### Step 3: View Student List
```
After both selections:
→ Table displays all enrolled students in that course
→ Each row shows:
  - Student Name
  - Installment Amount (monthly fee for this course)
  - Month Status: PAID ✓ | PENDING ⏳ | UNPAID ✗
  - Total Paid (across all months)
  - Installments (how many months paid so far)
  - Last Payment Date
  - Actions: Review Receipt | Record Payment
```

### Example Student List Display:
```
Course: Web Development | Month: #3

Statistics:
- Total Students: 25
- Paid (Month #3): 18
- Pending Review: 3
- Unpaid: 4
- Collected This Month: Rs. 144,000

Student List:
┌──────────────┬────────────┬─────────────┬────────────┬──────────────┬─────────────────┐
│ Student      │ Amount Due │ Month Status│ Total Paid │ Installments │ Action          │
├──────────────┼────────────┼─────────────┼────────────┼──────────────┼─────────────────┤
│ Ali Khan     │ Rs. 8,000  │ ✅ Paid     │ Rs. 24,000 │ 3/6 paid     │ View Receipt    │
│ Sara Ahmed   │ Rs. 8,000  │ ⏳ Pending  │ Rs. 16,000 │ 2/6 paid     │ Review Receipt→ │
│ Bilal Hassan │ Rs. 8,000  │ ❌ Unpaid   │ Rs. 16,000 │ 2/6 paid     │ Record Payment  │
│ Fatima Ali   │ Rs. 8,000  │ ✅ Paid     │ Rs. 24,000 │ 3/6 paid     │ View Receipt    │
└──────────────┴────────────┴─────────────┴────────────┴──────────────┴─────────────────┘
```

## Feature 1: Review Online Payment Receipts

**When student has submitted receipt (Status: PENDING)**:
```
Admin clicks "Review Receipt →"
→ Dialog opens showing:
  - Student name
  - Course name
  - Month number
  - Amount submitted
  - Receipt screenshot
  - Payment method (EasyPaisa/JazzCash/Bank)
  - Submission date
→ Admin reviews screenshot
→ Admin clicks:
  - "Verify & Activate" → Payment approved, month marked as PAID
  - "Reject" → Student must resubmit
```

## Feature 2: Manually Record Cash/Offline Payments

**When student paid cash but hasn't submitted online (Status: UNPAID)**:
```
Admin clicks "Record Payment"
→ Dialog opens with form:
  ┌─────────────────────────────────────────┐
  │  Record Manual Payment                  │
  │                                         │
  │  Student: Bilal Hassan                  │
  │  Course: Web Development                │
  │  Month: #3                              │
  │                                         │
  │  Amount Received (Rs.) *                │
  │  [        8,000       ]                 │
  │                                         │
  │  Payment Method *                       │
  │  [ Cash ▼ ]                            │
  │    - Cash                               │
  │    - Bank Deposit                       │
  │    - Check                              │
  │                                         │
  │  Notes (Optional)                       │
  │  [Received cash payment in office]     │
  │                                         │
  │  [Cancel]  [Record & Mark as Paid]     │
  └─────────────────────────────────────────┘
```

**After recording:**
- Payment automatically marked as VERIFIED
- Student's Month #3 status changes to PAID ✅
- Enrollment remains ACTIVE
- Payment record created in database
- Statistics update automatically

## Implementation Details

### Frontend Components Needed:

#### 1. Course & Month Selection Card
```typescript
<Card>
  <CardHeader>
    <CardTitle>Select Course & Month</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      {/* Course Dropdown */}
      <Select value={selectedCourse} onValueChange={setSelectedCourse}>
        <SelectTrigger>
          <GraduationCap /> Select Course
        </SelectTrigger>
        <SelectContent>
          {paidCourses.map(course => (
            <SelectItem value={course.id}>{course.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month Dropdown */}
      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
        <SelectTrigger>
          <CalendarDays /> Select Month
        </SelectTrigger>
        <SelectContent>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
            <SelectItem value={m}>Month #{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search */}
      <Input placeholder="Search student..." />
    </div>
  </CardContent>
</Card>
```

#### 2. Statistics Cards
```typescript
<div className="grid grid-cols-5 gap-4">
  <StatCard label="Total Students" value={stats.totalStudents} />
  <StatCard label="Paid" value={stats.paidCount} color="green" />
  <StatCard label="Pending" value={stats.pendingCount} color="amber" />
  <StatCard label="Unpaid" value={stats.unpaidCount} color="red" />
  <StatCard label="Collected" value={`Rs. ${stats.collected}`} />
</div>
```

#### 3. Student Table
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Student</TableHead>
      <TableHead>Amount Due</TableHead>
      <TableHead>Month Status</TableHead>
      <TableHead>Total Paid</TableHead>
      <TableHead>Installments</TableHead>
      <TableHead>Action</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {filteredStudents.map(student => (
      <TableRow key={student.userId}>
        <TableCell>{student.userName}</TableCell>
        <TableCell>Rs. {student.installmentAmount}</TableCell>
        <TableCell>{getMonthStatusBadge(student)}</TableCell>
        <TableCell>Rs. {student.totalPaid}</TableCell>
        <TableCell>{student.paidInstallments}/6</TableCell>
        <TableCell>
          {student.monthPending ? (
            <Button onClick={() => openReviewDialog(student)}>
              Review Receipt →
            </Button>
          ) : student.monthPaid ? (
            <Button variant="outline">View Receipt</Button>
          ) : (
            <Button onClick={() => openManualPaymentDialog(student)}>
              Record Payment
            </Button>
          )}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### 4. Manual Payment Dialog
```typescript
<Dialog open={isManualPaymentOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Record Manual Payment</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>Student</Label>
        <Input value={student.userName} disabled />
      </div>
      
      <div>
        <Label>Amount Received (Rs.) *</Label>
        <Input
          type="number"
          value={manualAmount}
          onChange={e => setManualAmount(e.target.value)}
          placeholder="8000"
        />
      </div>
      
      <div>
        <Label>Payment Method *</Label>
        <Select value={manualMethod} onValueChange={setManualMethod}>
          <SelectTrigger />
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank_deposit">Bank Deposit</SelectItem>
            <SelectItem value="check">Check</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Notes</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      
      <Button onClick={handleManualPayment}>
        Record & Mark as Paid
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### Backend API Call for Manual Payment:

```typescript
const handleManualPayment = async () => {
  // 1. Create payment record
  const res = await fetch('/api/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: student.userId,
      courseId: selectedCourse,
      amount: parseFloat(manualAmount),
      paymentPlan: 'monthly',
      installmentNumber: selectedMonth,
      installmentMonths: student.installmentMonths,
      method: manualMethod,
      receiptUrl: null, // No receipt for manual payments
      notes: `Manual payment recorded by admin - ${notes}`,
    })
  });
  
  const payment = await res.json();
  
  // 2. Auto-verify the payment
  await fetch(`/api/payments/${payment.id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'verified',
      notes: `Manually recorded by admin on ${new Date().toLocaleDateString()}`
    })
  });
  
  // 3. Refresh data
  queryClient.invalidateQueries();
  
  toast({ title: 'Payment recorded successfully!' });
};
```

### Data Structure:

```typescript
interface StudentPaymentStatus {
  userId: number;
  userName: string;
  courseName: string;
  courseFee: number;
  installmentAmount: number;
  installmentMonths: number;
  totalPaid: number;
  paidInstallments: number;
  monthPayment: Payment | null;  // Payment record for THIS specific month
  monthPaid: boolean;            // Is THIS month paid?
  monthPending: boolean;         // Is THIS month pending review?
  lastPaymentDate: string | null;
}
```

### Payment Status Logic:

```typescript
const getMonthStatus = (student: StudentPaymentStatus, monthNum: number) => {
  const monthPayment = student.payments.find(p => 
    p.installmentNumber === monthNum && 
    p.paymentPlan === 'monthly'
  );
  
  if (!monthPayment) return 'unpaid';
  if (monthPayment.status === 'verified') return 'paid';
  if (monthPayment.status === 'pending') return 'pending';
  return 'unpaid';
};
```

## Benefits

### For Admin:
✅ Systematic month-by-month collection
✅ Clear visibility: who paid vs who didn't
✅ Can review online receipts
✅ Can record cash payments immediately
✅ No need to reject receipts for offline payments
✅ Real-time statistics

### For Workflow:
✅ Organized by course and month
✅ Easy follow-up with unpaid students
✅ Track collection progress
✅ Flexible payment methods (online + offline)

### For Students:
✅ Multiple payment options (online or cash)
✅ Immediate activation after admin records payment
✅ Fair tracking of monthly payments

---

## Current Implementation Status

**File**: `client/src/pages/admin/payments.tsx`

**Status**: ⚠️ NEEDS COMPLETE REWRITE

**What Exists**:
- Basic payment verification system
- Receipt review dialog
- Status filtering (pending/verified/rejected)

**What's Missing**:
- Course selection dropdown
- Month selection dropdown
- Student list filtered by course + month
- Month-specific payment status
- Manual payment recording dialog
- Statistics for selected course + month
- Integration with enrollments data

**Next Steps**:
1. Import useListCourses and useListEnrollments hooks
2. Add course and month state variables
3. Build studentPaymentList using useMemo
4. Create course & month selection UI
5. Add manual payment dialog
6. Implement handleManualPayment function
7. Update table to show month-specific status

---

**Priority**: HIGH
**Complexity**: MEDIUM
**Estimated Time**: 2-3 hours
