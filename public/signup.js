document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;
  const timeZone = document.getElementById("timeZone").value;

  try {
    const res = await fetch("/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password, role, timeZone })
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById("message").style.color = "green";
      document.getElementById("message").textContent = "Signup successful! Redirecting to login...";
      setTimeout(() => {
        window.location.href = "login.html"; // Redirect to login page
      }, 1500);
    } else {
      document.getElementById("message").style.color = "red";
      document.getElementById("message").textContent = data.error;
    }
  } catch (err) {
    console.error("Signup error:", err);
    document.getElementById("message").textContent = "An error occurred.";
  }
});