-- Migration 002: Add fee_per_session to students table and drop from fee_statements table

ALTER TABLE student_fee_core.students 
ADD COLUMN IF NOT EXISTS fee_per_session NUMERIC(10, 2) DEFAULT 0.00 CHECK (fee_per_session >= 0);

-- Migrate existing fee_per_session from latest fee_statements into students table
UPDATE student_fee_core.students s
SET fee_per_session = fs.fee_per_session
FROM (
    SELECT DISTINCT ON (student_id) student_id, fee_per_session
    FROM student_fee_core.fee_statements
    ORDER BY student_id, created_at DESC
) fs
WHERE s.id = fs.student_id;

-- Drop fee_per_session from fee_statements table
ALTER TABLE student_fee_core.fee_statements 
DROP COLUMN IF EXISTS fee_per_session;
