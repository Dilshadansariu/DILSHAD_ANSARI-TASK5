-- schema.sql
-- run this once to create all tables needed for the app

-- drop old tables if re-running (only for dev, be careful in prod)
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS users;

-- users table (both students and professors/admins go here, role field decides)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student', -- 'student' or 'admin'
  created_at TIMESTAMP DEFAULT NOW()
);

-- groups created by students
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- who is in which group
CREATE TABLE group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);

-- assignments posted by professors
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATE,
  onedrive_link TEXT,
  assigned_to VARCHAR(20) DEFAULT 'all', -- 'all' or 'specific'
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- if assignment is for specific groups only
CREATE TABLE assignment_groups (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE
);

-- submission status per group per assignment
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' or 'submitted'
  confirmed_by INTEGER REFERENCES users(id),
  submitted_at TIMESTAMP,
  UNIQUE(assignment_id, group_id)
);
