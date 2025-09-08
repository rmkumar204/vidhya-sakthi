
-- Projects table
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  mentor_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'completed', 'on_hold', 'cancelled')) DEFAULT 'open',
  max_mentees INTEGER DEFAULT 5,
  industry TEXT,
  sector TEXT,
  required_skills TEXT,
  duration_weeks INTEGER,
  is_approved BOOLEAN DEFAULT 0,
  approved_by INTEGER,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project applications
CREATE TABLE project_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  mentee_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  application_text TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER
);

-- Project mentees (accepted applications)
CREATE TABLE project_mentees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  mentee_id INTEGER NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active'
);

-- Tasks within projects
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to INTEGER,
  assigned_by INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'submitted', 'reviewed', 'completed')) DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task submissions
CREATE TABLE task_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  mentee_id INTEGER NOT NULL,
  submission_text TEXT,
  file_url TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  feedback TEXT,
  reviewed_by INTEGER,
  reviewed_at TIMESTAMP,
  score INTEGER
);

-- Announcements
CREATE TABLE announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  mentor_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meeting_link TEXT,
  is_global BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat rooms
CREATE TABLE chat_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  type TEXT NOT NULL CHECK (type IN ('project_group', 'mentor_mentee')) DEFAULT 'project_group',
  name TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat participants
CREATE TABLE chat_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_room_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'mentee', 'admin')) DEFAULT 'mentee'
);

-- Chat messages
CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_room_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  message_text TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT 0,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'file', 'image', 'audio')) DEFAULT 'text'
);

-- Certificates
CREATE TABLE certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentee_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('completion', 'participation', 'excellence')),
  issued_date DATE DEFAULT CURRENT_DATE,
  certificate_url TEXT,
  hard_copy_requested BOOLEAN DEFAULT 0,
  hard_copy_address TEXT,
  hard_copy_status TEXT CHECK (hard_copy_status IN ('requested', 'processing', 'shipped', 'delivered')) DEFAULT 'requested'
);

-- Lookups for admin management
CREATE TABLE states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE districts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  district_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE industries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE sectors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  industry_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1
);
