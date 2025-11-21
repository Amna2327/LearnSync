import { fetchStudents, fetchStudentsWithDepartment } from "../databases/studentDatabase.js";

export async function getStudentInfo() {
    return await fetchStudents();
}

export async function getStudentsDeptJoin() {
    return await fetchStudentsWithDepartment();
}