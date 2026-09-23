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

let viewerPersonnelSequenceMap = new Map();


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

function getCachedViewerAssignments() {

    if (!viewerSelectedTeam) {
        return [];
    }


    try {

        const cached =
            localStorage.getItem(
                getViewerAssignmentsCacheKey(
                    viewerSelectedTeam
                )
            );


        if (!cached) {
            return [];
        }


        const records =
            JSON.parse(cached);


        return Array.isArray(records)
            ? records
            : [];


    } catch (error) {

        console.error(
            "Viewer assignments cache error:",
            error
        );


        return [];
    }
}


// ============================================
// LOADING STATE
// ============================================

function showViewerTeamLoading() {

    if (!viewerAssignmentsTableBody) {
        return;
    }


    viewerAssignmentsTableBody.innerHTML = `
        <tr class="viewer-team-loading-row">

            <td
                colspan="3"
                class="viewer-team-loading-cell"
            >
                <div class="viewer-team-loading">

                    <span
                        class="viewer-team-loading-spinner"
                        aria-hidden="true"
                    ></span>

                    <span>
                        Loading personnel assignments...
                    </span>

                </div>
            </td>

        </tr>
    `;
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


    /*
       Important:
       Do not render cached assignments first.

       The previous behavior briefly showed the newly
       added person in the API/cache order, then moved
       them after personnel sequence loaded.

       We now keep the table in a loading state until
       both the assignments and saved display order are
       ready, then render only once.
    */
    showViewerTeamLoading();


    const cachedAssignments =
        getCachedViewerAssignments();


    try {

        const assignmentsPromise =
            fetch(
                `/api/assignments?team=${encodeURIComponent(
                    viewerSelectedTeam
                )}`,
                {
                    cache: "no-store"
                }
            )
                .then(async response => {

                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.error ||
                            "Unable to load assignments."
                        );
                    }


                    return Array.isArray(data)
                        ? data
                        : [];
                });


        /*
           Fetch assignments and personnel order together.
           Nothing is rendered until both finish.
        */
        const [
            freshAssignments
        ] =
            await Promise.all([
                assignmentsPromise,
                loadViewerPersonnelSequence()
            ]);


        viewerAssignments =
            freshAssignments;


        localStorage.setItem(
            getViewerAssignmentsCacheKey(
                viewerSelectedTeam
            ),
            JSON.stringify(
                viewerAssignments
            )
        );


        updateViewerTeamHeading();


        /*
           Final render only.
           sortViewerAssignmentsByPersonnelSequence()
           is called inside the renderer, so the user
           never sees the temporary wrong position.
        */
        applyViewerTeamFilters();


    } catch (error) {

        console.error(
            "Viewer team error:",
            error
        );


        /*
           If fresh loading fails, use the cache only
           after the ordering request has already had
           its chance to finish.
        */
        if (cachedAssignments.length) {

            viewerAssignments =
                cachedAssignments;


            await loadViewerPersonnelSequence();


            updateViewerTeamHeading();

            applyViewerTeamFilters();

            return;
        }


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
// PERSONNEL DISPLAY SEQUENCE
// VIEWER IS READ-ONLY
// ============================================

async function loadViewerPersonnelSequence() {

    viewerPersonnelSequenceMap =
        new Map();

    if (!viewerSelectedTeam) {
        return;
    }


    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(
            () => controller.abort(),
            4000
        );


    try {

        const response =
            await fetch(
                `/api/personnel-sequence?team=${encodeURIComponent(
                    viewerSelectedTeam
                )}`,
                {
                    cache: "no-store",
                    signal:
                        controller.signal
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to load personnel sequence."
            );
        }


        const rows =
            Array.isArray(result)
                ? result
                : [];


        rows.forEach(row => {

            viewerPersonnelSequenceMap.set(
                String(row.personnel_id),
                Number(row.display_order)
            );
        });


    } catch (error) {

        /*
           Ordering must never stop the Viewer Team
           page from displaying assignments.
        */
        if (error.name !== "AbortError") {

            console.error(
                "Viewer personnel sequence error:",
                error
            );
        }

    } finally {

        clearTimeout(
            timeoutId
        );
    }
}


function sortViewerAssignmentsByPersonnelSequence(
    records
) {

    const originalPersonPosition =
        new Map();

    records.forEach((record, index) => {

        const personnelId =
            String(
                record?.personnel?.id ||
                record?.personnel_id ||
                ""
            );

        if (
            personnelId &&
            !originalPersonPosition.has(
                personnelId
            )
        ) {

            originalPersonPosition.set(
                personnelId,
                index
            );
        }
    });


    return [...records].sort(
        (a, b) => {

            const aId =
                String(
                    a?.personnel?.id ||
                    a?.personnel_id ||
                    ""
                );

            const bId =
                String(
                    b?.personnel?.id ||
                    b?.personnel_id ||
                    ""
                );


            const aOrder =
                viewerPersonnelSequenceMap.has(aId)
                    ? viewerPersonnelSequenceMap.get(aId)
                    : Number.MAX_SAFE_INTEGER;

            const bOrder =
                viewerPersonnelSequenceMap.has(bId)
                    ? viewerPersonnelSequenceMap.get(bId)
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
        sortViewerAssignmentsByPersonnelSequence(
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
// SEARCH + EMPLOYMENT STATUS FILTER
// ============================================

function applyViewerTeamFilters() {

    const query =
        String(
            viewerSearchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    const selectedStatus =
        String(
            viewerEmploymentStatusFilter
                ?.value || ""
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


                const employmentStatus =
                    String(
                        personnel.employment_status ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                const matchesSearch =
                    !query ||
                    name.includes(query) ||
                    designation.includes(query) ||
                    activity.includes(query) ||
                    employmentStatus.includes(query);


                const matchesStatus =
                    !selectedStatus ||
                    employmentStatus ===
                        selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );


    renderViewerTeamAssignments(
        filtered
    );
}


viewerSearchInput
    ?.addEventListener(
        "input",
        applyViewerTeamFilters
    );


viewerEmploymentStatusFilter
    ?.addEventListener(
        "change",
        applyViewerTeamFilters
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

// Show section code instantly from the URL.
if (
    viewerTeamCode &&
    viewerSelectedTeam
) {

    viewerTeamCode.textContent =
        String(viewerSelectedTeam)
            .toUpperCase() === "DIVISION"
            ? "Division"
            : String(viewerSelectedTeam)
                .toUpperCase();
}


// Then enrich it from cached team information.
showCachedViewerTeamInformation();

// Then load/cache assignments
loadViewerTeam();