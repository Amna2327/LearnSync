// dashboard.js
async function loadDashboard() {
  const token = localStorage.getItem('jwt');
  if (!token) {
    alert("Please login first");
    window.location.href = '/login.html';
    return;
  }

  try {
    const res = await fetch('/dashboard', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Access denied");
      window.location.href = '/login.html';
      return;
    }

    document.getElementById('userInfo').textContent =
      `Welcome, ${data.user.email} | Role: ${data.user.role}`;

    // Frontend debug: show role
    console.log("[Frontend DEBUG] User role:", data.user.role);

  } catch (err) {
    console.error(err);
  }
}

loadDashboard();
