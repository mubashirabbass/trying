# Articles Teacher Portal Fix

## Issues Reported
1. **Articles not showing** in teacher portal
2. **Cannot upload thumbnail/picture** - "failed to fetch" error
3. **Cannot post articles** - error when trying to create/publish

## Root Causes Identified

### 1. Incorrect API Base URL
**Problem**: The AdminArticles component was using `import.meta.env.BASE_URL` which is the Vite routing base URL (e.g., "/"), not the API endpoint.

**Impact**: All API calls were going to incorrect URLs like `//api/articles` instead of `http://localhost:5173/api/articles`

**Fix**: Changed from:
```typescript
const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
```

To:
```typescript
const BASE_URL = window.location.origin;
```

This ensures API calls go to `http://localhost:5173/api/...` (or production domain in production).

### 2. Incorrect Token Retrieval
**Problem**: The component was directly accessing `localStorage.getItem("token")`, but the AuthContext stores tokens in either `localStorage` OR `sessionStorage` depending on the "Remember Me" option.

**Impact**: If a user logged in without "Remember Me", their token would be in sessionStorage, but the articles component was only checking localStorage, resulting in unauthenticated requests.

**Fix**: Changed to use the `token` from `useAuth()` hook:
```typescript
// Before
const { user } = useAuth();
headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }

// After
const { user, token } = useAuth();
headers: { Authorization: `Bearer ${token}` }
```

### 3. Backend Already Supports Teachers
The backend routes in `server/src/routes/articles.ts` already have proper authorization for teachers:
- ✅ `POST /api/articles/upload-image` - `authorize("admin", "teacher")`
- ✅ `GET /api/admin/articles` - `authorize("admin", "teacher")`
- ✅ `POST /api/articles` - `authorize("admin", "teacher")`
- ✅ `PUT /api/articles/:id` - `authorize("admin", "teacher")`
- ✅ `DELETE /api/articles/:id` - `authorize("admin", "teacher")`

## Changes Made

### File: `client/src/pages/admin/articles.tsx`

#### 1. Fixed BASE_URL constant
```typescript
const BASE_URL = window.location.origin;
```

#### 2. Added token from useAuth
```typescript
const { user, token } = useAuth();
```

#### 3. Updated all fetch calls to use token from useAuth
- `fetchArticles()` - GET /api/admin/articles
- `handleImageUpload()` - POST /api/articles/upload-image
- `handleSaveArticle()` - POST/PUT /api/articles
- `handleDeleteArticle()` - DELETE /api/articles/:id
- `handleTogglePublish()` - PUT /api/articles/:id

All now use: `Authorization: Bearer ${token}`

## Features Available for Teachers

### 1. View All Articles
- Teachers can see all articles (published and drafts)
- Search by title, author, category, or excerpt
- Pagination support (8 articles per page)

### 2. Create Articles
- Write new articles with title, excerpt, and content
- Upload cover images (JPEG, PNG, WEBP)
- Set category
- Auto-calculated read time based on word count
- Publish immediately or save as draft
- **Note**: Only admins can mark articles as "Featured"

### 3. Edit Articles
- Edit any article field
- Update cover image
- Change publish status
- Teachers can edit their own articles

### 4. Delete Articles
- Teachers can delete articles
- Confirmation dialog before deletion

### 5. Toggle Visibility
- Show/Hide articles from public site
- Quick toggle button in article list

### 6. Image Upload
- Direct file upload to Cloudinary
- Supports drag & drop or file picker
- Preview before saving
- Alternative: paste image URL directly

## Teacher vs Admin Differences

| Feature | Teacher | Admin |
|---------|---------|-------|
| View articles | ✅ All articles | ✅ All articles |
| Create articles | ✅ Yes | ✅ Yes |
| Edit articles | ✅ Yes | ✅ Yes |
| Delete articles | ✅ Yes | ✅ Yes |
| Upload images | ✅ Yes | ✅ Yes |
| Publish/unpublish | ✅ Yes | ✅ Yes |
| Mark as Featured | ❌ No | ✅ Yes |
| Auto-publish on create | ✅ Yes (default) | ❌ No (draft default) |

## Testing Checklist

### Prerequisites
- [ ] Server is running (`pnpm dev` in root)
- [ ] Logged in as teacher
- [ ] Navigate to `/teacher/articles`

### Test Cases
1. **View Articles**
   - [ ] Articles list loads without errors
   - [ ] Can see all articles (published and drafts)
   - [ ] Search functionality works
   - [ ] Pagination works

2. **Create Article**
   - [ ] Click "Write Article" tab
   - [ ] Fill in title, excerpt, content
   - [ ] Upload cover image - should succeed
   - [ ] Click "Publish Article" - should succeed
   - [ ] Article appears in list

3. **Upload Image**
   - [ ] Click upload button
   - [ ] Select image file
   - [ ] Should show "Article cover uploaded" toast
   - [ ] Image preview should appear
   - [ ] No "failed to fetch" error

4. **Edit Article**
   - [ ] Click "Edit" on an article
   - [ ] Modify fields
   - [ ] Click "Update"
   - [ ] Changes should save

5. **Delete Article**
   - [ ] Click "Delete" on an article
   - [ ] Confirm deletion
   - [ ] Article should be removed

6. **Toggle Visibility**
   - [ ] Click "Hide" on published article
   - [ ] Status changes to "Draft"
   - [ ] Click "Show" on draft
   - [ ] Status changes to "Published"

## API Endpoints Used

### GET /api/admin/articles
Fetches all articles (including drafts) for admin/teacher dashboard.

**Authorization**: Bearer token required, role must be "admin" or "teacher"

**Response**: Array of article objects

### POST /api/articles/upload-image
Uploads article cover image to Cloudinary.

**Authorization**: Bearer token required, role must be "admin" or "teacher"

**Body**: FormData with "image" file

**Response**: 
```json
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "article-covers/..."
}
```

### POST /api/articles
Creates a new article.

**Authorization**: Bearer token required, role must be "admin" or "teacher"

**Body**:
```json
{
  "title": "Article Title",
  "excerpt": "Short summary",
  "content": "Full article content",
  "category": "General",
  "imageUrl": "https://...",
  "isPublished": true,
  "isFeatured": false,
  "readTime": "5 min read"
}
```

**Response**: Created article object

### PUT /api/articles/:id
Updates an existing article.

**Authorization**: Bearer token required, role must be "admin" or "teacher"

**Body**: Same as POST

**Response**: Updated article object

### DELETE /api/articles/:id
Deletes an article.

**Authorization**: Bearer token required, role must be "admin" or "teacher"

**Response**: 204 No Content

## Common Errors and Solutions

### Error: "Failed to fetch"
**Cause**: Server not running or incorrect API URL

**Solution**: 
1. Ensure server is running: `pnpm dev`
2. Check BASE_URL is set to `window.location.origin`

### Error: 401 Unauthorized
**Cause**: Token not found or invalid

**Solution**:
1. Ensure user is logged in
2. Check token is retrieved from `useAuth()` hook
3. Verify token is included in Authorization header

### Error: 403 Forbidden
**Cause**: User role doesn't have permission

**Solution**:
1. Verify user role is "teacher" or "admin"
2. Check backend route has `authorize("admin", "teacher")`

### Error: "Image upload failed"
**Cause**: 
- File is not an image
- Cloudinary credentials not configured
- Network error

**Solution**:
1. Verify file type is image (JPEG, PNG, WEBP)
2. Check Cloudinary env variables in `.env`
3. Check network tab for actual error

## Environment Variables Required

```env
# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Notes

1. **Teacher Default Behavior**: When teachers create articles, `isPublished` defaults to `true` (auto-publish). Admins default to `false` (draft).

2. **Featured Articles**: Only admins can mark articles as featured. Teachers will see the toggle but it won't affect the article.

3. **Author Field**: If no author is provided, it defaults to the current user's name from the JWT token.

4. **Slug Generation**: Slugs are auto-generated from the title with a timestamp to ensure uniqueness.

5. **Read Time**: Automatically calculated based on word count (200 words per minute).

6. **Image Storage**: All article images are stored in Cloudinary under the "article-covers" folder.

## Related Files
- `client/src/pages/admin/articles.tsx` - Main articles management component
- `server/src/routes/articles.ts` - Backend API routes
- `client/src/App.tsx` - Route configuration (line 241-244)
- `db/src/schema/articles.ts` - Database schema
- `server/src/middleware/auth.ts` - Authentication middleware
- `server/src/middleware/upload.ts` - File upload middleware
- `server/src/lib/cloudinary.ts` - Cloudinary integration
