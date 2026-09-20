import {
    supabaseAdmin
} from "../lib/supabase.js";

export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        // Total personnel
        const {
            count: personnelCount,
            error: personnelError
        } = await supabaseAdmin
            .from("personnel")
            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            );

        if (personnelError) {
            throw personnelError;
        }


        // Total teams
        const {
            count: teamsCount,
            error: teamsError
        } = await supabaseAdmin
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


        // Total assignments
        const {
            count: assignmentsCount,
            error: assignmentsCountError
        } = await supabaseAdmin
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


        // Recent assignments
        const {
            data: assignments,
            error: assignmentsError
        } = await supabaseAdmin
            .from("assignments")
            .select(`
                id,
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


        return res.status(200).json({
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

        return res.status(500).json({
            error: error.message
        });
    }
}