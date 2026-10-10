-- ========================================================
-- CAMPUS P2P LENDING HUB - PRODUCTION RELATIONAL SCHEMA
-- Meets DBMS Project Requirements: Integrity Constraints, 
-- Foreign Keys, CHECK constraints, and Normalization (3NF/BCNF)
-- ========================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    campus_email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

-- Seed Categories
INSERT INTO categories (category_name) 
VALUES ('Book'), ('Lab Equipment'), ('Electronics'), ('Stationery')
ON CONFLICT (category_name) DO NOTHING;

-- 3. ITEMS TABLE
CREATE TABLE IF NOT EXISTS items (
    item_id SERIAL PRIMARY KEY,
    owner_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    category_id INT NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Borrowed', 'Pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- 4. BORROW REQUESTS / TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS borrow_requests (
    request_id SERIAL PRIMARY KEY,
    item_id INT NOT NULL,
    borrower_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Returned')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    returned_at TIMESTAMP WITH TIME ZONE NULL,
    requested_return_date DATE NULL,
    note TEXT NULL,
    CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    CONSTRAINT fk_borrower FOREIGN KEY (borrower_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Migration (idempotent): add requested return date + borrower note to
-- borrow_requests for projects created before this feature existed.
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS requested_return_date DATE NULL;
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS note TEXT NULL;

-- ========================================================
-- ADVANCED DBMS FEATURES: VIEWS & SAMPLE QUERIES
-- ========================================================

-- View: Active Inventory with Owner & Category Details
CREATE OR REPLACE VIEW active_inventory AS
SELECT 
    i.item_id,
    i.title,
    c.category_name,
    i.status,
    u.full_name AS owner_name,
    u.campus_email AS owner_email
FROM items i
JOIN categories c ON i.category_id = c.category_id
JOIN users u ON i.owner_id = u.user_id;