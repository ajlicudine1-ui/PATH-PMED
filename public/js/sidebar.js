// ============================================
// P.A.T.H - ADMIN SIDEBAR
// PMED Assignment and Team Hub
// ============================================

const ADMIN_TEAM_CACHE =
    "path_sidebar_teams";


// ============================================
// TEAM ICON IMAGES
// ============================================

const adminTeamIcons = {
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

function getAdminTeamIconPath(code) {

    const normalizedCode =
        String(code || "")
            .trim()
            .toUpperCase();

    return (
        adminTeamIcons[normalizedCode] ||
        "/images/Division.png"
    );
}


// ============================================
// LOAD ADMIN SIDEBAR
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
        <aside class="sidebar admin-sidebar">

            <div class="sidebar-brand admin-sidebar-brand">

                <div class="brand-logo">

                    <img
                        src="/images/PMED-LOGO.png"
                        alt="PMED Logo"
                        class="brand-logo-image"
                    >

                </div>


                <div class="brand-text">

                    <h1>
                        P.A.T.H.
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


                <div id="adminTeamNavItems"></div>

            </nav>

        </aside>
    `;


    const cachedTeams =
        getAdminCachedTeams();


    if (cachedTeams.length) {

        renderAdminTeams(
            cachedTeams
        );
    }


    setAdminActiveItem();


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
                .slice()
                .sort(
                    (a, b) =>
                        (
                            Number(a.display_order) ||
                            999
                        ) -
                        (
                            Number(b.display_order) ||
                            999
                        )
                )
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
            (
                Array.isArray(result)
                    ? result
                    : []
            )
                .slice()
                .sort(
                    (a, b) =>
                        (
                            Number(a.display_order) ||
                            999
                        ) -
                        (
                            Number(b.display_order) ||
                            999
                        )
                );


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


                const iconPath =
                    getAdminTeamIconPath(
                        code
                    );


                const displayCode =
                    code === "DIVISION"
                        ? "Division"
                        : code;


                return `
                    <a
                        href="/team.html?team=${encodeURIComponent(code)}"
                        class="nav-item"
                        data-admin-team="${escapeSidebarHTML(code)}"
                        title="${escapeSidebarHTML(name)}"
                    >

                        <div class="nav-icon">

                            <img
                                src="${escapeSidebarHTML(iconPath)}"
                                alt="${escapeSidebarHTML(displayCode)} icon"
                                class="nav-icon-image"
                            >

                        </div>


                        <div class="nav-text">

                            <strong>
                                ${escapeSidebarHTML(
                                    displayCode
                                )}
                            </strong>

                            <span>
                                ${escapeSidebarHTML(
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
            ".admin-sidebar .nav-item"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );
        });


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

loadAdminSidebar();


