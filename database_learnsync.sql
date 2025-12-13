
-- the tables below are for zoom meeting, they have not been implememted completely(lack users)
-- will be completed when working upon meeting inetgration
CREATE TABLE zoom_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    client_id TEXT,
    client_secret TEXT,
    account_id TEXT,
    access_token TEXT,
    token_expires_at BIGINT
);

-- This is complete zoom accounts, system zoom accounts which are used for scheduling meetings
INSERT INTO zoom_accounts (name, client_id, client_secret, account_id, access_token, token_expires_at)
VALUES (
    'me',
    'fL85BzWMSRqLbSyFJFN3fQ',
    'v5yUyx6aHvP3avSxnN9P590xOXFVoiAv',
    'gV_PX5AdRWmUF3GMQItB3g',
    NULL,
    0
),
(
    'me',
    'Zk2T5hrsQGuCWtWWtsKCQg',
    'M0FjcxZ16VbeSvclmIsFJhcLOKoAqBKv',
     '4CJlZ93eQVmPAjaiNhO5Pw',
    NULL,
    0
);

-- User table used by all users including admins, instructors, students
-- this table is mainly used for signup and login
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  time_zone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(50) NOT NULL DEFAULT 'active'
);

-- Index for fast email lookup (login/lookup)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert an initial admin user
INSERT INTO users (name, email, password_hash, role, time_zone, status)
VALUES (
    'Admin User',
    'admin@learnsync.com',
    '$2b$10$k8C4kNzW23L4gbCakjSlxesE1RET1HaAP0QTv.uoXzz8qWHyRxYJK', 
    'admin',
    'UTC',
    'active'
);

-- Extra info of instructor
CREATE TABLE IF NOT EXISTS instructor_details (
  id BIGSERIAL PRIMARY KEY,
  instructor_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  certifications TEXT[],         -- array of URLs for PDF/image files(at the moment all these
                                 -- files are going in local memory in root directory, named upload)
  demo_material TEXT[],          -- array of URLs for PDF/image/video files
  subject_tags TEXT[],           -- array of strings
  education_level_tags TEXT[],   -- array of strings
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- Extra info of student
CREATE TABLE  IF NOT EXISTS student_details (
    student_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    education_level VARCHAR,
    subject_tags TEXT[], -- array of subjects interested in
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    instructor_id INT NOT NULL,
    description TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' -- pending, accepted, rejected, completed

    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE meetings (
    meeting_id SERIAL PRIMARY KEY,
    link TEXT NOT NULL,
    zoom_account_id INT NOT NULL REFERENCES zoom_accounts(id) ON DELETE CASCADE,
    session_id INT REFERENCES sessions(session_id) ON DELETE CASCADE
);

	CREATE TABLE payments (
    transaction_id VARCHAR(50) PRIMARY KEY,  -- your unique transaction ID
    session_id INT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,         -- allows decimal values like 199.99
    status VARCHAR(10) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    student_id INT REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    created_at TIMESTAMP DEFAULT NOW()      -- optional: track when payment was created
);