// ============================================
// PATH - VIEWER SIDEBAR
// ============================================

const VIEWER_TEAM_CACHE =
    "path_sidebar_teams";


// ============================================
// TEAM ICON IMAGES
// ============================================

const viewerTeamIcons = {
    PPS: "/images/PPS.png",
    MES: "/images/MES.png",
    IMS: "/images/IMS.png",
    AMIA: "/images/AMIA.png",
    RSBSA: "/images/RSBSA.png",
    F2C2: "/images/F2C2.png",
    RAFC: "/images/RAFC.png",
    DIVISION: "/images/Division.png"
};


// ============================================
// GET TEAM ICON PATH
// ============================================

function getViewerTeamIconPath(code) {

    const normalizedCode =
        String(code || "")
            .trim()
            .toUpperCase();

    return (
        viewerTeamIcons[normalizedCode] ||
        "/images/Division.png"
    );
}


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

                    <img
                        src="/images/PMED-LOGO.png"
                        alt="PMED Logo"
                        class="brand-logo-image"
                    >

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

                        <img
                            src="/images/home.png"
                            alt="Home"
                            class="nav-icon-image"
                        >

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


    const cachedTeams =
        getViewerCachedTeams();


    if (cachedTeams.length) {

        renderViewerTeams(
            cachedTeams
        );
    }


    setViewerActiveItem();


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
            "Viewer sidebar cache error:",
            error
        );

        return [];
    }
}


// ============================================
// REFRESH VIEWER TEAMS
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
// RENDER VIEWER TEAMS
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
                    String(
                        team.code || ""
                    )
                        .trim()
                        .toUpperCase();


                const name =
                    team.name || code;


                const iconPath =
                    getViewerTeamIconPath(
                        code
                    );


                const displayCode =
                    code === "DIVISION"
                        ? "Division"
                        : code;


                return `
                    <a
                        href="/viewer-team.html?team=${encodeURIComponent(code)}"
                        class="nav-item"
                        data-viewer-team="${escapeViewerSidebarHTML(code)}"
                        title="${escapeViewerSidebarHTML(name)}"
                    >

                        <div class="nav-icon">

                            <img
                                src="${escapeViewerSidebarHTML(iconPath)}"
                                alt="${escapeViewerSidebarHTML(displayCode)} icon"
                                class="nav-icon-image"
                            >

                        </div>


                        <div class="nav-text">

                            <strong>
                                ${escapeViewerSidebarHTML(
                                    displayCode
                                )}
                            </strong>

                            <span>
                                ${escapeViewerSidebarHTML(
                                    name
                                )}
                            </span>

                        </div>

                    </a>
                `;
            })
            .join("");
}


// ============================================
// ACTIVE VIEWER ITEM
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
            ".sidebar .nav-item"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );
        });


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


    if (selectedTeam) {

        const code =
            selectedTeam
                .toUpperCase();


        document
            .querySelector(
                `[data-viewer-team="${CSS.escape(code)}"]`
            )
            ?.classList
            .add("active");
    }
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