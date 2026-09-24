import {
    supabaseAdmin
} from "../lib/supabase.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { data: personnel, error: personnelError } =
            await supabaseAdmin
                .from("personnel")
                .select("id, employment_status");

        if (personnelError) throw personnelError;

        const personnelCounts = {
            permanent: 0,
            contractual: 0,
            jobOrder: 0
        };

        (personnel || []).forEach(person => {
            const status = String(person.employment_status || "")
                .trim()
                .toLowerCase();

            if (status === "permanent") {
                personnelCounts.permanent += 1;
            }

            if (status === "contractual") {
                personnelCounts.contractual += 1;
            }

            if (status === "job order") {
                personnelCounts.jobOrder += 1;
            }
        });

        const { count: teamsCount, error: teamsError } =
            await supabaseAdmin
                .from("teams")
                .select("*", {
                    count: "exact",
                    head: true
                });

        if (teamsError) throw teamsError;

        const {
            count: assignmentsCount,
            error: assignmentsCountError
        } =
            await supabaseAdmin
                .from("assignments")
                .select("*", {
                    count: "exact",
                    head: true
                });

        if (assignmentsCountError) {
            throw assignmentsCountError;
        }

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
                        designation,
                        employment_status
                    ),
                    teams (
                        id,
                        code,
                        name
                    )
                `)
                .order("created_at", {
                    ascending: false
                })
                .limit(10);

        if (assignmentsError) {
            throw assignmentsError;
        }

        return res.status(200).json({
            permanentPersonnel:
                personnelCounts.permanent,

            contractualPersonnel:
                personnelCounts.contractual,

            jobOrderPersonnel:
                personnelCounts.jobOrder,

            totalPermanent:
                personnelCounts.permanent,

            totalContractual:
                personnelCounts.contractual,

            totalJobOrder:
                personnelCounts.jobOrder,

            totalPersonnel:
                personnelCounts.permanent +
                personnelCounts.contractual +
                personnelCounts.jobOrder,

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
