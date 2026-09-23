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


// ============================================
// STATE
// ============================================

let viewerAssignments = [];

let viewerResponsiblePersonOrder = new Map();


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
            `P.A.T.H | ${team.code}`;


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


        renderViewerTeamAssignments(
            viewerAssignments
        );


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

        await loadViewerResponsiblePersonOrder();

        renderViewerTeamAssignments(
            viewerAssignments
        );


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
            `P.A.T.H | ${team.code}`;
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
            `P.A.T.H | ${team.code}`;


    } catch (error) {

        console.error(
            "Unable to load team name:",
            error
        );
    }
}




// ============================================
// FORMAT FUNCTIONS / ACTIVITIES FOR DISPLAY
// Preserves line breaks and blank lines,
// while removing accidental leading spaces/tabs.
// ============================================

function formatViewerActivityDisplay(value) {

    const normalized =
        String(value || "")
            .replace(/\r\n/g, "\n")
            .split("\n")
            .map(line => line.trimStart())
            .join("\n")
            .trim();


    return escapeViewerTeamHTML(
        normalized
    )
        .replace(/\n/g, "<br>");
}



// ============================================
// RESPONSIBLE PERSON STABLE DISPLAY ORDER
// Viewer is read-only and follows the order
// established by the admin.
// ============================================

async function loadViewerResponsiblePersonOrder() {

    viewerResponsiblePersonOrder =
        new Map();

    if (!viewerSelectedTeam) {
        return;
    }

    try {

        const response =
            await fetch(
                `/api/personnel-sequence?team=${encodeURIComponent(
                    viewerSelectedTeam
                )}`,
                {
                    cache: "no-store"
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to load responsible person order."
            );
        }

        viewerResponsiblePersonOrder =
            new Map(
                (Array.isArray(result)
                    ? result
                    : []
                ).map(item => [
                    String(item.personnel_id),
                    Number(item.display_order)
                ])
            );

    } catch (error) {

        console.error(
            "Viewer responsible person order error:",
            error
        );

        viewerResponsiblePersonOrder =
            new Map();
    }
}


function sortViewerAssignmentsByResponsiblePersonOrder(
    records
) {

    if (!viewerResponsiblePersonOrder.size) {

        // No saved order yet:
        // preserve the existing arrangement exactly.
        return [...records];
    }

    const originalPersonPosition =
        new Map();

    records.forEach((record, index) => {

        const personnelId =
            record.personnel?.id ||
            record.personnel_id;

        const key =
            String(personnelId ?? "");

        if (
            key &&
            !originalPersonPosition.has(key)
        ) {

            originalPersonPosition.set(
                key,
                index
            );
        }
    });

    return [...records].sort(
        (a, b) => {

            const aId =
                String(
                    a.personnel?.id ||
                    a.personnel_id ||
                    ""
                );

            const bId =
                String(
                    b.personnel?.id ||
                    b.personnel_id ||
                    ""
                );

            const aOrder =
                viewerResponsiblePersonOrder.has(aId)
                    ? viewerResponsiblePersonOrder.get(aId)
                    : Number.MAX_SAFE_INTEGER;

            const bOrder =
                viewerResponsiblePersonOrder.has(bId)
                    ? viewerResponsiblePersonOrder.get(bId)
                    : Number.MAX_SAFE_INTEGER;

            if (aOrder !== bOrder) {

                return aOrder - bOrder;
            }

            return (
                (originalPersonPosition.get(aId) ?? 0) -
                (originalPersonPosition.get(bId) ?? 0)
            );
        }
    );
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


    const orderedRecords =
        sortViewerAssignmentsByResponsiblePersonOrder(
            records
        );

    const groupedRecords =
        groupViewerAssignmentsByPerson(
            orderedRecords
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
                                        ${formatViewerActivityDisplay(
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
// SEARCH
// ============================================

viewerSearchInput?.addEventListener(
    "input",
    () => {

        const query =
            viewerSearchInput
                .value
                .trim()
                .toLowerCase();


        if (!query) {

            renderViewerTeamAssignments(
                viewerAssignments
            );

            return;
        }


        const filtered =
            viewerAssignments.filter(
                record => {

                    const personnel =
                        record.personnel || {};


                    return [
                        personnel.full_name,
                        record.designation ||
                            personnel.designation,
                        record.functions_activities
                    ]
                        .filter(Boolean)
                        .some(
                            value =>
                                String(value)
                                    .toLowerCase()
                                    .includes(query)
                        );
                }
            );


        renderViewerTeamAssignments(
            filtered
        );
    }
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