// public/student/dashboard_student.js

// view all sessions, display converted local time zone instead of utc from database
async function viewAllSessions() { 
  console.log("viewAllSessions called");

  try {
    const res = await fetch("/student/all_sessions", {
      headers: {},
      credentials: "include" 
    });

    if (!res.ok) {
      console.error("Failed to fetch all sessions");
      return;
    }

    const data = await res.json();
    console.log("All sessions fetched:", data.sessions); // 🔴 Sessions data received
    
    const ul = document.getElementById("allSessions");
    ul.innerHTML = "";

    if (!data.sessions || data.sessions.length === 0) {
      ul.innerHTML = "<li>No sessions found.</li>";
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
        Instructor ID: ${s.instructor_id} | 
        Status: ${s.status || 'Pending'}`;

      ul.appendChild(li);
      console.log("🔴 Displayed session:", s.description); // 🔴 per-item debug
    });

  } catch (err) {
    console.error("Error fetching sessions:", err);
  }
}

async function loadDashboard() {

  try {
    // Fetch basic user info
    const dashRes = await fetch("/dashboard", {
      headers: {},
      credentials: "include" 
    });

    if (!dashRes.ok) {
      const err = await dashRes.json().catch(() => ({}));
      alert(err.error || "Access denied");
      if (err.error === "Invalid or expired token")
        window.location.href = "/shared/login.html";
      return;
    }

    const dashData = await dashRes.json();
    const user = dashData.user;
    console.log("Got User ", user);

     // HARD ROLE CHECK — REQUIRED
    if (user.role !== "student") {
      console.warn("❌ Non-student detected on student dashboard:", user.role);
      alert("Session changed. Please log in as an instructor.");
      window.location.href = "/shared/login.html";
      return; // STOP EVERYTHING AND DISPLAY WARNING MESSAGE (FOR XSS)
    }

    document.getElementById("userInfo").textContent =
      `Welcome, ${user.name} | Role: ${user.role}`;

    // Hide both initially
    document.getElementById("studentContent").style.display = "none";
    document.getElementById("studentProfileForm").style.display = "none";

    // Load student profile
    const res = await fetch("/student/details", {
      headers: {},
      credentials: "include"
    });

    if (!res.ok) {
      console.error("Failed to fetch student details");
      document.getElementById("studentContent").style.display = "block";
      return;
    }

    const details = await res.json(); // { exists, profile }

    // FIRST TIME LOGIN → SHOW FORM
    if (!details.exists) {
      document.getElementById("studentProfileForm").style.display = "block";
      setupProfileForm();
      return;
    }

    // PROFILE EXISTS
    const profile = details.profile;

    document.getElementById("studentContent").style.display = "block";
    renderUpcomingSessions(profile.upcomingSessions || []);

    //setup sesssion booking button
    setupBookSessionButton();
    
    // Enable update button
    enableProfileEditing(profile);

    // Trigger fetching all sessions from server
    console.log("Triggering viewAllSessions now...");
    await viewAllSessions();
    
  } catch (err) {
    console.error("Error loading dashboard:", err);
  }
}

// Render upcoming sessions
function renderUpcomingSessions(sessions) {
  const ul = document.getElementById("allSessions");
  ul.innerHTML = "";

  if (!sessions || sessions.length === 0) {
    ul.innerHTML = "<li>No sessions yet.</li>";
    return;
  }

  sessions.forEach(s => {
    const li = document.createElement("li");
    li.textContent = `${s.description} - UTC:${s.start_time} - LOCAL:${s.local_start_time} - ${s.duration_minutes} mins - ${s.instructor_id} - Status: ${s.status}`;
    ul.appendChild(li);
  });
}

// Enable Edit Profile button
function enableProfileEditing(details) {
  const btn = document.getElementById("editProfileBtn");

  btn.addEventListener("click", () => {
    document.getElementById("studentContent").style.display = "none";
    document.getElementById("studentProfileForm").style.display = "block";

    // Pre-fill values
    document.querySelector("select[name='education_level']").value =
      details.education_level || "";

    document.querySelector("input[name='subject_tags']").value =
      (details.subject_tags || []).join(", ");

    setupProfileForm();
  }, { once: true });
}

// Form handling (create/update)
function setupProfileForm() {
  const form = document.getElementById("profileForm");

  // Reset listeners to avoid duplicates
  const cleanForm = form.cloneNode(true);
  form.replaceWith(cleanForm);

  const newForm = document.getElementById("profileForm");

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(newForm);
    const body = Object.fromEntries(formData.entries());

    // Convert tags to array
    if (typeof body.subject_tags === "string") {
      body.subject_tags = body.subject_tags
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    }

    try {
      const res = await fetch("/student/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(body)


        
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        document.getElementById("profileMessage").textContent =
          data.error || "Failed to save profile";
        return;
      }

      document.getElementById("profileMessage").textContent =
        data.message || "Profile saved";

      // Go back to dashboard
      document.getElementById("studentProfileForm").style.display = "none";
      document.getElementById("studentContent").style.display = "block";

    } catch (err) {
      console.error("Error saving profile:", err);
      document.getElementById("profileMessage").textContent = "Server error";
    }
  }, { once: true });
}

//setup session with an instructor
//button redirects to session creation page
function setupBookSessionButton() {
  const btn = document.getElementById("book-ssn-btn");
  btn.addEventListener("click", () => {
    window.location.href = "/student/book_session.html";
  });
}


loadDashboard();