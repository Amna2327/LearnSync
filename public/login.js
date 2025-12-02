// login.js
const form = document.getElementById('loginForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.error || "Login failed";
      return;
    }

    // Save JWT in localStorage
    localStorage.setItem('jwt', data.token);
    
    // Frontend debug: show user role
    console.log("[Frontend DEBUG] Logged-in user role:", data.role);

    // Redirect to dashboard
    window.location.href = '/dashboard.html';

  } catch (err) {
    message.textContent = "Error connecting to server";
    console.error(err);
  }
});
