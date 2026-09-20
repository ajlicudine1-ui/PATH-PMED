import {
    supabase,
    supabaseAdmin
} from "../../lib/supabase.js";

import {
    requireAuth
} from "../../lib/requireAuth.js";


export default async function handler(req, res) {

    const {
        id
    } = req.query;


    if (!id) {

        return res
            .status(400)
            .json({
                error:
                    "Section ID is required."
            });
    }


    // ==========================================
    // GET ONE SECTION - PUBLIC
    // ==========================================

    if (req.method === "GET") {

        try {

            const {
                data,
                error
            } = await supabase
                .from("teams")
                .select("*")
                .eq(
                    "id",
                    id
                )
                .single();


            if (error) {
                throw error;
            }


            return res
                .status(200)
                .json(data);


        } catch (error) {

            console.error(
                "GET section error:",
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
    // UPDATE SECTION - ADMIN ONLY
    // ==========================================

    if (req.method === "PUT") {

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
                data: duplicate,
                error: duplicateError
            } = await supabaseAdmin
                .from("teams")
                .select("id")
                .eq(
                    "code",
                    normalizedCode
                )
                .neq(
                    "id",
                    id
                )
                .maybeSingle();


            if (duplicateError) {
                throw duplicateError;
            }


            if (duplicate) {

                return res
                    .status(409)
                    .json({
                        error:
                            "Another section already uses this code."
                    });
            }


            const {
                data,
                error
            } = await supabaseAdmin
                .from("teams")
                .update({
                    code:
                        normalizedCode,

                    name:
                        normalizedName,

                    updated_at:
                        new Date()
                            .toISOString()
                })
                .eq(
                    "id",
                    id
                )
                .select()
                .single();


            if (error) {
                throw error;
            }


            return res
                .status(200)
                .json({
                    message:
                        "Section updated successfully.",

                    team:
                        data
                });


        } catch (error) {

            console.error(
                "PUT section error:",
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
    // DELETE SECTION - ADMIN ONLY
    // ==========================================

    if (req.method === "DELETE") {

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
                data: team,
                error: teamError
            } = await supabaseAdmin
                .from("teams")
                .select(
                    "id, code, name"
                )
                .eq(
                    "id",
                    id
                )
                .maybeSingle();


            if (teamError) {
                throw teamError;
            }


            if (!team) {

                return res
                    .status(404)
                    .json({
                        error:
                            "Section not found."
                    });
            }


            const {
                count,
                error: assignmentError
            } = await supabaseAdmin
                .from("assignments")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "team_id",
                    id
                );


            if (assignmentError) {
                throw assignmentError;
            }


            if (
                count &&
                count > 0
            ) {

                return res
                    .status(409)
                    .json({
                        error:
                            `${team.code} cannot be deleted because it still has ${count} assignment${count === 1 ? "" : "s"}.`
                    });
            }


            const {
                error: deleteError
            } = await supabaseAdmin
                .from("teams")
                .delete()
                .eq(
                    "id",
                    id
                );


            if (deleteError) {
                throw deleteError;
            }


            return res
                .status(200)
                .json({
                    message:
                        "Section deleted successfully."
                });


        } catch (error) {

            console.error(
                "DELETE section error:",
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