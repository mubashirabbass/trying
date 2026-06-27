# Advanced Reports Section - Implementation Plan

## New Features to Add

### 1. **Additional Report Types** (5 new reports)
- ✅ Teacher Attendance Report
- ✅ Fee Installments Tracking
- ✅ Course-wise Revenue
- ✅ Student Performance Analysis
- ✅ Monthly Trends & Analytics

### 2. **Advanced Filters**
- ✅ Date Range Picker (From/To)
- ✅ Branch Filter
- ✅ Course Filter
- ✅ Status Filter (Active/Inactive/Pending)
- ✅ Search Box (real-time search)

### 3. **Summary Dashboard Cards**
- Total Students Count
- Total Revenue (this month)
- Active Enrollments
- Pending Payments
- Teacher Attendance Rate
- Course Completion Rate

### 4. **Visual Charts** (using Recharts)
- Bar Chart: Enrollments by month
- Pie Chart: Revenue breakdown by course
- Line Chart: Monthly trends
- Area Chart: Student growth

### 5. **Enhanced Export Options**
- ✅ Export to PDF (existing)
- ✅ Export to Excel (existing)
- 🆕 Export to CSV
- 🆕 Print Report
- 🆕 Email Report (send to admin email)
- 🆕 Schedule Reports (daily/weekly/monthly)

### 6. **View Modes**
- Table View (default)
- Card View (for mobile)
- Chart View (visualizations)

### 7. **Pagination & Sorting**
- Items per page selector (10, 20, 50, 100)
- Page navigation
- Sort by any column (ascending/descending)
- Quick jump to page

### 8. **Report Categories**
- **Overview**: Branch, Full Student List
- **Academic**: Student Progress, Enrollments, Performance, Teacher Attendance
- **Financial**: Revenue, Installments, Course Revenue
- **Analytics**: Monthly Trends, Comparisons

## Implementation Steps

### Step 1: Update Report Types
```typescript
type ReportType = 
  | "branch" | "students" | "enrollments" | "revenue" | "full-list"
  | "teacher-attendance" | "fee-installments" | "course-revenue"
  | "student-performance" | "monthly-trends";
```

### Step 2: Add Category Tabs
```tsx
<Tabs value={activeCategory} onValueChange={setActiveCategory}>
  <TabsList>
    <TabsTrigger value="all">All Reports</TabsTrigger>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="academic">Academic</TabsTrigger>
    <TabsTrigger value="financial">Financial</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
  </TabsList>
</Tabs>
```

### Step 3: Add Filter Panel
```tsx
<Card>
  <CardHeader>
    <CardTitle>Filters</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-4 gap-4">
      <div>
        <Label>Date From</Label>
        <Input type="date" value={dateFrom} onChange={...} />
      </div>
      <div>
        <Label>Date To</Label>
        <Input type="date" value={dateTo} onChange={...} />
      </div>
      <div>
        <Label>Branch</Label>
        <Select value={selectedBranch} onValueChange={...}>
          <SelectItem value="all">All Branches</SelectItem>
          {branches.map(b => <SelectItem value={b.id}>{b.name}</SelectItem>)}
        </Select>
      </div>
      <div>
        <Label>Course</Label>
        <Select value={selectedCourse} onValueChange={...}>
          <SelectItem value="all">All Courses</SelectItem>
          {courses.map(c => <SelectItem value={c.id}>{c.name}</SelectItem>)}
        </Select>
      </div>
    </div>
  </CardContent>
</Card>
```

### Step 4: Add Summary Cards
```tsx
<div className="grid grid-cols-6 gap-4">
  <Card>
    <CardHeader>
      <Users className="h-8 w-8 text-blue-500" />
      <CardTitle className="text-2xl">{summary.totalStudents}</CardTitle>
      <CardDescription>Total Students</CardDescription>
    </CardHeader>
  </Card>
  {/* More cards... */}
</div>
```

### Step 5: Add Chart Visualizations
```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="enrollments" fill="#3b82f6" />
    <Bar dataKey="revenue" fill="#10b981" />
  </BarChart>
</ResponsiveContainer>
```

### Step 6: Enhanced Export Functions
```typescript
const handleExportCSV = () => {
  const csv = convertToCSV(data);
  downloadFile(csv, `${activeReport}-report.csv`, 'text/csv');
};

const handlePrintReport = () => {
  window.print();
};

const handleEmailReport = async () => {
  await fetch('/api/reports/email', {
    method: 'POST',
    body: JSON.stringify({ reportType: activeReport, filters: {...} })
  });
  toast({ title: "Report emailed successfully!" });
};
```

### Step 7: Pagination Component
```tsx
<div className="flex items-center justify-between">
  <div>
    <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
      <SelectItem value="10">10 per page</SelectItem>
      <SelectItem value="20">20 per page</SelectItem>
      <SelectItem value="50">50 per page</SelectItem>
      <SelectItem value="100">100 per page</SelectItem>
    </Select>
  </div>
  <div className="flex gap-2">
    <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
      Previous
    </Button>
    <span>Page {currentPage} of {totalPages}</span>
    <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
      Next
    </Button>
  </div>
</div>
```

## New Backend Endpoints Needed

### Teacher Attendance Report
```
GET /api/reports/teacher-attendance?month=6&year=2026&branchId=1
Response: [
  { teacherName, totalDays, present, absent, late, percentage, workingHours }
]
```

### Fee Installments Report
```
GET /api/reports/fee-installments?status=pending&courseId=1
Response: [
  { studentName, courseName, totalFee, paid, remaining, installments, nextDue }
]
```

### Course Revenue Report
```
GET /api/reports/course-revenue?dateFrom=2026-01-01&dateTo=2026-06-30
Response: [
  { courseName, enrolled, revenue, avgFee, pending, completed }
]
```

### Student Performance Report
```
GET /api/reports/student-performance?courseId=1&branchId=1
Response: [
  { studentName, course, quizAvg, assignmentAvg, attendance, grade, rank }
]
```

### Monthly Trends Report
```
GET /api/reports/monthly-trends?year=2026&months=6
Response: [
  { month, enrollments, revenue, newStudents, completions, trend }
]
```

## UI Improvements

### Color-Coded Status Badges
```tsx
{status === "paid" && <Badge className="bg-green-500">Paid</Badge>}
{status === "pending" && <Badge className="bg-amber-500">Pending</Badge>}
{status === "overdue" && <Badge className="bg-red-500">Overdue</Badge>}
```

### Interactive Tooltips
```tsx
<Tooltip>
  <TooltipTrigger>
    <InfoIcon className="h-4 w-4" />
  </TooltipTrigger>
  <TooltipContent>
    This report shows all teacher attendance for the selected period
  </TooltipContent>
</Tooltip>
```

### Loading Skeleton
```tsx
{loading ? (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
) : (
  <Table>...</Table>
)}
```

## Mobile Responsive Design
- Stack filters vertically on mobile
- Card view for small screens
- Horizontal scroll for tables
- Collapsible filter sections
- Bottom navigation for pagination

## Performance Optimizations
1. **Lazy Loading**: Load charts only when tab is active
2. **Debounced Search**: Wait 300ms before filtering
3. **Memoized Calculations**: Use useMemo for heavy computations
4. **Virtual Scrolling**: For large datasets (100+ rows)
5. **Cached Data**: Store fetched reports in memory

## Accessibility Features
- Keyboard navigation (Tab, Enter, Arrow keys)
- Screen reader labels
- High contrast mode support
- Focus indicators
- ARIA labels

## Status: Ready for Implementation
All planning complete - proceed with coding!
