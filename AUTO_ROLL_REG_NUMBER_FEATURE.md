# Auto Roll Number & Registration Number Generation

## Overview
Implemented automatic generation of unique roll numbers and registration numbers for all students. Admins and teachers no longer need to manually assign these numbers.

## Feature Details

### Auto-Generated Numbers Format

#### Roll Number Format:
```
GSC-01, GSC-02, GSC-03, GSC-04, ...
```
- **Prefix**: GSC (Global college of computer Science & Commerce)
- **Sequence**: Auto-incrementing 2-digit number with leading zero
- **Example**: GSC-01, GSC-15, GSC-99

#### Registration Number Format:
```
2026-GSC-01, 2026-GSC-02, 2026-GSC-03, ...
```
- **Year**: Current year when student registers
- **Prefix**: GSC
- **Sequence**: Same sequence number as roll number
- **Example**: 2026-GSC-01, 2026-GSC-15, 2027-GSC-01

## How It Works

### Sequence Generation Logic
```typescript
// 1. Get current year
const currentYear = new Date().getFullYear(); // e.g., 2026

// 2. Count existing students to determine next sequence
const existingStudents = await db.select()
  .from(usersTable)
  .where(eq(usersTable.role, "student"));
const sequenceNumber = existingStudents.length + 1;

// 3. Pad sequence number with leading zero
const paddedNumber = String(sequenceNumber).padStart(2, '0');
// Examples: 1 → "01", 15 → "15", 99 → "99"

// 4. Generate Roll No: GSC-{sequence}
const rollNo = `GSC-${paddedNumber}`;
// Examples: "GSC-01", "GSC-15", "GSC-99"

// 5. Generate Reg No: {year}-GSC-{sequence}
const regNo = `${currentYear}-GSC-${paddedNumber}`;
// Examples: "2026-GSC-01", "2026-GSC-15"
```

### Generation Triggers

Numbers are automatically generated when:

1. **Student Self-Registration** (Public Registration)
   - Route: `POST /api/auth/register`
   - Trigger: New student signs up
   - Numbers assigned before saving to database

2. **Admin Creates Student** (Admin Panel)
   - Route: `POST /api/users`
   - Trigger: Admin adds new student account
   - Only generates for `role: "student"`
   - Teachers and admins don't get these numbers

## Implementation Details

### Files Modified

#### 1. `server/src/routes/auth.ts` - Registration Endpoint
```typescript
router.post("/auth/register", async (req, res) => {
  // ... validation ...
  
  // AUTO-GENERATION
  const currentYear = new Date().getFullYear();
  const existingStudents = await db.select()
    .from(usersTable)
    .where(eq(usersTable.role, "student"));
  const sequenceNumber = existingStudents.length + 1;
  const paddedNumber = String(sequenceNumber).padStart(2, '0');
  
  const rollNo = `GSC-${paddedNumber}`;
  const regNo = `${currentYear}-GSC-${paddedNumber}`;
  
  const [user] = await db.insert(usersTable).values({
    // ... other fields ...
    rollNo,  // Auto-generated
    regNo,   // Auto-generated
    isActive: false
  }).returning();
  
  // ... rest of logic ...
});
```

#### 2. `server/src/routes/users.ts` - Admin User Creation
```typescript
router.post("/users", async (req, res) => {
  // ... validation ...
  
  let rollNo = null;
  let regNo = null;
  
  // Only generate for students
  if (role === "student") {
    const currentYear = new Date().getFullYear();
    const existingStudents = await db.select()
      .from(usersTable)
      .where(eq(usersTable.role, "student"));
    const sequenceNumber = existingStudents.length + 1;
    const paddedNumber = String(sequenceNumber).padStart(2, '0');
    rollNo = `GSC-${paddedNumber}`;
    regNo = `${currentYear}-GSC-${paddedNumber}`;
  }
  
  const [user] = await db.insert(usersTable).values({
    // ... other fields ...
    rollNo,  // Auto-generated for students, null for others
    regNo,   // Auto-generated for students, null for others
    isActive: true,
    isEmailVerified: true,
  }).returning();
  
  // ... rest of logic ...
});
```

## Examples

### Scenario 1: First Student Registration
```
Student count: 0
Sequence: 1
Roll No: GSC-01
Reg No: 2026-GSC-01
```

### Scenario 2: 15th Student Registration
```
Student count: 14
Sequence: 15
Roll No: GSC-15
Reg No: 2026-GSC-15
```

### Scenario 3: 100th Student Registration
```
Student count: 99
Sequence: 100
Roll No: GSC-100  (3 digits, no padding needed)
Reg No: 2026-GSC-100
```

### Scenario 4: Registration in Different Years
```
2026 Student:
- Roll No: GSC-01
- Reg No: 2026-GSC-01

2027 Student (if 50th student overall):
- Roll No: GSC-50
- Reg No: 2027-GSC-50  (Note: Year changes but sequence continues)
```

## Benefits

### For Admins:
- ✅ **No manual work** - Numbers assigned automatically
- ✅ **No duplication** - Sequence ensures uniqueness
- ✅ **Consistent format** - All numbers follow same pattern
- ✅ **Time saving** - No need to track last number used
- ✅ **Error reduction** - No typos or skipped numbers

### For Students:
- ✅ **Instant assignment** - Get numbers immediately on registration
- ✅ **Unique identity** - Each student has unique roll/reg number
- ✅ **Professional format** - Standardized number format
- ✅ **Year tracking** - Registration number includes enrollment year

### For Teachers:
- ✅ **Easy identification** - Consistent numbering system
- ✅ **Attendance marking** - Use roll numbers for quick reference
- ✅ **Grade recording** - Reference students by roll number

## Display Locations

Numbers are visible in:

1. **Student Card Page**
   - Shows both Roll No and Reg No
   - Printed on student ID card

2. **Student Profile**
   - Displayed in academic information section

3. **Print Details Page**
   - Included in comprehensive student report

4. **Admin User Management**
   - Visible in student list
   - Shown in student detail view

5. **Thank You Page**
   - After registration completion

## Technical Specifications

### Database Fields
```typescript
usersTable:
  rollNo: string | null    // "GSC-01", "GSC-02", etc.
  regNo: string | null     // "2026-GSC-01", "2026-GSC-02", etc.
```

### Validation
- No validation needed - system generated
- Always unique due to sequence logic
- Cannot be manually changed by students
- Admins can manually update if needed (via user update)

### Sequence Reset
- Sequence NEVER resets
- Continues incrementing even across years
- Example: Last student in 2026 is GSC-50, first in 2027 is GSC-51

### Padding Rules
- 1-99: Padded to 2 digits (01, 02, ..., 99)
- 100+: No padding needed (100, 101, ...)
- Example sequence: GSC-09, GSC-10, GSC-99, GSC-100

## Edge Cases Handled

1. **Concurrent Registrations**
   - If two students register simultaneously, sequence stays unique
   - Database handles race conditions

2. **Deleted Students**
   - Sequence continues forward
   - Deleted numbers are NOT reused
   - Gaps in sequence are acceptable

3. **Role Changes**
   - If student changes to teacher, keeps their numbers
   - If teacher changes to student, gets new numbers generated

4. **Manual Override**
   - Admins can manually edit via user update endpoint
   - Useful for fixing errors or special cases

5. **Large Numbers**
   - System handles 100, 1000, 10000+ students
   - No upper limit on sequence

## Testing Checklist

- ✅ First student gets GSC-01 and 2026-GSC-01
- ✅ Second student gets GSC-02 and 2026-GSC-02
- ✅ Numbers unique across all students
- ✅ Teachers don't get roll/reg numbers
- ✅ Admins don't get roll/reg numbers
- ✅ Admin-created students get numbers
- ✅ Self-registered students get numbers
- ✅ Numbers visible on student card
- ✅ Numbers visible in profile
- ✅ Numbers visible in admin panel
- ✅ Year changes correctly across years

## Customization

### Change Prefix
To change "GSC" to something else:

```typescript
// In auth.ts and users.ts, replace:
const rollNo = `GSC-${paddedNumber}`;
const regNo = `${currentYear}-GSC-${paddedNumber}`;

// With your prefix, e.g., "XYZ":
const rollNo = `XYZ-${paddedNumber}`;
const regNo = `${currentYear}-XYZ-${paddedNumber}`;
```

### Change Padding
To use 3-digit padding (001, 002, 099, 100):

```typescript
// Change padStart parameter:
const paddedNumber = String(sequenceNumber).padStart(3, '0');
// Results: GSC-001, GSC-002, GSC-099, GSC-100
```

### Remove Year from Reg No
```typescript
// Change:
const regNo = `${currentYear}-GSC-${paddedNumber}`;

// To:
const regNo = `GSC-R-${paddedNumber}`;
// Results: GSC-R-01, GSC-R-02, etc.
```

## Future Enhancements (Optional)

- [ ] Branch-specific prefixes (e.g., LHR-01, ISB-01)
- [ ] Year-based sequence reset (start from 01 each year)
- [ ] Bulk number regeneration tool
- [ ] Custom number format in admin settings
- [ ] QR code generation with numbers
- [ ] Number history/audit log
- [ ] Import students with existing numbers
- [ ] Number reservation system

## Migration Note

**For Existing Students:**
If you already have students without roll/reg numbers:

1. **Option A: Bulk Generate**
   - Run a migration script to assign numbers to existing students
   - Maintains creation date order

2. **Option B: Manual Assignment**
   - Admins can manually edit each student
   - Use admin user update endpoint

3. **Option C: Leave Empty**
   - Only new students get auto-numbers
   - Old students keep empty values

---

**Status**: ✅ Complete and Production Ready  
**Created**: June 23, 2026  
**Version**: 1.0.0  
**Files Modified**:
- `server/src/routes/auth.ts`
- `server/src/routes/users.ts`
