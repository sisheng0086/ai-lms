-- ============================================================
-- AI-INTEGRATED LEARNING MANAGEMENT SYSTEM (LMS)
-- PostgreSQL Database Schema
-- Politeknik Kuching Sarawak
-- Prepared by: Daniel Wong Bin Husain Wong
-- Session I: 2026/2027
-- ============================================================

-- Step 1: Create Database (run this separately first)
-- CREATE DATABASE ai_lms_db;

-- Step 2: Run all tables below
-- ============================================================


-- ============================================================
-- TABLE 1: USERS
-- Stores all system users (students, lecturers, admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL          PRIMARY KEY,
    username      VARCHAR(50)     NOT NULL UNIQUE,
    password_hash VARCHAR(255)    NOT NULL,
    full_name     VARCHAR(100)    NOT NULL,
    role          VARCHAR(20)     NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
    email         VARCHAR(100)    UNIQUE,
    created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- TABLE 2: COURSES
-- Stores subject/course info linked to a lecturer
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
    id           SERIAL        PRIMARY KEY,
    subject_code VARCHAR(15)   NOT NULL UNIQUE,
    subject_name VARCHAR(150)  NOT NULL,
    lecturer_id  INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- TABLE 3: LECTURE NOTES
-- Stores uploaded PDF file info (NOT the file itself)
-- Actual PDF is saved in: uploads/notes/<lecturer_name>/
-- ============================================================
CREATE TABLE IF NOT EXISTS lecture_notes (
    id           SERIAL        PRIMARY KEY,
    lecturer_id  INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_code VARCHAR(15)   NOT NULL,
    title        VARCHAR(150)  NOT NULL,
    file_name    VARCHAR(255)  NOT NULL,
    file_path    VARCHAR(500)  NOT NULL,
    file_size_kb INT,
    is_indexed   BOOLEAN       DEFAULT FALSE,
    uploaded_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- TABLE 4: QA HISTORY
-- Stores all AI chat question & answer logs
-- ============================================================
CREATE TABLE IF NOT EXISTS qa_history (
    id               SERIAL        PRIMARY KEY,
    student_id       INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lecturer_id      INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question         TEXT          NOT NULL,
    answer           TEXT          NOT NULL,
    source_reference VARCHAR(100),
    asked_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- TABLE 5: FALLBACK QUEUE
-- Stores questions the AI could not answer
-- Lecturer will manually answer these
-- ============================================================
CREATE TABLE IF NOT EXISTS fallback_queue (
    id          SERIAL       PRIMARY KEY,
    student_id  INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lecturer_id INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question    TEXT         NOT NULL,
    status      VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
    answer      TEXT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP
);


-- ============================================================
-- TABLE 6: TIMETABLE
-- Stores lecturer availability schedule
-- ============================================================
CREATE TABLE IF NOT EXISTS timetable (
    id          SERIAL      PRIMARY KEY,
    lecturer_id INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday')),
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL
);


-- ============================================================
-- TABLE 7: QUIZZES
-- Stores quiz sets created by AI or lecturer
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
    id           SERIAL       PRIMARY KEY,
    lecturer_id  INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_code VARCHAR(15)  NOT NULL,
    title        VARCHAR(150) NOT NULL,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- TABLE 8: QUIZ QUESTIONS
-- Stores individual questions inside each quiz
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
    id             SERIAL        PRIMARY KEY,
    quiz_id        INT           NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text  TEXT          NOT NULL,
    option_a       VARCHAR(255)  NOT NULL,
    option_b       VARCHAR(255)  NOT NULL,
    option_c       VARCHAR(255)  NOT NULL,
    option_d       VARCHAR(255)  NOT NULL,
    correct_answer CHAR(1)       NOT NULL CHECK (correct_answer IN ('A','B','C','D'))
);


-- ============================================================
-- TABLE 9: QUIZ ATTEMPTS
-- Stores student quiz results and scores
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id              SERIAL    PRIMARY KEY,
    student_id      INT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id         INT       NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score           INT       NOT NULL,
    total_questions INT       NOT NULL,
    attempted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- SAMPLE DATA (for testing)
-- ============================================================
INSERT INTO users (username, password_hash, full_name, role, email) VALUES
('daniel_wong',   'hashed_pass_123', 'Daniel Wong Bin Husain Wong', 'student',  'daniel@student.pks.edu.my'),
('dr_faisal',     'hashed_pass_456', 'Dr. Ahmad Faisal',            'lecturer', 'faisal@pks.edu.my'),
('mdm_norhaliza', 'hashed_pass_789', 'Madam Norhaliza',             'lecturer', 'norhaliza@pks.edu.my'),
('admin_lms',     'hashed_pass_000', 'LMS Administrator',           'admin',    'admin@pks.edu.my');


-- ============================================================
-- VERIFY: Run this to check all tables were created
-- ============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
