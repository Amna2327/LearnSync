// Load dashboard
async function loadDashboard() {
  const token = localStorage.getItem("jwt");
  if (!token) return window.location.href = "/login.html";

  try {
    // Fetch basic user info
    const dashRes = await fetch("/dashboard", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!dashRes.ok) {
      const err = await dashRes.json().catch(() => ({}));
      alert(err.error || "Access denied");
      return window.location.href = "/login.html";
    }
    const { user } = await dashRes.json();
    document.getElementById("userInfo").textContent = `Welcome, ${user.name} | Role: ${user.role}`;

    // Hide dashboard/profile initially
    document.getElementById("studentContent").style.display = "none";
    document.getElementById("studentProfileForm").style.display = "none";

    // Fetch student profile
    const profileRes = await fetch("/student/details", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!profileRes.ok) {
      document.getElementById("studentContent").style.display = "block";
      console.error("Failed to fetch student details");
      return;
    }

    const { exists, profile } = await profileRes.json();

    if (!exists) {
      document.getElementById("studentProfileForm").style.display = "block";
      setupProfileForm(token);
      return;
    }

    // Show dashboard
    document.getElementById("studentContent").style.display = "block";
    setupBookSessionButton();
    enableProfileEditing(profile, token);

    // Fetch all sessions and render
    await viewAllSessions(token);

  } catch (err) {
    console.error("Error loading dashboard:", err);
  }
}

// Fetch and display all sessions
async function viewAllSessions(token) {
  try {
    const res = await fetch("/student/all_sessions", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!res.ok) throw new Error("Failed to fetch all sessions");

    const { sessions } = await res.json();
    renderSessions(sessions || []);

  } catch (err) {
    console.error("Error fetching sessions:", err);
  }
}

// Render sessions
function renderSessions(sessions) {
  const allUl = document.getElementById("allSessions");
  allUl.innerHTML = "";

  if (!sessions.length) {
    allUl.innerHTML = "<li>No sessions found.</li>";
    return;
  }

  sessions.forEach(s => {
    const li = document.createElement("li");

    // Payment status
    let paymentText = "unpaid";
    if (!s.payment_status) {
      paymentText = "unpaid";
    } else if (s.payment_status.toLowerCase() === "success") {
      paymentText = "paid";
    } else {
      paymentText = s.payment_status.toLowerCase();
    }

    // Base text
    li.textContent = `${s.description} | ${s.status} | Payment: ${paymentText}`;
    li.textContent += ` | Scheduled at: ${s.local_start_time}`;
    // Show Pay Now button if eligible
    if (
      s.status === "accepted" &&
      (!s.payment_status || ["pending", "failed"].includes(s.payment_status.toLowerCase()))
    ) {
      const btn = document.createElement("button");
      btn.textContent = "Pay Now";
      btn.addEventListener("click", () => handlePayNow(s.session_id, li));
      li.appendChild(document.createTextNode(" "));
      li.appendChild(btn);
    }

    // Handle meeting link visibility
    if (s.meeting_scheduled && s.meeting_link) {
      // Link exists and scheduled: show immediately
      li.textContent += ` | Zoom Link: ${s.meeting_link}`;
    } else if (s.meeting_scheduled && !s.meeting_link) {
      // Scheduled but link hidden (more than 10 min away)
      li.textContent += ` | Meeting scheduled. Link will be shared 10 minutes before session.`;
    }

    allUl.appendChild(li);
  });
}

// Handle Pay Now click
async function handlePayNow(sessionId, li) {
  const token = localStorage.getItem("jwt");
  if (!token) return alert("Not authenticated");

  try {
    const res = await fetch("/student/pay_session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ session_id: sessionId })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Payment successful! `);

    } else {
      alert(data.message || "Payment failed");
    }
  } catch (err) {
    console.error("Error processing payment:", err);
    alert("Server error while processing payment");
  }
}

// Edit Profile button
function enableProfileEditing(details, token) {
  const btn = document.getElementById("editProfileBtn");
  btn.addEventListener("click", () => {
    document.getElementById("studentContent").style.display = "none";
    document.getElementById("studentProfileForm").style.display = "block";

    document.querySelector("input[name='education_level']").value = details.education_level || "";
    document.querySelector("input[name='subject_tags']").value = (details.subject_tags || []).join(", ");

    setupProfileForm(token);
  }, { once: true });
}

// Profile form setup
function setupProfileForm(token) {
  const form = document.getElementById("profileForm");
  const cleanForm = form.cloneNode(true);
  form.replaceWith(cleanForm);
  const newForm = document.getElementById("profileForm");

  newForm.addEventListener("submit", async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(newForm).entries());
    body.subject_tags = body.subject_tags.split(",").map(s => s.trim()).filter(Boolean);

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
      document.getElementById("profileMessage").textContent = res.ok ? data.message || "Profile saved" : data.error || "Failed to save profile";

      if (res.ok) {
        document.getElementById("studentProfileForm").style.display = "none";
        document.getElementById("studentContent").style.display = "block";
        await viewAllSessions(token);
      }

    } catch (err) {
      console.error("Error saving profile:", err);
      document.getElementById("profileMessage").textContent = "Server error";
    }
  }, { once: true });
}

// Book session button
function setupBookSessionButton() {
  document.getElementById("book-ssn-btn").addEventListener("click", () => {
    window.location.href = "/student/book_session.html";
  });
}

// Initialize
loadDashboard();
