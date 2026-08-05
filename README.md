<<<<<<< HEAD
Setup Installation Codes :

        node install 

Run
        
        npm run dev

**Updates

** Merged zoom meeting integration and Cookie-parser code. 
- Added duration_minutes and Payment Amount fields in session objects for frontend display (FORNEND FORMATTING NEEDED)
- Impemented roleMiddleware along with HTTP-Only Cookies
- Ensured Frontend displays error message if session cookie expires
- Added logout button for all roles

**Authentication Flow:**

Client → HTTP-only Cookie → cookie-parser → verifyToken → verify Role → redirect to controller function (Browser stores JWT in httpOnly cookie) → fetch(..., credentials: "include") → cookie-parser → req  → cookies.token → verifyToken → req.user → verifyRole(user.role)

**MUST ADD**
- Student payment Decision: Student should be able to Cancel Payment 

**FUTURE FEATURES**

- Admin Panel Features (manage users, sessions, review flags)
- View instructor/student page
- Meeting Integration (one-on-one and group sessions)
- Search & Filtering (classes, instructors, sessions)
- View Instructor Page (profile, ratings, availability)
- Broadcast Info Page (schedule, join links, notifications)
- Reporting and Flagging for instructors/students
=======
# FUNCTIONAL FEATURES

### - Backend Additions
Added MiddleWare for JWT handling

.env file has necessary JWT tokenization info 

Uses JWT tokens for preservation of logged-in user's info

Password hashing done using bcrypt 

- Landing page: buttons for login and signup
- Signup: password strength check, Timezone and role selection (instructor/student)
- Login: (email and password) Dashboard page loaded after logging in

Installation Codes: 

    npm install luxon, jsonwebtoken, cookie-parser

# FUTURE FEATURES:

- Admin Panel Features (manage users, sessions)
- View instructor/student page
- Session creation and broadcast info page
- Meeting Integration (one-on-one and group sessions)
- Search & Filtering (classes, instructors, sessions)
- View Instructor Page (profile, ratings, availability)
- Session Creation & Broadcast Info Page (schedule, join links, notifications)
- User Profile Management (to update profile, subjects, password, time zone, preferences)
- Reporting and Flagging for instructors/students
>>>>>>> e99e056df746f80320bd9cd41d3b5ff2896d736c
