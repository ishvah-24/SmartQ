/*
  analytics.js
  Concept-stage analytics. Derives simple counts from the in-memory
  dummyTickets array (dummy-data.js). No backend — purely illustrative.
*/

const tickets = getTickets();

const QUERY_TYPES = ["Access Card", "Pay Fees", "Registration", "Other"];
const STATUSES = ["waiting", "in-progress", "served"];
const STATUS_LABELS = {
  waiting: "Waiting",
  "in-progress": "In Progress",
  served: "Served"
};

function countBy(items, keyFn) {
  const counts = {};
  items.forEach(item => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function renderStats() {
  const total = tickets.length;
  const queryCounts = countBy(tickets, t => t.query);
  const topQuery = Object.entries(queryCounts).sort((a, b) => b[1] - a[1])[0];
  const waiting = tickets.filter(t => t.status === "waiting").length;

  // Illustrative "average wait" — for a real system this would come
  // from timestamps between submission and being served.
  const avgWaitMinutes = 12;

  document.getElementById("statRow").innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Tickets Today</div>
      <div class="stat-value">${total}</div>
    </div>
    <div class="stat-card accent">
      <div class="stat-label">Most Common Query</div>
      <div class="stat-value">${topQuery ? topQuery[0] : "—"}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Currently Waiting</div>
      <div class="stat-value">${waiting}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg. Wait Time</div>
      <div class="stat-value">${avgWaitMinutes}m</div>
    </div>
  `;
}

function renderQueryChart() {
  const counts = countBy(tickets, t => t.query);
  const max = Math.max(1, ...QUERY_TYPES.map(q => counts[q] || 0));

  document.getElementById("queryChart").innerHTML = QUERY_TYPES.map(q => {
    const count = counts[q] || 0;
    const heightPct = Math.round((count / max) * 100);
    return `
      <div class="bar-item">
        <div class="bar-count">${count}</div>
        <div class="bar-fill" style="height:${Math.max(heightPct, 4)}%"></div>
        <div class="bar-label">${q}</div>
      </div>
    `;
  }).join("");
}

function renderStatusChart() {
  const counts = countBy(tickets, t => t.status);
  const max = Math.max(1, ...STATUSES.map(s => counts[s] || 0));

  document.getElementById("statusChart").innerHTML = STATUSES.map(s => {
    const count = counts[s] || 0;
    const heightPct = Math.round((count / max) * 100);
    return `
      <div class="bar-item">
        <div class="bar-count">${count}</div>
        <div class="bar-fill" style="height:${Math.max(heightPct, 4)}%"></div>
        <div class="bar-label">${STATUS_LABELS[s]}</div>
      </div>
    `;
  }).join("");
}

function renderHourChart() {
  const counts = countBy(tickets, t => {
    const date = new Date(t.submittedAt);
    return date.getHours();
  });

  const hours = Object.keys(counts).map(Number).sort((a, b) => a - b);
  const max = Math.max(1, ...hours.map(h => counts[h]));

  document.getElementById("hourChart").innerHTML = hours.map(h => {
    const count = counts[h];
    const widthPct = Math.round((count / max) * 100);
    const label = `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;
    return `
      <div class="hbar-row">
        <div class="hbar-label">${label}</div>
        <div class="hbar-track">
          <div class="hbar-fill" style="width:${Math.max(widthPct, 6)}%"></div>
        </div>
        <div class="hbar-count">${count}</div>
      </div>
    `;
  }).join("");
}

document.getElementById("signOutBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});

renderStats();
renderQueryChart();
renderStatusChart();
renderHourChart();
