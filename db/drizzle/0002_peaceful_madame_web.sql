ALTER TABLE "articles" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dob" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "obtained_marks" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_marks" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "education_document_url" text;