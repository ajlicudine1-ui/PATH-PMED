import {
    supabase,
    supabaseAdmin
} from "../lib/supabase.js";

import {
    requireAuth
} from "../lib/requireAuth.js";


export default async function handler(req, res) {

    // ==========================================
    // GET TEAMS - PUBLIC
    // ==========================================

    if (req.method === "GET") {

        try {

            const {
                data,
                error
            } = await supabase
                .from("teams")
                .select("*")
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


            if (error) {
                throw error;
            }


            return res
                .status(200)
                .json(data);


        } catch (error) {

            console.error(
                "GET teams error:",
                error
            );


            return res
                .status(500)
                .json({
                    error:
                        error.message
                });
        }
    }


    // ==========================================
    // POST - ADMIN ONLY
    // ==========================================

    if (req.method === "POST") {

        try {

            const auth =
                await requireAuth(req);


            if (auth.error) {

                return res
                    .status(401)
                    .json({
                        error:
                            auth.error
                    });
            }


            const {
                code,
                name
            } = req.body;


            if (!code || !name) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Section code and section name are required."
                    });
            }


            const normalizedCode =
                code
                    .trim()
                    .toUpperCase();


            const normalizedName =
                name.trim();


            const {
                data: existingTeam,
                error: checkError
            } = await supabaseAdmin
                .from("teams")
                .select(
                    "id, code"
                )
                .eq(
                    "code",
                    normalizedCode
                )
                .maybeSingle();


            if (checkError) {
                throw checkError;
            }


            if (existingTeam) {

                return res
                    .status(409)
                    .json({
                        error:
                            "A section with this code already exists."
                    });
            }


            const {
                data,
                error
            } = await supabaseAdmin
                .from("teams")
                .insert({
                    code:
                        normalizedCode,

                    name:
                        normalizedName
                })
                .select()
                .single();


            if (error) {
                throw error;
            }


            return res
                .status(201)
                .json({
                    message:
                        "Section added successfully.",

                    team:
                        data
                });


        } catch (error) {

            console.error(
                "POST teams error:",
                error
            );


            return res
                .status(500)
                .json({
                    error:
                        error.message
                });
        }
    }


    return res
        .status(405)
        .json({
            error:
                "Method not allowed."
        });
}