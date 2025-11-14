document.getElementById("student_btn").addEventListener("click", async() => {
    try{
        const res = await fetch("/student");
        const data = await res.json();
        //document.getElementById("output").textContent = JSON.stringify(data, null, 2); //displays the json text in raw form
        renderTable(data, "student_tbl");
    } catch(err){
        console.error("Error fetching students:", err);
    }
});``

document.getElementById("schedule_btn").addEventListener("click", async()=> {
    try{
        const res = await fetch("/schedule");
        const data = await res.json();
        renderTable(data, "schedule_tbl");
    } catch(err){
        console.error("Error fetching schedule: ", err);
    }
});

document.getElementById("st-dept-btn").addEventListener("click", async()=>{
    try{
        const res = await fetch("/filter_studentdept");
        const data = await res.json();
        renderTable(data, "st_dept_tbl");
    } catch(err){
        console.error("Error fetching student department:", err);
    }
});

//creates table dynamically from info by id
function renderTable(data, tableId){
    const table = document.getElementById(tableId);
    table.innerHTML = "";

    if(!data.length){ //no data sent back from sql
        table.innerHTML = "<tr><td>No Records found</td></tr>";
        return ;
    }
    //creates header row
    const headerRow = document.createElement("tr");
    Object.keys(data[0]).forEach((key) => {
        const th = document.createElement("th");
        th.textContent = key;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    //create  data rows
    data.forEach((row) => {
        const tr = document.createElement("tr");
        Object.values(row).forEach((val) => {
            const td = document.createElement("td");
            td.textContent = val;
            tr.appendChild(td);
        });
    table.appendChild(tr);
    });
}