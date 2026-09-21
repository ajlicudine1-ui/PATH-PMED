// ============================================
// PATH - PMED Assignment and Team Hub
// TEAM PAGE SCRIPT
// ============================================


// ============================================
// GET TEAM FROM URL
// Example: team.html?team=IMS
// ============================================

const params =
    new URLSearchParams(
        window.location.search
    );

const teamCode =
    params.get("team");


// ============================================
// PAGE ELEMENTS
// ============================================

const teamCodeElement =
    document.getElementById("teamCode");

const teamNameElement =
    document.getElementById("teamName");

const tableBody =
    document.getElementById("teamTableBody");

const searchInput =
    document.getElementById("searchInput");


// ============================================
// SHOW TEAM INFO IMMEDIATELY FROM CACHE
// ============================================

function showCachedTeamInformation() {

    if (!teamCode) {
        return;
    }

    teamCodeElement.textContent =
        String(teamCode).toUpperCase() === "DIVISION"
            ? "Division"
            : String(teamCode).toUpperCase();

    teamNameElement.textContent = "";

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

        const cachedTeam =
            teams.find(
                team =>
                    String(team.code)
                        .toUpperCase() ===
                    String(teamCode)
                        .toUpperCase()
            );

        if (!cachedTeam) {
            return;
        }

        teamCodeElement.textContent =
            String(cachedTeam.code)
                .toUpperCase() === "DIVISION"
                ? "Division"
                : cachedTeam.code;

        teamNameElement.textContent =
            cachedTeam.name || "";

        document.title =
            `PATH | ${cachedTeam.code}`;

    } catch (error) {

        console.error(
            "Cached team error:",
            error
        );
    }
}


// Show cached section name before network requests
showCachedTeamInformation();


// ============================================
// MODAL ELEMENTS
// ============================================

const addAssignmentBtn =
    document.getElementById("addAssignmentBtn");

const assignmentModal =
    document.getElementById("assignmentModal");

const closeAssignmentModal =
    document.getElementById("closeAssignmentModal");

const cancelAssignment =
    document.getElementById("cancelAssignment");

const assignmentForm =
    document.getElementById("assignmentForm");

const saveAssignment =
    document.getElementById("saveAssignment");

const modalTitle =
    document.querySelector(
        "#assignmentModal .modal-header h2"
    );

const modalDescription =
    document.querySelector(
        "#assignmentModal .modal-header p"
    );


// ============================================
// FORM INPUTS
// ============================================

const responsiblePersonInput =
    document.getElementById("responsiblePerson");

const designationInput =
    document.getElementById("designation");

const functionsActivitiesInput =
    document.getElementById("functionsActivities");


// ============================================
// STATE
// ============================================

let assignments = [];

let modalMode = "add";

let selectedAssignmentId = null;


// ============================================
// LAST RESPONSIBLE PERSON PER SECTION
// ============================================

function getLastPersonCacheKey() {

    return `path_last_responsible_person_${String(
        teamCode || ""
    ).toUpperCase()}`;
}


function saveLastResponsiblePerson(name) {

    if (
        !teamCode ||
        !name
    ) {
        return;
    }

    localStorage.setItem(
        getLastPersonCacheKey(),
        String(name).trim()
    );
}


function getLastResponsiblePerson() {

    if (!teamCode) {
        return "";
    }

    const cached =
        localStorage.getItem(
            getLastPersonCacheKey()
        );

    if (cached) {
        return cached;
    }

    if (
        Array.isArray(assignments) &&
        assignments.length
    ) {
        return (
            assignments[0]
                ?.personnel
                ?.full_name ||
            ""
        );
    }

    return "";
}


// ============================================
// LOAD TEAM
// ============================================

async function loadTeam() {

    if (!teamCode) {

        teamCodeElement.textContent =
            "Team Not Found";

        teamNameElement.textContent =
            "No team was selected.";

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty-state"
                >
                    No team selected.
                </td>
            </tr>
        `;

        return;
    }

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
                "Unable to load teams."
            );
        }

        if (!Array.isArray(teams)) {

            throw new Error(
                "Invalid teams response."
            );
        }

        const currentTeam =
            teams.find(
                team =>
                    String(team.code)
                        .toUpperCase() ===
                    String(teamCode)
                        .toUpperCase()
            );

        if (!currentTeam) {

            teamCodeElement.textContent =
                "Team Not Found";

            teamNameElement.textContent =
                "The selected team does not exist.";

            return;
        }

        localStorage.setItem(
            "path_sidebar_teams",
            JSON.stringify(teams)
        );

        teamCodeElement.textContent =
            String(currentTeam.code)
                .toUpperCase() === "DIVISION"
                ? "Division"
                : currentTeam.code;

        teamNameElement.textContent =
            currentTeam.name;

        document.title =
            `PATH | ${currentTeam.code}`;

        await loadAssignments();

    } catch (error) {

        console.error(
            "Load team error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty-state"
                >
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;
    }
}


// ============================================
// LOAD ASSIGNMENTS
// ============================================

async function loadAssignments() {

    if (!teamCode) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="4"
                class="empty-state"
            >
                Loading assignments...
            </td>
        </tr>
    `;

    try {

        const response =
            await fetch(
                `/api/assignments?team=${encodeURIComponent(teamCode)}`
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to load assignments."
            );
        }

        assignments =
            Array.isArray(result)
                ? result
                : [];

        renderAssignments(assignments);

    } catch (error) {

        console.error(
            "Load assignments error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty-state"
                >
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;
    }
}


// ============================================
// DISPLAY ASSIGNMENTS
// ============================================

function renderAssignments(records) {

    closeAllActionMenus();

    if (!records.length) {

        tableBody.innerHTML = `
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

    tableBody.innerHTML =
        records
            .map(record => {

                const personnel =
                    record.personnel || {};

                const fullName =
                    personnel.full_name || "";

                const designation =
                    personnel.designation || "";

                const functionsActivities =
                    record.functions_activities || "";

                return `
                    <tr>

                        <td>
                            ${escapeHTML(fullName)}
                        </td>

                        <td>
                            ${escapeHTML(designation)}
                        </td>

                        <td>
                            ${escapeHTML(functionsActivities)}
                        </td>

                        <td class="actions-cell">

                            <div class="actions-dropdown">

                                <button
                                    type="button"
                                    class="action-button"
                                    data-id="${record.id}"
                                >
                                    Actions
                                    <span class="action-arrow">
                                        ▾
                                    </span>
                                </button>

                                <div
                                    class="actions-menu"
                                    data-menu-id="${record.id}"
                                >

                                    <button
                                        type="button"
                                        class="actions-menu-item view-action"
                                        data-id="${record.id}"
                                    >
                                        View
                                    </button>

                                    <button
                                        type="button"
                                        class="actions-menu-item edit-action"
                                        data-id="${record.id}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="actions-menu-item delete-action"
                                        data-id="${record.id}"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>

                        </td>

                    </tr>
                `;
            })
            .join("");
}


// ============================================
// SEARCH
// ============================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        event => {

            const keyword =
                event.target.value
                    .toLowerCase()
                    .trim();

            if (!keyword) {

                renderAssignments(
                    assignments
                );

                return;
            }

            const filtered =
                assignments.filter(record => {

                    const name =
                        record.personnel
                            ?.full_name
                            ?.toLowerCase() ||
                        "";

                    const designation =
                        record.personnel
                            ?.designation
                            ?.toLowerCase() ||
                        "";

                    const activity =
                        record.functions_activities
                            ?.toLowerCase() ||
                        "";

                    return (
                        name.includes(keyword) ||
                        designation.includes(keyword) ||
                        activity.includes(keyword)
                    );
                });

            renderAssignments(filtered);
        }
    );
}


// ============================================
// OPEN ADD MODAL
// ============================================

function openAddAssignmentModal() {

    modalMode = "add";

    selectedAssignmentId = null;

    assignmentForm.reset();

    responsiblePersonInput.value =
        getLastResponsiblePerson();

    responsiblePersonInput.disabled =
        false;

    designationInput.disabled =
        false;

    functionsActivitiesInput.disabled =
        false;

    modalTitle.textContent =
        "Add Assignment";

    modalDescription.textContent =
        "Add a new personnel assignment for the selected team.";

    saveAssignment.style.display =
        "inline-block";

    saveAssignment.textContent =
        "Save Assignment";

    showModal();
}


// ============================================
// OPEN VIEW MODAL
// ============================================

async function openViewAssignment(id) {

    try {

        const assignment =
            await fetchAssignment(id);

        modalMode = "view";

        selectedAssignmentId = id;

        responsiblePersonInput.value =
            assignment.personnel?.full_name || "";

        designationInput.value =
            assignment.personnel?.designation || "";

        functionsActivitiesInput.value =
            assignment.functions_activities || "";

        responsiblePersonInput.disabled = true;
        designationInput.disabled = true;
        functionsActivitiesInput.disabled = true;

        modalTitle.textContent =
            "View Assignment";

        modalDescription.textContent =
            "View personnel assignment information.";

        saveAssignment.style.display =
            "none";

        showModal();

    } catch (error) {

        console.error(
            "View assignment error:",
            error
        );

        alert(error.message);
    }
}


// ============================================
// OPEN EDIT MODAL
// ============================================

async function openEditAssignment(id) {

    try {

        const assignment =
            await fetchAssignment(id);

        modalMode = "edit";

        selectedAssignmentId = id;

        responsiblePersonInput.value =
            assignment.personnel?.full_name || "";

        designationInput.value =
            assignment.personnel?.designation || "";

        functionsActivitiesInput.value =
            assignment.functions_activities || "";

        responsiblePersonInput.disabled = false;
        designationInput.disabled = false;
        functionsActivitiesInput.disabled = false;

        modalTitle.textContent =
            "Edit Assignment";

        modalDescription.textContent =
            "Update personnel assignment information.";

        saveAssignment.style.display =
            "inline-block";

        saveAssignment.textContent =
            "Update Assignment";

        showModal();

    } catch (error) {

        console.error(
            "Edit assignment error:",
            error
        );

        alert(error.message);
    }
}


// ============================================
// FETCH ONE ASSIGNMENT
// ============================================

async function fetchAssignment(id) {

    const response =
        await fetch(
            `/api/assignments/${encodeURIComponent(id)}`
        );

    const result =
        await response.json();

    if (!response.ok) {

        throw new Error(
            result.error ||
            "Unable to load assignment."
        );
    }

    return result;
}


// ============================================
// SHOW MODAL
// ============================================

function showModal() {

    if (!assignmentModal) {
        return;
    }

    closeAllActionMenus();

    assignmentModal.classList.add(
        "show"
    );

    document.body.style.overflow =
        "hidden";

    setTimeout(() => {

        if (
            modalMode !== "view" &&
            responsiblePersonInput
        ) {
            responsiblePersonInput.focus();
        }

    }, 50);
}


// ============================================
// CLOSE MODAL
// ============================================

function closeModal() {

    if (!assignmentModal) {
        return;
    }

    assignmentModal.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";

    assignmentForm.reset();

    responsiblePersonInput.disabled =
        false;

    designationInput.disabled =
        false;

    functionsActivitiesInput.disabled =
        false;

    saveAssignment.style.display =
        "inline-block";

    saveAssignment.disabled =
        false;

    saveAssignment.textContent =
        "Save Assignment";

    modalMode = "add";

    selectedAssignmentId = null;
}


// ============================================
// MODAL EVENTS
// ============================================

if (addAssignmentBtn) {

    addAssignmentBtn.addEventListener(
        "click",
        openAddAssignmentModal
    );
}

if (closeAssignmentModal) {

    closeAssignmentModal.addEventListener(
        "click",
        closeModal
    );
}

if (cancelAssignment) {

    cancelAssignment.addEventListener(
        "click",
        closeModal
    );
}

if (assignmentModal) {

    assignmentModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                assignmentModal
            ) {
                closeModal();
            }
        }
    );
}

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            assignmentModal
                ?.classList
                .contains("show")
        ) {
            closeModal();
        }

        if (
            event.key === "Escape"
        ) {
            closeAllActionMenus();
        }
    }
);


// ============================================
// ADD OR UPDATE ASSIGNMENT
// ============================================

if (assignmentForm) {

    assignmentForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            if (modalMode === "view") {
                return;
            }

            const responsiblePerson =
                responsiblePersonInput
                    .value
                    .trim();

            const designation =
                designationInput
                    .value
                    .trim();

            const functionsActivities =
                functionsActivitiesInput
                    .value
                    .trim();

            if (
                !responsiblePerson ||
                !designation ||
                !functionsActivities
            ) {

                alert(
                    "Please complete all required fields."
                );

                return;
            }

            try {

                saveAssignment.disabled =
                    true;

                saveAssignment.textContent =
                    modalMode === "edit"
                        ? "Updating..."
                        : "Saving...";

                let url =
                    "/api/assignments";

                let method =
                    "POST";

                if (
                    modalMode === "edit" &&
                    selectedAssignmentId
                ) {

                    url =
                        `/api/assignments/${encodeURIComponent(selectedAssignmentId)}`;

                    method =
                        "PUT";
                }

                const headers =
                    await getAdminAuthHeaders();


                const response =
                    await fetch(
                        url,
                        {
                            method,

                            headers,

                            body:
                                JSON.stringify({
                                    teamCode,
                                    responsiblePerson,
                                    designation,
                                    functionsActivities
                                })
                        }
                    );

                const result =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        "Unable to save assignment."
                    );
                }


                if (modalMode === "add") {

                    saveLastResponsiblePerson(
                        responsiblePerson
                    );
                }


                closeModal();

                await loadAssignments();

            } catch (error) {

                console.error(
                    "Save assignment error:",
                    error
                );

                alert(error.message);

            } finally {

                saveAssignment.disabled =
                    false;

                if (modalMode === "edit") {

                    saveAssignment.textContent =
                        "Update Assignment";

                } else {

                    saveAssignment.textContent =
                        "Save Assignment";
                }
            }
        }
    );
}


// ============================================
// DELETE ASSIGNMENT
// ============================================

async function deleteAssignment(id) {

    const record =
        assignments.find(
            item =>
                String(item.id) ===
                String(id)
        );

    const name =
        record?.personnel?.full_name ||
        "this assignment";

    const confirmed =
        confirm(
            `Delete the assignment for ${name}?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const headers =
            await getAdminAuthHeaders(false);


        const response =
            await fetch(
                `/api/assignments/${encodeURIComponent(id)}`,
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
                "Unable to delete assignment."
            );
        }

        await loadAssignments();

    } catch (error) {

        console.error(
            "Delete assignment error:",
            error
        );

        alert(error.message);
    }
}


// ============================================
// ACTIONS DROPDOWN
// ============================================

tableBody.addEventListener(
    "click",
    async event => {

        const actionButton =
            event.target.closest(
                ".action-button"
            );

        if (actionButton) {

            event.stopPropagation();

            const assignmentId =
                actionButton.dataset.id;

            const menu =
                document.querySelector(
                    `[data-menu-id="${assignmentId}"]`
                );

            if (!menu) {
                return;
            }

            const isAlreadyOpen =
                menu.classList.contains("show");

            closeAllActionMenus();

            if (!isAlreadyOpen) {

                positionActionMenu(
                    actionButton,
                    menu
                );

                menu.classList.add(
                    "show"
                );
            }

            return;
        }


        const viewButton =
            event.target.closest(
                ".view-action"
            );

        if (viewButton) {

            closeAllActionMenus();

            await openViewAssignment(
                viewButton.dataset.id
            );

            return;
        }


        const editButton =
            event.target.closest(
                ".edit-action"
            );

        if (editButton) {

            closeAllActionMenus();

            await openEditAssignment(
                editButton.dataset.id
            );

            return;
        }


        const deleteButton =
            event.target.closest(
                ".delete-action"
            );

        if (deleteButton) {

            closeAllActionMenus();

            await deleteAssignment(
                deleteButton.dataset.id
            );
        }
    }
);


// ============================================
// POSITION ACTION MENU
// ============================================

function positionActionMenu(
    actionButton,
    menu
) {

    const rect =
        actionButton.getBoundingClientRect();

    const menuWidth =
        150;

    const gap =
        6;

    let left =
        rect.right - menuWidth;

    let top =
        rect.bottom + gap;


    // Keep menu inside left edge
    if (left < 8) {
        left = 8;
    }


    // Keep menu inside right edge
    if (
        left + menuWidth >
        window.innerWidth - 8
    ) {

        left =
            window.innerWidth -
            menuWidth -
            8;
    }


    // Temporarily display to measure height
    menu.style.visibility =
        "hidden";

    menu.style.display =
        "block";

    const menuHeight =
        menu.offsetHeight;

    menu.style.display =
        "";

    menu.style.visibility =
        "";


    // If there is not enough room below,
    // automatically open above the button
    if (
        top + menuHeight >
        window.innerHeight - 8
    ) {

        top =
            rect.top -
            menuHeight -
            gap;
    }


    // Prevent menu from going above viewport
    if (top < 8) {
        top = 8;
    }


    menu.style.top =
        `${top}px`;

    menu.style.left =
        `${left}px`;
}


// ============================================
// CLOSE ACTION MENUS
// ============================================

function closeAllActionMenus() {

    document
        .querySelectorAll(
            ".actions-menu.show"
        )
        .forEach(menu => {

            menu.classList.remove(
                "show"
            );

            menu.style.top =
                "";

            menu.style.left =
                "";
        });
}


// Close dropdown when clicking elsewhere
document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".actions-dropdown"
            )
        ) {

            closeAllActionMenus();
        }
    }
);


// Close dropdown when scrolling
window.addEventListener(
    "scroll",
    closeAllActionMenus,
    true
);


// Close dropdown when resizing
window.addEventListener(
    "resize",
    closeAllActionMenus
);


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

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
// START PAGE
// ============================================

loadTeam();