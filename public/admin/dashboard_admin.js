// dashboard_admin.js
async function loadDashboard() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const res = await fetch('/dashboard', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Access denied");
            window.location.href = '/login.html';
            return;
        }

        const user = data.user;
        document.getElementById('userInfo').textContent =
            `Welcome, ${user.name} | Role: ${user.role}`;

        // Fetch pending instructors
        const pendingRes = await fetch('/admin/pending-instructors', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const pending = await pendingRes.json();

        const pendingUl = document.getElementById('pendingInstructors');
        pendingUl.innerHTML = '';

        pending.forEach(inst => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${inst.name} - ${inst.email} | ${inst.time_zone} 
                <button class="approveBtn" data-id="${inst.id}">Approve</button>
                <button class="rejectBtn" data-id="${inst.id}">Reject</button>
                <button class="viewDocsBtn" data-id="${inst.id}">View Docs</button>
            `;
            pendingUl.appendChild(li);
        });

        // Attach event listeners
        pendingUl.querySelectorAll('.approveBtn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const res = await fetch(`/admin/approve-instructor/${id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + token }
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
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const result = await res.json();
                alert(result.message);
                loadDashboard(); // refresh list
            });
        });

        pendingUl.querySelectorAll('.viewDocsBtn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const res = await fetch(`/admin/instructor-details/${id}`, {
                    headers: { 'Authorization': 'Bearer ' + token }
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
