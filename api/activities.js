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
                        start_time,
                        end_time,
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
                    )
                    .order(
                        "start_time",
                        {
                            ascending: true,
                            nullsFirst: true
                        }
                    );


            if (start) {

                query =
                    query.gte(
                        "activity_date",
                        start
                    );
            }


            if (end) {

                query =
                    query.lte(
                        "activity_date",
                        end
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
                teamId,
                startTime,
                endTime,
                description
            } = req.body;


            const cleanTitle =
                String(title || "")
                    .trim();

            const cleanDate =
                String(activityDate || "")
                    .trim();


            if (
                !cleanTitle ||
                !cleanDate
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Activity title and date are required."
                    });
            }


            if (
                startTime &&
                endTime &&
                endTime < startTime
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "End time cannot be earlier than start time."
                    });
            }


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

                        team_id:
                            cleanNullableValue(
                                teamId
                            ),

                        start_time:
                            cleanNullableValue(
                                startTime
                            ),

                        end_time:
                            cleanNullableValue(
                                endTime
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
                        start_time,
                        end_time,
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


    return res
        .status(405)
        .json({
            error:
                "Method not allowed"
        });
}
