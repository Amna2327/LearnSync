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

// View all sessions feature
async function viewAllSessions() { 
  const user = await checkToken();
  if (!user) return;

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

    const user = await checkToken();
    if (!user) return;

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

    const user = await checkToken();
    if (!user) return;

    const formData = new FormData(form);

    try {
      const res = await fetch('/instructor/upload-profile', {
        method: 'POST',
        headers: {},
        credentials: "include",
        body: formData
      });

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
