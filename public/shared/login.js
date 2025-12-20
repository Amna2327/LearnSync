// login.js
const form = document.getElementById('loginForm');
const message = document.getElementById('message');
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Show loading state
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';
  message.classList.add('hidden');

  try{
      const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 🍪 SEND / RECEIVE COOKIE
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      message.className = "message message-error";
      message.textContent = data.error || "Login failed. Please check your credentials.";
      message.classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    console.log("[Frontend DEBUG] Logged-in user role:", data.role);

    // Show success message briefly
    message.className = "message message-success";
    message.textContent = "Login successful! Redirecting...";
    message.classList.remove("hidden");

    // Redirect based on role
    setTimeout(() => {
      if (data.role === "admin") {
        window.location.href = "/admin/dashboard_admin.html";
      } else if (data.role === "instructor") {
        window.location.href = "/instructor/dashboard_instructor.html";
      } else {
        window.location.href = "/student/dashboard_student.html";
      }
    }, 500);

  } catch (err) {
    message.className = "message message-error";
    message.textContent = "Error connecting to server. Please try again.";
    message.classList.remove("hidden");
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    console.error(err);
  }
});
