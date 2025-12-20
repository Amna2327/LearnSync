
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
    
    //setup sesssion booking button
    setupBookSessionButton();
    
    // Enable update button
    enableProfileEditing(profile);

    // Trigger fetching all sessions from server
    console.log("Triggering viewAllSessions now...");
    await viewAllSessions();
    
    // Also render any sessions from profile
    if (profile.upcomingSessions && profile.upcomingSessions.length > 0) {
      renderSessions(profile.upcomingSessions);
    }
    
  } catch (err) {
    console.error("Error loading dashboard:", err);
  }
}

// Render pending payment sessions
function renderPendingPaymentSessions(sessions) {
  const pendingUl = document.getElementById("pendingPaymentSessions");
  const noPendingMsg = document.getElementById("noPendingPayment");
  
  if (!pendingUl) return;
  
  pendingUl.innerHTML = "";

  // Filter sessions that need payment
  const pendingPayment = sessions.filter(s => 
    s.status === "accepted" && 
    (!s.payment_status || ["pending", "failed"].includes((s.payment_status || "").toLowerCase()))
  );

  if (!pendingPayment.length) {
    if (noPendingMsg) noPendingMsg.style.display = "block";
    return;
  }

  if (noPendingMsg) noPendingMsg.style.display = "none";

  pendingPayment.forEach(s => {
    const li = document.createElement("li");
    
    const paymentStatus = s.payment_status ? s.payment_status.toLowerCase() : "unpaid";
    const amount = s.amount || "N/A";
    
    li.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div><strong>${s.description || "No description"}</strong></div>
        <div>Status: <span class="badge badge-warning">${s.status}</span> | Payment: <span class="badge badge-danger">${paymentStatus}</span></div>
        <div>Amount: <strong>$${amount}</strong> | Scheduled: ${formatLocalTime(s.local_start_time)} | Duration: ${s.duration_minutes} mins</div>
        <div>
          <button class="btn btn-primary" onclick="handlePayNowFromPending('${s.session_id}', this)">Pay Now</button>
        </div>
      </div>
    `;
    
    pendingUl.appendChild(li);
  });
}

// Handle Pay Now from pending payment list
window.handlePayNowFromPending = async function(sessionId, btn) {
  await handlePayNow(sessionId, btn);
  // Refresh pending payments after payment
  await viewAllSessions();
};

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

    // Create structured content
    li.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div><strong>${s.description || "No description"}</strong></div>
        <div>
          Status: <span class="badge ${statusBadge}">${s.status}</span> | 
          Payment: <span class="badge ${paymentBadge}">${paymentText}</span>
          ${(s.status === "accepted" || s.status === "scheduled") && s.amount ? ` | Amount: <strong>$${s.amount}</strong>` : ''}
        </div>
        <div>
          Scheduled: ${formatLocalTime(s.local_start_time)} | Duration: ${s.duration_minutes} mins
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          ${s.status === "accepted" && (!s.payment_status || ["pending", "failed"].includes((s.payment_status || "").toLowerCase())) 
            ? `<button class="btn btn-primary" onclick="handlePayNowFromPending('${s.session_id}', this)">Pay Now</button>` 
            : ''}
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
  
  // Also render pending payment sessions
  renderPendingPaymentSessions(sessions);
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
        // Show success message
        const messageEl = document.createElement('div');
        messageEl.className = "message message-success";
        messageEl.textContent = "Payment successful!";
        messageEl.style.position = "fixed";
        messageEl.style.top = "20px";
        messageEl.style.right = "20px";
        messageEl.style.zIndex = "10000";
        document.body.appendChild(messageEl);
        setTimeout(() => messageEl.remove(), 3000);
        
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

    // Set education level
    const educationSelect = document.getElementById("education_level");
    if (educationSelect && details.education_level) {
      educationSelect.value = details.education_level;
    }

    // Set subjects (will be handled by setupProfileForm)
    const existingSubjects = details.subject_tags || [];
    
    setupProfileForm().then(() => {
      // After form is set up, check the existing subjects
      if (existingSubjects.length > 0) {
        setTimeout(() => {
          existingSubjects.forEach(subject => {
            const checkbox = document.querySelector(`#subject_tags_container input[value="${subject}"]`);
            if (checkbox) checkbox.checked = true;
          });
          // Trigger change to update hidden input
          const event = new Event('change');
          document.getElementById('subject_tags_container').dispatchEvent(event);
        }, 100);
      }
    });
  }, { once: true });
}

// Form handling (create/update)
function setupProfileForm() {
  const form = document.getElementById("profileForm");
  const cleanForm = form.cloneNode(true);
  form.replaceWith(cleanForm);
  const newForm = document.getElementById("profileForm");

  // Populate education level dropdown and subjects
  (async () => {
    try {
      const { educationLevels, subjects, createMultiSelect } = await import('../shared/options.js');
      
      // Populate education level datalist (editable dropdown)
      const educationInput = document.getElementById("education_level");
      const educationDatalist = document.getElementById("education_level_list");
      if (educationInput && educationDatalist) {
        educationLevels.forEach(level => {
          const option = document.createElement('option');
          option.value = level;
          educationDatalist.appendChild(option);
        });
      }

      // Create multi-select for subjects
      const getSelectedSubjects = createMultiSelect('subject_tags_container', subjects);
      
      // Update hidden input when checkboxes change
      const container = document.getElementById('subject_tags_container');
      if (container) {
        container.addEventListener('change', () => {
          const selected = getSelectedSubjects();
          const hiddenInput = document.getElementById('subject_tags');
          if (hiddenInput) {
            hiddenInput.value = selected.join(', ');
          }
        });
      }
    } catch (err) {
      console.error("Error loading options:", err);
    }
  })();

  newForm.addEventListener("submit", async e => {
    e.preventDefault();

    // Check token before doing anything
    const user = await checkToken();
    if (!user) return; // stop if token expired

    // Get selected subjects from checkboxes
    const subjectCheckboxes = document.querySelectorAll('#subject_tags_container input[type="checkbox"]:checked');
    const selectedSubjects = Array.from(subjectCheckboxes).map(cb => cb.value);
    
    const educationLevel = document.getElementById("education_level").value;
    
    if (!educationLevel) {
      document.getElementById("profileMessage").className = "message message-error";
      document.getElementById("profileMessage").textContent = "Please select an education level";
      document.getElementById("profileMessage").classList.remove("hidden");
      return;
    }

    if (selectedSubjects.length === 0) {
      document.getElementById("profileMessage").className = "message message-error";
      document.getElementById("profileMessage").textContent = "Please select at least one subject";
      document.getElementById("profileMessage").classList.remove("hidden");
      return;
    }

    const body = {
      education_level: educationLevel,
      subject_tags: selectedSubjects
    };

    const messageEl = document.getElementById("profileMessage");
    messageEl.classList.add("hidden");

    try {
      const res = await fetch("/student/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        messageEl.className = "message message-success";
        messageEl.textContent = data.message || "Profile saved successfully!";
        messageEl.classList.remove("hidden");
        
        setTimeout(() => {
          document.getElementById("studentProfileForm").style.display = "none";
          document.getElementById("studentContent").style.display = "block";
          viewAllSessions();
        }, 1500);
      } else {
        messageEl.className = "message message-error";
        messageEl.textContent = data.error || "Failed to save profile. Please try again.";
        messageEl.classList.remove("hidden");
      }

    } catch (err) {
      console.error("Error saving profile:", err);
      messageEl.className = "message message-error";
      messageEl.textContent = "Server error. Please check your connection and try again.";
      messageEl.classList.remove("hidden");
    }
  }, { once: true });
}

// Book session button
function setupBookSessionButton() {
  const btn = document.getElementById("book-ssn-btn");
  // Remove existing listeners by cloning
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  
  newBtn.addEventListener("click", async() => {
    const user = await checkToken();
    if (!user) return;
    window.location.href = "/student/book_session.html";
  });
}

// Initialize
loadDashboard();
