# Global College LMS

## Overview

A full-stack Learning Management System (LMS) for Global College — a professional educational institution website with student, teacher, and admin portals.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Routing**: Wouter

## Key Features

- Landing page with hero, courses, testimonials, success stories, branches, contact
- WhatsApp floating button and social media links
- User login system: Student, Teacher, Admin roles
- Course Management: Add/edit courses, video lectures, PDF notes, syllabus
- Student Dashboard: Enrolled courses, video timeline with progress, assignments, quizzes, certificates
- Teacher Panel: Upload content, grade assignments, create quizzes
- Admin Dashboard: Manage users, courses, payments, success stories, branches
- Certificate verification by CNIC or certificate number
- Payment system: EasyPaisa, JazzCash, bank transfer, cash

## Seed Accounts

- Admin: `admin@globalcollege.pk`
- Teacher: `farhan@globalcollege.pk` / `sadia@globalcollege.pk`
- Students: `ali@student.pk`, `fatima@student.pk`, `usman@student.pk`
- (Login via the app — password hash is stored, use the register flow or update DB for real passwords)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

- `artifacts/global-college/` — React + Vite frontend (served at `/`)
- `artifacts/api-server/` — Express API server (served at `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod schemas
- `lib/db/` — Drizzle ORM schema and client

## DB Tables

users, courses, lessons, lesson_progress, enrollments, assignments, assignment_submissions, quizzes, quiz_results, payments, testimonials, success_stories, branches, certificates
