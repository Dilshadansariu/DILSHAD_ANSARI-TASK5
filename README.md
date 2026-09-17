# Joineazy - Student, Group & Assignment Management System

This is my submission for Task 1 (Full Stack Intern assignment).

The idea is simple: students form their own groups, professors post assignments
with a OneDrive link, and students confirm once they've uploaded their work there.
Professors can then see who submitted and who didn't, group-wise.

## Tech Stack

- **Frontend:** React.js, Tailwind CSS, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Auth:** JWT (JSON Web Tokens)
- **Containerization:** Docker + docker-compose

## Folder Structure

```
joineazy-task1/
├── backend/
│   ├── routes/          (auth, groups, assignments, submissions)
│   ├── middleware/       (jwt auth + role check)
│   ├── db.js
│   ├── schema.sql
│   ├── server.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/        (Login, Register, StudentDashboard, AdminDashboard)
│   │   ├── components/   (Navbar, GroupManagement, StudentAssignments, ProgressBar)
│   │   ├── context/      (AuthContext for login state)
│   │   └── api/          (axios instance)
│   └── Dockerfile
└── docker-compose.yml
```

## How to Run (Docker way - easiest)

1. Make sure Docker Desktop is installed and running.
2. From the root folder, run:
   ```
   docker-compose up --build
   ```
3. Frontend will be up at `http://localhost:3000`
4. Backend API will be up at `http://localhost:5000`
5. Postgres runs on port 5432 (the schema.sql runs automatically on first startup)

## How to Run (manual way, without Docker)

**Backend:**
```
cd backend
npm install
cp .env.example .env      # then edit the DB values if needed
# create the database in postgres manually first, then run schema.sql on it
npm run dev
```

**Frontend:**
```
cd frontend
npm install
npm start
```

Make sure Postgres is running locally and the `.env` values match your setup.
Also update `baseURL` in `frontend/src/api/api.js` if backend is on a different URL.

## Test accounts

Just register two accounts via the `/register` page - one with role "Student"
and one with role "Professor / Admin". There's no separate seed data, you create
your own accounts when you run it.

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user (student/admin) |
| POST | /api/auth/login | Login, returns JWT token |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/groups/create | Student creates a group |
| POST | /api/groups/:groupId/add-member | Add member by email |
| GET | /api/groups/my-group | Get logged in student's group + members |
| GET | /api/groups/all | Admin: list all groups |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/assignments/create | Admin creates assignment |
| PUT | /api/assignments/:id | Admin edits assignment |
| GET | /api/assignments | Get all assignments (student + admin) |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/submissions/:assignmentId/confirm | Student confirms submission for their group |
| GET | /api/submissions/my-group-status | Student's group progress + status list |
| GET | /api/submissions/all | Admin: all submissions + analytics |

All routes except register/login need `Authorization: Bearer <token>` header.

## Database Schema (ER Diagram)

```
users                     groups
------                    ------
id (PK)                   id (PK)
name                      name
email (unique)            created_by (FK -> users.id)
password (hashed)         created_at
role (student/admin)
created_at

group_members                    assignments
--------------                   -----------
id (PK)                          id (PK)
group_id (FK -> groups.id)       title
student_id (FK -> users.id)      description
joined_at                        due_date
                                  onedrive_link
                                  assigned_to (all/specific)
                                  created_by (FK -> users.id)
                                  created_at

assignment_groups                     submissions
------------------                    -----------
id (PK)                               id (PK)
assignment_id (FK)                    assignment_id (FK -> assignments.id)
group_id (FK)                         group_id (FK -> groups.id)
                                       status (pending/submitted)
                                       confirmed_by (FK -> users.id)
                                       submitted_at
```

**Relationships:**
- One user can create many groups (but currently UI supports 1 group per student for simplicity)
- A group has many members (many-to-many between users and groups via group_members)
- An assignment is created by one admin, and can target all groups or specific groups
  (assignment_groups table handles the specific case)
- A submission row is created per (assignment, group) pair - this is what gets
  updated to "submitted" when a student confirms

## Architecture Overview

It's a pretty standard 3-tier setup:

```
[React Frontend] <--- Axios/REST ---> [Express Backend] <---> [PostgreSQL]
```

- Frontend talks to backend only through REST APIs (no direct DB access obviously)
- Backend handles all business logic - auth, role checks, creating submission
  records automatically when an assignment is posted, calculating progress %, etc.
- JWT token is stored in localStorage on the frontend and sent with every
  request via an axios interceptor
- Role-based access is handled with middleware (`verifyToken`, `isAdmin`, `isStudent`)
  on the backend, and `ProtectedRoute` component on the frontend

## Key Design Decisions

- **One group per student (for now):** To keep things simple for this task, I
  assumed a student is only in one group at a time. The DB structure (many-to-many)
  can support multiple groups later without much change, just the frontend query
  currently does `LIMIT 1`.
- **Submission rows created upfront:** When an admin creates an assignment, I
  immediately create a "pending" submission row for every relevant group. This
  made it much easier to calculate progress % and show pending/submitted status,
  instead of calculating it on the fly every time.
- **Two-step confirm:** Handled entirely on the frontend with a bit of state
  (`confirmingId`) - first click just reveals a "Yes, confirm" button, second
  click actually calls the API. Didn't feel like this needed a backend change.
- **JWT over sessions:** Went with JWT since it's stateless and easier to test
  with Postman/Thunder Client during development, and works well since frontend
  and backend are separate apps.
- **Docker:** Added docker-compose so the whole thing (db + backend + frontend)
  can be spun up with one command, without anyone needing to install Postgres
  locally.

## What I'd improve with more time

- Multiple groups per student
- Email notifications when a new assignment is posted
- Nicer charts for admin analytics (currently just summary counts + a table)
- Proper form validation messages instead of relying on basic `required` fields
- Tests (didn't get to write any given the deadline, being honest here)

## Notes

Built this solo within the given timeline. Tried to keep the code simple and
readable rather than over-engineering it — happy to walk through any part of
it and explain the choices during the interview.
