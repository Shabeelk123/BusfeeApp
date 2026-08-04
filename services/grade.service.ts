import { supabase } from "../lib/supabase";
import { Division, Grade } from "../types/grade";

// ─── Grades ───────────────────────────────────────────────────────────────────

/** Fetch all grades (8, 9, 10) ordered by name. */
export const getGrades = async (): Promise<{ data: Grade[]; error: any }> => {
    const { data, error } = await supabase
        .from("grades")
        .select("id, name, created_at")
        .order("name", { ascending: true });

    return { data: data ?? [], error };
};

/**
 * Fetch all grades with their divisions nested, for the admin
 * Grade Management screen.
 */
export const getGradesWithDivisions = async (): Promise<{
    data: (Grade & { divisions: Division[] })[];
    error: any;
}> => {
    const { data: grades, error: gradesError } = await supabase
        .from("grades")
        .select("id, name, created_at")
        .order("name", { ascending: true });

    if (gradesError) return { data: [], error: gradesError };

    const { data: divisions, error: divisionsError } = await supabase
        .from("divisions")
        .select("id, grade_id, name, created_at")
        .order("name", { ascending: true });

    if (divisionsError) return { data: [], error: divisionsError };

    const data = (grades ?? []).map((g) => ({
        ...g,
        divisions: (divisions ?? []).filter((d) => d.grade_id === g.id),
    }));

    return { data, error: null };
};

/**
 * Create a grade with one or more divisions via the `create-grade` Edge
 * Function. The function also provisions a CLASS account (Supabase Auth
 * user + `users` row + `class_accounts` row) per division and returns
 * the generated login credentials.
 */
export const createGrade = async ({
    gradeName,
    divisions,
}: {
    gradeName: string;
    divisions: string[];
}): Promise<{
    data: { class: string; email: string; password: string }[] | null;
    error: any;
}> => {
    const { data, error } = await supabase.functions.invoke("create-grade", {
        body: { gradeName, divisions },
    });

    if (error) return { data: null, error };

    if (data?.success === false) {
        return { data: null, error: { message: data.error || "Failed to create grade" } };
    }

    return { data: data?.accounts ?? [], error: null };
};

/**
 * Delete a grade (and its divisions + class/coordinator accounts) via the
 * `delete-grade` Edge Function. Refuses to delete if students are still
 * enrolled in the grade.
 */
export const deleteGrade = async (
    gradeId: string
): Promise<{ error: any }> => {
    const { data, error } = await supabase.functions.invoke("delete-grade", {
        body: { gradeId },
    });

    if (error) return { error };

    if (data?.success === false) {
        return { error: { message: data.error || "Failed to delete grade" } };
    }

    return { error: null };
};

// ─── Divisions ────────────────────────────────────────────────────────────────

/**
 * Fetch divisions, optionally filtered by grade_id.
 * Returns A–Q for the specified grade, or all 51 if no gradeId supplied.
 */
export const getDivisions = async (
    gradeId?: string
): Promise<{ data: Division[]; error: any }> => {
    let query = supabase
        .from("divisions")
        .select("id, grade_id, name, created_at")
        .order("name", { ascending: true });

    if (gradeId) {
        query = query.eq("grade_id", gradeId);
    }

    const { data, error } = await query;
    return { data: data ?? [], error };
};


/**
 * Lookup a single division by grade name + division letter.
 * Example: getGradeAndDivision("8", "A")
 */
export const getGradeAndDivision = async (
    gradeName: string,
    divisionName: string
): Promise<{ gradeId: string | null; divisionId: string | null }> => {
    const { data: grade } = await supabase
        .from("grades")
        .select("id")
        .eq("name", gradeName)
        .single();

    if (!grade) return { gradeId: null, divisionId: null };

    const { data: division } = await supabase
        .from("divisions")
        .select("id")
        .eq("grade_id", grade.id)
        .eq("name", divisionName)
        .single();

    return {
        gradeId: grade.id,
        divisionId: division?.id ?? null,
    };
};
