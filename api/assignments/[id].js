import {
    supabase,
    supabaseAdmin
} from "../../lib/supabase.js";

import {
    requireAuth
} from "../../lib/requireAuth.js";


// ==========================================
// NORMALIZE PERSON NAME
// ==========================================

function normalizePersonName(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[.,]/g, "")
        .replace(/\s+/g, " ");
}


// ==========================================
// API HANDLER
// ==========================================

export default async function handler(req, res) {

    const {
        id
    } = req.query;


    if (!id) {

        return res
            .status(400)
            .json({
                error:
                    "Assignment ID is required."
            });
    }


    // ==========================================
    // GET ONE ASSIGNMENT - PUBLIC
    // ==========================================

    if (req.method === "GET") {

        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("assignments")
                    .select(`
                        id,
                        personnel_id,
                        team_id,
                        designation,
                        functions_activities,
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
                "GET assignment error:",
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
    // UPDATE ASSIGNMENT - ADMIN ONLY
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
                responsiblePerson,
                designation,
                functionsActivities
            } = req.body;


            if (
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


            const cleanName =
                responsiblePerson.trim();

            const cleanDesignation =
                designation.trim();

            const cleanFunctions =
                functionsActivities.trim();


            // ==========================================
            // GET CURRENT ASSIGNMENT + PERSONNEL
            // ==========================================

            const {
                data: currentAssignment,
                error: currentError
            } =
                await supabaseAdmin
                    .from("assignments")
                    .select(`
                        id,
                        personnel_id,
                        team_id,
                        designation,
                        functions_activities,
                        personnel (
                            id,
                            full_name,
                            designation
                        )
                    `)
                    .eq(
                        "id",
                        id
                    )
                    .single();


            if (currentError) {
                throw currentError;
            }


            if (!currentAssignment) {

                return res
                    .status(404)
                    .json({
                        error:
                            "Assignment not found."
                    });
            }


            const oldPersonnelId =
                currentAssignment.personnel_id;

            const oldPersonnelName =
                currentAssignment
                    .personnel
                    ?.full_name ||
                "";

            const oldNormalizedName =
                normalizePersonName(
                    oldPersonnelName
                );

            const newNormalizedName =
                normalizePersonName(
                    cleanName
                );


            let targetPersonnelId =
                oldPersonnelId;

            let personnelChanged =
                false;


            // ==========================================
            // RESPONSIBLE PERSON CHANGED
            // ==========================================

            if (
                oldNormalizedName !==
                newNormalizedName
            ) {

                const {
                    data: personnelRecords,
                    error: personnelLookupError
                } =
                    await supabaseAdmin
                        .from("personnel")
                        .select(`
                            id,
                            full_name,
                            designation
                        `);


                if (personnelLookupError) {
                    throw personnelLookupError;
                }


                const existingPersonnel =
                    personnelRecords
                        ?.find(record => {

                            return (
                                normalizePersonName(
                                    record.full_name
                                ) ===
                                newNormalizedName
                            );
                        });


                // Reuse an existing person if found
                if (existingPersonnel) {

                    targetPersonnelId =
                        existingPersonnel.id;

                } else {

                    // Otherwise create a new person
                    const {
                        data: newPersonnel,
                        error: createPersonnelError
                    } =
                        await supabaseAdmin
                            .from("personnel")
                            .insert({
                                full_name:
                                    cleanName,

                                // Kept only for backward compatibility.
                                // Assignment-specific designation is stored
                                // in assignments.designation.
                                designation:
                                    cleanDesignation
                            })
                            .select(`
                                id,
                                full_name,
                                designation
                            `)
                            .single();


                    if (createPersonnelError) {
                        throw createPersonnelError;
                    }


                    targetPersonnelId =
                        newPersonnel.id;
                }


                personnelChanged =
                    String(targetPersonnelId) !==
                    String(oldPersonnelId);

            } else {

                // Same person, but allow formatting/capitalization
                // corrections to the canonical displayed name.
                const {
                    error: updatePersonnelError
                } =
                    await supabaseAdmin
                        .from("personnel")
                        .update({
                            full_name:
                                cleanName,

                            updated_at:
                                new Date()
                                    .toISOString()
                        })
                        .eq(
                            "id",
                            oldPersonnelId
                        );


                if (updatePersonnelError) {
                    throw updatePersonnelError;
                }
            }


            // ==========================================
            // UPDATE ASSIGNMENT
            // ==========================================

            const {
                data: updatedAssignment,
                error: assignmentError
            } =
                await supabaseAdmin
                    .from("assignments")
                    .update({
                        personnel_id:
                            targetPersonnelId,

                        designation:
                            cleanDesignation,

                        functions_activities:
                            cleanFunctions,

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
                        personnel_id,
                        team_id,
                        designation,
                        functions_activities,
                        updated_at,
                        personnel (
                            id,
                            full_name,
                            designation
                        )
                    `)
                    .single();


            if (assignmentError) {
                throw assignmentError;
            }


            // ==========================================
            // CLEAN UP OLD PERSONNEL IF NOW UNUSED
            // ==========================================

            let oldPersonnelDeleted =
                false;


            if (
                personnelChanged &&
                oldPersonnelId
            ) {

                const {
                    count,
                    error: countError
                } =
                    await supabaseAdmin
                        .from("assignments")
                        .select(
                            "id",
                            {
                                count: "exact",
                                head: true
                            }
                        )
                        .eq(
                            "personnel_id",
                            oldPersonnelId
                        );


                if (countError) {
                    throw countError;
                }


                if (count === 0) {

                    const {
                        error: deletePersonnelError
                    } =
                        await supabaseAdmin
                            .from("personnel")
                            .delete()
                            .eq(
                                "id",
                                oldPersonnelId
                            );


                    if (deletePersonnelError) {
                        throw deletePersonnelError;
                    }


                    oldPersonnelDeleted =
                        true;
                }
            }


            return res
                .status(200)
                .json({
                    message:
                        "Assignment updated successfully.",

                    assignment:
                        updatedAssignment,

                    personnelChanged,

                    oldPersonnelDeleted
                });


        } catch (error) {

            console.error(
                "PUT assignment error:",
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
    // DELETE ASSIGNMENT - ADMIN ONLY
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


            // ==========================================
            // GET ASSIGNMENT BEFORE DELETE
            // ==========================================

            const {
                data: currentAssignment,
                error: currentError
            } =
                await supabaseAdmin
                    .from("assignments")
                    .select(`
                        id,
                        personnel_id,
                        team_id,
                        designation,
                        functions_activities
                    `)
                    .eq(
                        "id",
                        id
                    )
                    .single();


            if (currentError) {
                throw currentError;
            }


            if (!currentAssignment) {

                return res
                    .status(404)
                    .json({
                        error:
                            "Assignment not found."
                    });
            }


            const personnelId =
                currentAssignment
                    .personnel_id;


            // ==========================================
            // DELETE ASSIGNMENT
            // ==========================================

            const {
                data: deletedAssignment,
                error: deleteAssignmentError
            } =
                await supabaseAdmin
                    .from("assignments")
                    .delete()
                    .eq(
                        "id",
                        id
                    )
                    .select(`
                        id,
                        personnel_id,
                        team_id,
                        designation,
                        functions_activities
                    `)
                    .single();


            if (deleteAssignmentError) {
                throw deleteAssignmentError;
            }


            // ==========================================
            // CHECK FOR OTHER ASSIGNMENTS
            // ==========================================

            let personnelDeleted =
                false;


            if (personnelId) {

                const {
                    count,
                    error: countError
                } =
                    await supabaseAdmin
                        .from("assignments")
                        .select(
                            "id",
                            {
                                count: "exact",
                                head: true
                            }
                        )
                        .eq(
                            "personnel_id",
                            personnelId
                        );


                if (countError) {
                    throw countError;
                }


                // ==========================================
                // DELETE PERSONNEL ONLY IF UNUSED
                // ==========================================

                if (count === 0) {

                    const {
                        error: deletePersonnelError
                    } =
                        await supabaseAdmin
                            .from("personnel")
                            .delete()
                            .eq(
                                "id",
                                personnelId
                            );


                    if (deletePersonnelError) {
                        throw deletePersonnelError;
                    }


                    personnelDeleted =
                        true;
                }
            }


            return res
                .status(200)
                .json({
                    message:
                        personnelDeleted
                            ? "Assignment and personnel deleted successfully."
                            : "Assignment deleted successfully.",

                    assignment:
                        deletedAssignment,

                    personnelDeleted
                });


        } catch (error) {

            console.error(
                "DELETE assignment error:",
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
                "Method not allowed."
        });
}
