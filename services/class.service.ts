import { supabase } from "../lib/supabase";

export const getClasses =
    async () => {
        const { data, error } =
            await supabase
                .from("users")
                .select(
                    "assigned_class"
                )
                .eq(
                    "role",
                    "TEACHER"
                );

        if (error) {
            return {
                data: [],
                error,
            };
        }

        // Remove duplicates
        const uniqueClasses = [
            "ALL",
            ...new Set(
                data
                    .map(
                        (
                            item
                        ) =>
                            item.assigned_class
                    )
                    .filter(Boolean)
            ),
        ];

        return {
            data: uniqueClasses,
            error: null,
        };
    };