import pool from "../db.js";

//postgreSQL HEADS-UP

//whatever import syntax is to come here for postgreSQL

// // --- Create User ---
// // successful signup (business checks validated via service layer)
// // return TRUE if inserted, FALSE if failed
// export async function createUser(name, email, hashedPassword) {
//     // INSERT INTO users (name, email, password) VALUES (%s, %s, %s)
//     // If insert succeeds → return true
//     // If fails → return false
// }

// // First step of login
// // check if a user exists by email
// // return TRUE if exists, FALSE otherwise
// export async function findUserByEmail(email) {
//     // SELECT 1 FROM users WHERE email=%s
// }

// // Second step of login
// // return user's hashed password OR null if not found
// export async function getUserPasswordFromEmail(email) {
//     // SELECT password FROM users WHERE email=%s
// }

// // Fetch full user info by email
// // return full user object (id, name, email, role, timeZone)
// export async function getUserInfoFromEmail(email) {
//     // SELECT id, name, email, role, timezone FROM users WHERE email=%S
// }

// // Fetch full user info by ID
// // return full user object
// export async function getUserInfoFromId(id) {
//     // SELECT id, name, email, role, timezone FROM users WHERE id=%s
// }

// // Import the pool connection
// import pool from "../db.js";

// // --- Create User ---
// // successful signup (business checks validated via service layer)
// // return TRUE if inserted, FALSE if failed
// export async function createUser(name, email, hashedPassword, role = 'student', timeZone = 'UTC') {
//     try {
//         const [result] = await pool.execute(
//             `INSERT INTO `user` (user, email, password, role, timeZone) VALUES (?, ?, ?, ?, ?)`,
//             [name, email, hashedPassword, role, timeZone]
//         );
//         return result.affectedRows === 1; // TRUE if insert succeeded
//     } catch (err) {
//         console.error("Error in createUser:", err);
//         return false; // insert failed
//     }
// }


// FOR LOCALHOST TESTING
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

///the funsctions below are for approving/rejecting instructors
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
    updateStudentDetails
};
