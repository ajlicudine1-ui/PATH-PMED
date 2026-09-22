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
// STATE
// ============================================

let viewerAssignments = [];


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
                        }
                    )
                    .join("");
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
