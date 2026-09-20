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
// LOAD TEAM
// ============================================

async function loadViewerTeam() {

    if (!viewerSelectedTeam) {

        showViewerTeamError(
            "No section selected."
        );

        return;
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


        updateViewerTeamHeading();


        renderViewerTeamAssignments(
            viewerAssignments
        );


    } catch (error) {

        console.error(
            "Viewer team error:",
            error
        );


        showViewerTeamError(
            error.message
        );
    }
}


// ============================================
// UPDATE TEAM HEADING
// ============================================

function updateViewerTeamHeading() {

    if (!viewerAssignments.length) {

        viewerTeamCode.textContent =
            viewerSelectedTeam.toUpperCase();


        loadViewerTeamName();


        return;
    }


    const team =
        viewerAssignments[0].teams || {};


    viewerTeamCode.textContent =
        team.code ||
        viewerSelectedTeam.toUpperCase();


    viewerTeamName.textContent =
        team.name ||
        "";
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


        const team =
            teams.find(
                item =>
                    String(item.code)
                        .toUpperCase() ===
                    String(viewerSelectedTeam)
                        .toUpperCase()
            );


        viewerTeamName.textContent =
            team?.name ||
            "PMED Section";


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


    viewerAssignmentsTableBody.innerHTML =
        records
            .map(record => {

                const personnel =
                    record.personnel || {};


                return `
                    <tr>

                        <td>
                            ${escapeViewerTeamHTML(
                                personnel.full_name || ""
                            )}
                        </td>

                        <td>
                            ${escapeViewerTeamHTML(
                                personnel.designation || ""
                            )}
                        </td>

                        <td>
                            ${escapeViewerTeamHTML(
                                record.functions_activities || ""
                            )}
                        </td>

                    </tr>
                `;
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
                ?.toUpperCase() ||
            "Section";
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

loadViewerTeam();