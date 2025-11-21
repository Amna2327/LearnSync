import pool from "../db.js";

// Get only students
export async function fetchStudents() {
    const [rows] = await pool.query(`SELECT * FROM Student`);
    return rows;
}

// JOIN Students with Department
export async function fetchStudentsWithDepartment() {
    const [rows] = await pool.query(`SELECT s.StudentID, s.Name, s.Major, d.DeptName FROM Student s JOIN Department d ON s.DeptID = d.DeptID;`);
    return rows;
}
