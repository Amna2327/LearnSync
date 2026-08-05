// dashboard_admin.js

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

async function loadDashboard() {

    try {
        const user = await checkToken();
        if (!user) return;
        
        // const user = response.user;

        // HARD ROLE CHECK — REQUIRED
        if (user.role !== "admin") {
        console.warn("❌ Non-admin detected on admin dashboard:", user.role);
        alert("Session changed. Please log in as an admin.");
        window.location.href = "/shared/login.html";
        return; // STOP EVERYTHING AND DISPLAY WARNING MESSAGE (FOR XSS)
        }

        document.getElementById('userInfo').textContent =
            `Welcome, ${user.name} | Role: ${user.role}`;

        // Fetch pending instructors
        const pendingRes = await fetch('/admin/pending-instructors', {
            headers: {},
            credentials: "include" 
        });
        
        if (!pendingRes.ok) {
            console.error("Failed to fetch pending instructors");
            return;
        }
        
        const pending = await pendingRes.json() || [];
        const pendingUl = document.getElementById('pendingInstructors');
        const noPendingMsg = document.getElementById('noPendingInstructors');
        
        if (!pendingUl) return;
        
        pendingUl.innerHTML = '';

        if (!pending || pending.length === 0) {
            if (noPendingMsg) noPendingMsg.style.display = "block";
            return;
        }

        if (noPendingMsg) noPendingMsg.style.display = "none";

        pending.forEach(inst => {
            const li = document.createElement('li');
            const name = inst.name || "Unknown";
            const email = inst.email || "No email";
            const timeZone = inst.time_zone || "UTC";
            
            li.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div>
                        <strong>Name:</strong> ${name} | 
                        <strong>Email:</strong> ${email} | 
                        <strong>Time Zone:</strong> ${timeZone}
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-success approveBtn" data-id="${inst.id}">✅ Approve</button>
                        <button class="btn btn-danger rejectBtn" data-id="${inst.id}">❌ Reject</button>
                        <button class="btn btn-secondary viewDocsBtn" data-id="${inst.id}">📄 View Documents</button>
                    </div>
                </div>
            `;
            pendingUl.appendChild(li);
        });

        // Attach event listeners
        pendingUl.querySelectorAll('.approveBtn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const res = await fetch(`/admin/approve-instructor/${id}`, {
                    method: 'PUT',
                    headers: {},
                    credentials: "include" 
                });
                const result = await res.json();
                alert(result.message);
                loadDashboard(); // refresh list
            });
        });

        pendingUl.querySelectorAll('.rejectBtn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const res = await fetch(`/admin/reject-instructor/${id}`, {
                    method: 'PUT',
                    headers: {},
                    credentials: "include" 
                });
                const result = await res.json();
                alert(result.message);
                loadDashboard(); // refresh list
            });
        });

        pendingUl.querySelectorAll('.viewDocsBtn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const user = await checkToken();
                if (!user) return;

                const id = btn.dataset.id;
                const res = await fetch(`/admin/instructor-details/${id}`, {
                    headers: {},
                    credentials: "include" 
                });
                const details = await res.json();
                if (!res.ok) {
                    alert(details.error || "Failed to fetch details");
                    return;
                }

                let html = "<h3>Certifications:</h3><ul>";
                (details.certifications || []).forEach(url => {
                    html += `<li><a href="${url}" target="_blank">${url.split("/").pop()}</a></li>`;
                });
                html += "</ul><h3>Demo Materials:</h3><ul>";
                (details.demo_material || []).forEach(url => {
                    html += `<li><a href="${url}" target="_blank">${url.split("/").pop()}</a></li>`;
                });
                html += "</ul>";

                const win = window.open("", "_blank", "width=600,height=400,scrollbars=yes");
                win.document.write(html);
            });
        });

    } catch (err) {
        console.error("Error loading admin dashboard:", err);
    }
}

loadDashboard();
