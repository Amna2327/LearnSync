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
