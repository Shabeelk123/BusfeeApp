import { useCallback, useState } from "react";

import { DropdownOption } from "../components/common/AppSelect";
import { getCurrentCoordinatorAccount } from "../services/account.service";
import { getDivisionOptions } from "../services/class.service";

export const ALL_CLASSES = "ALL";

/**
 * Resolves the signed-in Coordinator's assigned grade and its class (division)
 * filter options — shared by every Coordinator screen that needs to scope a
 * query to "my grade" and/or offer a "Class" dropdown restricted to it
 * (Students, Reports hub, Class-wise Report, Defaulters Report, Defaulters
 * screen).
 */
export function useCoordinatorGrade() {
    const [gradeId, setGradeId] = useState<string | null>(null);
    const [gradeName, setGradeName] = useState<string | null>(null);
    const [divisionOptions, setDivisionOptions] = useState<DropdownOption[]>([
        { label: "All Classes", value: ALL_CLASSES },
    ]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);

            const { data: account, error: accountError } = await getCurrentCoordinatorAccount();
            if (accountError || !account) { setError(true); return; }

            setGradeId(account.grade_id);
            setGradeName(account.grade.name);

            const { data: divisions, error: divisionsError } = await getDivisionOptions(account.grade_id);
            if (divisionsError) { setError(true); return; }

            setDivisionOptions([
                { label: "All Classes", value: ALL_CLASSES },
                ...divisions.map((d) => ({ label: `${account.grade.name}${d.name}`, value: d.id })),
            ]);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    return { gradeId, gradeName, divisionOptions, loading, error, load };
}
