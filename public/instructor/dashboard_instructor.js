// View all sessions feature
async function viewAllSessions(token) { 
  console.log("viewAllSessions called with token"); // 🔴 Called when fetching all sessions

  try {
    const res = await fetch("/instructor/all_sessions", {
      headers: { "Authorization": "Bearer " + token }
    });

    console.log("Fetching sessions from server"); // 🔴 Fetch request sent

    if (!res.ok) {
      console.error("Failed to fetch all sessions"); // 🔴 Server returned error
      return;
    }

    const data = await res.json(); // expect { sessions: [...] }
    console.log("All sessions fetched:", data.sessions); // 🔴 Sessions data received

    const ul = document.getElementById("allSessions");
    ul.innerHTML = ""; // 🔴 Clear previous list

    if (!data.sessions || data.sessions.length === 0) {
      ul.innerHTML = "<li>No sessions found.</li>";
      console.log("No sessions to display"); // 🔴 Nothing to display
      return;
    }

    data.sessions.forEach(s => {
      const li = document.createElement("li");
      
      // Parse UTC
      const utcDate = new Date(s.start_time); // 🔴 parse UTC from DB
      const utcStr = utcDate.toUTCString();   // 🔴 keep UTC output

      // Convert to user's browser timezone
      const localStr = utcDate.toLocaleString(undefined, {
        weekday: "short", month: "short", day: "numeric",
        year: "numeric",
        hour: "2-digit", minute: "2-digit",
        hour12: false
      }); // 🔴 browser timezone formatting

      li.textContent =
        `${s.description}
UTC: ${utcStr}
Local: ${localStr}
Student ID: ${s.student_id}
Duration: ${s.duration_minutes} mins
Status: ${s.status || "Pending"}`;

      ul.appendChild(li);
      console.log("🔴 Displayed session:", s.description); // 🔴 per-item debug
    });

  } catch (err) {
    console.error("🔴 Error fetching instructor sessions:", err); // 🔴
  }
}

// Load instructor dashboard
async function loadInstructorDashboard() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    console.log("No JWT token found, redirecting to login"); // 🔴 JWT check
    window.location.href = '/shared/login.html';
    return;
  }

  try {
    const res = await fetch('/dashboard', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log("Fetching dashboard info"); // 🔴 Fetch request sent

    if (!res.ok) {
      console.error("Failed to fetch dashboard info"); // 🔴 Server returned error
      return;
    }

    const data = await res.json();
    const user = data.user;
    console.log("User info received:", user); // 🔴 Dashboard data received

    document.getElementById('userInfo').textContent =
      `Welcome, ${user.name} | Role: ${user.role}`;

    if (user.status === "pending") {
      console.log("Instructor is pending, showing upload form"); // 🔴 User pending
      document.getElementById("pendingInstructorUpload").style.display = "block";
      setupUploadForm(token);
    } else if (user.status === "active") {
      console.log("Instructor is active, showing dashboard content"); // 🔴 User active
      document.getElementById("instructorContent").style.display = "block";
      // Optionally fetch approved sessions etc.
    }

    console.log("Triggering viewAllSessions"); // 🔴 Now fetching sessions
    await viewAllSessions(token);

  } catch (err) {
    console.error("Error loading instructor dashboard:", err); // 🔴 Network or parsing error
  }
}

// Setup upload form for pending instructors
function setupUploadForm(token) {
  const form = document.getElementById('uploadForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Upload form submitted"); // 🔴 Form submit triggered

    const formData = new FormData(form);

    try {
      const res = await fetch('/instructor/upload-profile', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });

      console.log("Uploading profile data"); // 🔴 Upload request sent

      const data = await res.json();

      if (!res.ok) {
        console.error("Upload failed:", data.error); // 🔴 Server error on upload
        document.getElementById('uploadMessage').textContent = data.error || "Upload failed";
        return;
      }

      console.log("Upload successful:", data.message); // 🔴 Server responded successfully
      document.getElementById('uploadMessage').textContent = data.message;

    } catch (err) {
      console.error("Error connecting to server:", err); // 🔴 Network error
      document.getElementById('uploadMessage').textContent = "Error connecting to server";
    }
  });
}

// Call the dashboard loader
console.log("Initializing instructor dashboard"); // 🔴 Script start
loadInstructorDashboard();
