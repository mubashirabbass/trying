CREATE TABLE "course_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "franchise_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"city" text,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending',
	"admin_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teacher_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer NOT NULL,
	"date" date NOT NULL,
	"status" text DEFAULT 'present' NOT NULL,
	"check_in_time" text,
	"check_out_time" text,
	"working_hours" text,
	"recorded_by_id" integer,
	"notes" text,
	"leave_type" text,
	"is_approved" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installment_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"month_number" integer NOT NULL,
	"installment_amount" real NOT NULL,
	"total_fee" real NOT NULL,
	"total_paid" real DEFAULT 0 NOT NULL,
	"remaining_balance" real NOT NULL,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"payment_history" jsonb DEFAULT '[]' NOT NULL,
	"receipt_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "file_url" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "outline_pdf_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name_urdu" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "father_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "session" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "semester_term" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shift" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "roll_no" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reg_no" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "is_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "total_fee" real;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "remaining_fee" real;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_plan" text DEFAULT 'full' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "installment_months" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "installment_number" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_type" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_name" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_size" integer;--> statement-breakpoint
ALTER TABLE "announcement_logs" ADD COLUMN "is_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "live_classes" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "live_classes" ADD COLUMN "created_by_role" text;--> statement-breakpoint
ALTER TABLE "teacher_attendance" ADD CONSTRAINT "teacher_attendance_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_attendance" ADD CONSTRAINT "teacher_attendance_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_ledger" ADD CONSTRAINT "installment_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_ledger" ADD CONSTRAINT "installment_ledger_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teacher_attendance_teacher_id_idx" ON "teacher_attendance" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "teacher_attendance_date_idx" ON "teacher_attendance" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_user_course_month_idx" ON "installment_ledger" USING btree ("user_id","course_id","month_number");--> statement-breakpoint
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrollment_status_idx" ON "enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "enrollment_enrolled_at_idx" ON "enrollments" USING btree ("enrolled_at");--> statement-breakpoint
CREATE INDEX "id_verification_status_idx" ON "identity_verifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "user_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lesson_completion_feedback_rating_idx" ON "lesson_completions" USING btree ("feedback_rating");--> statement-breakpoint
CREATE INDEX "lesson_completion_completed_at_idx" ON "lesson_completions" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "lesson_completion_rating_completed_at_idx" ON "lesson_completions" USING btree ("feedback_rating","completed_at");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_created_at_idx" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "thread_student_id_idx" ON "message_threads" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "thread_teacher_id_idx" ON "message_threads" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "message_thread_id_idx" ON "messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "message_sender_id_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "live_class_course_id_idx" ON "live_classes" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "live_class_student_id_idx" ON "live_classes" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "live_class_is_completed_idx" ON "live_classes" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "live_class_scheduled_at_idx" ON "live_classes" USING btree ("scheduled_at");--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_student_id_teacher_id_unique" UNIQUE("student_id","teacher_id");