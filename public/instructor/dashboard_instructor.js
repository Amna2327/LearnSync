// View all sessions feature
async function viewAllSessions(token) {
  try {
    const res = await fetch("/instructor/all_sessions", {
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


// Pending approvals feature
async function loadPendingApprovals(token) {
  try {
    const res = await fetch("/instructor/all_sessions", {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) return;

    const data = await res.json();
    const pending = data.sessions.filter(s => s.status === "pending");

    const ul = document.getElementById("pendingApprovals");
    ul.innerHTML = "";

    pending.forEach(s => {
      const li = document.createElement("li");

      li.innerHTML = `
        <b>Student:</b> ${s.student_id || s.student_user_id} |
        <b>${s.description}</b> |
        <b>${(s.local_start_time).toLocaleString()}</b>
        <br>
        Amount: <input type="number" id="amount_${s.session_id}" placeholder="Enter amount" min="1">
        <button onclick="handleApproval(${s.session_id}, 'accept')">Accept</button>
        <button onclick="handleApproval(${s.session_id}, 'reject')">Reject</button>
        <hr>
      `;

      ul.appendChild(li);
    });

  } catch (err) {
    console.error("Error loading pending approvals:", err);
  }
}

// Handle accept/reject action
async function handleApproval(sessionId, action) {
  const token = localStorage.getItem("jwt");
  let amount = null;

  if (action === "accept") {
    amount = parseFloat(document.getElementById(`amount_${sessionId}`).value);
    if (!amount || amount <= 0) {
      alert("Enter a valid amount");
      return;
    }
  }

  try {
    const res = await fetch("/instructor/session_action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ session_id: sessionId, action, amount })
    });

    const data = await res.json();

    if (data.success) {
      alert(data.message);
      loadPendingApprovals(token);
      viewAllSessions(token);
    } else {
      alert(data.error || "Failed to update session");
    }

  } catch (err) {
    console.error("Error sending approval request:", err);
  }
}

// Load instructor dashboard
async function loadInstructorDashboard() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    window.location.href = '/shared/login.html';
    return;
  }

  try {
    const res = await fetch('/dashboard', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) return;

    const data = await res.json();
    const user = data.user;

    document.getElementById('userInfo').textContent =
      `Welcome, ${user.name} | Role: ${user.role}`;

    if (user.status === "pending") {
      document.getElementById("pendingInstructorUpload").style.display = "block";
      setupUploadForm(token);
    } else if (user.status === "active") {
      document.getElementById("instructorContent").style.display = "block";
      loadPendingApprovals(token);
    }

    viewAllSessions(token);

  } catch (err) {
    console.error("Error loading dashboard:", err);
  }
}

// Setup upload form
function setupUploadForm(token) {
  const form = document.getElementById('uploadForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    try {
      const res = await fetch('/instructor/upload-profile', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });

      const data = await res.json();
      document.getElementById('uploadMessage').textContent =
        data.message || data.error || "Upload failed";

    } catch (err) {
      document.getElementById('uploadMessage').textContent = "Server error";
    }
  });
}

// Initialize
console.log("Initializing instructor dashboard");
loadInstructorDashboard();
