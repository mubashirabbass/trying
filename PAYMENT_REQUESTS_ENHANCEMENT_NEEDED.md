# Payment Requests Enhancement - PLANNED

## Current Status
The admin payments page currently has:
- Payment verification by status (pending/verified/rejected/all)
- Statistics showing pending count
- Review dialog for checking receipts
- Course-wise and month-wise systematic collection

## Requested Enhancement

### What User Wants:
1. **Prominent Payment Requests Section**
   - Show all pending payment requests from students upfront
   - Include both monthly installment payments and full payments
   - Easy access to review each request

2. **Manual Amount Entry**
   - Admin should be able to verify the receipt
   - Admin can manually enter the actual amount paid (if different from submitted)
   - This allows correction if student submitted wrong amount or partial payment

### Implementation Plan:

#### 1. Add Manual Amount Field in Review Dialog
```typescript
// Add state for manual amount
const [manualAmount, setManualAmount] = useState<string>("");

// In review dialog, add input field:
<div className="space-y-2">
  <Label>Verify Amount Paid (Rs.)</Label>
  <Input
    type="number"
    value={manualAmount}
    onChange={(e) => setManualAmount(e.target.value)}
    placeholder="Enter actual amount received"
    className="h-11 rounded-xl"
  />
  <p className="text-xs text-gray-500">
    Submitted amount: Rs. {reviewPayment?.amount?.toLocaleString()}
  </p>
</div>
```

#### 2. Update handleVerify Function
```typescript
const handleVerify = async (id: number, status: "verified" | "rejected") => {
  if (status === "verified") {
    // Use manual amount if provided, otherwise use submitted amount
    const finalAmount = manualAmount ? parseFloat(manualAmount) : reviewPayment?.amount;
    
    if (!finalAmount || finalAmount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    
    // Update payment with verified amount
    await verifyPayment.mutateAsync({ 
      id, 
      data: { 
        status, 
        notes,
        amount: finalAmount // Send verified amount to backend
      } 
    });
  }
  
  // ... rest of logic
};
```

#### 3. Add Tab System (Optional)
Create tabs to separate:
- **Tab 1: Payment Requests** - All pending requests from students
- **Tab 2: Course Collection** - Month-wise systematic collection

```typescript
<Tabs defaultValue="requests">
  <TabsList>
    <TabsTrigger value="requests">
      Payment Requests ({pendingCount})
    </TabsTrigger>
    <TabsTrigger value="collection">
      Course Collection
    </TabsTrigger>
  </TabsList>

  <TabsContent value="requests">
    {/* Show all pending payment requests */}
  </TabsContent>

  <TabsContent value="collection">
    {/* Show course-wise and month-wise collection */}
  </TabsContent>
</Tabs>
```

### Benefits:

**For Admin**:
✅ See all payment requests in one place
✅ Manually verify and correct amounts
✅ Separate pending requests from systematic collection
✅ Handle discrepancies (student paid Rs. 7,500 but submitted Rs. 8,000)

**For Workflow**:
✅ Review pending requests first (Tab 1)
✅ Then do systematic course-wise collection (Tab 2)
✅ Clear separation of reactive (requests) vs proactive (collection) workflows

### Technical Notes:

**Backend Changes Needed**:
The `verifyPayment` API endpoint should accept an optional `amount` field:
```typescript
// In server/src/routes/payments.ts
router.post("/payments/:id/verify", async (req, res) => {
  const { status, notes, amount } = req.body;
  
  const updateData: any = { status, notes };
  if (amount !== undefined) {
    updateData.amount = amount; // Use admin-verified amount
  }
  
  await db.update(paymentsTable)
    .set(updateData)
    .where(eq(paymentsTable.id, id));
});
```

**Frontend Validation**:
- Check if manualAmount is valid number
- Show warning if manual amount differs significantly from submitted
- Require admin to add notes when changing amount

### Example Use Case:

**Scenario**: Student submits receipt for Rs. 8,000 but actually paid Rs. 7,500

**Current Flow**:
1. Admin sees payment request
2. Reviews receipt screenshot
3. Notices discrepancy
4. Has to reject and ask student to resubmit with correct amount

**Enhanced Flow**:
1. Admin sees payment request
2. Reviews receipt screenshot  
3. Enters actual amount: Rs. 7,500
4. Adds note: "Receipt shows Rs. 7,500 paid, not Rs. 8,000"
5. Verifies payment with corrected amount
6. Student enrollment activated with correct fee tracking

---

**Status**: PLANNED (Not Yet Implemented)
**Priority**: MEDIUM
**Complexity**: LOW (Simple UI enhancement + minor backend change)
