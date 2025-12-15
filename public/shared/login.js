// login.js
const form = document.getElementById('loginForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try{
      const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 🍪 SEND / RECEIVE COOKIE
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.error || "Login failed";
      return;
    }

    console.log("[Frontend DEBUG] Logged-in user role:", data.role);

    // Redirect based on role
    if (data.role === "admin") {
      window.location.href = "/admin/dashboard_admin.html";
    } else if (data.role === "instructor") {
      window.location.href = "/instructor/dashboard_instructor.html";
    } else {
      window.location.href = "/student/dashboard_student.html";
    }

  } catch (err) {
    message.textContent = "Error connecting to server";
    console.error(err);
  }
});
