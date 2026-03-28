CREATE DATABASE IF NOT EXISTS taskverse;
USE taskverse;

CREATE TABLE IF NOT EXISTS boards (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS lists (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    board_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cards (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    list_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

-- Delete existing default data to avoid duplicates if you rerun this
DELETE FROM boards WHERE id = 'b-1';
DELETE FROM lists WHERE id IN ('l-1', 'l-2');

-- 1. Insert Target Board
REPLACE INTO boards (id, title) VALUES
('b-1', 'Bhawika''s Productivity Board'),
('b-2', 'Bhawika''s Daily Stuffs');

-- 2. Insert Target Lists
REPLACE INTO lists (id, title, board_id) VALUES
('l-1', 'To Do', 'b-1'),
('l-2', 'In Progress', 'b-1'),
('l-3', 'Personal Tasks', 'b-2');

-- 3. Insert Target Cards
REPLACE INTO cards (id, title, list_id) VALUES
('c-1', 'Complete Trello Clone Project', 'l-1'),
('c-2', 'Prepare for Placement Interviews', 'l-1'),
('c-3', 'Revise DSA Questions', 'l-1'),
('c-4', 'Work on Backend Integration', 'l-2'),
('c-5', 'Improve UI Design', 'l-2'),
('c-6', 'Sleep 6 hours', 'l-3'),
('c-7', 'Hit the Gym', 'l-3'),
('c-8', 'Diet Plan', 'l-3');
