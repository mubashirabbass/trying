# 📋 Global College LMS — Task Tracker

> **Last Updated:** May 13, 2026  
> **Active Phase:** Phase 6  
> **Overall Progress:** 84 / 149 tasks (56.4%)

---

## Phase 1: Project Restructure & Replit Cleanup `[8/8]`
> **Status:** ✅ Complete | **Goal:** Clean independent project

- [x] 1.1 Create clean `client/` + `server/` + `db/` folder structure
- [x] 1.2 Delete Replit files (`.replit`, `.replitignore`, `replit.md`, `.agents/`, `.local/`, `mockup-sandbox/`)
- [x] 1.3 Clean `pnpm-workspace.yaml` — remove `@replit/*` and platform overrides
- [x] 1.4 Fix `vite.config.ts` — remove 3 Replit plugins, add default PORT/BASE_PATH
- [x] 1.5 Fix all `package.json` files — remove `@replit/*` devDeps, update workspace refs
- [x] 1.6 Create `.env.example` with all required environment variables
- [x] 1.7 Create root `package.json` scripts (`dev`, `build`, `db:push`, `db:studio`)
- [x] 1.8 Verify project runs independently (`pnpm install` → `pnpm dev`)

---

## Phase 2: Authentication & Security Foundation `[12/12]`
> **Status:** ✅ Complete | **Goal:** JWT + bcrypt + RBAC

- [x] 2.1 Install auth packages (`bcryptjs`, `jsonwebtoken`, types)
- [x] 2.2 Replace SHA-256 with bcrypt (cost 12) in `hashPassword()` / `verifyPassword()`
- [x] 2.3 Implement JWT token system (access 7-day, refresh 30-day)
- [x] 2.4 Build `authenticate` middleware (verify JWT, attach `req.user`)
- [x] 2.5 Build `authorize(roles)` middleware (check role against allowed list)
- [x] 2.6 Build `AppError` class + global `errorHandler` middleware
- [x] 2.7 Build `catchAsync` utility wrapper
- [x] 2.8 Rebuild login endpoint (bcrypt, JWT, account lock check)
- [x] 2.9 Rebuild register endpoint (bcrypt, validate, JWT, branch selection)
- [x] 2.10 Rebuild `/auth/me` endpoint (decode JWT, return safe user)
- [x] 2.11 Build `/auth/refresh` endpoint (validate refresh, issue new access)
- [x] 2.12 Update frontend `AuthContext.tsx` (JWT storage, API interceptor)

---

## Phase 3: Database Schema Completion `[10/10]`
> **Status:** ✅ Complete | **Goal:** All tables match PRD

- [x] 3.1 Update `users` — add branchId FK, isEmailVerified, isIdentityVerified, failedLoginAttempts, lockedUntil
- [x] 3.2 Update `courses` — add slug (unique), status enum, rejectionNote, totalDurationHours
- [x] 3.3 Create `sections` table — id, courseId FK, title, order
- [x] 3.4 Update `lessons` — add sectionId FK, encryptedYoutubeId, completionThreshold
- [x] 3.5 Create `lessonCompletions` table — userId, lessonId, watchedPercent, isCompleted, completedAt
- [x] 3.6 Create `videoAccessLogs` table — userId, lessonId, ipAddress, userAgent, accessedAt
- [x] 3.7 Normalize quizzes — separate `questions` table with optionA-D, correctOption, explanation
- [x] 3.8 Update `payments` — add rejectionReason, reviewedAt, reviewedBy
- [x] 3.9 Update `certificates` — add pdfUrl, status, isRevoked
- [x] 3.10 Add unique constraints & database indexes on all major tables

---

## Phase 4: Core API Infrastructure `[9/9]`
> **Status:** ✅ Complete | **Goal:** Standard patterns for all routes

- [x] 4.1 Create response helpers — `sendSuccess()`, `sendError()` with standard format
- [x] 4.2 Create `validate(schema)` middleware using Zod
- [x] 4.3 Create pagination utility — `{data, total, page, totalPages}`
- [x] 4.4 Add API versioning — mount routes under `/api/v1/`
- [x] 4.5 Create file upload middleware (Multer + MIME validation)
- [x] 4.6 Setup Cloudinary service (upload/delete helpers)
- [x] 4.7 Create Winston logger service
- [x] 4.8 Add rate limiting on auth routes
- [x] 4.9 Add security middleware (helmet, cors, xss-clean)

---

## Phase 5: Branch & User Management `[7/7]`
> **Status:** ✅ Complete | **Goal:** Admin manages users & branches

- [x] 5.1 Branch CRUD API (public GET + admin CRUD with student count)
- [x] 5.2 Branch management frontend (admin page with add/edit/deactivate)
- [x] 5.3 Student management API (list, detail, edit, delete, reset password)
- [x] 5.4 Student management frontend (table, search, filters, detail view)
- [x] 5.5 Teacher management API (list, create with email creds, detail, edit, delete)
- [x] 5.6 Teacher management frontend (create modal, table, detail view)
- [x] 5.7 Update registration form (branch dropdown from API)

---

## Phase 6: Course System `[8/11]`
> **Status:** 🚧 In Progress | **Goal:** Full course lifecycle

- [x] 6.1 Course CRUD API (admin) — create, edit, approve, reject, archive
- [x] 6.2 Course CRUD API (teacher) — create draft, edit own, submit for approval
- [ ] 6.3 Section CRUD API — create, edit, delete, reorder within course
- [x] 6.4 Lesson CRUD API — create, edit, delete within section, PDF upload
- [x] 6.5 Course catalog API (public) — LIVE courses with filters, search, pagination
- [x] 6.6 Course detail API (public) — sections, lessons, teacher info
- [ ] 6.7 Teacher course builder page (form + sections/lessons builder)
- [x] 6.8 Admin course management page (table, status filters, actions)
- [ ] 6.9 Admin course review page (preview + approve/reject)
- [x] 6.10 Public course catalog page (search, filter, sort, cards)
- [x] 6.11 Public course detail page (syllabus accordion, teacher card, enroll)

---

## Phase 7: Enrollment & Payment System `[5/9]`
> **Status:** 🚧 In Progress | **Goal:** Complete enrollment flow

- [x] 7.1 Free enrollment API (immediate, unique constraint)
- [x] 7.2 Payment submission API (receipt upload to Cloudinary)
- [x] 7.3 Payment review API (approve → auto-enroll, reject → reason)
- [ ] 7.4 Manual enrollment API (admin bypasses payment)
- [ ] 7.5 Student payment page (instructions from settings, upload)
- [x] 7.6 Admin payments page (table, receipt viewer, approve/reject)
- [ ] 7.7 Admin manual enrollment page
- [x] 7.8 Student enrolled courses page (progress bars, continue)
- [ ] 7.9 Enrollment status on course detail page

---

## Phase 8: Video Learning System `[3/8]`
> **Status:** 🚧 In Progress | **Goal:** Protected YouTube video playback

- [ ] 8.1 AES-256 encryption service (encrypt/decrypt YouTube IDs)
- [ ] 8.2 Stream token endpoint (verify enrollment, signed JWT)
- [ ] 8.3 Embed endpoint (validate token, return youtube-nocookie URL)
- [ ] 8.4 Video access logging
- [x] 8.5 Progress tracking API (upsert watchedPercent, check completion)
- [ ] 8.6 Course completion service (all lessons done → mark complete)
- [x] 8.7 Video player component (sandboxed iframe, overlay, YouTube API)
- [x] 8.8 Lesson viewer page (two-panel: sidebar + video + tabs)

---

## Phase 9: Quiz & Assignment System `[4/10]`
> **Status:** 🚧 In Progress | **Goal:** Assessment system

- [x] 9.1 Quiz CRUD API (create, add questions, edit, delete)
- [ ] 9.2 Quiz submission API (auto-grade, return score)
- [ ] 9.3 Quiz builder page (teacher — MCQ, timer, passing score)
- [x] 9.4 Quiz taking page (student — one-at-a-time, timer, progress)
- [ ] 9.5 Quiz results page (score card, answer review)
- [x] 9.6 Assignment CRUD API (create, edit, delete)
- [ ] 9.7 Assignment submission API (file upload, late tracking)
- [ ] 9.8 Assignment grading API (mark + feedback → notify)
- [x] 9.9 Assignment pages (student — view, upload, grades)
- [ ] 9.10 Grading page (teacher — view submission, enter marks)

---

## Phase 10: Certificate & Identity Verification `[4/7]`
> **Status:** 🚧 In Progress

- [x] 10.1 Identity verification upload API (CNIC/Form-B)
- [x] 10.2 Admin verification queue API (list, approve, reject)
- [ ] 10.3 Certificate generation service (Puppeteer PDF)
- [ ] 10.4 Certificate download API
- [ ] 10.5 Public certificate verification page
- [x] 10.6 Student identity verification page
- [x] 10.7 Student certificates page (status badges, download)

---

## Phase 11: Messaging & Forum `[4/6]`
> **Status:** 🚧 In Progress

- [x] 11.1 Message threads API (list, create, get messages, send)
- [x] 11.2 Forum posts API (list, create, pin, upvote, reply)
- [x] 11.3 Student messages page (two-column chat)
- [ ] 11.4 Teacher messages page
- [x] 11.5 Student forum page (threads, replies, upvotes)
- [ ] 11.6 Admin forum moderation (delete posts)

---

## Phase 12: Notifications & Email `[1/8]`
> **Status:** 🚧 In Progress

- [ ] 12.1 Nodemailer + SendGrid SMTP setup
- [ ] 12.2 Email templates (welcome, verification, reset, enrollment, payment)
- [ ] 12.3 Email verification flow (register → verify link)
- [ ] 12.4 Password reset flow (forgot → email → reset)
- [ ] 12.5 Notification creation service (`createNotification()`)
- [ ] 12.6 Implement all notification triggers (16 events)
- [x] 12.7 Announcement system API (admin → target group)
- [ ] 12.8 Announcement composer page (admin)

---

## Phase 13: Admin Dashboard & Reports `[2/8]`
> **Status:** 🚧 In Progress

- [x] 13.1 Admin dashboard API (comprehensive KPIs, pending actions)
- [x] 13.2 Admin dashboard frontend (5 KPI cards, branch table, activity feed)
- [ ] 13.3 Reports API (branch, enrollment, revenue, students)
- [ ] 13.4 PDF export service (Puppeteer branded reports)
- [ ] 13.5 Excel export service (exceljs)
- [ ] 13.6 Reports page (type selector, filters, preview, export buttons)
- [ ] 13.7 Student progress report API + PDF download
- [ ] 13.8 Admin leaderboard page

---

## Phase 14: Public Website Polish `[5/9]`
> **Status:** 🚧 In Progress

- [x] 14.1 Homepage — all 11 sections per PRD (hero, courses, how-it-works, etc.)
- [x] 14.2 Course catalog — sidebar filters, pagination, empty state
- [x] 14.3 Course detail — syllabus accordion, sticky sidebar, teacher card
- [x] 14.4 About page — history, mission, vision, team, stats
- [ ] 14.5 Branches page — card grid with all active branches
- [x] 14.6 Contact page — form + Google Map + FAQ accordion
- [ ] 14.7 Privacy Policy page
- [ ] 14.8 WhatsApp floating button (all pages)
- [ ] 14.9 Footer — links, newsletter signup, social icons, copyright

---

## Phase 15: Student & Teacher Portal Polish `[1/10]`
> **Status:** 🚧 In Progress

- [ ] 15.1 Student dashboard — continue learning, deadlines, leaderboard rank
- [ ] 15.2 Student browse courses — "Enrolled" badges on catalog
- [ ] 15.3 Student progress page — per-course breakdown, PDF download
- [ ] 15.4 Student profile page — edit name/phone/photo, change password
- [ ] 15.5 Student payment page — instructions tabs, receipt upload
- [ ] 15.6 Teacher dashboard — KPIs, recent submissions, course status
- [ ] 15.7 Teacher course builder — drag-drop sections/lessons
- [ ] 15.8 Teacher student progress view — per-student table
- [ ] 15.9 Teacher profile page — edit bio, photo, password
- [x] 15.10 Mobile responsive — all dashboard pages

---

## Phase 16: Admin Panel Polish `[2/8]`
> **Status:** 🚧 In Progress

- [ ] 16.1 Admin student detail page — profile, enrollments, payments, activity
- [ ] 16.2 Admin teacher detail page — profile, courses, disable/reset
- [ ] 16.3 Admin course editor — full editor with fee, status, teacher assignment
- [ ] 16.4 Admin payment review modal — full-size receipt, zoom, approve/reject
- [ ] 16.5 Admin certificates page — table, search, revoke
- [x] 16.6 Admin settings page — organized tabs (payment, certificate, LMS, site, email)
- [x] 16.7 Admin content management — success stories + testimonials with drag reorder
- [ ] 16.8 Admin identity verifications — document viewer, approve/reject

---

## Phase 17: Security & Production `[1/9]`
> **Status:** 🚧 In Progress

- [ ] 17.1 Security audit — all endpoints require authentication
- [ ] 17.2 Input sanitization on all text fields
- [ ] 17.3 Environment variable validation on startup
- [ ] 17.4 Database indexes verification
- [ ] 17.5 Performance optimization — pagination, select fields, lazy loading
- [ ] 17.6 Dockerfile + docker-compose.yml
- [x] 17.7 Health check endpoint (`/api/v1/health`)
- [ ] 17.8 End-to-end testing of critical flows
- [ ] 17.9 README.md — setup instructions, env docs, API overview

---

## Decisions Log

| Date | Decision | Reason |
|------|----------|--------|
| May 5 | Keep Drizzle ORM | Already set up, no need to switch to Prisma |
| May 5 | Keep integer IDs | Simpler than CUIDs, works well with PostgreSQL |
| May 5 | Clean client/server structure | Remove Replit's artifacts layout |
| May 13 | Synchronized Tracker | Corrected progress status to match existing codebase |

---

## Notes

_Project is much further along than initially documented. Core focus shifted to finalizing missing logic in Phase 6/7/8._

---
