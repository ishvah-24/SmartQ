/**
 * SmartQ Reception Dashboard
 *
 * Loads ticket data from the Django backend.
 * Displays queue statistics and ticket information.
 * Supports ticket filtering and status updates.
 * Tracks time spent in each status, updating every 10 seconds.
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
    called: "Called",
    "in-progress": "In Progress",
    served: "Served",
    "no-show": "No Show"
};

const ACTION_LABELS = {
    waiting: "Call Student",
    called: "Start Helping",
    "in-progress": "Mark Served",
    served: "Served",
    "no-show": "No Show"
};

function formatTime(iso) {
    if (!iso) return "-";

    const parts = iso.split("-");

    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return iso;
}


function getTimeInStatus(timestamp) {
    if (!timestamp) return "—";

    const changedAt = new Date(timestamp).getTime();

    if (Number.isNaN(changedAt)) return "—";

    const elapsedMinutes = Math.max(
        0,
        Math.floor((Date.now() - changedAt) / 60000)
    );

    if (elapsedMinutes < 60) {
        return `${elapsedMinutes} min`;
    }

    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;

    return `${hours}h ${minutes}m`;
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

    // Display empty message if no tickets match the filters
    if (filtered.length === 0) {
        tableBody.innerHTML = "";
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;

    // Generate ticket rows
    tableBody.innerHTML = filtered.map(t => `
        <tr>
            <!-- Ticket Number -->
            <td class="cell-ticket">
                ${t.ticketNumber}
            </td>

            <!-- Student Name -->
            <td>
                ${t.name}
            </td>

            <!-- Student Number -->
            <td>
                ${t.studentNumber}
            </td>

            <!-- Query Type -->
            <td>
                ${t.query}
            </td>

            <!-- Current Status -->
            <td>
                <span class="status-pill ${t.status}">
                    <span class="status-dot"></span>
                    ${STATUS_LABELS[t.status] || t.status}
                </span>
            </td>

            <td class="time-in-status"
                data-status-changed="${t.statusChangedAt || ''}">
                ${getTimeInStatus(t.statusChangedAt)}
            </td>

            <!-- Date Submitted -->
            <td>
                ${formatTime(t.submittedAt)}
            </td>

            <!-- Status Action Button -->
            <td>
                <button
                    class="row-action"
                    data-ticket="${t.ticketNumber}"
                    ${["served", "no-show"].includes(t.status)? "disabled": ""}
                >
                    ${ACTION_LABELS[t.status] || "Update"}
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
tableBody.addEventListener("click", async event => {

    const button = event.target.closest(".row-action");

    if (!button || button.disabled) return;

    const ticketNumber = button.dataset.ticket;

    const ticket = tickets.find(
        t => t.ticketNumber === ticketNumber
    );

    if (!ticket) return;

    button.disabled = true;

    const csrfToken = document.querySelector(
        '#csrfForm input[name="csrfmiddlewaretoken"]'
    ).value;

    try {
        const response = await fetch(updateTicketUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
            },
            body: JSON.stringify({
                ticket_id: ticket.id
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.error || "Unable to update ticket."
            );
        }

        const statusMapping = {
            "Waiting": "waiting",
            "Called": "called",
            "In service": "in-progress",
            "Completed": "served",
            "No show": "no-show"
        };

        ticket.status = statusMapping[result.new_status];
        ticket.statusChangedAt = result.status_changed_at;

        renderAll();

      } catch (error) {
        alert(error.message);
        renderAll();
    }
});

[statusFilter, queryFilter].forEach(el => el.addEventListener("change", renderTable));
searchInput.addEventListener("input", renderTable);

renderAll();


function updateStatusTimers() {
    document.querySelectorAll(".time-in-status").forEach(cell => {
        cell.textContent = getTimeInStatus(
            cell.dataset.statusChanged
        );
    });
}

setInterval(updateStatusTimers, 10000);