// ============================================
// PATH - ADMIN SIDEBAR
// ============================================

const ADMIN_TEAM_CACHE =
    "path_sidebar_teams";


// ============================================
// TEAM ICONS
// ============================================

const adminTeamIcons = {
    PPS: "📋",
    MES: "📊",
    IMS: "💻",
    AMIA: "🌾",
    RSBSA: "👥",
    F2C2: "🔗",
    RAFC: "🏛️",
    DIVISION: "🏢",
    RAED: "⚙️"
};


// ============================================
// LOAD SIDEBAR
// ============================================

async function loadAdminSidebar() {

    const sidebarContainer =
        document.getElementById(
            "sidebarContainer"
        );

    if (!sidebarContainer) {
        return;
    }


    sidebarContainer.innerHTML = `
        <aside class="sidebar">

            <div class="sidebar-brand">

                <div class="brand-logo">
                    P
                </div>

                <div class="brand-text">

                    <h1>
                        PATH
                    </h1>

                    <p>
                        PMED Assignment and Team Hub
                    </p>

                </div>

            </div>


            <nav class="sidebar-nav">

                <a
                    href="/admin.html"
                    class="nav-item"
                    id="adminHomeLink"
                >

                    <div class="nav-icon">
                        🏠
                    </div>

                    <div class="nav-text">
                        <strong>
                            Home
                        </strong>
                    </div>

                </a>


                <div id="adminTeamNavItems"></div>

            </nav>

        </aside>
    `;


    // Display cached teams instantly.
    const cachedTeams =
        getAdminCachedTeams();

    if (cachedTeams.length) {

        renderAdminTeams(
            cachedTeams
        );
    }


    setAdminActiveItem();


    // Refresh from database.
    await refreshAdminTeams();
}


// ============================================
// GET CACHED TEAMS
// ============================================

function getAdminCachedTeams() {

    try {

        const cached =
            localStorage.getItem(
                ADMIN_TEAM_CACHE
            );


        if (!cached) {
            return [];
        }


        const teams =
            JSON.parse(cached);


        return Array.isArray(teams)
            ? teams
            : [];


    } catch (error) {

        console.error(
            "Admin sidebar cache error:",
            error
        );

        return [];
    }
}


// ============================================
// REFRESH TEAMS
// ============================================

async function refreshAdminTeams() {

    try {

        const response =
            await fetch(
                "/api/teams",
                {
                    cache: "no-store"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to load teams."
            );
        }


        const teams =
            Array.isArray(result)
                ? result
                : [];


        localStorage.setItem(
            ADMIN_TEAM_CACHE,
            JSON.stringify(teams)
        );


        renderAdminTeams(
            teams
        );


        setAdminActiveItem();


    } catch (error) {

        console.error(
            "Admin sidebar error:",
            error
        );
    }
}


// ============================================
// RENDER TEAMS
// ============================================

function renderAdminTeams(teams) {

    const container =
        document.getElementById(
            "adminTeamNavItems"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        teams
            .map(team => {

                const code =
                    String(
                        team.code || ""
                    )
                        .trim()
                        .toUpperCase();


                const name =
                    team.name || code;


                const icon =
                    adminTeamIcons[code] ||
                    "📁";


                return `
                    <a
                        href="/team.html?team=${encodeURIComponent(code)}"
                        class="nav-item"
                        data-admin-team="${escapeSidebarHTML(code)}"
                        title="${escapeSidebarHTML(name)}"
                    >

                        <div class="nav-icon">
                            ${icon}
                        </div>

                        <div class="nav-text">

                            <strong>
                                ${escapeSidebarHTML(
                                    code === "DIVISION"
                                        ? "Division"
                                        : code
                                )}
                            </strong>

                        </div>

                    </a>
                `;
            })
            .join("");
}


// ============================================
// ACTIVE SIDEBAR ITEM
// ============================================

function setAdminActiveItem() {

    const currentPath =
        window.location.pathname;


    const params =
        new URLSearchParams(
            window.location.search
        );


    const selectedTeam =
        params.get("team");


    document
        .querySelectorAll(
            ".sidebar .nav-item"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );
        });


    // ADMIN HOME
    if (
        currentPath === "/admin.html" ||
        currentPath.endsWith(
            "/admin.html"
        )
    ) {

        document
            .getElementById(
                "adminHomeLink"
            )
            ?.classList
            .add("active");

        return;
    }


    // ADMIN TEAM PAGE
    if (selectedTeam) {

        const code =
            selectedTeam
                .toUpperCase();


        document
            .querySelector(
                `[data-admin-team="${CSS.escape(code)}"]`
            )
            ?.classList
            .add("active");
    }
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeSidebarHTML(value) {

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

loadAdminSidebar();