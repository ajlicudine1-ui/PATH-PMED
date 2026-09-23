// ============================================
// PATH - PUBLIC VIEWER DASHBOARD
// ============================================


// ============================================
// ELEMENTS
// ============================================

const viewerTotalPersonnel =
    document.getElementById(
        "totalPersonnel"
    );

const viewerTotalTeams =
    document.getElementById(
        "totalTeams"
    );

const viewerTotalAssignments =
    document.getElementById(
        "totalAssignments"
    );

const viewerTableBody =
    document.getElementById(
        "viewerTableBody"
    );

const viewerEmploymentStatusFilter =
    document.getElementById(
        "employmentStatusFilter"
    );




// ============================================
// VIEWER CALENDAR ELEMENTS
// ============================================

const viewerCalendarGrid =
    document.getElementById(
        "viewerCalendarGrid"
    );

const viewerCalendarMonthLabel =
    document.getElementById(
        "viewerCalendarMonthLabel"
    );

const viewerPreviousMonthBtn =
    document.getElementById(
        "viewerPreviousMonthBtn"
    );

const viewerNextMonthBtn =
    document.getElementById(
        "viewerNextMonthBtn"
    );

const viewerActivityModal =
    document.getElementById(
        "viewerActivityModal"
    );

const viewerCloseActivityModal =
    document.getElementById(
        "viewerCloseActivityModal"
    );

const viewerCloseActivityButton =
    document.getElementById(
        "viewerCloseActivityButton"
    );

const viewerActivityTitle =
    document.getElementById(
        "viewerActivityTitle"
    );

const viewerActivityDate =
    document.getElementById(
        "viewerActivityDate"
    );

const viewerActivityTime =
    document.getElementById(
        "viewerActivityTime"
    );

const viewerActivitySection =
    document.getElementById(
        "viewerActivitySection"
    );

const viewerActivityDescription =
    document.getElementById(
        "viewerActivityDescription"
    );


// ============================================
// STATE
// ============================================

let viewerAssignments = [];

let viewerCalendarCurrentDate =
    new Date();

let viewerCalendarActivities =
    [];


// ============================================
// LOAD VIEWER DASHBOARD
// ============================================

async function loadViewerDashboard() {

    try {

        const response =
            await fetch(
                "/api/dashboard",
                {
                    cache: "no-store"
                }
            );

        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load dashboard."
            );
        }


        if (viewerTotalPersonnel) {

            viewerTotalPersonnel.textContent =
                data.totalPersonnel ?? 0;
        }


        if (viewerTotalTeams) {

            viewerTotalTeams.textContent =
                data.totalTeams ?? 0;
        }


        if (viewerTotalAssignments) {

            viewerTotalAssignments.textContent =
                data.totalAssignments ?? 0;
        }


        viewerAssignments =
            Array.isArray(data.assignments)
                ? data.assignments
                : [];


        applyViewerDashboardFilter();


    } catch (error) {

        console.error(
            "Viewer dashboard error:",
            error
        );


        if (viewerTableBody) {

            viewerTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="4"
                        class="empty-state"
                    >
                        ${escapeViewerHTML(
                            error.message
                        )}
                    </td>
                </tr>
            `;
        }
    }
}


// ============================================
// NORMALIZE PERSON NAME
// ============================================

function normalizeViewerDashboardName(name) {

    return String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[.,]/g, "")
        .replace(/\s+/g, " ");
}


// ============================================
// GROUP ASSIGNMENTS BY PERSON
// ============================================

function groupViewerDashboardAssignments(records) {

    const groups =
        new Map();


    records.forEach(record => {

        const personnel =
            record.personnel || {};


        const fullName =
            personnel.full_name || "";


        const key =
            normalizeViewerDashboardName(
                fullName
            ) ||
            `assignment-${record.id}`;


        if (!groups.has(key)) {

            groups.set(
                key,
                {
                    fullName,
                    records: []
                }
            );
        }


        groups
            .get(key)
            .records
            .push(record);
    });


    return Array.from(
        groups.values()
    );
}


// ============================================
// FILTER BY EMPLOYMENT STATUS
// ============================================

function applyViewerDashboardFilter() {

    const selectedStatus =
        String(
            viewerEmploymentStatusFilter?.value || ""
        )
            .trim()
            .toLowerCase();


    const filtered =
        viewerAssignments.filter(
            record => {

                const employmentStatus =
                    String(
                        record.personnel
                            ?.employment_status ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                return (
                    !selectedStatus ||
                    employmentStatus ===
                        selectedStatus
                );
            }
        );


    renderViewerAssignments(
        filtered
    );
}


viewerEmploymentStatusFilter
    ?.addEventListener(
        "change",
        applyViewerDashboardFilter
    );


// ============================================
// RENDER ASSIGNMENTS
// ============================================

function renderViewerAssignments(records) {

    if (!viewerTableBody) {

        return;
    }


    if (!records.length) {

        viewerTableBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty-state"
                >
                    No assignments found.
                </td>
            </tr>
        `;

        return;
    }


    const groupedRecords =
        groupViewerDashboardAssignments(
            records
        );


    viewerTableBody.innerHTML =
        groupedRecords
            .map(group => {

                const rowCount =
                    group.records.length;


                return group.records
                    .map(
                        (record, index) => {

                            const personnel =
                                record.personnel || {};

                            const team =
                                record.teams || {};

                            const designation =
                                record.designation ||
                                personnel.designation ||
                                "";

                            const responsiblePersonCell =
                                index === 0
                                    ? `
                                        <td
                                            rowspan="${rowCount}"
                                            class="viewer-dashboard-grouped-person-cell"
                                        >
                                            ${escapeViewerHTML(
                                                group.fullName
                                            )}
                                        </td>
                                    `
                                    : "";


                            return `
                                <tr>

                                    ${responsiblePersonCell}

                                    <td>
                                        ${escapeViewerHTML(
                                            designation
                                        )}
                                    </td>

                                    <td>
                                        ${formatViewerDashboardActivityDisplay(
                                            record.functions_activities || ""
                                        )}
                                    </td>

                                    <td>
                                        ${escapeViewerHTML(
                                            team.code || ""
                                        )}
                                    </td>

                                </tr>
                            `;
                        }
                    )
                    .join("");
            })
            .join("");
}




// ============================================
// VIEWER CALENDAR HELPERS
// ============================================

function padViewerCalendarNumber(value) {

    return String(value)
        .padStart(2, "0");
}


function formatViewerCalendarDate(date) {

    return [
        date.getFullYear(),
        padViewerCalendarNumber(
            date.getMonth() + 1
        ),
        padViewerCalendarNumber(
            date.getDate()
        )
    ].join("-");
}


function formatViewerActivityTime(value) {

    if (!value) {
        return "";
    }


    const parts =
        String(value)
            .split(":");


    if (parts.length < 2) {
        return value;
    }


    const hour =
        Number(parts[0]);

    const minute =
        parts[1];

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    const displayHour =
        hour % 12 || 12;


    return `${displayHour}:${minute} ${suffix}`;
}


function getViewerCalendarMonthRange() {

    const year =
        viewerCalendarCurrentDate
            .getFullYear();

    const month =
        viewerCalendarCurrentDate
            .getMonth();


    return {
        start:
            formatViewerCalendarDate(
                new Date(
                    year,
                    month,
                    1
                )
            ),

        end:
            formatViewerCalendarDate(
                new Date(
                    year,
                    month + 1,
                    0
                )
            )
    };
}


// ============================================
// LOAD VIEWER CALENDAR
// ============================================

async function loadViewerCalendarActivities() {

    if (!viewerCalendarGrid) {
        return;
    }


    const {
        start,
        end
    } =
        getViewerCalendarMonthRange();


    try {

        const response =
            await fetch(
                `/api/activities?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
                {
                    cache: "no-store"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to load calendar activities."
            );
        }


        viewerCalendarActivities =
            Array.isArray(result)
                ? result
                : [];


        renderViewerCalendar();


    } catch (error) {

        console.error(
            "Viewer calendar error:",
            error
        );


        viewerCalendarGrid.innerHTML = `
            <div class="calendar-error">
                ${escapeViewerHTML(
                    error.message
                )}
            </div>
        `;
    }
}



// ============================================
// VIEWER CALENDAR INTERACTION STYLES
// Whole occupied date cell is clickable.
// ============================================

function ensureViewerCalendarInteractionStyles() {

    if (
        document.getElementById(
            "pathViewerCalendarInteractionStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "pathViewerCalendarInteractionStyles";


    style.textContent = `
        .viewer-calendar-card
        .calendar-day-has-activity {
            cursor: pointer;

            background:
                linear-gradient(
                    180deg,
                    #ffffff 0%,
                    #f7fcf8 100%
                );

            transition:
                background 0.16s ease,
                box-shadow 0.16s ease;
        }

        .viewer-calendar-card
        .calendar-day-has-activity:hover {
            background:
                linear-gradient(
                    180deg,
                    #eef8f1 0%,
                    #f7fcf8 100%
                );

            box-shadow:
                inset 0 0 0 2px
                rgba(31, 122, 69, 0.18);
        }

        .viewer-calendar-card
        .calendar-day-has-activity:focus-visible {
            outline:
                2px solid #1f7a45;

            outline-offset:
                -2px;
        }

        .viewer-calendar-card
        .calendar-activity {
            width: 100%;

            border:
                1px solid #d5e7db;

            border-radius: 7px;

            background:
                #edf7f0;

            color:
                #14532d;
        }
    `;


    document.head.appendChild(
        style
    );
}


// ============================================
// RENDER VIEWER CALENDAR
// ============================================

function renderViewerCalendar() {

    if (
        !viewerCalendarGrid ||
        !viewerCalendarMonthLabel
    ) {
        return;
    }


    ensureViewerCalendarInteractionStyles();


    const year =
        viewerCalendarCurrentDate
            .getFullYear();

    const month =
        viewerCalendarCurrentDate
            .getMonth();


    viewerCalendarMonthLabel.textContent =
        viewerCalendarCurrentDate
            .toLocaleDateString(
                undefined,
                {
                    month: "long",
                    year: "numeric"
                }
            );


    const firstDay =
        new Date(
            year,
            month,
            1
        );

    const totalDays =
        new Date(
            year,
            month + 1,
            0
        )
            .getDate();

    const leadingDays =
        firstDay.getDay();

    const today =
        formatViewerCalendarDate(
            new Date()
        );


    const cells = [];


    for (
        let index = 0;
        index < leadingDays;
        index += 1
    ) {

        cells.push(`
            <div
                class="calendar-day calendar-day-empty"
                aria-hidden="true"
            ></div>
        `);
    }


    for (
        let day = 1;
        day <= totalDays;
        day += 1
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );

        const dateString =
            formatViewerCalendarDate(
                date
            );


        const dayActivities =
            viewerCalendarActivities.filter(
                activity =>
                    activity.activity_date ===
                    dateString
            );


        const activityHTML =
            dayActivities
                .map(activity => {

                    const time =
                        formatViewerActivityTime(
                            activity.start_time
                        );

                    const teamCode =
                        activity.teams?.code ||
                        "";


                    return `
                        <button
                            type="button"
                            class="calendar-activity viewer-calendar-activity"
                            data-activity-id="${escapeViewerHTML(
                                activity.id
                            )}"
                        >
                            ${
                                time
                                    ? `<span class="calendar-activity-time">${escapeViewerHTML(time)}</span>`
                                    : ""
                            }

                            <span class="calendar-activity-title">
                                ${escapeViewerHTML(
                                    activity.title
                                )}
                            </span>

                            ${
                                teamCode
                                    ? `<span class="calendar-activity-team">${escapeViewerHTML(teamCode)}</span>`
                                    : ""
                            }
                        </button>
                    `;
                })
                .join("");


        const firstActivityId =
            dayActivities.length
                ? dayActivities[0].id
                : "";


        cells.push(`
            <div
                class="calendar-day ${
                    dateString === today
                        ? "calendar-day-today"
                        : ""
                } ${
                    dayActivities.length
                        ? "calendar-day-has-activity"
                        : ""
                }"
                ${
                    firstActivityId
                        ? `data-activity-id="${escapeViewerHTML(firstActivityId)}"`
                        : ""
                }
                ${
                    firstActivityId
                        ? 'role="button" tabindex="0"'
                        : ""
                }
            >

                <div class="calendar-day-number">
                    ${day}
                </div>

                <div class="calendar-day-activities">
                    ${activityHTML}
                </div>

            </div>
        `);
    }


    viewerCalendarGrid.innerHTML =
        cells.join("");
}


// ============================================
// VIEWER CALENDAR NAVIGATION
// ============================================

viewerPreviousMonthBtn?.addEventListener(
    "click",
    async () => {

        viewerCalendarCurrentDate =
            new Date(
                viewerCalendarCurrentDate
                    .getFullYear(),
                viewerCalendarCurrentDate
                    .getMonth() - 1,
                1
            );


        await loadViewerCalendarActivities();
    }
);


viewerNextMonthBtn?.addEventListener(
    "click",
    async () => {

        viewerCalendarCurrentDate =
            new Date(
                viewerCalendarCurrentDate
                    .getFullYear(),
                viewerCalendarCurrentDate
                    .getMonth() + 1,
                1
            );


        await loadViewerCalendarActivities();
    }
);


// ============================================
// VIEW ACTIVITY DETAILS
// ============================================

function openViewerActivityModal(activity) {

    if (!activity) {
        return;
    }


    viewerActivityTitle.textContent =
        activity.title ||
        "Activity";

    viewerActivityDate.textContent =
        activity.activity_date ||
        "-";


    const startTime =
        formatViewerActivityTime(
            activity.start_time
        );

    const endTime =
        formatViewerActivityTime(
            activity.end_time
        );


    viewerActivityTime.textContent =
        startTime && endTime
            ? `${startTime} - ${endTime}`
            : startTime ||
              endTime ||
              "No time specified";


    viewerActivitySection.textContent =
        activity.teams?.code
            ? `${activity.teams.code} - ${activity.teams.name || ""}`
            : "All PMED / General";


    viewerActivityDescription.textContent =
        activity.description ||
        "No description provided.";


    viewerActivityModal?.classList.add(
        "show"
    );

    document.body.style.overflow =
        "hidden";
}


function closeViewerActivityModalWindow() {

    viewerActivityModal?.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";
}


viewerCalendarGrid?.addEventListener(
    "click",
    event => {

        const activityTarget =
            event.target.closest(
                "[data-activity-id]"
            );


        if (!activityTarget) {
            return;
        }


        event.preventDefault();
        event.stopPropagation();


        const activity =
            viewerCalendarActivities.find(
                item =>
                    String(item.id) ===
                    String(
                        activityTarget.dataset
                            .activityId
                    )
            );


        openViewerActivityModal(
            activity
        );
    }
);


// Keyboard support for date cells that contain activities.
viewerCalendarGrid?.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Enter" &&
            event.key !== " "
        ) {
            return;
        }


        const activityTarget =
            event.target.closest(
                ".calendar-day-has-activity[data-activity-id]"
            );


        if (!activityTarget) {
            return;
        }


        event.preventDefault();


        const activity =
            viewerCalendarActivities.find(
                item =>
                    String(item.id) ===
                    String(
                        activityTarget.dataset
                            .activityId
                    )
            );


        openViewerActivityModal(
            activity
        );
    }
);


viewerCloseActivityModal?.addEventListener(
    "click",
    closeViewerActivityModalWindow
);


viewerCloseActivityButton?.addEventListener(
    "click",
    closeViewerActivityModalWindow
);


viewerActivityModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            viewerActivityModal
        ) {

            closeViewerActivityModalWindow();
        }
    }
);


// ============================================
// ESCAPE HTML
// ============================================

function escapeViewerHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================
// START
// ============================================

loadViewerDashboard();

loadViewerCalendarActivities();



// ============================================
// CLOSE VIEWER ACTIVITY MODAL WITH ESCAPE
// ============================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            viewerActivityModal?.classList.contains(
                "show"
            )
        ) {

            closeViewerActivityModalWindow();
        }
    }
);
