import { supabase } from "../lib/supabase";
import { Student } from "../types/student";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentWithRelations extends Student {
    grade?: { id: string; name: string };
    division?: { id: string; name: string };
    student_monthly_fees?: {
        id: string;
        month: number;
        year: number;
        fee: number;
        paid_amount: number;
        status: string;
    }[];
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Paginated student list with optional search and grade/division filters.
 *
 * Accepts both V2 (gradeId/divisionId) and V1-compat (selectedClass: "8-A") params.
 */
export const getStudents = async ({
    page = 0,
    limit = 20,
    search = "",
    gradeId,
    divisionId,
    selectedClass,   // V1 compat: "ALL" | "8-A" | "8-B" etc.
}: {
    page?: number;
    limit?: number;
    search?: string;
    gradeId?: string;
    divisionId?: string;
    selectedClass?: string;
}) => {
    // ── Resolve selectedClass → divisionId if supplied ────────────────────────
    if (selectedClass && selectedClass !== "ALL" && !divisionId) {
        const parts = selectedClass.split("-");   // ["8", "A"]
        const gradeName = parts[0];
        const divName   = parts[1];

        if (gradeName && divName) {
            const { data: grade } = await supabase
                .from("grades")
                .select("id")
                .eq("name", gradeName)
                .single();

            if (grade) {
                const { data: div } = await supabase
                    .from("divisions")
                    .select("id")
                    .eq("grade_id", grade.id)
                    .eq("name", divName)
                    .single();

                if (div) divisionId = div.id;
            }
        }
    }

    const from = page * limit;
    const to   = from + limit - 1;


    let query = supabase
        .from("students")
        .select(`
            id,
            admission_no,
            name,
            grade_id,
            division_id,
            monthly_fee,
            user_id,
            created_at,
            grade:grades(id, name),
            division:divisions(id, name)
        `)
        .order("name", { ascending: true })
        .range(from, to);

    if (search.trim()) {
        query = query.or(
            `name.ilike.%${search}%,admission_no.ilike.%${search}%`
        );
    }

    if (gradeId) {
        query = query.eq("grade_id", gradeId);
    }

    if (divisionId) {
        query = query.eq("division_id", divisionId);
    }

    return await query;
};

/**
 * Single student with their monthly fee records.
 */
export const getStudentById = async (id: string) => {
    return await supabase
        .from("students")
        .select(`
            id,
            admission_no,
            name,
            grade_id,
            division_id,
            monthly_fee,
            user_id,
            created_at,
            grade:grades(id, name),
            division:divisions(id, name),
            student_monthly_fees (
                id,
                month,
                year,
                fee,
                paid_amount,
                status,
                excluded,
                reason
            )
        `)
        .eq("id", id)
        .single();
};

/**
 * Create a student (V2).
 * Creates Supabase Auth user + users profile row + student row.
 */
export const createStudent = async ({
    name,
    admission_no,
    grade_id,
    division_id,
    monthly_fee,
    email,
    password,
}: {
    name: string;
    admission_no: string;
    grade_id: string;
    division_id: string;
    monthly_fee: number;
    email: string;
    password: string;
}) => {
    // ── Pre-flight uniqueness checks ─────────────────────────────────────────
    const { data: existingAdm } = await supabase
        .from("students")
        .select("id")
        .eq("admission_no", admission_no.trim())
        .maybeSingle();

    if (existingAdm) {
        return { error: { message: "Admission number already exists" } as any };
    }

    // ── Save current session (admin/class) ───────────────────────────────────
    const { data: { session: adminSession } } = await supabase.auth.getSession();

    // ── Create Supabase Auth user ────────────────────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError || !authData.user) {
        return { error: authError };
    }

    const authUser = authData.user;

    // ── Restore admin/class session immediately ───────────────────────────────
    if (adminSession?.access_token && adminSession?.refresh_token) {
        await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });
    }

    // ── Create users profile row (V2: id = auth.uid()) ───────────────────────
    const { error: userError } = await supabase.from("users").insert([{
        id:   authUser.id,   // V2: PK = auth UID
        name,
        role: "STUDENT",
    }]);

    if (userError) return { error: userError };

    // ── Create student row ────────────────────────────────────────────────────
    const { data: student, error: studentError } = await supabase
        .from("students")
        .insert([{
            name,
            admission_no,
            grade_id,
            division_id,
            monthly_fee,
            user_id: authUser.id,
        }])
        .select()
        .single();

    if (studentError) return { error: studentError };

    return { data: student, error: null };
};

/**
 * Update student fields.
 */
export const updateStudent = async (
    studentId: string,
    updates: Partial<Pick<Student, "name" | "admission_no" | "grade_id" | "division_id" | "monthly_fee">>
) => {
    return await supabase
        .from("students")
        .update(updates)
        .eq("id", studentId);
};

/**
 * Delete a student row.
 * Note: associated Supabase Auth user is NOT deleted here (admin action).
 */
export const deleteStudent = async (id: string) => {
    return await supabase.from("students").delete().eq("id", id);
};

/**
 * Fetch the currently signed-in student's own record.
 */
export const getCurrentStudent = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;
    if (!authUser) return { data: null };

    return await supabase
        .from("students")
        .select(`
            *,
            grade:grades(id, name),
            division:divisions(id, name),
            student_monthly_fees (
                id,
                month,
                year,
                fee,
                paid_amount,
                status
            )
        `)
        .eq("user_id", authUser.id)
        .single();
};