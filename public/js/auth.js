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
// GET ADMIN ACCESS TOKEN
// ============================================

async function getAdminAccessToken() {

    const session =
        await getAdminSession();


    if (!session) {

        window.location.replace(
            "/login.html"
        );

        throw new Error(
            "Admin session expired. Please sign in again."
        );
    }


    return session.access_token;
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

        const session =
            await getAdminSession();


        if (!session) {

            window.location.replace(
                "/login.html"
            );

            return false;
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


        window.location.replace(
            "/login.html"
        );


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