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

const employmentStatusFilter =
    document.getElementById(
        "employmentStatusFilter"
    );


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
            "P.A.T.H | PMED Assignment and Team Hub";

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

const employmentStatusInput =
    document.getElementById("employmentStatus");

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

let responsiblePersonOrder = new Map();


// ============================================
// RESPONSIBLE PERSON NAME FORMAT
// Required: Given Name(s) + Middle Initial + Last Name
// Example: Yhoebe Rae C. Bernal
// ============================================

function titleCasePersonNamePart(value) {

    return String(value || "")
        .toLowerCase()
        .replace(
            /(^|[-'’])([\p{L}])/gu,
            (match, separator, letter) =>
                separator + letter.toUpperCase()
        );
}


function parseResponsiblePersonName(value) {

    const cleanValue =
        String(value || "")
            .trim()
            .replace(/\s+/g, " ");


    const parts =
        cleanValue.split(" ");


    if (parts.length < 3) {

        return {
            valid: false,
            formatted: cleanValue
        };
    }


    let middleInitialIndex =
        -1;


    for (
        let index = 1;
        index < parts.length - 1;
        index += 1
    ) {

        if (
            /^[\p{L}]\.?$/u.test(
                parts[index]
            )
        ) {

            middleInitialIndex =
                index;

            break;
        }
    }


    if (middleInitialIndex === -1) {

        return {
            valid: false,
            formatted: cleanValue
        };
    }


    const givenNames =
        parts.slice(
            0,
            middleInitialIndex
        );


    const surnames =
        parts.slice(
            middleInitialIndex + 1
        );


    const validNamePart =
        /^[\p{L}][\p{L}'’\-]*$/u;


    const namesAreValid =
        givenNames.every(
            part =>
                validNamePart.test(part)
        ) &&
        surnames.every(
            part =>
                validNamePart.test(part)
        );


    if (!namesAreValid) {

        return {
            valid: false,
            formatted: cleanValue
        };
    }


    const middleInitial =
        parts[middleInitialIndex]
            .replace(".", "")
            .toUpperCase() +
        ".";


    const formatted =
        [
            ...givenNames.map(
                titleCasePersonNamePart
            ),
            middleInitial,
            ...surnames.map(
                titleCasePersonNamePart
            )
        ].join(" ");


    return {
        valid: true,
        formatted
    };
}


if (responsiblePersonInput) {

    responsiblePersonInput.placeholder =
        "e.g., Juan D. La Cruz";


    // Visible name-format guide under the input
    if (
        !document.getElementById(
            "responsiblePersonGuide"
        )
    ) {

        const guide =
            document.createElement("small");

        guide.id =
            "responsiblePersonGuide";

        guide.className =
            "field-guide";

        

        responsiblePersonInput
            .insertAdjacentElement(
                "afterend",
                guide
            );
    }


    responsiblePersonInput.addEventListener(
        "input",
        () => {

            responsiblePersonInput
                .setCustomValidity("");
        }
    );


    responsiblePersonInput.addEventListener(
        "blur",
        () => {

            if (modalMode !== "add") {
                return;
            }


            const parsedName =
                parseResponsiblePersonName(
                    responsiblePersonInput.value
                );


            if (parsedName.valid) {

                responsiblePersonInput.value =
                    parsedName.formatted;
            }
        }
    );
}


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


function getEmploymentStatusForPerson(name) {

    const normalizedName =
        normalizePersonName(name);

    if (!normalizedName) {
        return "";
    }

    const match =
        assignments.find(record => {

            return (
                normalizePersonName(
                    record.personnel?.full_name
                ) === normalizedName
            );
        });

    return (
        match?.personnel?.employment_status ||
        ""
    );
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
            "P.A.T.H | PMED Assignment and Team Hub";

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

        await syncResponsiblePersonOrder();

        applyAssignmentFilters();

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
// NORMALIZE ACTIVITY DISPLAY INDENTATION
// Keeps line breaks, removes leading spaces/tabs
// ============================================

function normalizeActivityDisplay(value) {

    return String(value || "")
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map(line => line.trimStart())
        .join("\n")
        .trim();
}



// ============================================
// RESPONSIBLE PERSON STABLE DISPLAY ORDER
// Existing order is preserved. New people are
// appended to the bottom only.
// ============================================

function getUniquePersonnelIdsInCurrentOrder(records) {

    const seen =
        new Set();

    const ids = [];

    records.forEach(record => {

        const personnelId =
            record.personnel?.id ||
            record.personnel_id;

        if (
            personnelId === null ||
            personnelId === undefined
        ) {
            return;
        }

        const key =
            String(personnelId);

        if (seen.has(key)) {
            return;
        }

        seen.add(key);

        ids.push(personnelId);
    });

    return ids;
}


async function syncResponsiblePersonOrder() {

    if (
        !teamCode ||
        !Array.isArray(assignments)
    ) {
        return;
    }

    const personnelIds =
        getUniquePersonnelIdsInCurrentOrder(
            assignments
        );

    if (!personnelIds.length) {

        responsiblePersonOrder =
            new Map();

        return;
    }

    try {

        const headers =
            await getAdminAuthHeaders();

        const response =
            await fetch(
                "/api/personnel-sequence",
                {
                    method: "PUT",
                    headers,
                    body:
                        JSON.stringify({
                            teamCode,
                            personnelIds
                        })
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

        responsiblePersonOrder =
            new Map(
                (Array.isArray(result.order)
                    ? result.order
                    : []
                ).map(item => [
                    String(item.personnel_id),
                    Number(item.display_order)
                ])
            );

    } catch (error) {

        console.error(
            "Responsible person order error:",
            error
        );

        // Keep the current display order if order sync fails.
        responsiblePersonOrder =
            new Map();
    }
}


function sortAssignmentsByResponsiblePersonOrder(
    records
) {

    if (!responsiblePersonOrder.size) {

        // Important:
        // Do not rearrange existing data if there
        // is no saved order yet.
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
                responsiblePersonOrder.has(aId)
                    ? responsiblePersonOrder.get(aId)
                    : Number.MAX_SAFE_INTEGER;

            const bOrder =
                responsiblePersonOrder.has(bId)
                    ? responsiblePersonOrder.get(bId)
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
// DISPLAY ASSIGNMENTS
// ============================================

function normalizePersonName(name) {

    return String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[.,]/g, "")
        .replace(/\s+/g, " ");
}


function groupAssignmentsByPerson(records) {

    const groups = new Map();

    records.forEach(record => {

        const personnel =
            record.personnel || {};

        const fullName =
            personnel.full_name || "";

        const key =
            normalizePersonName(fullName) ||
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

    const orderedRecords =
        sortAssignmentsByResponsiblePersonOrder(
            records
        );

    const groupedRecords =
        groupAssignmentsByPerson(
            orderedRecords
        );

    tableBody.innerHTML =
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

                            const functionsActivities =
                                record.functions_activities || "";

                            const responsiblePersonCell =
                                index === 0
                                    ? `
                                        <td
                                            rowspan="${rowCount}"
                                            class="grouped-person-cell"
                                        >
                                            ${escapeHTML(
                                                group.fullName
                                            )}
                                        </td>
                                    `
                                    : "";

                            return `
                                <tr>

                                    ${responsiblePersonCell}

                                    <td>
                                        ${escapeHTML(
                                            designation
                                        )}
                                    </td>

                                    <td class="functions-activities-cell">${escapeHTML(
                                        normalizeActivityDisplay(
                                            functionsActivities
                                        )
                                    )}</td>

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
                        }
                    )
                    .join("");
            })
            .join("");
}


// ============================================
// SEARCH + EMPLOYMENT STATUS FILTER
// ============================================

function applyAssignmentFilters() {

    const keyword =
        String(
            searchInput?.value || ""
        )
            .toLowerCase()
            .trim();


    const selectedStatus =
        String(
            employmentStatusFilter?.value || ""
        )
            .toLowerCase()
            .trim();


    const filteredAssignments =
        assignments.filter(record => {

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
                    record.functions_activities || ""
                )
                    .toLowerCase();


            const matchesKeyword =
                !keyword ||
                name.includes(keyword) ||
                employmentStatus.includes(keyword) ||
                designation.includes(keyword) ||
                activity.includes(keyword);


            const matchesStatus =
                !selectedStatus ||
                employmentStatus === selectedStatus;


            return (
                matchesKeyword &&
                matchesStatus
            );
        });


    renderAssignments(
        filteredAssignments
    );
}


if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyAssignmentFilters
    );
}


if (employmentStatusFilter) {

    employmentStatusFilter.addEventListener(
        "change",
        applyAssignmentFilters
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

    employmentStatusInput.value =
        getEmploymentStatusForPerson(
            responsiblePersonInput.value
        );

    responsiblePersonInput.disabled =
        false;

    employmentStatusInput.disabled =
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

        employmentStatusInput.value =
            assignment.personnel?.employment_status || "";

        designationInput.value =
            assignment.designation ||
            assignment.personnel?.designation ||
            "";

        functionsActivitiesInput.value =
            assignment.functions_activities || "";

        responsiblePersonInput.disabled = true;
        employmentStatusInput.disabled = true;
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

        employmentStatusInput.value =
            assignment.personnel?.employment_status || "";

        designationInput.value =
            assignment.designation ||
            assignment.personnel?.designation ||
            "";

        functionsActivitiesInput.value =
            assignment.functions_activities || "";

        responsiblePersonInput.disabled = false;
        employmentStatusInput.disabled = false;
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

    employmentStatusInput.disabled =
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

            let responsiblePerson =
                responsiblePersonInput
                    .value
                    .trim();


            // ============================================
            // RESPONSIBLE PERSON FORMAT VALIDATION
            // ============================================

            if (modalMode === "add") {

                const parsedName =
                    parseResponsiblePersonName(
                        responsiblePerson
                    );


                if (!parsedName.valid) {

                    responsiblePersonInput
                        .setCustomValidity(
                            "Use the format: First Name Middle Initial. Last Name (example: Juan D. La Cruz)."
                        );


                    responsiblePersonInput
                        .reportValidity();


                    responsiblePersonInput
                        .focus();


                    return;
                }


                responsiblePerson =
                    parsedName.formatted;


                responsiblePersonInput.value =
                    responsiblePerson;


                responsiblePersonInput
                    .setCustomValidity("");
            }


            const employmentStatus =
                employmentStatusInput
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
                !employmentStatus ||
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
                                    employmentStatus,
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