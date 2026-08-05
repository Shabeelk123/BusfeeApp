import { useMemo } from "react";

import {
    AcademicMonthOption,
    formatAcademicMonth,
    getAcademicMonths,
} from "../../utils/academicYear";
import AppSelect from "./AppSelect";

interface Props {
    label?: string;
    value: AcademicMonthOption;
    onChange: (value: AcademicMonthOption) => void;
    disabled?: boolean;
}

/**
 * The one Academic Month dropdown for the whole app — Admin Dashboard, CLASS
 * Dashboard, Collect Payment, Reports, and any future month selector all use
 * this instead of building their own June–March option list. Wraps AppSelect
 * so it stays visually identical to every other dropdown.
 */
export default function AcademicMonthSelect({
    label = "Academic Month",
    value,
    onChange,
    disabled,
}: Props) {
    const months = useMemo(() => getAcademicMonths(), []);

    return (
        <AppSelect
            label={label}
            iconName="calendar-outline"
            value={value.month}
            options={months.map((m) => ({ label: formatAcademicMonth(m), value: m.month }))}
            searchable={false}
            disabled={disabled}
            onChange={(v) => {
                const match = months.find((m) => m.month === Number(v));
                if (match) onChange(match);
            }}
        />
    );
}
