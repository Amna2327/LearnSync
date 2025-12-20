// checks if response from server is valid or not
async function checkToken() {
  try {
    const res = await fetch("/dashboard", {
      headers: {},
      credentials: "include"
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok && data.error === "Invalid or expired token") {
      alert("Session expired. Please log in again.");
      window.location.href = "/shared/login.html";
      return null; // token invalid → return null
    }

    // token valid → return user object
    return data.user; 
  } catch (err) {
    console.error("Token check failed:", err);
    alert("Server error. Please log in again.");
    window.location.href = "/shared/login.html";
    return null;
  }
}

// logout function
async function logout() {
  try {
    const res = await fetch("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    if (!res.ok) {
      alert("Failed to log out. Try again.");
      return;
    }

    // Redirect to login page
    window.location.href = "/shared/login.html";

  } catch (err) {
    console.error("Logout failed:", err);
    alert("Server error. Could not log out.");
  }
}

// Attach event listener to logout button
document.getElementById("logout-btn").addEventListener("click", logout);

// -------------------- FILTER INSTRUCTORS --------------------
async function filterInstructors() {
    const user = await checkToken();
    if (!user) return;
    
    const subject_tags = document.getElementById("subject_tags").value;
    const time_zone = document.getElementById("time_zone").value;

    const subjectsArray = subject_tags
        ? subject_tags.split(",").map(s => s.trim()).filter(Boolean)
        : [];

    const response = await fetch("/student/filter_instructor", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
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
        div.className = "instructor-card";

        const subjectTags = instr.subject_tags ? instr.subject_tags.join(", ") : "None";
        const educationLevels = instr.education_level_tags ? instr.education_level_tags.join(", ") : "None";
        const timeZone = instr.time_zone;

        let demoLinksHTML = "No demo material";
        if (instr.demo_material && instr.demo_material.length > 0) {
            demoLinksHTML = instr.demo_material.map(url =>
                `<a href="${url}" target="_blank" download>${url.split("/").pop()}</a>`
            ).join(" | ");
        }

        div.innerHTML = `
        <p><b>${instr.name}</b></p>
        <p>Email: ${instr.email}</p>
        <p>Time Zone: ${timeZone}</p>
        <p>Subjects: ${subjectTags}</p>
        <p>Education Levels: ${educationLevels}</p>
        <p>Demo Material: ${demoLinksHTML}</p>
        <button class="btn btn-primary" onclick="selectInstructor(${instr.id}, this)">Select</button>
    `;
        resultsDiv.appendChild(div);
    });


}

// -------------------- SELECT INSTRUCTOR --------------------
function selectInstructor(id, buttonElement) {
    document.getElementById("selected_instructor").value = id;
    
    // Remove selected class from all instructor cards
    document.querySelectorAll('.instructor-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to the clicked card
    buttonElement.closest('.instructor-card').classList.add('selected');
    
    // Enable submit button
    document.getElementById("submit_btn").disabled = false;
}

// -------------------- SUBMIT SESSION REQUEST --------------------
async function submitSession() {
    const user = await checkToken();
    if (!user) return;
    
    const desc = document.getElementById("session_desc").value;
    const instructor_id = document.getElementById("selected_instructor").value;
    const start_time = document.getElementById("start_time").value;
    const duration_minutes = parseInt(document.getElementById("duration_minutes").value);

    if (!desc || !instructor_id || !start_time || !duration_minutes) {
        alert("Fill all fields and select an instructor.");
        return;
    }

    const response = await fetch("/session/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
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

// -------------------- LOAD TIMEZONES AND DURATIONS --------------------
document.addEventListener("DOMContentLoaded", async () => {
    // Load timezones (editable dropdown)
    const timeZoneInput = document.getElementById("time_zone");
    const timeZoneDatalist = document.createElement("datalist");
    timeZoneDatalist.id = "time_zone_list";
    timeZoneInput.setAttribute("list", "time_zone_list");
    timeZoneInput.setAttribute("placeholder", "Type or select timezone");
    timeZoneInput.parentElement.appendChild(timeZoneDatalist);
    
    try {
        const res = await fetch("../timezones.json");
        const timeZones = await res.json();
        timeZones.forEach(tz => {
            const option = document.createElement("option");
            option.value = tz.value;
            option.textContent = tz.label;
            timeZoneDatalist.appendChild(option);
        });
    } catch (err) {
        console.error("Error loading time zones:", err);
        const option = document.createElement("option");
        option.value = "UTC";
        option.textContent = "UTC";
        timeZoneDatalist.appendChild(option);
    }
    
    // Load subject suggestions (editable dropdown)
    try {
        const { subjects } = await import('../shared/options.js');
        const subjectInput = document.getElementById("subject_tags");
        const subjectDatalist = document.getElementById("subject_tags_list");
        
        if (subjectInput && subjectDatalist) {
            subjects.forEach(subject => {
                const option = document.createElement("option");
                option.value = subject;
                subjectDatalist.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Error loading subjects:", err);
    }
    
    // Load duration options (editable dropdown)
    try {
        const { sessionDurations } = await import('../shared/options.js');
        const durationInput = document.getElementById("duration_minutes");
        const durationDatalist = document.getElementById("duration_list");
        
        if (durationInput && durationDatalist) {
            sessionDurations.forEach(duration => {
                const option = document.createElement("option");
                option.value = duration.value;
                option.textContent = duration.label;
                durationDatalist.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Error loading durations:", err);
    }
});
