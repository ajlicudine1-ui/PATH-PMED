// ============================================
// PATH - ADMIN AUTH GUARD
// ============================================

const PATH_SUPABASE_URL =
    "https://ccvmgrwtxzhvgscjhqqj.supabase.co";

const PATH_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_sugs8pHalzzKSKu33TfgmA_5Tx_OM0-";


const pathSupabase =
    window.supabase.createClient(
        PATH_SUPABASE_URL,
        PATH_SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );



// ============================================
// ELEMENTS
// ============================================

const logoutBtn =
    document.getElementById("logoutBtn");



// ============================================
// GET CURRENT ADMIN SESSION
// ============================================

async function getAdminSession() {

    const {
        data: {
            session
        },
        error
    } =
        await pathSupabase
            .auth
            .getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        return null;
    }


    return session;
}



// ============================================
// REFRESH ADMIN SESSION
// ============================================

async function refreshAdminSession() {

    try {

        const {
            data,
            error
        } =
            await pathSupabase
                .auth
                .refreshSession();


        if (
            error ||
            !data?.session
        ) {

            console.error(
                "Session refresh error:",
                error
            );

            return null;
        }


        return data.session;

    } catch (error) {

        console.error(
            "Session refresh exception:",
            error
        );

        return null;
    }
}



// ============================================
// REDIRECT TO LOGIN
// ============================================

async function redirectAdminToLogin() {

    try {

        await pathSupabase
            .auth
            .signOut();

    } catch (error) {

        console.error(
            "Sign out error:",
            error
        );
    }


    window.location.replace(
        "/login.html"
    );
}



// ============================================
// GET ADMIN ACCESS TOKEN
// ============================================

async function getAdminAccessToken() {

    let session =
        await getAdminSession();


    if (!session) {

        await redirectAdminToLogin();

        throw new Error(
            "Admin session expired. Please sign in again."
        );
    }


    // Supabase expires_at is in Unix seconds.
    const expiresAt =
        Number(
            session.expires_at || 0
        );

    const now =
        Math.floor(
            Date.now() / 1000
        );


    // ========================================
    // REFRESH IF TOKEN IS CLOSE TO EXPIRING
    // ========================================
    //
    // Refresh when:
    // - expires_at is unavailable
    // - token is already expired
    // - token has 60 seconds or less remaining
    //
    // This helps prevent a stale token from
    // reaching protected API routes.
    // ========================================

    if (
        !expiresAt ||
        expiresAt - now <= 60
    ) {

        const refreshedSession =
            await refreshAdminSession();


        if (!refreshedSession) {

            await redirectAdminToLogin();

            throw new Error(
                "Admin session expired. Please sign in again."
            );
        }


        session =
            refreshedSession;
    }


    // ========================================
    // FINAL TOKEN CHECK
    // ========================================

    const accessToken =
        session?.access_token;


    if (!accessToken) {

        await redirectAdminToLogin();

        throw new Error(
            "Admin session expired. Please sign in again."
        );
    }


    return accessToken;
}



// ============================================
// BUILD ADMIN AUTH HEADERS
// ============================================

async function getAdminAuthHeaders(
    includeJson = true
) {

    const accessToken =
        await getAdminAccessToken();


    const headers = {

        Authorization:
            `Bearer ${accessToken}`

    };


    if (includeJson) {

        headers["Content-Type"] =
            "application/json";
    }


    return headers;
}



// ============================================
// CHECK ADMIN SESSION
// ============================================

async function checkAdminSession() {

    try {

        let session =
            await getAdminSession();


        if (!session) {

            window.location.replace(
                "/login.html"
            );

            return false;
        }


        // ====================================
        // CHECK IF SESSION NEEDS REFRESH
        // ====================================

        const expiresAt =
            Number(
                session.expires_at || 0
            );

        const now =
            Math.floor(
                Date.now() / 1000
            );


        if (
            !expiresAt ||
            expiresAt - now <= 60
        ) {

            const refreshedSession =
                await refreshAdminSession();


            if (!refreshedSession) {

                await redirectAdminToLogin();

                return false;
            }


            session =
                refreshedSession;
        }


        document.body.classList.add(
            "auth-ready"
        );


        return true;

    } catch (error) {

        console.error(
            "Auth check error:",
            error
        );


        await redirectAdminToLogin();


        return false;
    }
}



// ============================================
// LOGOUT ADMIN
// ============================================

async function logoutAdmin() {

    try {

        if (logoutBtn) {

            logoutBtn.disabled =
                true;

            logoutBtn.textContent =
                "Logging out...";
        }


        const {
            error
        } =
            await pathSupabase
                .auth
                .signOut();


        if (error) {

            throw error;
        }


        window.location.replace(
            "/login.html"
        );


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        alert(
            "Unable to logout. Please try again."
        );


        if (logoutBtn) {

            logoutBtn.disabled =
                false;

            logoutBtn.textContent =
                "Logout";
        }
    }
}



// ============================================
// AUTH STATE CHANGES
// ============================================

pathSupabase.auth.onAuthStateChange(

    (event, session) => {

        // Supabase may emit TOKEN_REFRESHED during
        // normal use. That is expected and should
        // not redirect the admin.

        if (
            event === "SIGNED_OUT" ||
            !session
        ) {

            document.body.classList.remove(
                "auth-ready"
            );


            window.location.replace(
                "/login.html"
            );
        }
    }
);



// ============================================
// LOGOUT BUTTON
// ============================================

logoutBtn?.addEventListener(
    "click",
    logoutAdmin
);



// ============================================
// START AUTH CHECK
// ============================================

checkAdminSession();