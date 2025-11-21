import pool from "../db.js";

export async function fetchSchedule(){
    
    try{
        const[rows] = await pool.query(`SELECT * FROM Schedule`);
        console.log("Query executed: SELECT * FROM Schedule");
        console.log("Rows returned:", rows);   // Check if rows is empty
        return rows;
    } catch(err){
        console.error("Error in schedule: ", err);
        throw err;
    }
}