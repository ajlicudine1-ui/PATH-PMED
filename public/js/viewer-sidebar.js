// ============================================
// P.A.T.H - VIEWER SIDEBAR
// PMED Assignment and Team Hub
// ============================================

const VIEWER_TEAM_CACHE =
    "path_sidebar_teams";


// ============================================
// LOAD VIEWER SIDEBAR STYLESHEET
// ============================================

function ensureViewerSidebarStyles() {

    const stylesheetId =
        "viewerSidebarStyles";

    if (
        document.getElementById(
            stylesheetId
        )
    ) {
        return;
    }

    const link =
        document.createElement(
            "link"
        );

    link.id =
        stylesheetId;

    link.rel =
        "stylesheet";

    link.href =
        "/css/viewer-sidebar.css";

    document.head.appendChild(
        link
    );
}


// ============================================
// TEAM ICON IMAGES
// ============================================

const viewerTeamIcons = {

    PPS:
        "/images/PPS.png",

    MES:
        "/images/MES.png",

    IMS:
        "/images/IMS.png",

    AMIA:
        "/images/AMIA.png",

    RSBSA:
        "/images/RSBSA.png",

    F2C2:
        "/images/F2C2.png",

    RAFC:
        "/images/RAFC.png",

    DIVISION:
        "/images/Division.png"
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
        viewerTeamIcons[
            normalizedCode
        ] ||
        "/images/Division.png"
    );
}


// ============================================
// LOAD VIEWER SIDEBAR
// ============================================

async function loadViewerSidebar() {

    ensureViewerSidebarStyles();

    const sidebarContainer =
        document.getElementById(
            "sidebarContainer"
        );

    if (!sidebarContainer) {
        return;
    }


    sidebarContainer.innerHTML = `
        <aside class="sidebar viewer-sidebar">

            <div class="sidebar-brand viewer-sidebar-brand">

                <div class="brand-logo viewer-brand-logo">

                    <img
                        src="/images/PMED-LOGO.png"
                        alt="PMED Logo"
                        class="brand-logo-image"
                    >

                </div>


                <div class="brand-text viewer-brand-text">

                    <h1>
                        P.A.T.H.
                    </h1>

                    <p>
                        PMED Assignment and Team Hub
                    </p>

                </div>

            </div>


            <nav class="sidebar-nav viewer-sidebar-nav">

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


                <div
                    id="viewerTeamNavItems"
                    class="viewer-team-nav-items"
                ></div>

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
            ".viewer-sidebar .nav-item"
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
// KEEP SIDEBAR SCROLL POSITION
// ============================================

const SIDEBAR_SCROLL_KEY =
    "path_sidebar_scroll_position";


function restoreSidebarScrollPosition() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    if (!sidebar) {
        return;
    }


    const savedPosition =
        Number(
            sessionStorage.getItem(
                SIDEBAR_SCROLL_KEY
            )
        ) || 0;


    requestAnimationFrame(() => {

        sidebar.scrollTop =
            savedPosition;

    });
}


function saveSidebarScrollPosition() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    if (!sidebar) {
        return;
    }


    sessionStorage.setItem(
        SIDEBAR_SCROLL_KEY,
        String(
            sidebar.scrollTop
        )
    );
}


// Save whenever the sidebar is scrolled
document.addEventListener(
    "scroll",
    event => {

        if (
            event.target
                ?.classList
                ?.contains("sidebar")
        ) {

            saveSidebarScrollPosition();
        }

    },
    true
);


// Save immediately before clicking
// another sidebar page.
document.addEventListener(
    "click",
    event => {

        const sidebarLink =
            event.target.closest(
                ".sidebar a"
            );


        if (!sidebarLink) {
            return;
        }


        saveSidebarScrollPosition();

    }
);


// Extra protection before page navigation/reload
window.addEventListener(
    "pagehide",
    saveSidebarScrollPosition
);


// Restore after sidebar exists
requestAnimationFrame(
    restoreSidebarScrollPosition
);
// ============================================
// START
// ============================================

loadViewerSidebar();
