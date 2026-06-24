# Month Calculation - Visual Examples

## How It Works
The system calculates installment months based on **when the course was posted** (course `createdAt` date).

---

## Example 1: Course Posted on January 10, 2024 (3-month duration)

```
Course Posted Date: January 10, 2024
Course Duration: 3 months
```

**Admin sees in dropdown:**
```
✓ January 2024    (Installment #1) ← Course start month
✓ February 2024   (Installment #2) ← +1 month from start
✓ March 2024      (Installment #3) ← +2 months from start
```

**How it calculates:**
- Installment #1: January 10, 2024 + 0 months = **January 2024**
- Installment #2: January 10, 2024 + 1 month = **February 2024**
- Installment #3: January 10, 2024 + 2 months = **March 2024**

---

## Example 2: Course Posted on June 15, 2024 (6-month duration)

```
Course Posted Date: June 15, 2024
Course Duration: 6 months
```

**Admin sees in dropdown:**
```
✓ June 2024       (Installment #1) ← Course start month
✓ July 2024       (Installment #2)
✓ August 2024     (Installment #3)
✓ September 2024  (Installment #4)
✓ October 2024    (Installment #5)
✓ November 2024   (Installment #6)
```

**How it calculates:**
- Installment #1: June 15, 2024 + 0 months = **June 2024**
- Installment #2: June 15, 2024 + 1 month = **July 2024**
- Installment #3: June 15, 2024 + 2 months = **August 2024**
- And so on...

---

## Example 3: Course Posted on November 1, 2024 (4-month duration)

```
Course Posted Date: November 1, 2024
Course Duration: 4 months
```

**Admin sees in dropdown:**
```
✓ November 2024   (Installment #1) ← Course start month
✓ December 2024   (Installment #2)
✓ January 2025    (Installment #3) ← Year rolls over automatically!
✓ February 2025   (Installment #4)
```

**How it calculates:**
- Installment #1: November 1, 2024 + 0 months = **November 2024**
- Installment #2: November 1, 2024 + 1 month = **December 2024**
- Installment #3: November 1, 2024 + 2 months = **January 2025** ✓
- Installment #4: November 1, 2024 + 3 months = **February 2025** ✓

---

## Example 4: Course Posted on December 20, 2024 (3-month duration)

```
Course Posted Date: December 20, 2024
Course Duration: 3 months
```

**Admin sees in dropdown:**
```
✓ December 2024   (Installment #1) ← Course start month
✓ January 2025    (Installment #2) ← Next year
✓ February 2025   (Installment #3) ← Next year
```

**How it calculates:**
- Installment #1: December 20, 2024 + 0 months = **December 2024**
- Installment #2: December 20, 2024 + 1 month = **January 2025** ✓
- Installment #3: December 20, 2024 + 2 months = **February 2025** ✓

---

## Key Points

### ✅ Based on Posted Date
- **First installment month = Course posted month**
- Each subsequent installment adds 1 month

### ✅ Duration-Limited
- **3-month course** → Only 3 month options shown
- **6-month course** → Only 6 month options shown
- Can't select months beyond course duration

### ✅ Automatic Year Rollover
- Correctly handles December → January transitions
- Automatically updates year when crossing boundaries

### ✅ Works for All Scenarios
- Mid-month posting (June 15) → Shows "June 2024"
- End of year posting (Nov/Dec) → Rolls into next year
- Any duration (3, 6, 12 months, etc.)

---

## Real-World Scenario

**GlobalCollege posts "Web Development" course:**
- Posted: March 15, 2024
- Duration: 6 months
- Fee: Rs. 60,000
- Monthly installment: Rs. 10,000

**Admin Payment Collection View:**
```
Course: Web Development
Duration: 6 months
Posted: March 15, 2024

Select Month:
├─ March 2024     → Collect Rs. 10,000 (Installment #1)
├─ April 2024     → Collect Rs. 10,000 (Installment #2)
├─ May 2024       → Collect Rs. 10,000 (Installment #3)
├─ June 2024      → Collect Rs. 10,000 (Installment #4)
├─ July 2024      → Collect Rs. 10,000 (Installment #5)
└─ August 2024    → Collect Rs. 10,000 (Installment #6)
```

**What Admin Does:**
1. Selects "Web Development" course
2. Selects "April 2024" month
3. Sees all enrolled students with their April payment status:
   - ✅ PAID (student already paid for April)
   - ⏳ PENDING REVIEW (student submitted receipt for April)
   - ❌ UNPAID (student hasn't paid April yet)
4. Records payments for unpaid students

---

## Code Logic

```javascript
// Function that calculates month names
const getMonthName = (courseCreatedAt, installmentNumber) => {
  // Start from course posted date
  const startDate = new Date(courseCreatedAt);
  
  // Add months based on installment number
  const targetDate = new Date(startDate);
  targetDate.setMonth(startDate.getMonth() + (installmentNumber - 1));
  
  // Format as "Month Year"
  const monthName = targetDate.toLocaleString("en-US", { month: "long" });
  const year = targetDate.getFullYear();
  
  return `${monthName} ${year}`;
};

// Examples:
// Posted: Jan 15, 2024, Installment #1 → "January 2024"
// Posted: Jan 15, 2024, Installment #2 → "February 2024"
// Posted: Dec 15, 2024, Installment #2 → "January 2025" ✓
```

---

## Benefits

### For Admin
- Clear understanding: "March 2024" is more meaningful than "Month #1"
- Easy tracking: Can see which calendar month students are behind on
- Professional: Payment records show real dates

### For Students
- Transparency: Know exactly which month they're paying for
- Planning: Can see "I need to pay for January, then February, etc."
- Clarity: Receipt says "January 2024" not "Month #1"

### For Accounting
- Standard format: Matches calendar-based bookkeeping
- Easy reconciliation: Compare to bank statements by month
- Audit-friendly: Clear timeline from course start to end

---

*This calculation happens automatically based on the `createdAt` field in the courses table.*
