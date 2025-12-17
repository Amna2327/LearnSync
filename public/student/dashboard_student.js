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

function formatLocalTime(iso) {
  return iso
    .replace("T", " ")
    .replace(/:\d{2}\+\d{2}:\d{2}$/, "");
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
  const scheduledSessionsUl = document.getElementById("scheduledSessions");
  scheduledSessionsUl.innerHTML = "";
  const pendingUl = document.getElementById("pendingPaymentSessions");
  pendingUl.innerHTML = "";

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
    li.textContent += ` | Scheduled at: ${formatLocalTime(s.local_start_time)} | Duration: ${s.duration_minutes} mins`;

    // Show Pay Now button if eligible
    if (
      s.status === "accepted" &&
      (!s.payment_status || ["pending", "failed"].includes(s.payment_status.toLowerCase()))
    ) {
      pendingUl.textContent = `${s.description} | ${s.status} | Payment: ${paymentText}`;
      pendingUl.textContent += ` | Scheduled at: ${formatLocalTime(s.local_start_time)} | Duration: ${s.duration_minutes} mins`;
      pendingUl.textContent += '| Payment amount: $' + s.payment_amount;
      li.textContent += "| Payment amount: $" + s.payment_amount;
      const btn = document.createElement("button");
      btn.textContent = "Pay Now";
      btn.addEventListener("click", () => handlePayNow(s.session_id, btn));
      li.appendChild(document.createTextNode(" "));
      li.appendChild(btn);
      pendingUl.appendChild(document.createTextNode(" "));
      pendingUl.appendChild(btn);
    }

    // Handle meeting link visibility
    if (s.meeting_scheduled && s.meeting_link) {
      const link = document.createElement("a");
      link.href = s.meeting_link;
      link.textContent = "Join Zoom";
      link.target = "_blank"; // open in new tab
      li.appendChild(document.createTextNode(" | Zoom Link: "));
      li.appendChild(link);
    }
    else if (s.meeting_scheduled && !s.meeting_link) {
      // Scheduled but link hidden (more than 2 min away)
      li.textContent += ` | Meeting scheduled. Link will be shared 2 minutes before session.`;
    }

    allUl.appendChild(li);

    if (s.status === "scheduled" && !s.meetingCompleted) {
      const scheduledLi = li.cloneNode(true); // clone the same li
      scheduledSessionsUl.appendChild(scheduledLi);
    }

  })
  if (!pendingUl || pendingUl.children.length === 0) {
    pendingUl.textContent = "No pending payment at the moment.";
    pendingUl.style.display = "block";
  }
  if (!scheduledSessionsUl || scheduledSessionsUl.children.length === 0) {
    scheduledSessionsUl.textContent = "No scheduled sessions at the moment.";
    scheduledSessionsUl.style.display = "block";
  }
  if (!allUl || allUl.children.length === 0) {
    allUl.textContent = "No sessions found.";
    allUl.style.display = "block";
  };
}

// Handle Pay Now click
async function handlePayNow(sessionId, btn) {
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

    try {
      btn.disabled = true;
      const data = await res.json();
      if (data.success) {
        alert("Payment successful!");
        await viewAllSessions(token);
      } else {
        alert(data.message || "Payment failed");
      }
    } finally {
      btn.disabled = false;
    }

    if (data.success) {
      alert(`Payment successful! `);
      await viewAllSessions(token);
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
