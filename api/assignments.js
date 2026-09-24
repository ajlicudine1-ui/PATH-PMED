import {
    supabase,
    supabaseAdmin
} from "../lib/supabase.js";

import {
    requireAuth
} from "../lib/requireAuth.js";


// ==========================================
// NORMALIZE PERSON NAME
// ==========================================

function normalizePersonName(value) {

    return String(value || "")
        .trim()
        .toLowerCase()

        // Remove periods and commas
        .replace(/[.,]/g, "")

        // Convert multiple spaces to one
        .replace(/\s+/g, " ");
}


// ==========================================
// VALIDATE AND FORMAT RESPONSIBLE PERSON
// Format: Given Name(s) + Middle Initial + Last Name
// Optional suffix: Jr., Sr., II, III, IV, V
// Example: Juan D. La Cruz Jr.
// ==========================================

function titleCasePersonNamePart(value) {

    return String(value || "")
        .toLowerCase()
        .replace(
            /(^|[-'’])([\p{L}])/gu,
            (match, separator, letter) =>
                separator + letter.toUpperCase()
        );
}


function normalizePersonSuffix(value) {

    const cleanSuffix =
        String(value || "")
            .trim()
            .replace(/[.,]/g, "")
            .toUpperCase();


    const suffixMap = {
        JR: "Jr.",
        SR: "Sr.",
        II: "II",
        III: "III",
        IV: "IV",
        V: "V"
    };


    return suffixMap[cleanSuffix] || "";
}


function parseResponsiblePersonName(value) {

    const cleanValue =
        String(value || "")
            .trim()
            .replace(/\s+/g, " ");


    const parts =
        cleanValue.split(" ");


    if (parts.length < 3) {

        return {
            valid: false,
            formatted: cleanValue
        };
    }


    // ========================================
    // OPTIONAL SUFFIX / NAME EXTENSION
    // ========================================

    let suffix = "";

    const possibleSuffix =
        normalizePersonSuffix(
            parts[parts.length - 1]
        );


    if (possibleSuffix) {

        suffix = possibleSuffix;
        parts.pop();
    }


    // Must still contain:
    // Given Name + Middle Initial + Last Name
    if (parts.length < 3) {

        return {
            valid: false,
            formatted: cleanValue
        };
    }


    let middleInitialIndex =
        -1;


    for (
        let index = 1;
        index < parts.length - 1;
        index += 1
    ) {

        if (
            /^[\p{L}]\.?$/u.test(
                parts[index]
            )
        ) {

            middleInitialIndex =
                index;

            break;
        }
    }


    if (middleInitialIndex === -1) {

        return {
            valid: false,
            formatted: cleanValue
        };
    }


    const givenNames =
        parts.slice(
            0,
            middleInitialIndex
        );


    const surnames =
        parts.slice(
            middleInitialIndex + 1
        );


    const validNamePart =
        /^[\p{L}][\p{L}'’\-]*$/u;


    const namesAreValid =
        givenNames.length > 0 &&
        surnames.length > 0 &&
        givenNames.every(
            part =>
                validNamePart.test(part)
        ) &&
        surnames.every(
            part =>
                validNamePart.test(part)
        );


    if (!namesAreValid) {

        return {
            valid: false,
            formatted: cleanValue
        };
    }


    const middleInitial =
        parts[middleInitialIndex]
            .replace(".", "")
            .toUpperCase() +
        ".";


    const formattedParts =
        [
            ...givenNames.map(
                titleCasePersonNamePart
            ),

            middleInitial,

            ...surnames.map(
                titleCasePersonNamePart
            )
        ];


    if (suffix) {

        formattedParts.push(
            suffix
        );
    }


    return {
        valid: true,
        formatted:
            formattedParts.join(" ")
    };
}


// ==========================================
// API HANDLER
// ==========================================

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
                            designation,
                            employment_status
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
                employmentStatus,
                designation,
                functionsActivities
            } = req.body;


            // ==========================================
            // VALIDATION
            // ==========================================

            if (
                !teamCode ||
                !responsiblePerson ||
                !employmentStatus ||
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


            const cleanTeamCode =
                teamCode
                    .trim()
                    .toUpperCase();


            const parsedResponsiblePerson =
                parseResponsiblePersonName(
                    responsiblePerson
                );


            if (!parsedResponsiblePerson.valid) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Responsible Person must use the format: First Name Middle Initial. Last Name, with an optional suffix (example: Juan D. La Cruz Jr.)."
                    });
            }


            const cleanName =
                parsedResponsiblePerson
                    .formatted;


            const allowedEmploymentStatuses = [
                "Permanent",
                "Contractual",
                "Job Order"
            ];


            const cleanEmploymentStatus =
                allowedEmploymentStatuses.find(
                    status =>
                        status.toLowerCase() ===
                        String(employmentStatus)
                            .trim()
                            .toLowerCase()
                );


            if (!cleanEmploymentStatus) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Employment Status must be Permanent, Contractual, or Job Order."
                    });
            }


            const cleanDesignation =
                designation
                    .trim();


            const cleanFunctions =
                functionsActivities
                    .trim();


            // ==========================================
            // FIND TEAM
            // ==========================================

            const {
                data: team,
                error: teamError
            } =
                await supabaseAdmin
                    .from("teams")
                    .select(
                        "id, code, name"
                    )
                    .eq(
                        "code",
                        cleanTeamCode
                    )
                    .single();


            if (teamError) {
                throw teamError;
            }


            if (!team) {

                return res
                    .status(404)
                    .json({
                        error:
                            "Team not found."
                    });
            }


            // ==========================================
            // GET EXISTING PERSONNEL
            // ==========================================

            const {
                data: personnelRecords,
                error: personnelLookupError
            } =
                await supabaseAdmin
                    .from("personnel")
                    .select(`
                        id,
                        full_name,
                        designation,
                        employment_status
                    `);


            if (personnelLookupError) {
                throw personnelLookupError;
            }


            const normalizedInputName =
                normalizePersonName(
                    cleanName
                );


            // ==========================================
            // FIND SAME PERSON
            // ==========================================

            let personnel =
                personnelRecords
                    ?.find(record => {

                        return (
                            normalizePersonName(
                                record.full_name
                            ) ===
                            normalizedInputName
                        );
                    });


            let createdNewPersonnel =
                false;


            if (personnel) {

                const {
                    data: updatedPersonnel,
                    error: updatePersonnelError
                } =
                    await supabaseAdmin
                        .from("personnel")
                        .update({
                            full_name:
                                cleanName,

                            employment_status:
                                cleanEmploymentStatus,

                            updated_at:
                                new Date()
                                    .toISOString()
                        })
                        .eq(
                            "id",
                            personnel.id
                        )
                        .select(`
                            id,
                            full_name,
                            designation,
                            employment_status
                        `)
                        .single();


                if (updatePersonnelError) {
                    throw updatePersonnelError;
                }


                personnel =
                    updatedPersonnel;
            }


            // ==========================================
            // CREATE PERSONNEL ONLY IF NOT FOUND
            // ==========================================

            if (!personnel) {

                const {
                    data: newPersonnel,
                    error: createPersonnelError
                } =
                    await supabaseAdmin
                        .from("personnel")
                        .insert({
                            full_name:
                                cleanName,

                            // Kept for backward compatibility.
                            // Individual assignment designation
                            // is now stored in assignments.
                            designation:
                                cleanDesignation,

                            employment_status:
                                cleanEmploymentStatus
                        })
                        .select(`
                            id,
                            full_name,
                            designation,
                            employment_status
                        `)
                        .single();


                if (createPersonnelError) {
                    throw createPersonnelError;
                }


                personnel =
                    newPersonnel;


                createdNewPersonnel =
                    true;
            }


            // ==========================================
            // CREATE ASSIGNMENT
            // ==========================================

            const {
                data: assignment,
                error: assignmentError
            } =
                await supabaseAdmin
                    .from("assignments")
                    .insert({

                        team_id:
                            team.id,

                        personnel_id:
                            personnel.id,

                        designation:
                            cleanDesignation,

                        functions_activities:
                            cleanFunctions
                    })
                    .select(`
                        id,
                        personnel_id,
                        team_id,
                        designation,
                        functions_activities
                    `)
                    .single();


            if (assignmentError) {
                throw assignmentError;
            }


            // ==========================================
            // RESPONSE
            // ==========================================

            return res
                .status(201)
                .json({

                    message:
                        createdNewPersonnel
                            ? "New personnel and assignment added successfully."
                            : "Assignment added to existing personnel successfully.",

                    assignment,

                    personnel,

                    reusedPersonnel:
                        !createdNewPersonnel
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