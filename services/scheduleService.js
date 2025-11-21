import { fetchSchedule } from "../databases/scheduleDatabase.js"

export async function getScheduleInfo(){
    return await fetchSchedule();
}