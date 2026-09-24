import {
    supabaseAdmin
} from "../lib/supabase.js";

import {
    requireAuth
} from "../lib/requireAuth.js";


function cleanNullableValue(value) {

    const cleanValue =
        String(value || "")
            .trim();

    return cleanValue || null;
}


export default async function handler(req, res) {

    // ==========================================
    // GET ACTIVITIES
    // Public read so this can later be reused
    // by the viewer calendar.
    // ==========================================

    if (req.method === "GET") {

        try {

            const {
                start,
                end
            } = req.query;


            let query =
                supabaseAdmin
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
                    .order(
                        "activity_date",
                        {
                            ascending: true
                        }
                    );


            // ==========================================
            // DATE RANGE OVERLAP
            //
            // Example:
            // Activity: Aug 30 -> Sep 3
            // Calendar: Sep 1 -> Sep 30
            //
            // The activity must still be returned because
            // it overlaps September.
            // ==========================================

            if (end) {

                query =
                    query.lte(
                        "activity_date",
                        end
                    );
            }


            if (start) {

                query =
                    query.gte(
                        "end_date",
                        start
                    );
            }


            const {
                data,
                error
            } =
                await query;


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
                "GET activities error:",
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
    // CREATE ACTIVITY - ADMIN ONLY
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
            // INSERT ACTIVITY
            // ==========================================

            const {
                data,
                error
            } =
                await supabaseAdmin
                    .from("calendar_activities")
                    .insert({

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
                            )

                    })
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
                .status(201)
                .json(data);


        } catch (error) {

            console.error(
                "POST activity error:",
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