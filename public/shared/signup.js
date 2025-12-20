document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const roleSelect = document.getElementById("role");
  const role = roleSelect ? roleSelect.value : "student";
  const timeZoneSelect = document.getElementById("timeZone");
  const timeZone = timeZoneSelect && timeZoneSelect.value ? timeZoneSelect.value : "UTC";

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  const messageEl = document.getElementById("message");
  
  // Frontend validation
  if (!name || name.length < 2) {
    messageEl.className = "message message-error";
    messageEl.textContent = "Please enter a valid name (at least 2 characters).";
    messageEl.classList.remove("hidden");
    return;
  }

  if (!email || !email.includes("@") || !email.includes(".")) {
    messageEl.className = "message message-error";
    messageEl.textContent = "Please enter a valid email address.";
    messageEl.classList.remove("hidden");
    return;
  }

  if (!password || password.length < 8) {
    messageEl.className = "message message-error";
    messageEl.textContent = "Password must be at least 8 characters long.";
    messageEl.classList.remove("hidden");
    return;
  }

  // Check password strength
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit) {
    messageEl.className = "message message-error";
    messageEl.textContent = "Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit.";
    messageEl.classList.remove("hidden");
    return;
  }

  if (!role || (role !== "student" && role !== "instructor")) {
    messageEl.className = "message message-error";
    messageEl.textContent = "Please select a role (Student or Instructor).";
    messageEl.classList.remove("hidden");
    return;
  }

  if (!timeZone) {
    messageEl.className = "message message-error";
    messageEl.textContent = "Please select a time zone.";
    messageEl.classList.remove("hidden");
    return;
  }
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating Account...';
  messageEl.classList.add('hidden');

  try {
    const requestBody = {
      name: name,
      email: email,
      password: password,
      role: role,
      timeZone: timeZone
    };

    console.log("Sending signup request:", { ...requestBody, password: "***" });

    const res = await fetch("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(requestBody)
    });

    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Failed to parse response:", parseError);
      throw new Error("Server returned invalid response");
    }
    
    if (res.ok) {
      messageEl.className = "message message-success";
      messageEl.textContent = "Signup successful! Redirecting to login...";
      messageEl.classList.remove("hidden");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } else {
      messageEl.className = "message message-error";
      messageEl.textContent = data.error || "Signup failed. Please try again.";
      messageEl.classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  } catch (err) {
    console.error("Signup error:", err);
    messageEl.className = "message message-error";
    messageEl.textContent = err.message || "Error connecting to server. Please check your connection and try again.";
    messageEl.classList.remove("hidden");
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

document.addEventListener('DOMContentLoaded', async () => {
    const timeZoneSelect = document.getElementById('timeZone');

    // Clear existing options
    timeZoneSelect.innerHTML = '';

    try {
        // Fetch time zones from JSON file
        const res = await fetch('../timezones.json');
        
        if (!res.ok) {
            throw new Error('Failed to load timezones');
        }
        
        const timeZones = await res.json();

        if (!Array.isArray(timeZones) || timeZones.length === 0) {
            throw new Error('Invalid timezones data');
        }

        // Populate select
        timeZones.forEach(tz => {
            if (tz && tz.value && tz.label) {
                const option = document.createElement('option');
                option.value = tz.value;
                option.textContent = tz.label;
                timeZoneSelect.appendChild(option);
            }
        });

        // Ensure UTC is selected by default if available
        if (timeZoneSelect.options.length > 0) {
            const utcOption = Array.from(timeZoneSelect.options).find(opt => opt.value === 'UTC');
            if (utcOption) {
                timeZoneSelect.value = 'UTC';
            } else {
                timeZoneSelect.selectedIndex = 0;
            }
        }
    } catch (err) {
        console.error('Error loading time zones:', err);
        // Fallback to UTC
        timeZoneSelect.innerHTML = '';
        const option = document.createElement('option');
        option.value = 'UTC';
        option.textContent = 'UTC (Default)';
        option.selected = true;
        timeZoneSelect.appendChild(option);
    }
});
