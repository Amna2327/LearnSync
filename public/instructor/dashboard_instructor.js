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
function formatLocalTime(iso) {
  return iso
    .replace("T", " ")
    .replace(/:\d{2}\+\d{2}:\d{2}$/, "");
}

async function viewAllSessions() {
  try {
    const user = await checkToken();
    if (!user) return;

    const res = await fetch("/instructor/all_sessions", {
      headers: {},
      credentials: "include"
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
    if (s.status === "accepted" || s.status === "scheduled") li.textContent += ` | Amount: ${s.amount}`;
    li.textContent += ` | Scheduled at: ${formatLocalTime(s.local_start_time)}`;

    // Handle meeting link visibility
    if (s.meeting_scheduled && s.meeting_link) {
      const link = document.createElement("a");
      link.href = s.meeting_link;
      link.textContent = "Join Zoom";
      link.target = "_blank"; // open in new tab
      li.appendChild(document.createTextNode(" | Zoom Link: "));
      li.appendChild(link);
    } else if (s.meeting_scheduled && !s.meeting_link) {
      // Scheduled but link hidden (more than 2 min away)
      li.textContent += ` | Meeting scheduled. Link will be shared 2 minutes before session.`;
    }

    allUl.appendChild(li);
  });
}

// Pending approvals feature
async function loadPendingApprovals() {
  try {
    const user = await checkToken();
    if (!user) return; 

    const res = await fetch("/instructor/all_sessions", {
      headers: {},
      credentials: "include"
    });

    if (!res.ok) return;

    const data = await res.json();
    const pending = data.sessions.filter(s => s.status === "pending");

    const ul = document.getElementById("pendingApprovals");
    ul.innerHTML = "";

    pending.forEach(s => {
      const li = document.createElement("li");

      // Determine the amount to display
      let amountText = "";
      if (s.status === "accepted" || s.status === "scheduled") {
        amountText = ` | Amount: ${s.amount || "N/A"}`;
      }

      li.innerHTML = `
        <b>Student:</b> ${s.student_id || s.student_user_id} |
        <b> Desc: ${s.description} | Amount:</b>${amountText} |
        <br>
        <b>${formatLocalTime(s.local_start_time)}</b> |
        <b>${s.duration_minutes} mins</b> |
        <br>
        Amount to charge: <input type="number" id="amount_${s.session_id}" value="${s.amount || ""}" min="1">
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
      headers: {"Content-Type": "application/json"},
      credentials: "include",
      body: JSON.stringify({ session_id: sessionId, action, amount })
    });

    const data = await res.json();

    if (data.success) {
      alert(data.message);
      loadPendingApprovals();
      viewAllSessions();
    } else {
      alert(data.error || "Failed to update session");
    }

  } catch (err) {
    console.error("Error sending approval request:", err);
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
      document.getElementById("pendingInstructorUpload").style.display = "block";
      setupUploadForm();
    } else if (user.status === "active") {
      document.getElementById("instructorContent").style.display = "block";
      await loadPendingApprovals();
      await viewAllSessions();
    }

  } catch (err) {
    console.error("Error loading dashboard:", err);
  }
}

// Setup upload form
function setupUploadForm() {
  const form = document.getElementById('uploadForm');
  form.addEventListener('submit', async (e) => {
    
    const user = await checkToken();
    if (!user) return;

    e.preventDefault();
    const formData = new FormData(form);

    try {
      const res = await fetch('/instructor/upload-profile', {
        method: 'POST',
        headers: {},
        credentials: "include",
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
