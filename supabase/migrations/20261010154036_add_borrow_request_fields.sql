-- ========================================================
-- Add requested_return_date + note to borrow_requests
--
-- Supports the "Borrow Request" modal (components/BorrowRequestModal.tsx):
-- borrowers can pick a requested return date and leave a note for the
-- owner, both shown on the My Requests / Approvals page.
--
-- Apply this in the Supabase SQL editor (Dashboard > SQL Editor) since this
-- project uses the anon key only (no service-role key / DB password is
-- configured for `supabase db push`). Safe to re-run.
-- ========================================================

ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS requested_return_date DATE NULL;
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS note TEXT NULL;

