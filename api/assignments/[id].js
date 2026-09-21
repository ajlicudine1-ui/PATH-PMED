import {
    supabase,
    supabaseAdmin
} from "../../lib/supabase.js";

import {
    requireAuth
} from "../../lib/requireAuth.js";


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


            // ==========================================
            // GET CURRENT ASSIGNMENT
            // ==========================================

            const {
                data: currentAssignment,
                error: currentError
            } =
                await supabaseAdmin
                    .from("assignments")
                    .select(
                        "id, personnel_id"
                    )
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


            // ==========================================
            // UPDATE PERSONNEL
            // ==========================================

            const {
                error: personnelError
            } =
                await supabaseAdmin
                    .from("personnel")
                    .update({
                        full_name:
                            responsiblePerson.trim(),

                        designation:
                            designation.trim(),

                        updated_at:
                            new Date()
                                .toISOString()
                    })
                    .eq(
                        "id",
                        currentAssignment
                            .personnel_id
                    );


            if (personnelError) {
                throw personnelError;
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
                        functions_activities:
                            functionsActivities.trim(),

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
                        functions_activities,
                        updated_at
                    `)
                    .single();


            if (assignmentError) {
                throw assignmentError;
            }


            return res
                .status(200)
                .json({
                    message:
                        "Assignment updated successfully.",

                    assignment:
                        updatedAssignment
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