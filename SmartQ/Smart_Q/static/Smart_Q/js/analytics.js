/*
 * analytics.js
 * SmartQ concept-stage analytics using sample ticket data.
 */

document.addEventListener("DOMContentLoaded", function () {
    const tickets = getTickets();
    
    const QUERY_TYPES = [
        "Access Card",
        "Pay Fees",
        "Registration",
        "Other"
    ];

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

    
    // Summary cards

function renderStats(tickets) {
    const total = tickets.length;

    const waiting = tickets.filter(ticket =>
        String(ticket.status).toLowerCase().trim() === "waiting"
    ).length;

    const inProgress = tickets.filter(ticket =>
        ["in-progress", "in progress"].includes(
            String(ticket.status).toLowerCase().trim()
        )
    ).length;

    const served = tickets.filter(ticket =>
        String(ticket.status).toLowerCase().trim() === "served"
    ).length;

    const percentage = count =>
        total === 0 ? 0 : Math.round((count / total) * 100);

    const stats = [
        {
            id: "totalTickets",
            value: total,
            percentage: total === 0 ? 0 : 100,
            description: "All recorded tickets"
        },
        {
            id: "waitingTickets",
            value: waiting,
            percentage: percentage(waiting),
            description: "Share of total tickets"
        },
        {
            id: "progressTickets",
            value: inProgress,
            percentage: percentage(inProgress),
            description: "Share of total tickets"
        },
        {
            id: "servedTickets",
            value: served,
            percentage: percentage(served),
            description: "Share of total tickets"
        }
    ];

    const progressIds = {
        waitingTickets: "waitingProgress",
        progressTickets: "progressProgress",
        servedTickets: "servedProgress"
    };

    stats.forEach(stat => {
        const valueElement = document.getElementById(stat.id);
        const percentageElement = document.getElementById(
            stat.id + "Percentage"
        );
        const descriptionElement = document.getElementById(
            stat.id + "Description"
        );

        if (valueElement) {
            valueElement.textContent = stat.value;
        }

        if (percentageElement) {
            percentageElement.textContent = stat.percentage + "%";
        }

        if (descriptionElement) {
            descriptionElement.textContent = stat.description;
        }

        const progressElement = document.getElementById(
            progressIds[stat.id]
        );

        if (progressElement) {
            progressElement.style.width = stat.percentage + "%";
        }
    });
}



    
    // Store chart instances so they can be updated without duplicates.
    let queryPieChart = null;
    let statusPieChart = null;

    // Normalise text to count categories consistently.
    function normalise(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-");
    }

    // Queries by Type: pie chart.
    function renderQueryChart() {
        const canvas = document.getElementById("queryChart");
        if (!canvas || typeof Chart === "undefined") return;

        const labels = QUERY_TYPES;
        const counts = labels.map(label =>
            tickets.filter(ticket =>
                normalise(ticket.query) === normalise(label)
            ).length
        );

        if (queryPieChart) {
            queryPieChart.destroy();
        }

        queryPieChart = new Chart(canvas, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{
                    label: "Queries by Type",
                    data: counts,
                    backgroundColor: [
                        "#2563eb",
                        "#16a34a",
                        "#f59e0b",
                        "#dc2626"
                    ],
                    borderColor: "#ffffff",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom"
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data
                                    .reduce((sum, value) => sum + value, 0);
                                const count = context.raw;
                                const percentage = total
                                    ? ((count / total) * 100).toFixed(1)
                                    : "0.0";

                                return `${context.label}: ${count} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Tickets by Status: pie chart.
    function renderStatusChart() {
        const canvas = document.getElementById("statusChart");
        if (!canvas || typeof Chart === "undefined") return;

        const labels = ["Waiting", "In Progress", "Served"];

        const counts = [
            tickets.filter(ticket =>
                normalise(ticket.status) === "waiting"
            ).length,

            tickets.filter(ticket =>
                ["in-progress", "in_progress"].includes(
                    normalise(ticket.status)
                )
            ).length,

            tickets.filter(ticket =>
                normalise(ticket.status) === "served"
            ).length
        ];

        if (statusPieChart) {
            statusPieChart.destroy();
        }

        statusPieChart = new Chart(canvas, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{
                    label: "Tickets by Status",
                    data: counts,
                    backgroundColor: [
                        "#f59e0b",
                        "#2563eb",
                        "#16a34a"
                    ],
                    borderColor: "#ffffff",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom"
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data
                                    .reduce((sum, value) => sum + value, 0);
                                const count = context.raw;
                                const percentage = total
                                    ? ((count / total) * 100).toFixed(1)
                                    : "0.0";

                                return `${context.label}: ${count} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }


    // Horizontal graph: tickets submitted during each hour
    function renderHourChart() {
        const hourlyCounts = Array(24).fill(0);
        
        tickets.forEach(ticket => {
            if (!ticket.submittedAt) return;
            
            const date = new Date(ticket.submittedAt);
            if (Number.isNaN(date.getTime())) return;

        hourlyCounts[date.getHours()]++;
     });

    const container = document.getElementById("hourChart");
    if (!container) return;

    const max = Math.max(1, ...hourlyCounts);

    container.innerHTML = hourlyCounts.map((count, hour) => {
        const width = (count / max) * 100;
        const label = `${String(hour).padStart(2, "0")}:00`;

        return `
            <div class="hbar-row">
                <div class="hbar-label">${label}</div>
                <div class="hbar-track">
                    <div class="hbar-fill"
                         style="width:${width}%"></div>
                    </div>
                <div class="hbar-count">${count}</div>
            </div>
        `;
    }).join("");
}
function renderQueueActivityChart() {
    const canvas = document.getElementById("queueActivityChart");

    if (!canvas || typeof Chart === "undefined") return;

    const hourlyCounts = Array(24).fill(0);

    tickets.forEach(ticket => {
        if (!ticket.submittedAt) return;

        const date = new Date(ticket.submittedAt);

        if (Number.isNaN(date.getTime())) return;

        hourlyCounts[date.getHours()]++;
    });

    // Avoid creating duplicate charts if the function runs again.
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

    new Chart(canvas, {
        type: "line",
        data: {
            labels: Array.from(
                { length: 24 },
                (_, hour) => `${String(hour).padStart(2, "0")}:00`
            ),
            datasets: [{
                label: "Tickets submitted",
                data: hourlyCounts,
                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.15)",
                fill: true,
                tension: 0.3,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: "index"
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Hour of day"
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                    title: {
                        display: true,
                        text: "Number of tickets"
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}
function renderPerformanceKPIs(tickets) {
    // Use local calendar dates for today's and yesterday's tickets.
    const now = new Date();

    const startOfDay = new Date(
        now.getFullYear(), now.getMonth(), now.getDate()
    );

    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const normalise = value =>
        String(value || "").trim().toLowerCase().replace(/\s+/g, "-");

    // Support common timestamp field names.
    function getDate(ticket, fields) {
        for (const field of fields) {
            if (!ticket[field]) continue;

            const date = new Date(ticket[field]);

            if (!Number.isNaN(date.getTime())) {
                return date;
            }
        }

        return null;
    }

    const submittedFields = [
        "submittedAt", "createdAt", "created_at"
    ];

    const serviceStartFields = [
        "serviceStartedAt", "serviceStartAt",
        "startedAt", "service_started_at"
    ];

    const serviceEndFields = [
        "servedAt", "completedAt",
        "serviceEndedAt", "completed_at"
    ];

    const todayTickets = tickets.filter(ticket => {
        const date = getDate(ticket, submittedFields);
        return date && date >= startOfDay && date <= now;
    });

    const yesterdayTickets = tickets.filter(ticket => {
        const date = getDate(ticket, submittedFields);
        return date &&
            date >= startOfYesterday &&
            date < startOfDay;
    });

    // Compare today's total with yesterday's total.
    const todayCount = todayTickets.length;
    const yesterdayCount = yesterdayTickets.length;

    let changeText = "N/A";

    if (yesterdayCount > 0) {
        const change = Math.round(
            ((todayCount - yesterdayCount) / yesterdayCount) * 100
        );

        changeText = `${change > 0 ? "+" : ""}${change}%`;
    } else if (todayCount > 0) {
        changeText = "New activity";
    } else {
        changeText = "No tickets";
    }

    document.getElementById("ticketsToday").textContent = todayCount;
    document.getElementById("ticketsTodayChange").textContent = changeText;

    // Average waiting time: submission to service start.
    const waitingMinutes = tickets
        .map(ticket => {
            const submitted = getDate(ticket, submittedFields);
            const started = getDate(ticket, serviceStartFields);

            if (!submitted || !started || started < submitted) {
                return null;
            }

            return (started - submitted) / 60000;
        })
        .filter(minutes => minutes !== null);

    // Average service time: service start to completion.
    const serviceMinutes = tickets
        .map(ticket => {
            const started = getDate(ticket, serviceStartFields);
            const ended = getDate(ticket, serviceEndFields);

            if (
                normalise(ticket.status) !== "served" ||
                !started || !ended || ended < started
            ) {
                return null;
            }

            return (ended - started) / 60000;
        })
        .filter(minutes => minutes !== null);

    function formatMinutes(minutes) {
        if (!minutes.length) return "N/A";

        const average =
            minutes.reduce((sum, value) => sum + value, 0) /
            minutes.length;

        if (average < 60) {
            return `${Math.round(average)} min`;
        }

        const hours = Math.floor(average / 60);
        const remainingMinutes = Math.round(average % 60);

        return `${hours}h ${remainingMinutes}m`;
    }

    document.getElementById("averageWaitingTime").textContent =
        formatMinutes(waitingMinutes);

    document.getElementById("averageServiceTime").textContent =
        formatMinutes(serviceMinutes);

    // Completion rate across all recorded tickets.
    const servedCount = tickets.filter(ticket =>
        normalise(ticket.status) === "served"
    ).length;

    const completionRate = tickets.length
        ? Math.round((servedCount / tickets.length) * 100)
        : 0;

    document.getElementById("serviceCompletionRate").textContent =
        `${completionRate}%`;

    document.getElementById("completionTotal").textContent =
        `${servedCount} of ${tickets.length} tickets`;
}

    // Sign Out: redirect to the Django home route
    const signOutButton = document.getElementById("signOutBtn");

    if (signOutButton) {
        signOutButton.addEventListener("click", function () {
            window.location.href = "/";
        });
    }

    renderStats(tickets);
    renderPerformanceKPIs(tickets);
    renderQueryChart();
    renderStatusChart();
    renderHourChart();
    renderQueueActivityChart();

    console.log("SmartQ analytics rendered for", tickets.length, "sample tickets.");
});
