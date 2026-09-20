import {
    supabaseAdmin
} from "./supabase.js";


// ============================================
// REQUIRE AUTHENTICATED ADMIN USER
// ============================================

export async function requireAuth(req) {

    const authorization =
        req.headers.authorization || "";


    if (
        !authorization.startsWith(
            "Bearer "
        )
    ) {

        return {
            user: null,
            error: "Unauthorized."
        };
    }


    const token =
        authorization
            .replace("Bearer ", "")
            .trim();


    if (!token) {

        return {
            user: null,
            error: "Unauthorized."
        };
    }


    const {
        data,
        error
    } =
        await supabaseAdmin
            .auth
            .getUser(token);


    if (
        error ||
        !data?.user
    ) {

        return {
            user: null,
            error:
                "Invalid or expired session."
        };
    }


    return {
        user: data.user,
        error: null
    };
}