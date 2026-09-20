// ============================================
// PATH - SIDEBAR
// ============================================

const SIDEBAR_TEAMS_CACHE = "path_sidebar_teams";


// ============================================
// DEFAULT TEAMS
// Used only if there is no cache yet
// ============================================

const defaultTeams = [
    {
        code: "PPS",
        name: "Planning and Programming Section"
    },
    {
        code: "MES",
        name: "Monitoring and Evaluation Section"
    },
    {
        code: "IMS",
        name: "Information Management Section"
    },
    {
        code: "AMIA",
        name: "Adaptation and Mitigation Initiative in Agriculture"
    },
    {
        code: "RSBSA",
        name: "Registry System for Basic Sectors in Agriculture"
    },
    {
        code: "F2C2",
        name: "Farm and Fisheries Clustering and Consolidation"
    },
    {
        code: "RAFC",
        name: "Regional Agricultural and Fishery Council"
    },
    {
        code: "DIVISION",
        name: "Division"
    }
];


// ============================================
// LOAD SIDEBAR
// ============================================

async function loadSidebar() {

    const sidebarContainer =
        document.getElementById("sidebarContainer");

    if (!sidebarContainer) {
        return;
    }

    try {

        // Load sidebar structure
        const sidebarResponse =
            await fetch("/components/sidebar.html");

        if (!sidebarResponse.ok) {
            throw new Error(
                "Unable to load sidebar."
            );
        }

        sidebarContainer.innerHTML =
            await sidebarResponse.text();


        // ====================================
        // DISPLAY TEAMS IMMEDIATELY
        // ====================================

        const cachedTeams =
            getCachedTeams();

        renderSidebarTeams(
            cachedTeams.length
                ? cachedTeams
                : defaultTeams
        );

        setActiveSidebarItem();


        // ====================================
        // REFRESH FROM DATABASE IN BACKGROUND
        // ====================================

        refreshSidebarTeams();

    } catch (error) {

        console.error(
            "Sidebar error:",
            error
        );
    }
}


// ============================================
// GET CACHED TEAMS
// ============================================

function getCachedTeams() {

    try {

        const cached =
            localStorage.getItem(
                SIDEBAR_TEAMS_CACHE
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
            "Sidebar cache error:",
            error
        );

        return [];
    }
}


// ============================================
// SAVE TEAMS TO CACHE
// ============================================

function saveTeamsToCache(teams) {

    try {

        localStorage.setItem(
            SIDEBAR_TEAMS_CACHE,
            JSON.stringify(teams)
        );

    } catch (error) {

        console.error(
            "Unable to save sidebar cache:",
            error
        );
    }
}


// ============================================
// REFRESH TEAMS FROM DATABASE
// ============================================

async function refreshSidebarTeams() {

    try {

        const response =
            await fetch("/api/teams");

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


        // Save newest teams
        saveTeamsToCache(teams);


        // Update sidebar
        renderSidebarTeams(teams);

        setActiveSidebarItem();

    } catch (error) {

        console.error(
            "Sidebar refresh error:",
            error
        );
    }
}


// ============================================
// RENDER SIDEBAR TEAMS
// ============================================

function renderSidebarTeams(teams) {

    const container =
        document.getElementById(
            "teamNavItems"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        teams
            .map(team => {

                const code =
                    escapeSidebarHTML(
                        team.code
                    );

                const name =
                    escapeSidebarHTML(
                        team.name
                    );

                return `
                    <a
                        href="/team.html?team=${encodeURIComponent(team.code)}"
                        class="nav-item team-link"
                        data-team="${code}"
                    >

                        <div class="nav-icon">
                            ${getTeamIcon(team.code)}
                        </div>

                        <div class="nav-text">

                            <strong>
                                ${
                                    team.code === "DIVISION"
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
// ICONS
// ============================================

function getTeamIcon(code) {

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
        ] || "📁"
    );
}


// ============================================
// ACTIVE SIDEBAR ITEM
// ============================================

function setActiveSidebarItem() {

    const currentPath =
        window.location.pathname;

    const params =
        new URLSearchParams(
            window.location.search
        );

    const selectedTeam =
        params.get("team");


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.remove(
                "active"
            );
        });


    // HOME
    if (
        currentPath === "/" ||
        currentPath.endsWith(
            "index.html"
        )
    ) {

        document
            .querySelector(
                '[data-page="home"]'
            )
            ?.classList
            .add("active");

        return;
    }


    // TEAM
    if (selectedTeam) {

        document
            .querySelector(
                `[data-team="${selectedTeam.toUpperCase()}"]`
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

document.addEventListener(
    "DOMContentLoaded",
    loadSidebar
);