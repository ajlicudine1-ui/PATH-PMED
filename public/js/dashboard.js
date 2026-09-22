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
// STATE
// ============================================

let currentDashboardView =
    "assignments";

let sectionFormMode =
    "add";

let selectedSectionId =
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
                                        ${escapeDashboardHTML(
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