export type UserRole =
    | "ADMIN"
    | "TEACHER"
    | "STUDENT";

export interface AppUser {
    id: string;
    auth_id: string;
    name: string;
    email: string;
    role: UserRole;
}