// public/student/dashboard_student.js
async function loadDashboard() {
  const token = localStorage.getItem("jwt");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  try {
    // use your main /dashboard to get user basic info (name, role, etc.)
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
    document.getElementById("userInfo").textContent = `Welcome, ${user.name} | Role: ${user.role}`;

    // hide both blocks initially
    document.getElementById("studentContent").style.display = "none";
    document.getElementById("studentProfileForm").style.display = "none";

    // fetch profile existence using dedicated endpoint
    const res = await fetch("/student/details", {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
      console.error("Failed to fetch student details");
      // fallback: show dashboard so student isn't blocked, but log the error
      document.getElementById("studentContent").style.display = "block";
      return;
    }

    const details = await res.json(); // { exists: boolean, profile: {...} }

    if (!details.exists) {
      // FIRST TIME: force profile form
      document.getElementById("studentProfileForm").style.display = "block";
      setupProfileForm(token);
    } else {
      // profile exists -> normal dashboard
      document.getElementById("studentContent").style.display = "block";
      const profile = details.profile;
      // optional: show student's education level/subjects somewhere
      renderUpcomingSessions(profile.upcomingSessions || []); // or from dashData
    }

  } catch (err) {
    console.error("Error loading dashboard:", err);
  }
}

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

function setupProfileForm(token) {
  const form = document.getElementById("profileForm");

  // remove previous listener if any (defensive)
  form.replaceWith(form.cloneNode(true));
  const newForm = document.getElementById("profileForm");

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(newForm);
    const body = Object.fromEntries(formData.entries());

    // convert tags to array
    if (typeof body.subject_tags === "string") {
      body.subject_tags = body.subject_tags.split(",").map(s => s.trim()).filter(Boolean);
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
        document.getElementById("profileMessage").textContent = data.error || "Failed to save profile";
        return;
      }

      // success: hide form, show dashboard
      document.getElementById("profileMessage").textContent = data.message || "Profile saved";
      document.getElementById("studentProfileForm").style.display = "none";
      document.getElementById("studentContent").style.display = "block";

      // optional: reload dashboard data if you want to fetch sessions etc.
      // loadDashboard(); // be careful to avoid infinite loop (it calls this function)
    } catch (err) {
      console.error("Error saving profile:", err);
      document.getElementById("profileMessage").textContent = "Server error";
    }
  }, { once: true });
}

loadDashboard();
