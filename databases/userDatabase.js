import pool from "../db.js";

async function createUser(name, email, hashedPassword, role = 'student', timeZone = 'UTC') {
    try {
        const status = role === "instructor" ? "pending" : "active";

        const result = await pool.query(
            "INSERT INTO users (name, email, password_hash, role, time_zone, status) VALUES ($1, $2, $3, $4, $5, $6)",
            [name, email, hashedPassword, role, timeZone, status]
        );

        return result.rowCount === 1; // TRUE if insert succeeded

    } catch (err) {
        console.error("Error in createUser:", err);
        return false;
    }
}

// Check if a user exists by email
async function findUserByEmail(email) {
    try {
        const { rows } = await pool.query(
            "SELECT 1 FROM users WHERE email = $1 LIMIT 1",
            [email]
        );
        return rows.length > 0;
    } catch (err) {
        console.error("Error in findUserByEmail:", err);
        return false;
    }
}

// Get user's hashed password by email
async function getUserPasswordFromEmail(email) {
    try {
        const { rows } = await pool.query(
            "SELECT password_hash FROM users WHERE email = $1",
            [email]
        );
        if (rows.length === 0) return null;
        return rows[0].password_hash;
    } catch (err) {
        console.error("Error in getUserPasswordFromEmail:", err);
        return null;
    }
}

// Fetch full user info by email
async function getUserInfoFromEmail(email) {
    try {
        const { rows } = await pool.query(
            "SELECT id, name, email, role, time_zone, status FROM users WHERE email = $1",
            [email]
        );
        if (rows.length === 0) return null;
        return rows[0];
    } catch (err) {
        console.error("Error in getUserInfoFromEmail:", err);
        return null;
    }
}

// Fetch full user info by ID
async function getUserInfoFromId(id) {
    try {
        const { rows } = await pool.query(
            "SELECT id, name, email, role, time_zone, status FROM users WHERE id = $1",
            [id]
        );
        if (rows.length === 0) return null;
        return rows[0];
    } catch (err) {
        console.error("Error in getUserInfoFromId:", err);
        return null;
    }
}

///the functions below are for approving/rejecting instructors
//used by adminController and adminService

// Get all pending instructors
async function getPendingInstructors() {
    const result = await pool.query(
        "SELECT id, name, email, time_zone, status FROM users WHERE role = 'instructor' AND status = 'pending'"
    );
    return result.rows;
}

// Update instructor status to 'active'
async function approveInstructorById(id) {
    const result = await pool.query(
        "UPDATE users SET status = 'active' WHERE id = $1 RETURNING *",
        [id]
    );
    return result.rows[0];
}

// Update instructor status to 'rejected'
async function rejectInstructorById(id) {
    const result = await pool.query(
        "UPDATE users SET status = 'rejected' WHERE id = $1 RETURNING *",
        [id]
    );
    return result.rows[0];
}

// Instructor Details Management

async function getInstructorDetails(instructorId) {
    const { rows } = await pool.query(
        "SELECT * FROM instructor_details WHERE instructor_id = $1",
        [instructorId]
    );
    return rows[0] || null;
}

async function insertInstructorDetails(
    instructorId,
    certifications,
    demoMaterials,
    subjectTags = [],
    educationLevels = []
) {
    return pool.query(
        `INSERT INTO instructor_details
        (instructor_id, certifications, demo_material, subject_tags, education_level_tags)
        VALUES ($1, $2, $3, $4, $5)`,
        [instructorId, certifications, demoMaterials, subjectTags, educationLevels]
    );
}

async function updateInstructorDetails(
    instructorId,
    certifications,
    demoMaterials,
    subjectTags = [],
    educationLevels = []
) {
    return pool.query(
        `UPDATE instructor_details
         SET certifications = $1,
             demo_material = $2,
             subject_tags = $3,
             education_level_tags = $4,
             updated_at = now()
         WHERE instructor_id = $5`,
         [certifications, demoMaterials, subjectTags, educationLevels, instructorId]
        );
    }
    
    
    // Fetch student details
    async function getStudentDetails(studentId) {
        const { rows } = await pool.query(
        "SELECT * FROM student_details WHERE student_id = $1",
        [studentId]
    );
    
    const data = rows[0] || null;
    
    if (data && typeof data.subject_tags === "string") {
        data.subject_tags = JSON.parse(data.subject_tags);
    }
    
    return data;
}


// Insert new student details (after signup)
async function insertStudentDetails(studentId, educationLevel = null, subjectTags = []) {
    return pool.query(
        "INSERT INTO student_details (student_id, education_level, subject_tags) VALUES ($1, $2, $3)",
        [studentId, educationLevel, subjectTags]
    );
}

// Update student details
async function updateStudentDetails(studentId, educationLevel, subjectTags) {
    return pool.query(
        `UPDATE student_details
        SET education_level = $1,
        subject_tags = $2,
        updated_at = now()
        WHERE student_id = $3`,
        [educationLevel, subjectTags, studentId]
    );
}
async function getInstructorsByTags(subjectTags = [], time_zone = "") {
    const noTimezone = !time_zone || time_zone.trim() === "";
    const noSubjects = !subjectTags || subjectTags.length === 0;

    console.log("DB - getInstructorsByTags called with:", { time_zone, subjectTags });
    
    // Case 1: No filters
    if (noTimezone && noSubjects) {
        return pool.query(
            `SELECT u.id, u.name, u.email, u.time_zone, in_d.subject_tags, in_d.education_level_tags,in_d.demo_material
            FROM users u
            JOIN instructor_details in_d ON u.id = in_d.instructor_id
            WHERE u.role = 'instructor' AND u.status = 'active'
            LIMIT 15`
        );
    }
    
    // Case 2: Only timezone
    if (!noTimezone && noSubjects) {
        return pool.query(
            `SELECT u.id, u.name, u.email, u.time_zone, in_d.subject_tags, in_d.education_level_tags,in_d.demo_material
             FROM users u
             JOIN instructor_details in_d ON u.id = in_d.instructor_id
             WHERE u.role = 'instructor' AND u.status = 'active'
             AND u.time_zone = $1`,
             [time_zone]
            );
        }
        
        // Case 3: Only subject tags
        if (noTimezone && !noSubjects) {
            return pool.query(
            `SELECT u.id, u.name, u.email, u.time_zone, in_d.subject_tags, in_d.education_level_tags,in_d.demo_material
            FROM users u
            JOIN instructor_details in_d ON u.id = in_d.instructor_id
            WHERE u.role = 'instructor' AND u.status = 'active'
            AND in_d.subject_tags && $1::text[]`,
            [subjectTags]
        );
    }
    
    // Case 4: Both filters
    return pool.query(
        `SELECT u.id, u.name, u.email, u.time_zone, in_d.subject_tags, in_d.education_level_tags,in_d.demo_material
        FROM users u
         JOIN instructor_details in_d ON u.id = in_d.instructor_id
         WHERE u.role = 'instructor' AND u.status = 'active'
         AND u.time_zone = $1
         AND in_d.subject_tags && $2::text[]`,
         [time_zone, subjectTags]
        );
    }
    
async function getStudentSessions(userId) {
    const { rows } = await pool.query(
        `SELECT 
        s.session_id,
            s.description,
            s.student_id,
            s.instructor_id,
            s.start_time::text AS start_time, -- get as string
            s.duration_minutes,
            s.status,
            p.status AS payment_status,
            m.link AS meeting_link
            FROM sessions s
            LEFT JOIN payments p
            ON p.session_id = s.session_id
            LEFT JOIN meetings m
            ON m.session_id = s.session_id
            WHERE s.student_id = $1`,
            [userId]
        );
        return rows;
    }
    
    async function getInstructorSessions(userId) {
        const { rows } = await pool.query(
        `SELECT 
        s.session_id,
        s.description,
        s.student_id,
        s.instructor_id,
        s.start_time::text AS start_time,
        s.duration_minutes,
        s.status,
            p.status AS payment_status,
            m.link AS meeting_link
         FROM sessions s
         LEFT JOIN payments p
           ON p.session_id = s.session_id
         LEFT JOIN meetings m
           ON m.session_id = s.session_id
           WHERE s.instructor_id = $1`,
           [userId]
        );
        return rows;
    }
    
    
    
    // ============================
    // PAY NOW / TRANSACTION HELPERS
    // ============================
    
    // Get a session by ID
    async function getSessionById(client, sessionId) {
        const { rows } = await client.query(
            `SELECT s.session_id, s.student_id, s.instructor_id, s.status,
            start_time::text AS start_time, s.duration_minutes, s.description
            FROM sessions s
            WHERE s.session_id = $1`,
        [sessionId]
    );
    return rows[0] || null;
}

// Get pending payment for a session
async function getPendingPaymentBySession(client, sessionId) {
    const { rows } = await client.query(
        `SELECT * FROM payments
        WHERE session_id = $1 AND status IN ('pending', 'failed')`,
        [sessionId]
    );
    return rows[0] || null;
}

// Update payment status
async function updatePaymentStatus(client, transactionId, newStatus) {
    const { rows } = await client.query(
        `UPDATE payments
        SET status = $1
        WHERE transaction_id = $2
         RETURNING *`,
         [newStatus, transactionId]
        );
        return rows[0] || null;
    }

    
// Get a free Zoom account (mock for now)
async function getOverlappingMeetings(zoomAccountId, startTime, durationMinutes) {
    const { rows } = await pool.query(
        `
        SELECT m.meeting_id, s.session_id, s.start_time, s.duration_minutes
        FROM meetings m
        JOIN sessions s
        ON s.session_id = m.session_id
        WHERE m.zoom_account_id = $1
        AND NOT (
            $2::timestamp + ($3 || ' minutes')::interval <= s.start_time
            OR
            $2 >= s.start_time + (s.duration_minutes || ' minutes')::interval
            )
        `,
        [zoomAccountId, startTime, durationMinutes]
    );
    return rows; // if empty, no overlaps
}


// Insert a meeting
async function insertMeeting(client, { zoom_account_id, link }, session_id) {
    const { rows } = await client.query(
        `INSERT INTO meetings (session_id, zoom_account_id, link)
        VALUES ($1, $2, $3)
         RETURNING *`,
        [session_id, zoom_account_id, link]
    );
    return rows[0] || null;
}

// Update session status
async function updateSessionStatus(client, sessionId, newStatus) {
    const { rows } = await client.query(
        `UPDATE sessions
         SET status = $1
         WHERE session_id = $2
         RETURNING *`,
        [newStatus, sessionId]
    );
    return rows[0] || null;
}

export {
    createUser,
    findUserByEmail,
    getUserPasswordFromEmail,
    getUserInfoFromEmail,
    getUserInfoFromId,
    getPendingInstructors,
    approveInstructorById,
    rejectInstructorById,
    getInstructorDetails,
    insertInstructorDetails,
    updateInstructorDetails,
    getStudentDetails,
    insertStudentDetails,
    updateStudentDetails,
    
    getInstructorsByTags,
    getStudentSessions,
    getInstructorSessions,
    getSessionById,
    getPendingPaymentBySession,
    updatePaymentStatus,
    insertMeeting,
    updateSessionStatus,
    getOverlappingMeetings
};
