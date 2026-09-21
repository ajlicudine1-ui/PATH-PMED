// ============================================
// PATH - VIEWER SIDEBAR
// ============================================

const VIEWER_TEAM_CACHE =
    "path_sidebar_teams";


// ============================================
// LOAD VIEWER SIDEBAR
// ============================================

async function loadViewerSidebar() {

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
                    href="/"
                    class="nav-item"
                    id="viewerHomeLink"
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


                <div id="viewerTeamNavItems"></div>

            </nav>

        </aside>
    `;


    // ========================================
    // SHOW CACHED TEAMS IMMEDIATELY
    // ========================================

    const cachedTeams =
        getViewerCachedTeams();


    if (cachedTeams.length) {

        renderViewerTeams(
            cachedTeams
        );
    }


    setViewerActiveItem();


    // ========================================
    // REFRESH FROM DATABASE
    // ========================================

    await refreshViewerTeams();
}


// ============================================
// GET CACHED TEAMS
// ============================================

function getViewerCachedTeams() {

    try {

        const cached =
            localStorage.getItem(
                VIEWER_TEAM_CACHE
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
            "Viewer cache error:",
            error
        );

        return [];
    }
}


// ============================================
// REFRESH TEAMS
// ============================================

async function refreshViewerTeams() {

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


        if (!Array.isArray(teams)) {
            return;
        }


        localStorage.setItem(
            VIEWER_TEAM_CACHE,
            JSON.stringify(teams)
        );


        renderViewerTeams(
            teams
        );


        setViewerActiveItem();


    } catch (error) {

        console.error(
            "Viewer sidebar error:",
            error
        );
    }
}


// ============================================
// RENDER TEAMS
// ============================================

function renderViewerTeams(teams) {

    const container =
        document.getElementById(
            "viewerTeamNavItems"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        teams
            .map(team => {

                const code =
                    escapeViewerSidebarHTML(
                        team.code
                    );


                const name =
                    escapeViewerSidebarHTML(
                        team.name
                    );


                return `
                    <a
                        href="/viewer-team.html?team=${encodeURIComponent(
                            team.code
                        )}"
                        class="nav-item"
                        data-viewer-team="${code}"
                    >

                        <div class="nav-icon">
                            ${getViewerTeamIcon(
                                team.code
                            )}
                        </div>

                        <div class="nav-text">

                            <strong>
                                ${
                                    String(team.code)
                                        .toUpperCase() ===
                                    "DIVISION"
                                        ? "Division"
                                        : code
                                }
                            </strong>

                            <span>
                                ${name}
                            </span>

                        </div>

                    </a>
                `;
            })
            .join("");
}


// ============================================
// ACTIVE SIDEBAR ITEM
// ============================================

function setViewerActiveItem() {

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
            ".nav-item"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );
        });


    // ========================================
    // HOME
    // ========================================

    if (
        currentPath === "/" ||
        currentPath.endsWith(
            "/index.html"
        ) ||
        currentPath.endsWith(
            "index.html"
        )
    ) {

        document
            .getElementById(
                "viewerHomeLink"
            )
            ?.classList
            .add("active");

        return;
    }


    // ========================================
    // TEAM PAGE
    // ========================================

    if (selectedTeam) {

        const activeTeam =
            document.querySelector(
                `[data-viewer-team="${selectedTeam.toUpperCase()}"]`
            );


        activeTeam
            ?.classList
            .add("active");
    }
}


// ============================================
// TEAM ICONS
// ============================================

function getViewerTeamIcon(code) {

    const icons = {

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


    return (
        icons[
            String(code)
                .toUpperCase()
        ] ||
        "📁"
    );
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeViewerSidebarHTML(value) {

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

loadViewerSidebar();