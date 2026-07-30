-- Add denormalized assessing staff fields to babies
-- These snapshot the employee ID and name at registration time,
-- so the info is preserved even if the staff member is later deleted.
ALTER TABLE "babies" ADD COLUMN "assessing_staff_employee_id" TEXT;
ALTER TABLE "babies" ADD COLUMN "assessing_staff_name" TEXT;
