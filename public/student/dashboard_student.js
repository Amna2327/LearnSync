// public/student/dashboard_student.js

async function loadDashboard() {
  const token = localStorage.getItem("jwt");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  try {
    // Fetch basic user info
    const dashRes = await fetch("/dashboard", {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!dashRes.ok) {
      const err = await dashRes.json().catch(() => ({}));
      alert(err.error || "Access denied");
      window.location.href = "/login.html";
      return;
    }

    const dashData = await dashRes.json();
    const user = dashData.user;

    document.getElementById("userInfo").textContent =
      `Welcome, ${user.name} | Role: ${user.role}`;

    // Hide both initially
    document.getElementById("studentContent").style.display = "none";
    document.getElementById("studentProfileForm").style.display = "none";

    // Load student profile
    const res = await fetch("/student/details", {
      headers: { "Authorization": "Bearer " + token }
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
      setupProfileForm(token);
      return;
    }

    // PROFILE EXISTS
    const profile = details.profile;

    document.getElementById("studentContent").style.display = "block";
    renderUpcomingSessions(profile.upcomingSessions || []);

    // Enable update button
    enableProfileEditing(profile, token);

  } catch (err) {
    console.error("Error loading dashboard:", err);
  }
}

// Render upcoming sessions
function renderUpcomingSessions(sessions) {
  const ul = document.getElementById("upcomingSessions");
  ul.innerHTML = "";

  if (!sessions || sessions.length === 0) {
    ul.innerHTML = "<li>No sessions yet.</li>";
    return;
  }

  sessions.forEach(s => {
    const li = document.createElement("li");
    li.textContent = `${s.title} - ${s.date}`;
    ul.appendChild(li);
  });
}

// Enable Edit Profile button
function enableProfileEditing(details, token) {
  const btn = document.getElementById("editProfileBtn");

  btn.addEventListener("click", () => {
    document.getElementById("studentContent").style.display = "none";
    document.getElementById("studentProfileForm").style.display = "block";

    // Pre-fill values
    document.querySelector("select[name='education_level']").value =
      details.education_level || "";

    document.querySelector("input[name='subject_tags']").value =
      (details.subject_tags || []).join(", ");

    setupProfileForm(token);
  }, { once: true });
}

// Form handling (create/update)
function setupProfileForm(token) {
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
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
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

loadDashboard();
