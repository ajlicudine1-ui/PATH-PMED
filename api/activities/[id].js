import {
    supabaseAdmin
} from "../../lib/supabase.js";

import {
    requireAuth
} from "../../lib/requireAuth.js";


function cleanNullableValue(value) {

    const cleanValue =
        String(value || "")
            .trim();

    return cleanValue || null;
}


export default async function handler(req, res) {

    const {
        id
    } = req.query;


    if (!id) {

        return res
            .status(400)
            .json({
                error:
                    "Activity ID is required."
            });
    }


    // ==========================================
    // GET ONE ACTIVITY
    // ==========================================

    if (req.method === "GET") {

        try {

            const {
                data,
                error
            } =
                await supabaseAdmin
                    .from("calendar_activities")
                    .select(`
                        id,
                        title,
                        activity_date,
                        end_date,
                        description,
                        team_id,
                        created_at,
                        updated_at,
                        teams (
                            id,
                            code,
                            name
                        )
                    `)
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
                "GET activity error:",
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
    // UPDATE ACTIVITY - ADMIN ONLY
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
                title,
                activityDate,
                endDate,
                teamId,
                description
            } = req.body;


            const cleanTitle =
                String(title || "")
                    .trim();


            const cleanDate =
                String(activityDate || "")
                    .trim();


            const cleanEndDate =
                String(endDate || "")
                    .trim();


            // ==========================================
            // REQUIRED FIELDS
            // ==========================================

            if (
                !cleanTitle ||
                !cleanDate ||
                !cleanEndDate
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Activity title, start date, and end date are required."
                    });
            }


            // ==========================================
            // VALIDATE DATE RANGE
            // ==========================================

            if (
                cleanEndDate <
                cleanDate
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "End date cannot be earlier than start date."
                    });
            }


            // ==========================================
            // UPDATE ACTIVITY
            // ==========================================

            const {
                data,
                error
            } =
                await supabaseAdmin
                    .from("calendar_activities")
                    .update({

                        title:
                            cleanTitle,

                        activity_date:
                            cleanDate,

                        end_date:
                            cleanEndDate,

                        team_id:
                            cleanNullableValue(
                                teamId
                            ),

                        description:
                            cleanNullableValue(
                                description
                            ),

                        updated_at:
                            new Date()
                                .toISOString()

                    })
                    .eq(
                        "id",
                        id
                    )
                    .select(`
                        id,
                        title,
                        activity_date,
                        end_date,
                        description,
                        team_id,
                        created_at,
                        updated_at,
                        teams (
                            id,
                            code,
                            name
                        )
                    `)
                    .single();


            if (error) {
                throw error;
            }


            return res
                .status(200)
                .json(data);


        } catch (error) {

            console.error(
                "PUT activity error:",
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
    // DELETE ACTIVITY - ADMIN ONLY
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
                error
            } =
                await supabaseAdmin
                    .from("calendar_activities")
                    .delete()
                    .eq(
                        "id",
                        id
                    );


            if (error) {
                throw error;
            }


            return res
                .status(200)
                .json({
                    success:
                        true
                });


        } catch (error) {

            console.error(
                "DELETE activity error:",
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
                "Method not allowed"
        });
}