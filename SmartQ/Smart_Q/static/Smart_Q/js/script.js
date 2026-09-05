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

/* Student queue submission demo */
let nextTicketNumber = 24; // demo counter only — a real system would assign this server-side

document.getElementById("studentForm").addEventListener("submit", event => {
  event.preventDefault();

  const studentNumber = document.getElementById("studentNumber").value;
  const name = document.getElementById("studentName").value;
  const surname = document.getElementById("studentSurname").value;
  const phone = document.getElementById("studentPhone").value;
  const query = document.getElementById("studentQuery").value;

  /*
    In the completed system, these values would be sent to the
    Python backend, stored in MySQL, and displayed on the receptionist
    queue screen.

    The backend could also record the submission timestamp and use
    it to determine when the student should be notified.
  */

  const ticketNumber = `A-0${nextTicketNumber++}`;

  document.getElementById("ticketNumber").textContent = ticketNumber;
  document.getElementById("ticketStudentName").textContent = `${name} ${surname}`;
  document.getElementById("ticketQueryType").textContent = query;

  showScreen("ticketScreen");

  console.log({
    ticketNumber,
    studentNumber,
    name,
    surname,
    phone,
    query,
    submittedAt: new Date().toISOString()
  });
});