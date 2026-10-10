-- ========================================================
-- CAMPUS LENDING HUB - MOCK SEED DATA
-- Run this in the Supabase SQL editor (after schema.sql) to
-- populate the database with sample users, items, and a couple
-- of in-flight borrow requests so the dashboard isn't empty.
--
-- Safe to re-run: every insert is guarded so duplicates are
-- skipped if the seed has already been applied.
-- ========================================================

-- 1. USERS -------------------------------------------------
INSERT INTO users (full_name, campus_email, department)
VALUES
  ('Ava Thompson', 'ava.thompson@campus.edu', 'Computer Science'),
  ('Liam Patel', 'liam.patel@campus.edu', 'Mechanical Engineering'),
  ('Noah Kim', 'noah.kim@campus.edu', 'Biology'),
  ('Maya Rodriguez', 'maya.rodriguez@campus.edu', 'Electrical Engineering'),
  ('Sofia Nguyen', 'sofia.nguyen@campus.edu', 'Business Administration')
ON CONFLICT (campus_email) DO NOTHING;

-- 2. CATEGORIES ----------------------------------------------
-- Already seeded by schema.sql (Book, Lab Equipment, Electronics,
-- Stationery); re-run here too in case seed.sql is applied standalone.
INSERT INTO categories (category_name)
VALUES ('Book'), ('Lab Equipment'), ('Electronics'), ('Stationery')
ON CONFLICT (category_name) DO NOTHING;

-- 3. ITEMS ---------------------------------------------------
-- Guarded with NOT EXISTS (title + owner) since `items` has no
-- natural unique key, so re-running this script won't duplicate rows.
INSERT INTO items (owner_id, title, category_id, description, status)
SELECT u.user_id, v.title, c.category_id, v.description, v.status
FROM (
  VALUES
    ('ava.thompson@campus.edu', 'Introduction to Algorithms (CLRS)', 'Book', 'Hardcover 3rd edition, lightly highlighted.', 'Available'),
    ('ava.thompson@campus.edu', 'TI-84 Plus Graphing Calculator', 'Electronics', 'Great battery life, comes with charging cable.', 'Available'),
    ('liam.patel@campus.edu', 'Digital Oscilloscope', 'Lab Equipment', '2-channel, 70MHz, ideal for EE lab coursework.', 'Available'),
    ('liam.patel@campus.edu', 'Mechanical Drafting Kit', 'Stationery', 'Full set of drafting tools and compasses.', 'Available'),
    ('noah.kim@campus.edu', 'Campbell Biology (12th Edition)', 'Book', 'Used one semester, no writing inside.', 'Available'),
    ('noah.kim@campus.edu', 'Digital Microscope Camera', 'Lab Equipment', 'USB microscope camera, 1000x zoom.', 'Available'),
    ('maya.rodriguez@campus.edu', 'Soldering Iron Kit', 'Electronics', 'Includes stand, solder wire, and tips.', 'Available'),
    ('maya.rodriguez@campus.edu', 'Arduino Starter Kit', 'Electronics', 'Uno R3 board with sensors and breadboard.', 'Borrowed'),
    ('sofia.nguyen@campus.edu', 'Scientific Calculator (Casio FX-991)', 'Electronics', 'Non-graphing, approved for most exams.', 'Available'),
    ('sofia.nguyen@campus.edu', 'Principles of Marketing Textbook', 'Book', '8th edition, minor wear on cover.', 'Available'),
    ('ava.thompson@campus.edu', 'Mechanical Pencil Set', 'Stationery', 'Pack of 5, assorted lead sizes.', 'Available'),
    ('liam.patel@campus.edu', 'Digital Calipers', 'Lab Equipment', 'Stainless steel, 0-150mm range.', 'Pending')
) AS v(owner_email, title, category_name, description, status)
JOIN users u ON u.campus_email = v.owner_email
JOIN categories c ON c.category_name = v.category_name
WHERE NOT EXISTS (
  SELECT 1 FROM items i WHERE i.title = v.title AND i.owner_id = u.user_id
);

-- 4. BORROW REQUESTS ------------------------------------------
-- One sample request against the "Pending" oscilloscope-style item
-- and one against the item already marked "Borrowed", so the demo
-- data is internally consistent.
INSERT INTO borrow_requests (item_id, borrower_id, status)
SELECT i.item_id, u.user_id, v.status
FROM (
  VALUES
    ('Digital Calipers', 'noah.kim@campus.edu', 'Pending'),
    ('Arduino Starter Kit', 'sofia.nguyen@campus.edu', 'Approved')
) AS v(item_title, borrower_email, status)
JOIN items i ON i.title = v.item_title
JOIN users u ON u.campus_email = v.borrower_email
WHERE NOT EXISTS (
  SELECT 1 FROM borrow_requests br
  WHERE br.item_id = i.item_id AND br.borrower_id = u.user_id
);
