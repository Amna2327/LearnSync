import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import studentRoutes from "./routes/studentRoute.js";
import scheduleRoutes from "./routes/scheduleRoute.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Get correct directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static assets
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/student", studentRoutes);
app.use("/schedule", scheduleRoutes);

app.get("/", (req, res) => {
    res.send("LearnSync API is running.");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// import dotenv from "dotenv";
// import path from "path";
// dotenv.config()
// import express from "express";
// import { fileURLToPath } from "url";
// import {get_student_info} from "./services/studentService.js";


// dotenv.config(); //ensures it can read .env file
// const app = express()
// const PORT = process.env.PORT || 3000; //for the port number allocated by learnOBots
// app.use(express.json()); //parses json requests

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename); //saves the directory path


// app.use(express.static(path.join(__dirname, "public"))); //accesses all files from public folder

// app.get('/', (req, res) => { //will be used as landing page
//     res.send("Crud is going ay. Greetings from node API. This is not a drill");
// });

// app.get("/student", async (req,res)=>{
//     try{
//         const students = await get_student_info();
//         res.json(students); 
//     } catch(err){
//         console.error(err);
//         res.status(500).send("Error fetching Student Data");
//     }
// });

// app.get("/schedule", async (req,res)=>{
//     try{
//         const[rows] = await pool.query("SELECT * FROM Schedule");
//         res.json(rows);
//     } catch(err){
//         console.error(err);
//         res.status(500).send("Error fetching Schedule");
//     }
// });
// app.get("/filter_studentdept", async (req, res)=>{
//     try{
//         const[rows] = await pool.query("SELECT * FROM Department;");
//         res.json(rows);
//     } catch(err){
//         console.error(err);
//         res.status(500).send("Error fetching student department info");
//     }
// })
// //need to install nodemon in the global setting and link its path to environment varaibles.
// app.listen(PORT, ()=>{
//     console.log(`Server is running at port:  ${PORT} srailway man wooooo`);
// });


// console.log("DB_HOST:", process.env.DB_HOST);
// console.log("DB_USER:", process.env.DB_USER);
// console.log("DB_PASS:", process.env.DB_PASS ? "****" : "undefined");
// console.log("DB_NAME:", process.env.DB_NAME);
// console.log("DB_PORT:", process.env.DB_PORT);