
/**
 * SmartQ Reception Dashboard
 *
 * Loads ticket data from the Django backend.
 * Displays queue statistics and ticket information.
 * Supports ticket filtering and status updates.
 * Automatically refreshes ticket data every 5 seconds.
 * Updates time-in-status displays every 10 seconds.
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

let dashboardRefreshInProgress = false;
let ticketUpdateInProgress = false;

const STATUS_LABELS = {
    waiting: "Waiting",
    called: "Called",
    "in-progress": "In Progress",
    served: "Served",
    "no-show": "No Show",
    cancelled: "Cancelled"
};

const ACTION_LABELS = {
    waiting: "Call Student",
    called: "Start Helping",
    "in-progress": "Mark Served",
    served: "Served",
    "no-show": "No Show",
    cancelled: "Cancelled"
};

const STATUS_MAPPING = {
    "Waiting": "waiting",
    "Called": "called",
    "In service": "in-progress",
    "Completed": "served",
    "No show": "no-show",
    "Cancelled": "cancelled"
};

const FINAL_STATUSES = ["served", "no-show", "cancelled"];

//formatting functions
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

// Escape text before inserting it into HTML
function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]
    );
}

// dashboard stats
function renderStats() {
    const waiting = tickets.filter(
        t => t.status === "waiting"
    ).length;

    const inProgress = tickets.filter(
        t => t.status === "in-progress"
    ).length;

    const served = tickets.filter(
        t => t.status === "served"
    ).length;

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

//ticket filtering
function getFilteredTickets() {
    const status = statusFilter.value;
    const query = queryFilter.value;
    const search = searchInput.value.trim().toLowerCase();

    return tickets.filter(ticket => {

        if (
            status !== "all" &&
            ticket.status !== status
        ) {
            return false;
        }

        if (
            query !== "all" &&
            ticket.query !== query
        ) {
            return false;
        }

        if (search) {
            const haystack = `
                ${ticket.name}
                ${ticket.ticketNumber}
                ${ticket.studentNumber}
            `.toLowerCase();

            if (!haystack.includes(search)) {
                return false;
            }
        }

        return true;
    });
}

//ticket table
function renderTable() {
    const filtered = getFilteredTickets();

    if (filtered.length === 0) {
        tableBody.innerHTML = "";
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;

    tableBody.innerHTML = filtered.map(ticket => {

        const isFinal = FINAL_STATUSES.includes(ticket.status);

        return `
            <tr>
                <td class="cell-ticket">
                    ${escapeHTML(ticket.ticketNumber)}
                </td>

                <td>
                    ${escapeHTML(ticket.name)}
                </td>

                <td>
                    ${escapeHTML(ticket.studentNumber)}
                </td>

                <td>
                    ${escapeHTML(ticket.query)}
                </td>

                <td>
                    <span class="status-pill ${escapeHTML(ticket.status)}">
                        <span class="status-dot"></span>
                        ${escapeHTML(
                            STATUS_LABELS[ticket.status] || ticket.status
                        )}
                    </span>
                </td>

                <td
                    class="time-in-status"
                    data-status-changed="${escapeHTML(
                        ticket.statusChangedAt || ""
                    )}"
                >
                    ${getTimeInStatus(ticket.statusChangedAt)}
                </td>

                <td>
                    ${formatTime(ticket.submittedAt)}
                </td>

                <td>
                    <button
                        class="row-action"
                        data-ticket="${escapeHTML(ticket.ticketNumber)}"
                        ${isFinal ? "disabled" : ""}
                    >
                        ${escapeHTML(
                            ACTION_LABELS[ticket.status] || "Update"
                        )}
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// RENDER DASHBOARD
function renderAll() {
    renderStats();
    renderTable();
}

// ==========================================
// UPDATE TICKET STATUS
// ==========================================

tableBody.addEventListener("click", async event => {

    const button = event.target.closest(".row-action");

    if (
        !button ||
        button.disabled ||
        ticketUpdateInProgress
    ) {
        return;
    }

    const ticketNumber = button.dataset.ticket;

    const ticket = tickets.find(
        t => t.ticketNumber === ticketNumber
    );

    if (!ticket || FINAL_STATUSES.includes(ticket.status)) {
        return;
    }

    button.disabled = true;
    ticketUpdateInProgress = true;

    try {
        const csrfToken = document.querySelector(
            '#csrfForm input[name="csrfmiddlewaretoken"]'
        ).value;

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

        ticket.status = STATUS_MAPPING[result.new_status];
        ticket.statusChangedAt = result.status_changed_at;

        renderAll();

    } catch (error) {
        alert(error.message);

        // Reload the latest database state after a failed update
        ticketUpdateInProgress = false;
        await refreshDashboard();

    } finally {
        ticketUpdateInProgress = false;
    }
});

//filter event listeners
[statusFilter, queryFilter].forEach(element => {
    element.addEventListener("change", renderTable);
});

searchInput.addEventListener("input", renderTable);

//dashboard refresh
async function refreshDashboard() {

    // Prevent overlapping requests
    if (
        dashboardRefreshInProgress ||
        ticketUpdateInProgress
    ) {
        return;
    }

    dashboardRefreshInProgress = true;

    try {
        const response = await fetch(dashboardTicketsUrl, {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Failed to refresh dashboard.");
        }

        const data = await response.json();

        if (!Array.isArray(data.tickets)) {
            throw new Error("Invalid ticket data received.");
        }

        //do not overwrite data while a staff update is running
        if (!ticketUpdateInProgress) {
            tickets = data.tickets;
            renderAll();
        }

    } catch (error) {
        console.error(
            "Dashboard refresh failed:",
            error
        );

    } finally {
        dashboardRefreshInProgress = false;
    }
}

function updateStatusTimers() {
    document.querySelectorAll(".time-in-status").forEach(cell => {
        cell.textContent = getTimeInStatus(
            cell.dataset.statusChanged
        );
    });
}

//Display initial ticket data
renderAll();

setInterval(updateStatusTimers, 10000);

setInterval(refreshDashboard, 5000);
