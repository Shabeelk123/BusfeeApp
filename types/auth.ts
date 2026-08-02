// V2: 4 roles only — no TEACHER
export type UserRole = "ADMIN" | "CLASS" | "COORDINATOR" | "STUDENT";

export interface AppUser {
    /** = Supabase Auth user UUID (users.id = auth.uid()) */
    id: string;
    name: string;
    role: UserRole;
    created_at: string;
    /** Populated for CLASS accounts after login */
    grade_id?: string;
    /** Populated for CLASS accounts after login */
    division_id?: string;
}