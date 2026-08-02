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
 * Fetch all divisions with their grade name joined.
 * Useful for building flat lists like "8-A", "8-B", ...
 */
export const getDivisionsWithGrade = async (): Promise<{
    data: (Division & { grade: Pick<Grade, "id" | "name"> })[];
    error: any;
}> => {
    const { data, error } = await supabase
        .from("divisions")
        .select("id, grade_id, name, created_at, grade:grades(id, name)")
        .order("grade_id, name", { ascending: true });

    return { data: (data as any) ?? [], error };
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
