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
                    "display_order",
                    {
                        ascending: true,
                        nullsFirst: false
                    }
                )
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
                .json(
                    data || []
                );


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
                String(code)
                    .trim()
                    .toUpperCase();


            const normalizedName =
                String(name)
                    .trim();


            if (
                !normalizedCode ||
                !normalizedName
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Section code and section name are required."
                    });
            }


            // ==========================================
            // CHECK FOR DUPLICATE SECTION CODE
            // ==========================================

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


            // ==========================================
            // GET NEXT DISPLAY ORDER
            // ==========================================
            // New sections will automatically appear
            // after the existing sections.

            const {
                data: lastTeam,
                error: orderError
            } = await supabaseAdmin
                .from("teams")
                .select(
                    "display_order"
                )
                .not(
                    "display_order",
                    "is",
                    null
                )
                .order(
                    "display_order",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .maybeSingle();


            if (orderError) {
                throw orderError;
            }


            const nextDisplayOrder =
                Number(
                    lastTeam?.display_order || 0
                ) + 1;


            // ==========================================
            // CREATE SECTION
            // ==========================================

            const {
                data,
                error
            } = await supabaseAdmin
                .from("teams")
                .insert({

                    code:
                        normalizedCode,

                    name:
                        normalizedName,

                    display_order:
                        nextDisplayOrder

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


    // ==========================================
    // METHOD NOT ALLOWED
    // ==========================================

    return res
        .status(405)
        .json({
            error:
                "Method not allowed."
        });
}