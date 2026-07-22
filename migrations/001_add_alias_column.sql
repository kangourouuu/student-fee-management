-- Migration: 001_add_alias_column.sql
-- Add alias / nickname column to student_fee_core.students table

ALTER TABLE student_fee_core.students 
ADD COLUMN IF NOT EXISTS alias VARCHAR(100);
