# Admin Quick Start Guide - Course Management

## How to Create a Complete Course with 100 Lectures

### Step 1: Create the Course
1. Navigate to **Admin Dashboard** → **Courses** (`/admin/courses`)
2. Click the **"Add Course"** button
3. Fill in the course details:
   - **Title**: e.g., "Complete MS Office Mastery"
   - **Category**: Select from dropdown (MS Office, Graphics, Freelancing, AI, Web, Computer Basic)
   - **Duration**: e.g., "3 Months"
   - **Fee**: Enter amount in PKR (or check "Is Free Course")
   - **Assign Teacher**: Select instructor from dropdown
   - **Thumbnail**: Paste image URL
   - **Description**: Brief overview (2-3 sentences)
   - **Course Outline/Syllabus**: Detailed curriculum (5+ lines recommended)
4. Click **"Create & Publish"**

### Step 2: Add Video Lectures
1. From the courses list, click the **three-dot menu (⋮)** on your course
2. Select **"Manage Lectures"** (or click "Manage Lectures" button from edit page)
3. Click **"Add Lecture"** button
4. For each lecture, fill in:
   - **Lecture Title** (required): e.g., "Lecture 1: Introduction to MS Word"
   - **Description** (optional): What students will learn
   - **YouTube Video URL**: Paste full YouTube link
     - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
     - Or: `https://youtu.be/dQw4w9WgXcQ`
   - **PDF Notes URL**: Upload PDF to cloud storage first, then paste URL
     - Google Drive, Dropbox, AWS S3, or any public URL
   - **Duration**: Length in minutes (e.g., 45)
5. Click **"Add Lecture"**
6. Repeat for all lectures (you can add 100+ lectures)

### Step 3: Manage Lectures
- **Edit**: Click the pencil icon to update lecture details
- **Delete**: Click the trash icon to remove a lecture
- **Reorder**: Lectures are automatically ordered by creation sequence

### Step 4: Publish Course
1. Go back to **Courses** list
2. Click three-dot menu → **"Edit Metadata"**
3. Change **Status** to **"Live (Published)"**
4. Click **"Save Changes"**

## Quick Navigation

### From Courses List:
- **Full Review**: See complete course preview
- **View Public Page**: See student view
- **Edit Metadata**: Update course info, pricing, status
- **Manage Lectures**: Add/edit video lectures ← **Main feature**
- **Delete Course**: Remove entire course

### From Course Edit Page:
- **"Manage Lectures"** button in header for quick access

## Video Security
- All YouTube URLs are automatically encrypted
- Only enrolled students can access videos
- Videos cannot be downloaded by students
- Access is logged for security

## Best Practices

### YouTube Videos:
1. Upload videos to YouTube (can be unlisted for privacy)
2. Copy the full URL from browser
3. Paste into "YouTube Video URL" field
4. System handles encryption automatically

### PDF Notes:
1. Create your PDF document
2. Upload to cloud storage:
   - **Google Drive**: Share → Get link → Set to "Anyone with link"
   - **Dropbox**: Share → Create link
   - **AWS S3**: Upload → Make public → Copy URL
3. Paste URL into "PDF Notes URL" field

### Course Organization:
- Use clear, numbered titles: "Lecture 1: Topic Name"
- Add descriptions to help students
- Set accurate durations
- Add both video and PDF for best learning experience

## Example: Creating a 100-Lecture Course

**Course**: "Complete MS Office Mastery"
- **Duration**: 3 Months
- **Fee**: Rs. 5,000
- **Lectures**: 100

**Lecture Structure**:
```
Module 1: MS Word (Lectures 1-25)
- Lecture 1: Introduction to MS Word
- Lecture 2: Basic Formatting
- Lecture 3: Advanced Formatting
... (continue to 25)

Module 2: MS Excel (Lectures 26-50)
- Lecture 26: Introduction to Excel
- Lecture 27: Basic Formulas
... (continue to 50)

Module 3: MS PowerPoint (Lectures 51-75)
- Lecture 51: Introduction to PowerPoint
... (continue to 75)

Module 4: MS Outlook & Advanced Topics (Lectures 76-100)
- Lecture 76: Introduction to Outlook
... (continue to 100)
```

## Troubleshooting

### YouTube URL Not Working?
- Ensure the video is not private
- Use the full URL from browser address bar
- Both formats work: `youtube.com/watch?v=ID` or `youtu.be/ID`

### PDF Not Accessible?
- Check that the PDF URL is publicly accessible
- Test the URL in an incognito browser window
- Ensure sharing permissions are set correctly

### Can't See Lectures?
- Make sure you're on the correct course
- Check that lectures were saved successfully
- Refresh the page

## Student Experience

When students enroll:
1. They see the course in "My Courses"
2. Click to view all lectures in order
3. Click a lecture to watch video
4. Download PDF notes if available
5. Progress tracked automatically
6. Certificate issued upon completion

## Summary

✅ **Create Course** → Add metadata and syllabus
✅ **Manage Lectures** → Add 100+ video lectures with PDFs
✅ **Publish** → Set status to "Live"
✅ **Students Learn** → Secure, tracked, organized content

**Time to create 100-lecture course**: ~2-3 hours (if videos are ready)

---

For technical support, refer to `COURSE_MANAGEMENT_GUIDE.md` for detailed documentation.
