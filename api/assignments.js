import {
    supabase,
    supabaseAdmin
} from "../lib/supabase.js";

import {
    requireAuth
} from "../lib/requireAuth.js";


export default async function handler(req, res) {

    // ==========================================
    // GET ASSIGNMENTS - PUBLIC
    // ==========================================

    if (req.method === "GET") {

        try {

            const {
                team
            } = req.query;


            if (!team) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Team code is required."
                    });
            }


            const {
                data,
                error
            } = await supabase
                .from("assignments")
                .select(`
                    id,
                    functions_activities,
                    personnel (
                        id,
                        full_name,
                        designation
                    ),
                    teams!inner (
                        id,
                        code,
                        name
                    )
                `)
                .eq(
                    "teams.code",
                    team
                        .trim()
                        .toUpperCase()
                )
                .order(
                    "id",
                    {
                        ascending: false
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
                "GET assignments error:",
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
    // CREATE ASSIGNMENT - ADMIN ONLY
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
                teamCode,
                responsiblePerson,
                designation,
                functionsActivities
            } = req.body;


            if (
                !teamCode ||
                !responsiblePerson ||
                !designation ||
                !functionsActivities
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "All fields are required."
                    });
            }


            // FIND TEAM

            const {
                data: team,
                error: teamError
            } = await supabaseAdmin
                .from("teams")
                .select("id")
                .eq(
                    "code",
                    teamCode
                        .trim()
                        .toUpperCase()
                )
                .single();


            if (teamError) {
                throw teamError;
            }


            // CREATE PERSONNEL

            const {
                data: personnel,
                error: personnelError
            } = await supabaseAdmin
                .from("personnel")
                .insert({
                    full_name:
                        responsiblePerson.trim(),

                    designation:
                        designation.trim()
                })
                .select(
                    "id, full_name, designation"
                )
                .single();


            if (personnelError) {
                throw personnelError;
            }


            // CREATE ASSIGNMENT

            const {
                data: assignment,
                error: assignmentError
            } = await supabaseAdmin
                .from("assignments")
                .insert({
                    team_id:
                        team.id,

                    personnel_id:
                        personnel.id,

                    functions_activities:
                        functionsActivities.trim()
                })
                .select(`
                    id,
                    functions_activities
                `)
                .single();


            if (assignmentError) {
                throw assignmentError;
            }


            return res
                .status(201)
                .json({
                    message:
                        "Assignment added successfully.",

                    assignment,
                    personnel
                });


        } catch (error) {

            console.error(
                "POST assignment error:",
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