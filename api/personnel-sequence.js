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


async function getAssignedPersonnelIds(
    teamId
) {

    const {
        data,
        error
    } =
        await supabaseAdmin
            .from("assignments")
            .select(
                "id, personnel_id"
            )
            .eq(
                "team_id",
                teamId
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


    const seen =
        new Set();

    const ids =
        [];


    (data || []).forEach(row => {

        if (
            row.personnel_id === null ||
            row.personnel_id === undefined
        ) {
            return;
        }


        const key =
            String(
                row.personnel_id
            );


        if (seen.has(key)) {
            return;
        }


        seen.add(key);

        ids.push(
            row.personnel_id
        );
    });


    return ids;
}


async function getSavedSequence(
    teamId
) {

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


async function ensureSequence(
    teamId
) {

    const assignedPersonnelIds =
        await getAssignedPersonnelIds(
            teamId
        );


    if (!assignedPersonnelIds.length) {

        return [];
    }


    const existing =
        await getSavedSequence(
            teamId
        );


    const existingIds =
        new Set(
            existing.map(
                row =>
                    String(
                        row.personnel_id
                    )
            )
        );


    let nextOrder =
        existing.reduce(
            (maximum, row) =>
                Math.max(
                    maximum,
                    Number(
                        row.display_order
                    ) || 0
                ),
            0
        ) + 1;


    const missingRows =
        [];


    assignedPersonnelIds.forEach(
        personnelId => {

            if (
                existingIds.has(
                    String(personnelId)
                )
            ) {
                return;
            }


            missingRows.push({
                team_id:
                    teamId,

                personnel_id:
                    personnelId,

                display_order:
                    nextOrder
            });


            nextOrder += 1;
        }
    );


    if (missingRows.length) {

        const {
            error: insertError
        } =
            await supabaseAdmin
                .from(
                    "personnel_sequence"
                )
                .insert(
                    missingRows
                );


        if (insertError) {
            throw insertError;
        }
    }


    return getSavedSequence(
        teamId
    );
}


// ==========================================
// HANDLER
// ==========================================

export default async function handler(
    req,
    res
) {

    // ==========================================
    // GET DISPLAY ORDER
    // Public/read-only so viewer can follow it.
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


            const rows =
                await ensureSequence(
                    team.id
                );


            return res
                .status(200)
                .json(rows);


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
    // SAVE DISPLAY ORDER
    // ADMIN ONLY
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
                !Array.isArray(
                    personnelIds
                ) ||
                !personnelIds.length
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


            const assignedIds =
                await getAssignedPersonnelIds(
                    team.id
                );


            const assignedSet =
                new Set(
                    assignedIds.map(
                        id =>
                            String(id)
                    )
                );


            const uniqueIds =
                [];


            const seen =
                new Set();


            personnelIds.forEach(
                personnelId => {

                    const key =
                        String(
                            personnelId
                        );


                    if (
                        seen.has(key) ||
                        !assignedSet.has(key)
                    ) {
                        return;
                    }


                    seen.add(key);

                    uniqueIds.push(
                        personnelId
                    );
                }
            );


            // Keep any newly-created personnel that were
            // not present in the modal at the bottom.
            assignedIds.forEach(
                personnelId => {

                    const key =
                        String(
                            personnelId
                        );


                    if (!seen.has(key)) {

                        seen.add(key);

                        uniqueIds.push(
                            personnelId
                        );
                    }
                }
            );


            // Clear only this section's saved sequence.
            const {
                error: deleteError
            } =
                await supabaseAdmin
                    .from(
                        "personnel_sequence"
                    )
                    .delete()
                    .eq(
                        "team_id",
                        team.id
                    );


            if (deleteError) {
                throw deleteError;
            }


            const rows =
                uniqueIds.map(
                    (
                        personnelId,
                        index
                    ) => ({

                        team_id:
                            team.id,

                        personnel_id:
                            personnelId,

                        display_order:
                            index + 1
                    })
                );


            if (rows.length) {

                const {
                    error: insertError
                } =
                    await supabaseAdmin
                        .from(
                            "personnel_sequence"
                        )
                        .insert(
                            rows
                        );


                if (insertError) {
                    throw insertError;
                }
            }


            const finalOrder =
                await getSavedSequence(
                    team.id
                );


            return res
                .status(200)
                .json({
                    message:
                        "Personnel order saved successfully.",

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
