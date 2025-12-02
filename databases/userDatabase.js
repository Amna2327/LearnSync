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
export async function createUser(name, email, hashedPassword, role = 'student', timeZone = 'UTC') {
    try {
        const [result] = await pool.execute(
            "INSERT INTO `user` (name, email, password, role, timeZone) VALUES (?, ?, ?, ?, ?)",
            [name, email, hashedPassword, role, timeZone]
        ); //auto increment id done in DBMS
        return result.affectedRows === 1; // TRUE if insert succeeded
    } catch (err) {
        console.log("Error creating user");
        console.error("Error in createUser:", err);
        return false; // insert failed
    }
}
// First step of login
// check if a user exists by email
// return TRUE if exists, FALSE otherwise
export async function findUserByEmail(email) {
    try {
        const [rows] = await pool.execute(
            "SELECT 1 FROM `user` WHERE email = ? LIMIT 1",
            [email]
        );
        return rows.length > 0;
    } catch (err) {
        console.log("");
        console.error("Error in findUserByEmail:", err);
        return false;
    }
}

// Second step of login
// return user's hashed password OR null if not found
export async function getUserPasswordFromEmail(email) {
    try {
        const [rows] = await pool.execute(
            "SELECT password FROM `user` WHERE email = ?",
            [email]
        );
        if (rows.length === 0) return null;
        return rows[0].password;
    } catch (err) {
        console.error("Error in getUserPasswordFromEmail:", err);
        return null;
    }
}

// Fetch full user info by email
// return full user object (id, user, email, role, timeZone)
export async function getUserInfoFromEmail(email) {
    try {
        const [rows] = await pool.execute(
            "SELECT id, name, email, role, timeZone FROM `user` WHERE email = ?",
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
// return full user object
export async function getUserInfoFromId(id) {
    try {
        const [rows] = await pool.execute(
            "SELECT id, name, email, role, timeZone FROM `user` WHERE id = ?",
            [id]
        );
        if (rows.length === 0) return null;
        return rows[0];
    } catch (err) {
        console.error("Error in getUserInfoFromId:", err);
        return null;
    }
}
