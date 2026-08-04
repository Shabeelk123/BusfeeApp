import { supabase } from "../lib/supabase";
import { Student } from "../types/student";

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

/** Slug-ify the student's first name into a safe email/password fragment. */
const firstNameSlug = (name: string): string => {
    const slug = (name.trim().split(/\s+/)[0] ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    return slug || "student";
};

const LOGIN_EMAIL_DOMAIN = "school.com";

/**
 * Create a student (V2) with an auto-generated login.
 *
 * Login credentials are always generated — never entered manually — from
 * the student's first name + admission number (e.g. "Adam", "ADM-003" →
 * `adam003@school.com` / `adam123`). If that email is already taken, a
 * numeric suffix is added and retried a few times before giving up.
 * The generated credentials are returned so the caller can display them
 * once, right after creation.
 */
export const createStudent = async ({
    name,
    admission_no,
    grade_id,
    division_id,
    monthly_fee,
}: {
    name: string;
    admission_no: string;
    grade_id: string;
    division_id: string;
    monthly_fee: number;
}): Promise<{ data: (Student & { credentials: { email: string; password: string } }) | null; error: any }> => {
    // ── Pre-flight uniqueness checks ─────────────────────────────────────────
    const { data: existingAdm } = await supabase
        .from("students")
        .select("id")
        .eq("admission_no", admission_no.trim())
        .maybeSingle();

    if (existingAdm) {
        return { data: null, error: { message: "Admission number already exists" } as any };
    }

    const firstName = firstNameSlug(name);
    const admissionSlug = admission_no.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const password = `${firstName}123`;

    // ── Save current session (admin) — signUp() swaps the active session ──────
    const { data: { session: adminSession } } = await supabase.auth.getSession();

    let authUser: { id: string } | null = null;
    let email = `${firstName}${admissionSlug}@${LOGIN_EMAIL_DOMAIN}`;
    let lastAuthError: any = null;

    for (let attempt = 1; attempt <= 5; attempt++) {
        const candidateEmail =
            attempt === 1 ? email : `${firstName}${admissionSlug}${attempt}@${LOGIN_EMAIL_DOMAIN}`;

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: candidateEmail,
            password,
        });

        if (!authError && authData.user) {
            authUser = authData.user;
            email = candidateEmail;
            break;
        }

        lastAuthError = authError;

        const msg = authError?.message?.toLowerCase() ?? "";
        if (!msg.includes("already registered") && !msg.includes("already exists")) {
            break; // not a collision — no point retrying
        }
    }

    // ── Restore admin session immediately ──────────────────────────────────────
    if (adminSession?.access_token && adminSession?.refresh_token) {
        await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });
    }

    if (!authUser) {
        return { data: null, error: lastAuthError ?? { message: "Failed to generate a unique login" } };
    }

    // ── Create users profile row (V2: id = auth.uid()) ───────────────────────
    const { error: userError } = await supabase.from("users").insert([{
        id:   authUser.id,   // V2: PK = auth UID
        name,
        role: "STUDENT",
    }]);

    if (userError) return { data: null, error: userError };

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

    if (studentError) return { data: null, error: studentError };

    return { data: { ...student, credentials: { email, password } }, error: null };
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
 * Delete a student via the `delete-student` Edge Function — removes the
 * `students` row, the linked `users` row, and the Supabase Auth account
 * (if the student had a login), in that order.
 */
export const deleteStudent = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("delete-student", {
        body: { studentId: id },
    });

    if (error) return { error };

    if (data?.success === false) {
        return { error: { message: data.error || "Failed to delete student" } };
    }

    return { error: null };
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