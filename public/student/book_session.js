// -------------------- FILTER INSTRUCTORS --------------------
async function filterInstructors() {
    const subject_tags = document.getElementById("subject_tags").value;
    const time_zone = document.getElementById("time_zone").value; // now reading from select

    const response = await fetch("/instructor/filter", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("jwt")
        },
        body: JSON.stringify({ subject_tags, time_zone })
    });

    const data = await response.json();
    const resultsDiv = document.getElementById("filter-results");
    resultsDiv.innerHTML = "";

    if (!data.instructors || data.instructors.length === 0) {
        resultsDiv.innerHTML = "No instructors found.";
        return;
    }

    data.instructors.forEach(instr => {
        const div = document.createElement("div");

        // Use join(', ') for array fields
        const subjectTags = instr.subject_tags ? instr.subject_tags.join(', ') : 'None';
        const educationLevels = instr.education_level_tags ? instr.education_level_tags.join(', ') : 'None';
        const timeZone = instr.time_zone;

        div.innerHTML = `
            <p><b>${instr.name}</b></p>
            <p>Email: ${instr.email}</p>
            <p>Time Zone: ${timeZone}</p>
            <p>Subjects: ${subjectTags}</p>
            <p>Education Levels: ${educationLevels}</p>
            <button onclick="selectInstructor(${instr.id})">Select</button>
            <hr>
        `;
        resultsDiv.appendChild(div);
    });
}

// -------------------- SELECT INSTRUCTOR --------------------
function selectInstructor(id) {
    document.getElementById("selected_instructor").value = id;
    alert("Selected Instructor ID: " + id);
}

// -------------------- SUBMIT SESSION REQUEST --------------------
async function submitSession() {
    const desc = document.getElementById("session_desc").value;
    const instructor_id = document.getElementById("selected_instructor").value;
    const start_time = document.getElementById("start_time").value; // 🟥
    const duration_minutes = parseInt(document.getElementById("duration_minutes").value);


    if ( !desc || !instructor_id || !start_time || !duration_minutes) {
        alert("Fill all fields and select an instructor.");
        return;
    }

    const response = await fetch("/session/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("jwt")
        },
        body: JSON.stringify({ desc, instructor_id, start_time, duration_minutes })
    });

    const data = await response.json();

    if (data.success) {
        alert("Session request sent!");
    } else {
        alert("Failed to send request.");
    }
}

// -------------------- EVENT LISTENERS --------------------
document.getElementById("filter_btn").onclick = filterInstructors;
document.getElementById("submit_btn").onclick = submitSession;

// -------------------- LOAD TIMEZONES FROM JSON--------------------
document.addEventListener('DOMContentLoaded', async () => {
    const timeZoneSelect = document.getElementById('time_zone');

    try {
        const res = await fetch('../timezones.json');
        const timeZones = await res.json();

        timeZones.forEach(tz => {
            const option = document.createElement('option');
            option.value = tz.value;
            option.textContent = tz.label;
            timeZoneSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading time zones:', err);
        const option = document.createElement('option');
        option.value = 'UTC';
        option.textContent = 'UTC';
        timeZoneSelect.appendChild(option);
    }
});
