import { getStudentInfo, getStudentsDeptJoin } from "../services/studentService.js";

export async function getStudents(req, res) {
    try {
        const students = await getStudentInfo();
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching students");
    }
}

export async function getStudentsWithDepartment(req, res) {
    try {
        const data = await getStudentsDeptJoin();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching student department data");
    }
}
