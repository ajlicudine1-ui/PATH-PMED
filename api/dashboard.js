import {
    supabaseAdmin
} from "../lib/supabase.js";


export default async function handler(req, res) {

    if (req.method !== "GET") {

        return res
            .status(405)
            .json({
                error:
                    "Method not allowed"
            });
    }


    try {

        // ==========================================
        // TOTAL PERSONNEL
        // Count unique personnel currently linked
        // to at least one assignment.
        // ==========================================

        const {
            data: assignmentPersonnel,
            error: personnelError
        } =
            await supabaseAdmin
                .from("assignments")
                .select("personnel_id");


        if (personnelError) {
            throw personnelError;
        }


        const uniquePersonnel =
            new Set(
                (assignmentPersonnel || [])
                    .map(item =>
                        item.personnel_id
                    )
                    .filter(Boolean)
            );


        const personnelCount =
            uniquePersonnel.size;


        // ==========================================
        // TOTAL TEAMS
        // ==========================================

        const {
            count: teamsCount,
            error: teamsError
        } =
            await supabaseAdmin
                .from("teams")
                .select(
                    "*",
                    {
                        count: "exact",
                        head: true
                    }
                );


        if (teamsError) {
            throw teamsError;
        }


        // ==========================================
        // TOTAL ASSIGNMENTS
        // ==========================================

        const {
            count: assignmentsCount,
            error: assignmentsCountError
        } =
            await supabaseAdmin
                .from("assignments")
                .select(
                    "*",
                    {
                        count: "exact",
                        head: true
                    }
                );


        if (assignmentsCountError) {
            throw assignmentsCountError;
        }


        // ==========================================
        // RECENT ASSIGNMENTS
        // ==========================================

        const {
            data: assignments,
            error: assignmentsError
        } =
            await supabaseAdmin
                .from("assignments")
                .select(`
                    id,
                    personnel_id,
                    team_id,
                    designation,
                    functions_activities,
                    created_at,
                    personnel (
                        id,
                        full_name,
                        designation
                    ),
                    teams (
                        id,
                        code,
                        name
                    )
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(10);


        if (assignmentsError) {
            throw assignmentsError;
        }


        // ==========================================
        // RESPONSE
        // ==========================================

        return res
            .status(200)
            .json({

                totalPersonnel:
                    personnelCount || 0,

                totalTeams:
                    teamsCount || 0,

                totalAssignments:
                    assignmentsCount || 0,

                assignments:
                    assignments || []
            });


    } catch (error) {

        console.error(
            "Dashboard API error:",
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
