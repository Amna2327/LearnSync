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
    renderApprovedSessions(sessions || []);

  } catch (err) {
    console.error("Error fetching sessions:", err);
  }
}
// Render approved sessions in table
function renderApprovedSessions(sessions) {
  const tableBody = document.querySelector("#approvedSessions tbody");
  const noApprovedMsg = document.getElementById("noApprovedSessions");
  
  if (!tableBody) return;
  
  tableBody.innerHTML = "";

  // Filter approved/accepted sessions
  const approvedSessions = sessions.filter(s => 
    s.status === "accepted" || s.status === "scheduled"
  );

  if (!approvedSessions || approvedSessions.length === 0) {
    if (noApprovedMsg) noApprovedMsg.style.display = "block";
    return;
  }

  if (noApprovedMsg) noApprovedMsg.style.display = "none";

  approvedSessions.forEach(s => {
    const row = document.createElement("tr");
    
    const studentId = s.student_id || s.student_user_id || "Unknown";
    const description = s.description || "No description";
    const startTime = s.local_start_time ? formatLocalTime(s.local_start_time) : "Not scheduled";
    const status = s.status || "unknown";
    
    // Status badge
    let statusBadge = "badge-info";
    let statusText = status;
    if (status === "accepted") {
      statusBadge = "badge-success";
      statusText = "Accepted";
    } else if (status === "scheduled") {
      statusBadge = "badge-info";
      statusText = "Scheduled";
    }

    row.innerHTML = `
      <td>Student ID: ${studentId}</td>
      <td>${description}</td>
      <td>${startTime}</td>
      <td><span class="badge ${statusBadge}">${statusText}</span></td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Render sessions
function renderSessions(sessions) {
  const allUl = document.getElementById("allSessions");
  const noSessionsMsg = document.getElementById("noSessions");
  
  if (!allUl) return;
  
  allUl.innerHTML = "";

  if (!sessions || !sessions.length) {
    if (noSessionsMsg) noSessionsMsg.style.display = "block";
    return;
  }

  if (noSessionsMsg) noSessionsMsg.style.display = "none";

  sessions.forEach(s => {
    const li = document.createElement("li");

    // Payment status
    let paymentText = "unpaid";
    let paymentBadge = "badge-danger";
    if (!s.payment_status) {
      paymentText = "unpaid";
    } else if (s.payment_status.toLowerCase() === "success") {
      paymentText = "paid";
      paymentBadge = "badge-success";
    } else {
      paymentText = s.payment_status.toLowerCase();
      paymentBadge = "badge-warning";
    }

    // Status badge
    let statusBadge = "badge-info";
    if (s.status === "accepted") statusBadge = "badge-success";
    else if (s.status === "pending") statusBadge = "badge-warning";
    else if (s.status === "rejected") statusBadge = "badge-danger";
    else if (s.status === "scheduled") statusBadge = "badge-info";

    const description = s.description || "No description";
    const amount = s.amount ? `$${s.amount}` : "N/A";
    const startTime = s.local_start_time ? formatLocalTime(s.local_start_time) : "Not scheduled";
    const duration = s.duration_minutes || 0;

    li.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div><strong>${description}</strong></div>
        <div>
          Status: <span class="badge ${statusBadge}">${s.status}</span> | 
          Payment: <span class="badge ${paymentBadge}">${paymentText}</span>
          ${(s.status === "accepted" || s.status === "scheduled") ? ` | Amount: <strong>${amount}</strong>` : ''}
        </div>
        <div>
          Scheduled: ${startTime} | Duration: ${duration} mins
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          ${s.meeting_scheduled && s.meeting_link 
            ? `<a href="${s.meeting_link}" target="_blank" class="btn btn-success">Join Zoom</a>` 
            : s.meeting_scheduled && !s.meeting_link 
            ? `<span class="badge badge-info">Meeting scheduled. Link will be shared 2 minutes before session.</span>` 
            : ''}
        </div>
      </div>
    `;

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
    const noPendingMsg = document.getElementById("noPendingApprovals");
    
    if (!ul) return;
    
    ul.innerHTML = "";

    if (!pending || pending.length === 0) {
      if (noPendingMsg) noPendingMsg.style.display = "block";
      return;
    }

    if (noPendingMsg) noPendingMsg.style.display = "none";

    pending.forEach(s => {
      const li = document.createElement("li");

      // Get student name if available
      const studentInfo = s.student_id || s.student_user_id || "Unknown";
      const description = s.description || "No description";
      const amount = s.amount || "";
      const startTime = s.local_start_time ? formatLocalTime(s.local_start_time) : "Not scheduled";
      const duration = s.duration_minutes || 0;

      li.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div><strong>Student ID:</strong> ${studentInfo}</div>
          <div><strong>Description:</strong> ${description}</div>
          <div>
            <strong>Scheduled:</strong> ${startTime} | 
            <strong>Duration:</strong> ${duration} mins
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <label><strong>Amount to charge ($):</strong></label>
            <input type="number" id="amount_${s.session_id}" value="${amount}" min="1" step="0.01" style="width: 120px; padding: 0.5rem;">
            <button class="btn btn-success" onclick="handleApproval(${s.session_id}, 'accept')">Accept</button>
            <button class="btn btn-danger" onclick="handleApproval(${s.session_id}, 'reject')">Reject</button>
          </div>
        </div>
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
      await viewAllSessions(); // Refresh all sessions including approved table
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
  if (!form) {
    console.error("Upload form not found");
    return;
  }
  
  // Populate dropdowns
  (async () => {
    try {
      const { educationLevels, subjects, createMultiSelect } = await import('../shared/options.js');
      
      // Wait a bit for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create multi-select for subjects
      const subjectContainer = document.getElementById('subject_tags_container');
      if (subjectContainer) {
        const getSelectedSubjects = createMultiSelect('subject_tags_container', subjects);
        
        subjectContainer.addEventListener('change', () => {
          const selected = getSelectedSubjects();
          const hiddenInput = document.getElementById('subject_tags');
          if (hiddenInput) {
            hiddenInput.value = selected.join(', ');
          }
        });
      } else {
        console.error("Subject tags container not found");
      }
      
      // Create multi-select for education levels
      const educationContainer = document.getElementById('education_level_tags_container');
      if (educationContainer) {
        const getSelectedEducationLevels = createMultiSelect('education_level_tags_container', educationLevels);
        
        educationContainer.addEventListener('change', () => {
          const selected = getSelectedEducationLevels();
          const hiddenInput = document.getElementById('education_level_tags');
          if (hiddenInput) {
            hiddenInput.value = selected.join(', ');
          }
        });
      } else {
        console.error("Education level tags container not found");
      }
    } catch (err) {
      console.error("Error loading options:", err);
      const messageEl = document.getElementById('uploadMessage');
      if (messageEl) {
        messageEl.className = "message message-error";
        messageEl.textContent = "Error loading form options. Please refresh the page.";
        messageEl.classList.remove("hidden");
      }
    }
  })();
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = await checkToken();
    if (!user) {
      alert("Session expired. Please log in again.");
      window.location.href = "/shared/login.html";
      return;
    }

    const messageEl = document.getElementById('uploadMessage');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    messageEl.classList.add("hidden");
    
    try {
      // Get selected values from checkboxes
      const subjectCheckboxes = document.querySelectorAll('#subject_tags_container input[type="checkbox"]:checked');
      const educationCheckboxes = document.querySelectorAll('#education_level_tags_container input[type="checkbox"]:checked');
      
      const selectedSubjects = Array.from(subjectCheckboxes).map(cb => cb.value);
      const selectedEducationLevels = Array.from(educationCheckboxes).map(cb => cb.value);
      
      // Validation
      if (selectedSubjects.length === 0) {
        messageEl.className = "message message-error";
        messageEl.textContent = "Please select at least one subject";
        messageEl.classList.remove("hidden");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
      
      if (selectedEducationLevels.length === 0) {
        messageEl.className = "message message-error";
        messageEl.textContent = "Please select at least one education level";
        messageEl.classList.remove("hidden");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
      
      // Create FormData
      const formData = new FormData(form);
      
      // Add selected values to form data (as comma-separated strings)
      formData.set('subject_tags', selectedSubjects.join(', '));
      formData.set('education_level_tags', selectedEducationLevels.join(', '));

      console.log("Submitting form with:", {
        subjects: selectedSubjects,
        educationLevels: selectedEducationLevels,
        certifications: formData.getAll('certifications'),
        demo_material: formData.getAll('demo_material')
      });

      const res = await fetch('/instructor/upload-profile', {
        method: 'POST',
        headers: {}, // Don't set Content-Type, let browser set it with boundary for FormData
        credentials: "include",
        body: formData
      });

      let data;
      try {
        const text = await res.text();
        console.log("Response text:", text);
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error("Failed to parse response:", parseErr);
        throw new Error("Server returned invalid response");
      }
      
      if (res.ok) {
        messageEl.className = "message message-success";
        messageEl.textContent = data.message || "Profile submitted successfully! Waiting for admin approval.";
        messageEl.classList.remove("hidden");
        
        // Disable form after successful submission
        form.querySelectorAll('input, select, button').forEach(el => {
          if (el.type !== 'submit') el.disabled = true;
        });
        submitBtn.textContent = 'Submitted ✓';
        
        // Optionally reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        messageEl.className = "message message-error";
        messageEl.textContent = data.error || `Upload failed (${res.status}). Please try again.`;
        messageEl.classList.remove("hidden");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }

    } catch (err) {
      console.error("Upload error:", err);
      messageEl.className = "message message-error";
      messageEl.textContent = err.message || "Server error. Please check your connection and try again.";
      messageEl.classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Initialize
console.log("Initializing instructor dashboard");
loadInstructorDashboard();
