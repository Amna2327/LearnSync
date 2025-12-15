// View all sessions feature
async function viewAllSessions() { 
  console.log("viewAllSessions called with cookie"); // 🔴 Called when fetching all sessions

  try {
    const res = await fetch("/instructor/all_sessions", {
      headers: {},
      credentials: "include"
    });
    
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
      
      console.log("Raw start_time from API:", s.start_time);
      console.log("Backend Converted local time:", s.local_start_time);
      
      li.textContent =
        `${s.description} | 
        UTC: ${new Date(s.start_time).toUTCString()} | 
        Local: ${s.local_start_time} | 
        Duration: ${s.duration_minutes} mins | 
        Student ID: ${s.student_id} | 
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

  try {
    const res = await fetch('/dashboard', {
      headers: {},
      credentials: "include" 
    });
    console.log("Fetching dashboard info"); // 🔴 Fetch request sent

    if (!res.ok) {
      console.error("Failed to fetch dashboard info"); // 🔴 Server returned error
      return;
    }
 
    const data = await res.json();
    const user = data.user;
    console.log("User info received:", user); // 🔴 Dashboard data received

    // HARD ROLE CHECK — REQUIRED
    if (user.role !== "instructor") {
      console.warn("❌ Non-instructor detected on instructor dashboard:", user.role);
      alert("Session changed. Please log in as an instructor.");
      window.location.href = "/shared/login.html";
      return; // STOP EVERYTHING AND DISPLAY WARNING MESSAGE (FOR XSS), redirect to login
    }

    document.getElementById('userInfo').textContent =
      `Welcome, ${user.name} | Role: ${user.role}`;

    if (user.status === "pending") {
      console.log("Instructor is pending, showing upload form"); // 🔴 User pending
      document.getElementById("pendingInstructorUpload").style.display = "block";
      setupUploadForm();
    } else if (user.status === "active") {
      console.log("Instructor is active, showing dashboard content"); // 🔴 User active
      document.getElementById("instructorContent").style.display = "block";
    }

    console.log("Triggering viewAllSessions"); // 🔴 Now fetching sessions
    await viewAllSessions();

  } catch (err) {
    console.error("Error loading instructor dashboard:", err); // 🔴 Network or parsing error
  }
}

// Setup upload form for pending instructors
function setupUploadForm() {
  const form = document.getElementById('uploadForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Upload form submitted"); // 🔴 Form submit triggered

    const formData = new FormData(form);

    try {
      const res = await fetch('/instructor/upload-profile', {
        method: 'POST',
        headers: {},
        credentials: "include",
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
