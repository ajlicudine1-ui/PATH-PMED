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


        renderViewerAssignments(
            Array.isArray(data.assignments)
                ? data.assignments
                : []
        );


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


    viewerTableBody.innerHTML =
        records
            .map(record => {

                const personnel =
                    record.personnel || {};

                const team =
                    record.teams || {};


                return `
                    <tr>

                        <td>
                            ${escapeViewerHTML(
                                personnel.full_name || ""
                            )}
                        </td>

                        <td>
                            ${escapeViewerHTML(
                                personnel.designation || ""
                            )}
                        </td>

                        <td>
                            ${escapeViewerHTML(
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
            })
            .join("");
}


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