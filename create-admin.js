import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

const email = "admin@path.com";
const password = "PathAdmin123!";

const { data, error } =
    await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

if (error) {
    console.error(
        "Create admin error:",
        error.message
    );

    process.exit(1);
}

console.log(
    "Admin created successfully."
);

console.log(
    "Email:",
    data.user.email
);

console.log(
    "User ID:",
    data.user.id
);