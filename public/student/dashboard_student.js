
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


function formatLocalTime(iso) {
  return iso
    .replace("T", " ")
    .replace(/:\d{2}\+\d{2}:\d{2}$/, "");
}
// Fetch and display all sessions
async function viewAllSessions() {
  try {
    const user = await checkToken();
    if (!user) return;
    
    const res = await fetch("/student/all_sessions", {
      headers: {},
      credentials: "include" 
    });
    if (!res.ok) throw new Error("Failed to fetch all sessions");

    // const { sessions } = await res.json();
    // renderSessions(sessions || []);

    //setup session booking button
    setupBookSessionButton();

    // Fetch and render sessions from server
    const { sessions } = await res.json();
    renderSessions(sessions || []);

  } catch (err) {
    console.error("Error fetching sessions:", err);
  }
}

async function loadDashboard() {

  try {
    const user = await checkToken();
    if (!user) return;

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
    renderSessions(profile.upcomingSessions || []);

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
    li.textContent += ` | Scheduled at: ${formatLocalTime(s.local_start_time)} | Duration: ${s.duration_minutes} mins`;


    // Show Pay Now button if eligible
    if (
      s.status === "accepted" &&
      (!s.payment_status || ["pending", "failed"].includes(s.payment_status.toLowerCase()))
    ) {
      const btn = document.createElement("button");
      btn.textContent = "Pay Now";
      btn.addEventListener("click", () => handlePayNow(s.session_id, btn));
      li.appendChild(document.createTextNode(" "));
      li.appendChild(btn);
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
  });
}

// Handle Pay Now click
async function handlePayNow(sessionId, btn) {
  const user = await checkToken();
  if (!user) return; // stop if token invalid
  btn.disabled = true;
  
  try {
    const res = await fetch("/student/pay_session", {
      method: "POST",
      headers: {"Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ session_id: sessionId })
    });


      if (!res.ok) {
        const errorText = await res.text();
        throw new Error (`Server error: ${res.status} - ${errorText}`)
      }

      const data = await res.json();
      if (data.success) {
        alert("Payment successful!");
        await viewAllSessions();
      } else {
        alert(data.message || "Payment failed");
      }
    } 
    catch (err) {
    console.error("Error processing payment:", err);
    alert("Server error while processing payment");
    } finally {
      btn.disabled = false;
    }

}

// Edit Profile button
function enableProfileEditing(details) {
  const btn = document.getElementById("editProfileBtn");
  btn.addEventListener("click", async () => {
    const user = await checkToken();
    if (!user) return;

    document.getElementById("studentContent").style.display = "none";
    document.getElementById("studentProfileForm").style.display = "block";

    document.querySelector("input[name='education_level']").value = details.education_level || "";
    document.querySelector("input[name='subject_tags']").value = (details.subject_tags || []).join(", ");

    setupProfileForm();
  }, { once: true });
}

// Form handling (create/update)
function setupProfileForm() {
  const form = document.getElementById("profileForm");
  const cleanForm = form.cloneNode(true);
  form.replaceWith(cleanForm);
  const newForm = document.getElementById("profileForm");

  newForm.addEventListener("submit", async e => {
    e.preventDefault();

    // Check token before doing anything
    const user = await checkToken();
    if (!user) return; // stop if token expired

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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      document.getElementById("profileMessage").textContent = res.ok ? data.message || "Profile saved" : data.error || "Failed to save profile";

      if (res.ok) {
        document.getElementById("studentProfileForm").style.display = "none";
        document.getElementById("studentContent").style.display = "block";
        await viewAllSessions();
      }

    } catch (err) {
      console.error("Error saving profile:", err);
      document.getElementById("profileMessage").textContent = "Server error";
    }
  }, { once: true });
}

// Book session button
function setupBookSessionButton() {
  const btn = document.getElementById("book-ssn-btn");
  btn.addEventListener("click", async() => {
    const user = await checkToken();
    if (!user) return;
    window.location.href = "/student/book_session.html";
  });
}

// Initialize
loadDashboard();
