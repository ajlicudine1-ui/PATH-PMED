// ============================================
// PATH - ADMIN LOGIN
// ============================================

// IMPORTANT:
// Use only the publishable key here.
// NEVER use SUPABASE_SECRET_KEY in frontend JS.

const SUPABASE_URL =
    "https://ccvmgrwtxzhvgscjhqqj.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_sugs8pHalzzKSKu33TfgmA_5Tx_OM0-";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ============================================
// ELEMENTS
// ============================================

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const loginMessage =
    document.getElementById("loginMessage");


// ============================================
// CHECK EXISTING SESSION
// ============================================

async function checkExistingSession() {

    const {
        data: {
            session
        },
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (error) {

        console.error(
            "Session check error:",
            error
        );

        return;
    }


    if (session) {

        window.location.replace(
            "/admin.html"
        );
    }
}


checkExistingSession();


// ============================================
// LOGIN
// ============================================

loginForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        loginMessage.textContent =
            "";


        loginButton.disabled =
            true;


        loginButton.textContent =
            "Signing in...";


        const email =
            emailInput
                .value
                .trim();


        const password =
            passwordInput
                .value;


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signInWithPassword({
                        email,
                        password
                    });


            if (error) {
                throw error;
            }


            if (!data.session) {

                throw new Error(
                    "Unable to create login session."
                );
            }


            window.location.replace(
                "/admin.html"
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            loginMessage.textContent =
                error.message;


        } finally {

            loginButton.disabled =
                false;


            loginButton.textContent =
                "Sign In";
        }
    }
);