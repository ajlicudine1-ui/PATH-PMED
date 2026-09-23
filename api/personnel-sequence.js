import {
    supabaseAdmin
} from "../lib/supabase.js";

import {
    requireAuth
} from "../lib/requireAuth.js";


// ==========================================
// HELPERS
// ==========================================

async function getTeamByCode(teamCode) {

    const cleanCode =
        String(teamCode || "")
            .trim()
            .toUpperCase();

    if (!cleanCode) {
        return null;
    }

    const {
        data,
        error
    } =
        await supabaseAdmin
            .from("teams")
            .select(
                "id, code, name"
            )
            .eq(
                "code",
                cleanCode
            )
            .single();

    if (error) {
        throw error;
    }

    return data;
}


async function getSavedOrder(teamId) {

    const {
        data,
        error
    } =
        await supabaseAdmin
            .from(
                "personnel_sequence"
            )
            .select(
                "team_id, personnel_id, display_order"
            )
            .eq(
                "team_id",
                teamId
            )
            .order(
                "display_order",
                {
                    ascending: true
                }
            );

    if (error) {
        throw error;
    }

    return data || [];
}


// ==========================================
// HANDLER
// ==========================================

export default async function handler(req, res) {

    // ==========================================
    // GET ORDER - PUBLIC/VIEWER
    // ==========================================
    if (req.method === "GET") {

        try {

            const teamCode =
                req.query.team;

            if (!teamCode) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Team code is required."
                    });
            }

            const team =
                await getTeamByCode(
                    teamCode
                );

            if (!team) {

                return res
                    .status(404)
                    .json({
                        error:
                            "Team not found."
                    });
            }

            const order =
                await getSavedOrder(
                    team.id
                );

            return res
                .status(200)
                .json(order);

        } catch (error) {

            console.error(
                "GET personnel sequence error:",
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
    // SYNC ORDER - ADMIN ONLY
    //
    // Existing saved positions NEVER change.
    // Personnel not yet saved are appended to
    // the bottom in the order supplied by admin.
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
                teamCode,
                personnelIds
            } =
                req.body || {};

            if (
                !teamCode ||
                !Array.isArray(personnelIds)
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "teamCode and personnelIds are required."
                    });
            }

            const team =
                await getTeamByCode(
                    teamCode
                );

            if (!team) {

                return res
                    .status(404)
                    .json({
                        error:
                            "Team not found."
                    });
            }

            const uniquePersonnelIds = [];

            const seen =
                new Set();

            personnelIds.forEach(value => {

                if (
                    value === null ||
                    value === undefined
                ) {
                    return;
                }

                const key =
                    String(value);

                if (seen.has(key)) {
                    return;
                }

                seen.add(key);

                uniquePersonnelIds.push(
                    value
                );
            });

            const existingOrder =
                await getSavedOrder(
                    team.id
                );

            const existingPersonnelIds =
                new Set(
                    existingOrder.map(
                        item =>
                            String(
                                item.personnel_id
                            )
                    )
                );

            let nextOrder =
                existingOrder.reduce(
                    (highest, item) =>
                        Math.max(
                            highest,
                            Number(
                                item.display_order
                            ) || 0
                        ),
                    0
                ) + 1;

            const rowsToInsert = [];

            uniquePersonnelIds.forEach(
                personnelId => {

                    if (
                        existingPersonnelIds.has(
                            String(personnelId)
                        )
                    ) {
                        return;
                    }

                    rowsToInsert.push({
                        team_id:
                            team.id,

                        personnel_id:
                            personnelId,

                        display_order:
                            nextOrder
                    });

                    nextOrder += 1;
                }
            );

            if (rowsToInsert.length) {

                const {
                    error: insertError
                } =
                    await supabaseAdmin
                        .from(
                            "personnel_sequence"
                        )
                        .insert(
                            rowsToInsert
                        );

                if (insertError) {
                    throw insertError;
                }
            }

            const finalOrder =
                await getSavedOrder(
                    team.id
                );

            return res
                .status(200)
                .json({
                    message:
                        rowsToInsert.length
                            ? "New responsible persons appended to the bottom."
                            : "Responsible person order unchanged.",

                    order:
                        finalOrder
                });

        } catch (error) {

            console.error(
                "PUT personnel sequence error:",
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
