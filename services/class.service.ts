import { supabase } from "../lib/supabase";
import { getGradeAndDivision } from "./grade.service";

// ─── V2 APIs ──────────────────────────────────────────────────────────────────

export const getGradeOptions = async () => {
    const { data, error } = await supabase
        .from("grades")
        .select("id, name")
        .order("name", { ascending: true });

    return { data: data ?? [], error };
};

export const getDivisionOptions = async (gradeId?: string) => {
    let query = supabase
        .from("divisions")
        .select("id, grade_id, name")
        .order("name", { ascending: true });

    if (gradeId) {
        query = query.eq("grade_id", gradeId);
    }

    const { data, error } = await query;
    return { data: data ?? [], error };
};

/**
 * Returns a flat list of division labels (e.g. ["8-A", "8-B", ...]).
 * Used for filter dropdowns that need a simple string list.
 */
export const getDivisionLabels = async (): Promise<string[]> => {
    const { data: grades } = await supabase
        .from("grades")
        .select("id, name")
        .order("name", { ascending: true });

    const { data: divisions } = await supabase
        .from("divisions")
        .select("grade_id, name")
        .order("name", { ascending: true });

    if (!grades || !divisions) return [];

    const gradeMap = Object.fromEntries(grades.map((g) => [g.id, g.name]));

    return divisions.map((d) => `${gradeMap[d.grade_id]}-${d.name}`);
};

// ─── Compatibility shim for existing screens ──────────────────────────────────

/**
 * getClasses() — used by students, reports and defaulters screens.
 *
 * Returns ["ALL", "8-A", "8-B", ..., "10-Q"] so existing screens
 * that filter by a class string still work without modification.
 */
export const getClasses = async (): Promise<{ data: string[]; error: any }> => {
    const labels = await getDivisionLabels();
    return { data: ["ALL", ...labels], error: null };
};

/**
 * Resolve a compat class-label filter (e.g. "ALL" or "8-A") into
 * {gradeId, divisionId} for screens that still use the single class-string
 * dropdown (Defaulters, Reports) but need to query V2 grade/division ids.
 */
export const resolveClassFilter = async (
    selectedClass: string
): Promise<{ gradeId?: string; divisionId?: string }> => {
    if (!selectedClass || selectedClass === "ALL") return {};

    const [gradeName, divisionName] = selectedClass.split("-");
    if (!gradeName || !divisionName) return {};

    const { gradeId, divisionId } = await getGradeAndDivision(gradeName, divisionName);
    return { gradeId: gradeId ?? undefined, divisionId: divisionId ?? undefined };
};