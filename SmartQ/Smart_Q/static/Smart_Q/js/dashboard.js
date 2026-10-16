/*
  dashboard.js
  Concept-stage dashboard. Reads from the in-memory dummyTickets array
  (dummy-data.js). No backend, no persistence — refreshing the page
  resets any status changes made here.
*/

let tickets = JSON.parse(
    document.getElementById("ticketData").textContent
);

const statRow = document.getElementById("statRow");
const tableBody = document.getElementById("ticketTableBody");
const emptyState = document.getElementById("emptyState");
const statusFilter = document.getElementById("statusFilter");
const queryFilter = document.getElementById("queryFilter");
const searchInput = document.getElementById("searchInput");

const STATUS_LABELS = {
  waiting: "Waiting",
  "in-progress": "In Progress",
  served: "Served", 
  "no-show": "No Show"
};

const NEXT_STATUS = {
  waiting: "in-progress",
  "in-progress": "served",
  served: "served", 
  "no-show": "no-Show"
};

const ACTION_LABELS = {
  waiting: "Start Helping",
  "in-progress": "Mark Served",
  served: "Served", 
  "no-show": "No Show"
};

function formatTime(iso) {
  if(!iso) return "-";

  const pats = iso.split("-");

  if(parseInt.length === 3){
    return `${parts[2]}/${parts[1]}/${parts[0]}`;

    return iso;
  }
}

function renderStats() {
  const waiting = tickets.filter(t => t.status === "waiting").length;
  const inProgress = tickets.filter(t => t.status === "in-progress").length;
  const served = tickets.filter(t => t.status === "served").length;

  statRow.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Tickets Today</div>
      <div class="stat-value">${tickets.length}</div>
    </div>
    <div class="stat-card accent">
      <div class="stat-label">Waiting</div>
      <div class="stat-value">${waiting}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">In Progress</div>
      <div class="stat-value">${inProgress}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Served</div>
      <div class="stat-value">${served}</div>
    </div>
  `;
}

function getFilteredTickets() {
  const status = statusFilter.value;
  const query = queryFilter.value;
  const search = searchInput.value.trim().toLowerCase();

  return tickets.filter(t => {
    if (status !== "all" && t.status !== status) return false;
    if (query !== "all" && t.query !== query) return false;
    if (search) {
      const haystack = `${t.name} ${t.ticketNumber} ${t.studentNumber}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function renderTable() {
  const filtered = getFilteredTickets();

  if (filtered.length === 0) {
    tableBody.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  tableBody.innerHTML = filtered.map(t => `
    <tr>
      <td class="cell-ticket">${t.ticketNumber}</td>
      <td>${t.name}</td>
      <td>${t.studentNumber}</td>
      <td>${t.query}</td>
      <td>
        <span class="status-pill ${t.status}">
          <span class="status-dot"></span> ${STATUS_LABELS[t.status]}
        </span>
      </td>
      <td>${formatTime(t.submittedAt)}</td>
      <td>
        <button
          class="row-action"
          data-ticket="${t.ticketNumber}"
          ${["served", "no-show"].includes(t.status) ? "disabled" : ""}
        >
  ${ACTION_LABELS[t.status]}
</button>
          ${ACTION_LABELS[t.status]}
        </button>
      </td>
    </tr>
  `).join("");
}

function renderAll() {
  renderStats();
  renderTable();
}

/* Advance a ticket's status (demo only — resets on reload) */
tableBody.addEventListener("click", event => {
  const button = event.target.closest(".row-action");
  if (!button || button.disabled) return;

  const ticketNumber = button.dataset.ticket;
  const ticket = tickets.find(t => t.ticketNumber === ticketNumber);
  if (!ticket) return;

  ticket.status = NEXT_STATUS[ticket.status];
  renderAll();
});

[statusFilter, queryFilter].forEach(el => el.addEventListener("change", renderTable));
searchInput.addEventListener("input", renderTable);

/* Sign out: concept only, no real session to clear */
document.getElementById("signOutBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});

renderAll();
