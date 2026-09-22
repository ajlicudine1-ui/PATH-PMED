// ============================================
// PATH - VIEWER TEAM PAGE
// ============================================


// ============================================
// ELEMENTS
// ============================================

const viewerTeamCode =
    document.getElementById("teamCode");

const viewerTeamName =
    document.getElementById("teamName");

const viewerAssignmentsTableBody =
    document.getElementById(
        "assignmentsTableBody"
    );

const viewerSearchInput =
    document.getElementById("searchInput");

const viewerEmploymentStatusFilter =
    document.getElementById(
        "employmentStatusFilter"
    );


// ============================================
// STATE
// ============================================

let viewerAssignments = [];


// ============================================
// GET TEAM FROM URL
// ============================================

const viewerParams =
    new URLSearchParams(
        window.location.search
    );

const viewerSelectedTeam =
    viewerParams.get("team");


// ============================================
// CACHE KEYS
// ============================================

function getViewerAssignmentsCacheKey(code) {

    return `path_viewer_assignments_${String(code).toUpperCase()}`;
}


// ============================================
// SHOW TEAM INFO IMMEDIATELY
// ============================================

function showCachedViewerTeamInformation() {

    if (!viewerSelectedTeam) {
        return;
    }


    // Show team code immediately
    viewerTeamCode.textContent =
        String(viewerSelectedTeam)
            .toUpperCase() === "DIVISION"
            ? "Division"
            : String(viewerSelectedTeam)
                .toUpperCase();


    viewerTeamName.textContent = "";


    try {

        const cached =
            localStorage.getItem(
                "path_sidebar_teams"
            );


        if (!cached) {
            return;
        }


        const teams =
            JSON.parse(cached);


        if (!Array.isArray(teams)) {
            return;
        }


        const team =
            teams.find(
                item =>
                    String(item.code)
                        .toUpperCase() ===
                    String(viewerSelectedTeam)
                        .toUpperCase()
            );


        if (!team) {
            return;
        }


        viewerTeamCode.textContent =
            String(team.code)
                .toUpperCase() === "DIVISION"
                ? "Division"
                : team.code;


        viewerTeamName.textContent =
            team.name || "";


        document.title =
            "P.A.T.H | PMED Assignment and Team Hub";


    } catch (error) {

        console.error(
            "Viewer team cache error:",
            error
        );
    }
}


// ============================================
// SHOW CACHED ASSIGNMENTS
// ============================================

function showCachedViewerAssignments() {

    if (!viewerSelectedTeam) {
        return false;
    }


    try {

        const cached =
            localStorage.getItem(
                getViewerAssignmentsCacheKey(
                    viewerSelectedTeam
                )
            );


        if (!cached) {
            return false;
        }


        const records =
            JSON.parse(cached);


        if (!Array.isArray(records)) {
            return false;
        }


        viewerAssignments =
            records;


        applyViewerAssignmentFilters();


        return true;


    } catch (error) {

        console.error(
            "Viewer assignments cache error:",
            error
        );


        return false;
    }
}


// ============================================
// LOAD TEAM
// ============================================

async function loadViewerTeam() {

    if (!viewerSelectedTeam) {

        showViewerTeamError(
            "No section selected."
        );

        return;
    }


    const hasCachedAssignments =
        showCachedViewerAssignments();


    if (
        !hasCachedAssignments &&
        viewerAssignmentsTableBody
    ) {

        viewerAssignmentsTableBody.innerHTML = `
            <tr>

                <td
                    colspan="3"
                    class="empty-state"
                >
                    Loading assignments...
                </td>

            </tr>
        `;
    }


    try {

        const response =
            await fetch(
                `/api/assignments?team=${encodeURIComponent(
                    viewerSelectedTeam
                )}`,
                {
                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load assignments."
            );
        }


        viewerAssignments =
            Array.isArray(data)
                ? data
                : [];


        // Cache latest assignments
        localStorage.setItem(
            getViewerAssignmentsCacheKey(
                viewerSelectedTeam
            ),
            JSON.stringify(
                viewerAssignments
            )
        );


        updateViewerTeamHeading();


        applyViewerAssignmentFilters();


    } catch (error) {

        console.error(
            "Viewer team error:",
            error
        );


        // If cached data is already visible,
        // keep it visible.
        if (!hasCachedAssignments) {

            showViewerTeamError(
                error.message
            );
        }
    }
}


// ============================================
// UPDATE TEAM HEADING
// ============================================

function updateViewerTeamHeading() {

    if (!viewerAssignments.length) {

        viewerTeamCode.textContent =
            String(viewerSelectedTeam)
                .toUpperCase() === "DIVISION"
                ? "Division"
                : String(viewerSelectedTeam)
                    .toUpperCase();


        loadViewerTeamName();


        return;
    }


    const team =
        viewerAssignments[0].teams || {};


    viewerTeamCode.textContent =
        String(team.code || viewerSelectedTeam)
            .toUpperCase() === "DIVISION"
            ? "Division"
            : (
                team.code ||
                String(viewerSelectedTeam)
                    .toUpperCase()
            );


    viewerTeamName.textContent =
        team.name || "";


    if (team.code) {

        document.title =
            "P.A.T.H | PMED Assignment and Team Hub";
    }
}


// ============================================
// LOAD TEAM NAME IF NO ASSIGNMENTS
// ============================================

async function loadViewerTeamName() {

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
            return;
        }


        if (!Array.isArray(teams)) {
            return;
        }


        // Refresh shared team cache
        localStorage.setItem(
            "path_sidebar_teams",
            JSON.stringify(teams)
        );


        const team =
            teams.find(
                item =>
                    String(item.code)
                        .toUpperCase() ===
                    String(viewerSelectedTeam)
                        .toUpperCase()
            );


        if (!team) {
            return;
        }


        viewerTeamCode.textContent =
            String(team.code)
                .toUpperCase() === "DIVISION"
                ? "Division"
                : team.code;


        viewerTeamName.textContent =
            team.name ||
            "PMED Section";


        document.title =
            "P.A.T.H | PMED Assignment and Team Hub";


    } catch (error) {

        console.error(
            "Unable to load team name:",
            error
        );
    }
}


// ============================================
// RENDER ASSIGNMENTS
// ============================================

function normalizeViewerPersonName(name) {

    return String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[.,]/g, "")
        .replace(/\s+/g, " ");
}


function groupViewerAssignmentsByPerson(records) {

    const groups = new Map();


    records.forEach(record => {

        const personnel =
            record.personnel || {};


        const fullName =
            personnel.full_name || "";


        const key =
            normalizeViewerPersonName(
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


function renderViewerTeamAssignments(records) {

    if (!viewerAssignmentsTableBody) {
        return;
    }


    if (!records.length) {

        viewerAssignmentsTableBody.innerHTML = `
            <tr>

                <td
                    colspan="3"
                    class="empty-state"
                >
                    No assignments found for this section.
                </td>

            </tr>
        `;

        return;
    }


    const groupedRecords =
        groupViewerAssignmentsByPerson(
            records
        );


    viewerAssignmentsTableBody.innerHTML =
        groupedRecords
            .map(group => {

                const rowCount =
                    group.records.length;


                return group.records
                    .map(
                        (record, index) => {

                            const personnel =
                                record.personnel || {};


                            const designation =
                                record.designation ||
                                personnel.designation ||
                                "";


                            const responsiblePersonCell =
                                index === 0
                                    ? `
                                        <td
                                            rowspan="${rowCount}"
                                            class="viewer-grouped-person-cell"
                                        >
                                            ${escapeViewerTeamHTML(
                                                group.fullName
                                            )}
                                        </td>
                                    `
                                    : "";


                            return `
                                <tr>

                                    ${responsiblePersonCell}

                                    <td>
                                        ${escapeViewerTeamHTML(
                                            designation
                                        )}
                                    </td>

                                    <td>
                                        ${escapeViewerTeamHTML(
                                            record.functions_activities || ""
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
// SEARCH + EMPLOYMENT STATUS FILTER
// ============================================

function applyViewerAssignmentFilters() {

    const query =
        String(
            viewerSearchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    const selectedStatus =
        String(
            viewerEmploymentStatusFilter?.value || ""
        )
            .trim()
            .toLowerCase();


    const filtered =
        viewerAssignments.filter(
            record => {

                const personnel =
                    record.personnel || {};


                const name =
                    String(
                        personnel.full_name || ""
                    )
                        .toLowerCase();


                const employmentStatus =
                    String(
                        personnel.employment_status || ""
                    )
                        .toLowerCase();


                const designation =
                    String(
                        record.designation ||
                        personnel.designation ||
                        ""
                    )
                        .toLowerCase();


                const activity =
                    String(
                        record.functions_activities ||
                        ""
                    )
                        .toLowerCase();


                const matchesSearch =
                    !query ||
                    name.includes(query) ||
                    employmentStatus.includes(query) ||
                    designation.includes(query) ||
                    activity.includes(query);


                const matchesEmploymentStatus =
                    !selectedStatus ||
                    employmentStatus ===
                        selectedStatus;


                return (
                    matchesSearch &&
                    matchesEmploymentStatus
                );
            }
        );


    renderViewerTeamAssignments(
        filtered
    );
}


viewerSearchInput?.addEventListener(
    "input",
    applyViewerAssignmentFilters
);


viewerEmploymentStatusFilter?.addEventListener(
    "change",
    applyViewerAssignmentFilters
);


// ============================================
// ERROR
// ============================================

function showViewerTeamError(message) {

    if (viewerTeamCode) {

        viewerTeamCode.textContent =
            viewerSelectedTeam
                ? (
                    String(
                        viewerSelectedTeam
                    ).toUpperCase() === "DIVISION"
                        ? "Division"
                        : String(
                            viewerSelectedTeam
                        ).toUpperCase()
                )
                : "Section";
    }


    if (viewerTeamName) {

        viewerTeamName.textContent =
            "Unable to load section.";
    }


    if (viewerAssignmentsTableBody) {

        viewerAssignmentsTableBody.innerHTML = `
            <tr>

                <td
                    colspan="3"
                    class="empty-state"
                >
                    ${escapeViewerTeamHTML(
                        message
                    )}
                </td>

            </tr>
        `;
    }
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeViewerTeamHTML(value) {

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

// Show heading instantly
showCachedViewerTeamInformation();

// Then load/cache assignments
loadViewerTeam();