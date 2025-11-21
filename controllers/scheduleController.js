import { getScheduleInfo } from "../services/scheduleService.js";

export async function getSchedule(req, res){
    try{
        const schedule = await getScheduleInfo();
        res.json(schedule);
    }catch(err){
        console.error(err);
        res.status(500).send("Error fetching students");
    }
}