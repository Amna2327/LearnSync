// dashboard_instructor.js

async function loadInstructorDashboard() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        window.location.href = '/shared/login.html';
        return;
    }

    const res = await fetch('/dashboard', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    const user = data.user;
    console.log("DEBUG user:", user);

    document.getElementById('userInfo').textContent =
        `Welcome, ${user.name} | Role: ${user.role}`;

    if (user.status === "pending") {
        document.getElementById("pendingInstructorUpload").style.display = "block";
        setupUploadForm(token); // <-- this calls the function I gave you
    } else if (user.status === "active") {
        document.getElementById("instructorContent").style.display = "block";
        // fetch approved sessions, etc.
    }
}

// The setupUploadForm function goes here in the same file
function setupUploadForm(token) {
    const form = document.getElementById('uploadForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        try {
            const res = await fetch('/instructor/upload-profile', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                document.getElementById('uploadMessage').textContent = data.error || "Upload failed";
                return;
            }

            document.getElementById('uploadMessage').textContent = data.message;
        } catch (err) {
            document.getElementById('uploadMessage').textContent = "Error connecting to server";
            console.error(err);
        }
    });
}

// Call the dashboard loader
loadInstructorDashboard();
