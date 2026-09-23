// ============================================
// PATH - DASHBOARD
// ============================================


// ============================================
// DASHBOARD ELEMENTS
// ============================================

const totalPersonnelElement =
    document.getElementById("totalPersonnel");

const totalTeamsElement =
    document.getElementById("totalTeams");

const totalAssignmentsElement =
    document.getElementById("totalAssignments");

const dashboardTableBody =
    document.getElementById("dashboardTableBody");

const dashboardEmploymentStatusFilter =
    document.getElementById(
        "dashboardEmploymentStatusFilter"
    );


// ============================================
// VIEW ELEMENTS
// ============================================

const manageSectionsBtn =
    document.getElementById("manageSectionsBtn");

const recentAssignmentsView =
    document.getElementById("recentAssignmentsView");

const manageSectionsView =
    document.getElementById("manageSectionsView");

const sectionsTableBody =
    document.getElementById("sectionsTableBody");


// ============================================
// SECTION FORM ELEMENTS
// ============================================

const addSectionBtn =
    document.getElementById("addSectionBtn");

const sectionModal =
    document.getElementById("sectionModal");

const sectionModalTitle =
    document.getElementById("sectionModalTitle");

const sectionModalDescription =
    document.getElementById("sectionModalDescription");

const closeSectionModal =
    document.getElementById("closeSectionModal");

const cancelSection =
    document.getElementById("cancelSection");

const sectionForm =
    document.getElementById("sectionForm");

const sectionCodeInput =
    document.getElementById("sectionCode");

const sectionNameInput =
    document.getElementById("sectionName");

const saveSectionButton =
    document.getElementById("saveSection");




// ============================================
// CALENDAR ELEMENTS
// ============================================

const calendarGrid =
    document.getElementById(
        "calendarGrid"
    );

const calendarMonthLabel =
    document.getElementById(
        "calendarMonthLabel"
    );

const previousMonthBtn =
    document.getElementById(
        "previousMonthBtn"
    );

const nextMonthBtn =
    document.getElementById(
        "nextMonthBtn"
    );

const addActivityBtn =
    document.getElementById(
        "addActivityBtn"
    );

const activityModal =
    document.getElementById(
        "activityModal"
    );

const activityModalTitle =
    document.getElementById(
        "activityModalTitle"
    );

const activityModalDescription =
    document.getElementById(
        "activityModalDescription"
    );

const closeActivityModal =
    document.getElementById(
        "closeActivityModal"
    );

const cancelActivity =
    document.getElementById(
        "cancelActivity"
    );

const activityForm =
    document.getElementById(
        "activityForm"
    );

const activityTitleInput =
    document.getElementById(
        "activityTitle"
    );

const activityDateInput =
    document.getElementById(
        "activityDate"
    );

const activityTeamInput =
    document.getElementById(
        "activityTeam"
    );

const activityStartTimeInput =
    document.getElementById(
        "activityStartTime"
    );

const activityEndTimeInput =
    document.getElementById(
        "activityEndTime"
    );

const activityDescriptionInput =
    document.getElementById(
        "activityDescription"
    );

const deleteActivityBtn =
    document.getElementById(
        "deleteActivityBtn"
    );

const saveActivityBtn =
    document.getElementById(
        "saveActivityBtn"
    );


// ============================================
// STATE
// ============================================

let currentDashboardView =
    "assignments";

let sectionFormMode =
    "add";

let selectedSectionId =
    null;

let calendarCurrentDate =
    new Date();

let calendarActivities = [];

let selectedActivityId =
    null;

let activityFormMode =
    "add";

let activityTeamsLoaded =
    false;

let activityTeamsLoadingPromise =
    null;

let dashboardAssignments = [];


// ============================================
// LOAD DASHBOARD
// ============================================

async function loadDashboard() {

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


        if (totalPersonnelElement) {

            totalPersonnelElement.textContent =
                data.totalPersonnel ?? 0;
        }


        if (totalTeamsElement) {

            totalTeamsElement.textContent =
                data.totalTeams ?? 0;
        }


        if (totalAssignmentsElement) {

            totalAssignmentsElement.textContent =
                data.totalAssignments ?? 0;
        }


        dashboardAssignments =
            Array.isArray(data.assignments)
                ? data.assignments
                : [];

        applyDashboardEmploymentStatusFilter();

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}


// ============================================
// FILTER BY EMPLOYMENT STATUS
// ============================================

function applyDashboardEmploymentStatusFilter() {

    const selectedStatus =
        String(
            dashboardEmploymentStatusFilter?.value || ""
        )
            .trim()
            .toLowerCase();


    const filtered =
        dashboardAssignments.filter(
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


    renderDashboardAssignments(
        filtered
    );
}


dashboardEmploymentStatusFilter
    ?.addEventListener(
        "change",
        applyDashboardEmploymentStatusFilter
    );





// ============================================
// FORMAT FUNCTIONS / ACTIVITIES FOR DISPLAY
// Preserves line breaks and blank lines,
// while removing unwanted leading spaces/tabs.
// ============================================

function formatDashboardActivityDisplay(value) {

    const normalized =
        String(value || "")
            .replace(/\r\n/g, "\n")
            .split("\n")
            .map(line => line.trimStart())
            .join("\n")
            .trim();


    return escapeDashboardHTML(
        normalized
    )
        .replace(/\n/g, "<br>");
}


// ============================================
// RENDER ASSIGNMENTS
// ============================================

function normalizeDashboardPersonName(name) {

    return String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[.,]/g, "")
        .replace(/\s+/g, " ");
}


function groupDashboardAssignmentsByPerson(records) {

    const groups = new Map();


    records.forEach(record => {

        const personnel =
            record.personnel || {};


        const fullName =
            personnel.full_name || "";


        const key =
            normalizeDashboardPersonName(
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


function renderDashboardAssignments(records) {

    if (!dashboardTableBody) {
        return;
    }


    if (!records.length) {

        dashboardTableBody.innerHTML = `
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
        groupDashboardAssignmentsByPerson(
            records
        );


    dashboardTableBody.innerHTML =
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
                                            class="dashboard-grouped-person-cell"
                                        >
                                            ${escapeDashboardHTML(
                                                group.fullName
                                            )}
                                        </td>
                                    `
                                    : "";


                            return `
                                <tr>

                                    ${responsiblePersonCell}

                                    <td>
                                        ${escapeDashboardHTML(
                                            designation
                                        )}
                                    </td>

                                    <td>
                                        ${formatDashboardActivityDisplay(
                                            record.functions_activities || ""
                                        )}
                                    </td>

                                    <td>
                                        ${escapeDashboardHTML(
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
// SWITCH DASHBOARD VIEW
// ============================================

manageSectionsBtn?.addEventListener(
    "click",
    async () => {

        if (
            currentDashboardView ===
            "assignments"
        ) {

            currentDashboardView =
                "sections";


            recentAssignmentsView
                ?.classList
                .add("hidden");


            manageSectionsView
                ?.classList
                .remove("hidden");


            manageSectionsBtn.textContent =
                "Recent Assignments";


            await loadSections();


        } else {

            currentDashboardView =
                "assignments";


            manageSectionsView
                ?.classList
                .add("hidden");


            recentAssignmentsView
                ?.classList
                .remove("hidden");


            manageSectionsBtn.textContent =
                "Manage Sections";
        }
    }
);


// ============================================
// LOAD SECTIONS
// ============================================

async function loadSections() {

    if (!sectionsTableBody) {
        return;
    }


    sectionsTableBody.innerHTML = `
        <tr>

            <td
                colspan="3"
                class="empty-state"
            >
                Loading sections...
            </td>

        </tr>
    `;


    try {

        const response =
            await fetch(
                "/api/teams",
                {
                    cache: "no-store"
                }
            );


        const teams =
            await response.json();


        if (!response.ok) {

            throw new Error(
                teams.error ||
                "Unable to load sections."
            );
        }


        if (
            !Array.isArray(teams) ||
            !teams.length
        ) {

            sectionsTableBody.innerHTML = `
                <tr>

                    <td
                        colspan="3"
                        class="empty-state"
                    >
                        No sections found.
                    </td>

                </tr>
            `;

            return;
        }


        sectionsTableBody.innerHTML =
            teams
                .map(team => {

                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${escapeDashboardHTML(
                                        team.code
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeDashboardHTML(
                                    team.name
                                )}
                            </td>

                            <td>

                                <div class="section-actions">

                                    <button
                                        type="button"
                                        class="edit-section-button"
                                        data-id="${team.id}"
                                        data-code="${escapeDashboardHTML(
                                            team.code
                                        )}"
                                        data-name="${escapeDashboardHTML(
                                            team.name
                                        )}"
                                    >
                                        Edit
                                    </button>


                                    <button
                                        type="button"
                                        class="delete-section-button"
                                        data-id="${team.id}"
                                        data-code="${escapeDashboardHTML(
                                            team.code
                                        )}"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;
                })
                .join("");


    } catch (error) {

        sectionsTableBody.innerHTML = `
            <tr>

                <td
                    colspan="3"
                    class="empty-state"
                >
                    ${escapeDashboardHTML(
                        error.message
                    )}
                </td>

            </tr>
        `;
    }
}


// ============================================
// OPEN ADD SECTION
// ============================================

addSectionBtn?.addEventListener(
    "click",
    () => {

        sectionFormMode =
            "add";

        selectedSectionId =
            null;


        sectionModalTitle.textContent =
            "Add Section";


        sectionModalDescription.textContent =
            "Add a new PMED section or division.";


        saveSectionButton.textContent =
            "Save Section";


        sectionForm.reset();


        sectionModal.classList.add(
            "show"
        );


        document.body.style.overflow =
            "hidden";


        sectionCodeInput.focus();
    }
);


// ============================================
// OPEN EDIT SECTION
// ============================================

sectionsTableBody?.addEventListener(
    "click",
    event => {

        const editButton =
            event.target.closest(
                ".edit-section-button"
            );


        if (!editButton) {
            return;
        }


        sectionFormMode =
            "edit";


        selectedSectionId =
            editButton.dataset.id;


        sectionModalTitle.textContent =
            "Edit Section";


        sectionModalDescription.textContent =
            "Update the PMED section information.";


        sectionCodeInput.value =
            editButton.dataset.code || "";


        sectionNameInput.value =
            editButton.dataset.name || "";


        saveSectionButton.textContent =
            "Save Changes";


        sectionModal.classList.add(
            "show"
        );


        document.body.style.overflow =
            "hidden";


        sectionCodeInput.focus();
    }
);


// ============================================
// CLOSE MODAL
// ============================================

function closeSectionModalWindow() {

    sectionModal?.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";


    sectionForm?.reset();


    sectionFormMode =
        "add";


    selectedSectionId =
        null;


    if (saveSectionButton) {

        saveSectionButton.disabled =
            false;

        saveSectionButton.textContent =
            "Save Section";
    }
}


closeSectionModal?.addEventListener(
    "click",
    closeSectionModalWindow
);


cancelSection?.addEventListener(
    "click",
    closeSectionModalWindow
);


sectionModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            sectionModal
        ) {

            closeSectionModalWindow();
        }
    }
);


// ============================================
// ADD / UPDATE SECTION
// ============================================

sectionForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const code =
            sectionCodeInput
                .value
                .trim()
                .toUpperCase();


        const name =
            sectionNameInput
                .value
                .trim();


        if (!code || !name) {

            alert(
                "Please complete all required fields."
            );

            return;
        }


        try {

            saveSectionButton.disabled =
                true;


            saveSectionButton.textContent =
                sectionFormMode === "edit"
                    ? "Saving..."
                    : "Saving...";


            let endpoint =
                "/api/teams";


            let method =
                "POST";


            if (
                sectionFormMode === "edit"
            ) {

                endpoint =
                    `/api/teams/${selectedSectionId}`;

                method =
                    "PUT";
            }


            const headers =
                await getAdminAuthHeaders();


            const response =
                await fetch(
                    endpoint,
                    {
                        method,

                        headers,

                        body: JSON.stringify({
                            code,
                            name
                        })
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Unable to save section."
                );
            }


            closeSectionModalWindow();


            await refreshSidebarAfterSectionChange();


            await loadDashboard();


            if (
                currentDashboardView ===
                "sections"
            ) {

                await loadSections();
            }


        } catch (error) {

            console.error(
                "Save section error:",
                error
            );


            alert(
                error.message
            );


        } finally {

            saveSectionButton.disabled =
                false;
        }
    }
);


// ============================================
// DELETE SECTION
// ============================================

sectionsTableBody?.addEventListener(
    "click",
    async event => {

        const deleteButton =
            event.target.closest(
                ".delete-section-button"
            );


        if (!deleteButton) {
            return;
        }


        const id =
            deleteButton.dataset.id;


        const code =
            deleteButton.dataset.code;


        const confirmed =
            confirm(
                `Are you sure you want to delete ${code}?`
            );


        if (!confirmed) {
            return;
        }


        try {

            deleteButton.disabled =
                true;


            deleteButton.textContent =
                "Deleting...";


            const headers =
                await getAdminAuthHeaders(false);


            const response =
                await fetch(
                    `/api/teams/${id}`,
                    {
                        method: "DELETE",
                        headers
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Unable to delete section."
                );
            }


            await refreshSidebarAfterSectionChange();


            await loadDashboard();


            await loadSections();


        } catch (error) {

            console.error(
                "Delete section error:",
                error
            );


            alert(
                error.message
            );


            deleteButton.disabled =
                false;


            deleteButton.textContent =
                "Delete";
        }
    }
);


// ============================================
// REFRESH SIDEBAR
// ============================================

async function refreshSidebarAfterSectionChange() {

    try {

        const response =
            await fetch(
                "/api/teams",
                {
                    cache: "no-store"
                }
            );


        const teams =
            await response.json();


        if (
            response.ok &&
            Array.isArray(teams)
        ) {

            localStorage.setItem(
                "path_sidebar_teams",
                JSON.stringify(teams)
            );
        }


        if (
            typeof refreshAdminTeams ===
            "function"
        ) {

            await refreshAdminTeams();

        } else if (
            typeof loadAdminSidebar ===
            "function"
        ) {

            await loadAdminSidebar();
        }


    } catch (error) {

        console.error(
            "Sidebar refresh error:",
            error
        );
    }
}




// ============================================
// CALENDAR HELPERS
// ============================================

function padCalendarNumber(value) {

    return String(value)
        .padStart(2, "0");
}


function formatCalendarDate(date) {

    return [
        date.getFullYear(),
        padCalendarNumber(
            date.getMonth() + 1
        ),
        padCalendarNumber(
            date.getDate()
        )
    ].join("-");
}


function getCalendarMonthRange() {

    const year =
        calendarCurrentDate
            .getFullYear();

    const month =
        calendarCurrentDate
            .getMonth();


    const firstDay =
        new Date(
            year,
            month,
            1
        );

    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    return {
        start:
            formatCalendarDate(
                firstDay
            ),

        end:
            formatCalendarDate(
                lastDay
            )
    };
}


function formatActivityTime(value) {

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


    return (
        `${displayHour}:${minute} ${suffix}`
    );
}


// ============================================
// LOAD CALENDAR ACTIVITIES
// ============================================

async function loadCalendarActivities() {

    if (!calendarGrid) {
        return;
    }


    const {
        start,
        end
    } =
        getCalendarMonthRange();


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


        calendarActivities =
            Array.isArray(result)
                ? result
                : [];


        renderCalendar();


    } catch (error) {

        console.error(
            "Calendar load error:",
            error
        );


        calendarGrid.innerHTML = `
            <div class="calendar-error">
                ${escapeDashboardHTML(
                    error.message
                )}
            </div>
        `;
    }
}


// ============================================
// RENDER CALENDAR
// ============================================

function renderCalendar() {

    if (
        !calendarGrid ||
        !calendarMonthLabel
    ) {
        return;
    }


    const year =
        calendarCurrentDate
            .getFullYear();

    const month =
        calendarCurrentDate
            .getMonth();


    calendarMonthLabel.textContent =
        calendarCurrentDate
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

    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );

    const leadingDays =
        firstDay.getDay();

    const totalDays =
        lastDay.getDate();


    const today =
        formatCalendarDate(
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
            formatCalendarDate(
                date
            );


        const dayActivities =
            calendarActivities.filter(
                activity =>
                    activity.activity_date ===
                    dateString
            );


        const activityHTML =
            dayActivities
                .map(activity => {

                    const time =
                        formatActivityTime(
                            activity.start_time
                        );

                    const teamCode =
                        activity.teams?.code ||
                        "";


                    return `
                        <button
                            type="button"
                            class="calendar-activity"
                            data-activity-id="${escapeDashboardHTML(
                                activity.id
                            )}"
                            title="${escapeDashboardHTML(
                                activity.title
                            )}"
                        >
                            ${
                                time
                                    ? `<span class="calendar-activity-time">${escapeDashboardHTML(time)}</span>`
                                    : ""
                            }

                            <span class="calendar-activity-title">
                                ${escapeDashboardHTML(
                                    activity.title
                                )}
                            </span>

                            ${
                                teamCode
                                    ? `<span class="calendar-activity-team">${escapeDashboardHTML(teamCode)}</span>`
                                    : ""
                            }
                        </button>
                    `;
                })
                .join("");


        cells.push(`
            <div
                class="calendar-day ${
                    dateString === today
                        ? "calendar-day-today"
                        : ""
                }"
                data-date="${dateString}"
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


    calendarGrid.innerHTML =
        cells.join("");
}


// ============================================
// CALENDAR NAVIGATION
// ============================================

previousMonthBtn?.addEventListener(
    "click",
    async () => {

        calendarCurrentDate =
            new Date(
                calendarCurrentDate
                    .getFullYear(),
                calendarCurrentDate
                    .getMonth() - 1,
                1
            );


        await loadCalendarActivities();
    }
);


nextMonthBtn?.addEventListener(
    "click",
    async () => {

        calendarCurrentDate =
            new Date(
                calendarCurrentDate
                    .getFullYear(),
                calendarCurrentDate
                    .getMonth() + 1,
                1
            );


        await loadCalendarActivities();
    }
);


// ============================================
// LOAD ACTIVITY TEAM OPTIONS
// ============================================

async function loadActivityTeamOptions() {

    if (!activityTeamInput) {
        return;
    }


    if (activityTeamsLoaded) {
        return;
    }


    if (activityTeamsLoadingPromise) {

        await activityTeamsLoadingPromise;

        return;
    }


    activityTeamsLoadingPromise =
        (async () => {

            try {

                const response =
                    await fetch(
                        "/api/teams",
                        {
                            cache: "no-store"
                        }
                    );


                const teams =
                    await response.json();


                if (
                    !response.ok ||
                    !Array.isArray(teams)
                ) {

                    throw new Error(
                        teams?.error ||
                        "Unable to load section options."
                    );
                }


                const currentValue =
                    activityTeamInput.value;


                activityTeamInput.innerHTML = `
                    <option value="">
                        All PMED / General
                    </option>
                ` +
                teams
                    .map(team => `
                        <option value="${escapeDashboardHTML(team.id)}">
                            ${escapeDashboardHTML(team.code)} - ${escapeDashboardHTML(team.name)}
                        </option>
                    `)
                    .join("");


                activityTeamInput.value =
                    currentValue;


                activityTeamsLoaded =
                    true;


            } catch (error) {

                console.error(
                    "Activity team options error:",
                    error
                );


            } finally {

                activityTeamsLoadingPromise =
                    null;
            }
        })();


    await activityTeamsLoadingPromise;
}


// ============================================
// ACTIVITY MODAL
// ============================================

function openActivityModalForAdd(
    date = ""
) {

    activityFormMode =
        "add";

    selectedActivityId =
        null;


    activityForm?.reset();


    activityModalTitle.textContent =
        "Add Activity";

    activityModalDescription.textContent =
        "Add an activity to the PMED calendar.";

    saveActivityBtn.textContent =
        "Save Activity";

    deleteActivityBtn.hidden =
        true;

    deleteActivityBtn.textContent =
        "Delete Activity";


    if (date) {

        activityDateInput.value =
            date;
    }


    activityModal?.classList.add(
        "show"
    );

    document.body.style.overflow =
        "hidden";


    setTimeout(() => {

        activityTitleInput?.focus();

    }, 50);
}


function openActivityModalForEdit(
    activity
) {

    activityFormMode =
        "edit";

    selectedActivityId =
        activity.id;


    activityTitleInput.value =
        activity.title || "";

    activityDateInput.value =
        activity.activity_date || "";

    activityTeamInput.value =
        activity.team_id || "";

    activityStartTimeInput.value =
        activity.start_time
            ? String(
                activity.start_time
            ).slice(0, 5)
            : "";

    activityEndTimeInput.value =
        activity.end_time
            ? String(
                activity.end_time
            ).slice(0, 5)
            : "";

    activityDescriptionInput.value =
        activity.description || "";


    activityModalTitle.textContent =
        "Edit Activity";

    activityModalDescription.textContent =
        "Update the selected calendar activity.";

    saveActivityBtn.textContent =
        "Save Changes";

    deleteActivityBtn.hidden =
        false;

    deleteActivityBtn.textContent =
        "Delete Activity";


    activityModal?.classList.add(
        "show"
    );

    document.body.style.overflow =
        "hidden";
}


function closeActivityModalWindow() {

    activityModal?.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";

    activityForm?.reset();

    selectedActivityId =
        null;

    activityFormMode =
        "add";

    deleteActivityBtn.hidden =
        true;

    saveActivityBtn.disabled =
        false;
}


addActivityBtn?.addEventListener(
    "click",
    () => {

        openActivityModalForAdd(
            formatCalendarDate(
                new Date()
            )
        );


        // Load section options in the background.
        // The modal opens immediately.
        loadActivityTeamOptions();
    }
);


calendarGrid?.addEventListener(
    "click",
    event => {

        const clickedActivity =
            event.target.closest(
                "[data-activity-id]"
            );


        if (clickedActivity) {

            event.preventDefault();
            event.stopPropagation();


            const id =
                clickedActivity.dataset
                    .activityId;


            const activity =
                calendarActivities.find(
                    item =>
                        String(item.id) ===
                        String(id)
                );


            if (!activity) {

                console.warn(
                    "Calendar activity not found:",
                    id
                );

                return;
            }


            openActivityModalForEdit(
                activity
            );


            // Load section options in the background.
            // Keep the modal in Edit mode while loading.
            loadActivityTeamOptions()
                .then(() => {

                    if (
                        activityTeamInput &&
                        activity.team_id !==
                            null &&
                        activity.team_id !==
                            undefined
                    ) {

                        activityTeamInput.value =
                            String(
                                activity.team_id
                            );
                    }
                });


            return;
        }


        const dayCell =
            event.target.closest(
                ".calendar-day[data-date]"
            );


        if (!dayCell) {
            return;
        }


        // Clicking empty calendar space creates a new activity.
        // Clicking an existing activity never reaches this block.
        openActivityModalForAdd(
            dayCell.dataset.date
        );


        loadActivityTeamOptions();
    }
);


closeActivityModal?.addEventListener(
    "click",
    closeActivityModalWindow
);


cancelActivity?.addEventListener(
    "click",
    closeActivityModalWindow
);


activityModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            activityModal
        ) {

            closeActivityModalWindow();
        }
    }
);


// ============================================
// SAVE ACTIVITY
// ============================================

activityForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const title =
            activityTitleInput
                .value
                .trim();

        const activityDate =
            activityDateInput
                .value;

        const teamId =
            activityTeamInput
                .value || null;

        const startTime =
            activityStartTimeInput
                .value || null;

        const endTime =
            activityEndTimeInput
                .value || null;

        const description =
            activityDescriptionInput
                .value
                .trim();


        if (
            !title ||
            !activityDate
        ) {

            alert(
                "Activity title and date are required."
            );

            return;
        }


        if (
            startTime &&
            endTime &&
            endTime < startTime
        ) {

            alert(
                "End time cannot be earlier than start time."
            );

            return;
        }


        try {

            saveActivityBtn.disabled =
                true;

            saveActivityBtn.textContent =
                "Saving...";


            const endpoint =
                activityFormMode === "edit"
                    ? `/api/activities/${encodeURIComponent(selectedActivityId)}`
                    : "/api/activities";


            const method =
                activityFormMode === "edit"
                    ? "PUT"
                    : "POST";


            const headers =
                await getAdminAuthHeaders();


            const response =
                await fetch(
                    endpoint,
                    {
                        method,

                        headers,

                        body:
                            JSON.stringify({
                                title,
                                activityDate,
                                teamId,
                                startTime,
                                endTime,
                                description
                            })
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Unable to save activity."
                );
            }


            const savedDate =
                activityDate;


            closeActivityModalWindow();


            calendarCurrentDate =
                new Date(
                    `${savedDate}T00:00:00`
                );


            await loadCalendarActivities();


        } catch (error) {

            console.error(
                "Save activity error:",
                error
            );

            alert(
                error.message
            );


        } finally {

            saveActivityBtn.disabled =
                false;

            if (
                activityFormMode ===
                "edit"
            ) {

                saveActivityBtn.textContent =
                    "Save Changes";

            } else {

                saveActivityBtn.textContent =
                    "Save Activity";
            }
        }
    }
);


// ============================================
// DELETE ACTIVITY
// ============================================

deleteActivityBtn?.addEventListener(
    "click",
    async () => {

        if (!selectedActivityId) {
            return;
        }


        const selectedActivity =
            calendarActivities.find(
                item =>
                    String(item.id) ===
                    String(selectedActivityId)
            );


        const activityName =
            selectedActivity?.title ||
            "this activity";


        const confirmed =
            confirm(
                `Are you sure you want to delete "${activityName}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            deleteActivityBtn.disabled =
                true;

            deleteActivityBtn.textContent =
                "Deleting...";


            const headers =
                await getAdminAuthHeaders(
                    false
                );


            const response =
                await fetch(
                    `/api/activities/${encodeURIComponent(selectedActivityId)}`,
                    {
                        method:
                            "DELETE",

                        headers
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Unable to delete activity."
                );
            }


            closeActivityModalWindow();

            await loadCalendarActivities();


        } catch (error) {

            console.error(
                "Delete activity error:",
                error
            );

            alert(
                error.message
            );


        } finally {

            deleteActivityBtn.disabled =
                false;

            deleteActivityBtn.textContent =
                "Delete Activity";
        }
    }
);


// ============================================
// ESCAPE
// ============================================

function escapeDashboardHTML(value) {

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

loadDashboard();

loadCalendarActivities();

// Preload section choices so Add Activity opens instantly.
loadActivityTeamOptions();