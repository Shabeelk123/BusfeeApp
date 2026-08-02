/**
 * teacher.service.ts — REMOVED IN V2
 *
 * The TEACHER role no longer exists in V2.
 * Class management is handled by CLASS accounts (class_accounts table).
 *
 * This file is kept as a stub to avoid import errors in screens
 * that are pending a V2 update.
 */

export const getTeachers = async () => {
    console.warn("[teacher.service] TEACHER role removed in V2. Use account.service instead.");
    return { data: [], error: null };
};

export const createTeacher = async (_: any) => {
    console.warn("[teacher.service] TEACHER role removed in V2. Use account.service instead.");
    return { error: { message: "TEACHER role is not available in V2" } };
};