# Quick Test Guide - Student Forms

## 🚀 Start Here

### 1. Open Browser
Go to: **http://localhost:5174/admin/forms**

### 2. Search for Student
Type in the search box: **mubashir**
Click the **Search** button

### 3. Select Student
You should see:
```
Searchmubashir
Roll: | Reg:
Select

mubashir abbas
Roll: 998877 | Reg: GCUF-998877
Select
```

Click **Select** on "mubashir abbas"

### 4. Check the Three Forms

#### Tab 1: Admission Record ✅
- Should show student name: "mubashir abbas"
- History Number: "GCUF-998877"
- Course enrollment details
- Add/Edit/Delete buttons for rows

#### Tab 2: Fee Chart ✅
- Roll No: 998877
- Admission No: GCUF-998877
- Trainee Name: mubashir abbas
- Father Name: Father 1782219051532
- Mobile: 03041654629
- CNIC: 3329080988888888888
- Session: 2024-2028
- 12 monthly fee entry fields

#### Tab 3: Urdu Register ✅
- Name in Urdu: اردو نام 1782219051532
- Father Name: Father 1782219051532
- RTL (Right-to-Left) layout
- Urdu labels and text

### 5. Test Print
Click the **Print** button (printer icon) on any form
- Print preview should show clean form
- GCCS branding should appear
- No navigation or buttons in print view

## ✅ Success Criteria

- ✓ Search finds the student
- ✓ Select loads student details
- ✓ Toast notification: "Student details loaded successfully! ✓"
- ✓ All three forms populate with data
- ✓ No console errors
- ✓ Print preview looks professional

## ❌ If Something Goes Wrong

### Search Returns No Results
- Check backend is running: http://localhost:8080
- Check browser console for errors (F12)
- Verify you're logged in as admin

### Forms Don't Auto-Fill
- Check browser console for error messages
- Look for red error toasts
- Refresh the page and try again

### Data Missing or Wrong
- Some fields may be empty (that's OK if student doesn't have data)
- Check console for field mapping errors
- Take screenshot and report the issue

## Need Help?

Check these files for details:
- `FORMS_READY_TO_TEST.md` - Complete testing guide
- `FORMS_FIXED_STATUS.md` - What was fixed
- `DEBUG_SEARCH_ISSUE.md` - Previous debugging notes

---

**Happy Testing!** 🎉
