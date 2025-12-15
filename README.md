Setup Installation Codes :

- node install 

**Updates**

- Added roleMiddleware to keep track of roles
- Added cookies with role checks to protect against Cross Site Scripting
- Fixed Frontend for local time display 

**Additions:**

- added nodemon for quick restart (runs server automatically for each update in the code, no manual restart required after every change)

        Manual Runs: npm start
        Nodemon: npm run dev 

- [STUDENT] create session page with instructor filtering (session request sent to a specific instructor, no broadcast features implemented)
- creation of sessions by students with status 'pending'

- [DATABASE] added foreign keys student_id and instructor_id in session table

- [STUDENT, INSTRUCTOR] display all sessions with local time zone conversion in respective dashboards
- Added timezones.json for modularity

# MUST ADD:
- Instructor Session Decision: Instructor should be able to Accept or Reject session

# FUTURE FEATURES:

- Admin Panel Features (manage users, sessions, review flags)
- View instructor/student page
- Meeting Integration (one-on-one and group sessions)
- Search & Filtering (classes, instructors, sessions)
- View Instructor Page (profile, ratings, availability)
- Broadcast Info Page (schedule, join links, notifications)
- Reporting and Flagging for instructors/students

**Authentication Flow:**

Client → HTTP-only Cookie → cookie-parser → verifyToken -> veify Role -> redirect to controller function (Browser stores JWT in httpOnly cookie)

↓

fetch(..., credentials: "include")

↓

cookie-parser → req.cookies.token

↓

verifyToken → req.user

↓

verifyRole(student)