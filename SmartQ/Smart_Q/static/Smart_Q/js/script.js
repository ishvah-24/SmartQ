const screens = ["loginScreen", "signupScreen", "studentScreen", "ticketScreen"];

function showScreen(id) {
  screens.forEach(screenId => {
    document.getElementById(screenId).classList.toggle("active", screenId === id);
  });

  clearMessage();
}

function showMessage(text) {
  const message = document.getElementById("message");
  message.textContent = text;
}

function clearMessage() {
  document.getElementById("message").textContent = "";
}

/* Show / hide passwords */
document.querySelectorAll(".show-btn").forEach(button => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    const isHidden = input.type === "password";

    input.type = isHidden ? "text" : "password";
    button.textContent = isHidden ? "Hide" : "Show";
  });
});

/* Staff login demo */
document.getElementById("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  showMessage("Login submitted. Taking you to the dashboard...");

  // Concept demo only — no real authentication or session is created.
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 500);
});

/* Staff sign-up demo */
document.getElementById("signupForm").addEventListener("submit", event => {
  event.preventDefault();

  const password = document.getElementById("signupPassword").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (password !== confirm) {
    showMessage("Passwords do not match.");
    return;
  }

  showMessage(
    "Staff account submitted. Connect this form to the Python/MySQL backend."
  );
});
