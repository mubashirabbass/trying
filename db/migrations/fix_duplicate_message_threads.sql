-- Fix duplicate message threads
-- This migration removes duplicate threads and adds a unique constraint

-- Step 1: Find and keep only the oldest thread for each student-teacher pair
-- Delete newer duplicate threads
WITH ranked_threads AS (
  SELECT 
    id,
    student_id,
    teacher_id,
    ROW_NUMBER() OVER (
      PARTITION BY student_id, teacher_id 
      ORDER BY created_at ASC, id ASC
    ) as rn
  FROM message_threads
)
DELETE FROM message_threads
WHERE id IN (
  SELECT id FROM ranked_threads WHERE rn > 1
);

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE message_threads 
ADD CONSTRAINT message_threads_student_id_teacher_id_unique 
UNIQUE (student_id, teacher_id);

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_message_threads_student_teacher 
ON message_threads(student_id, teacher_id);
