// The school's fee calendar is the academic year: June through March.
// April and May are off-months and are never shown as fee-collection months.
export const ACADEMIC_MONTH_ORDER = [6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
export const ACADEMIC_MONTH_SET = new Set(ACADEMIC_MONTH_ORDER);

export interface AcademicMonthOption {
    month: number; // 1-12
    year: number;
}

/** The calendar year an academic year starts in (June of that year). */
export function getAcademicYearStartYear(referenceDate: Date = new Date()): number {
    const month = referenceDate.getMonth() + 1;
    return month >= 6 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1;
}

/** June..March for the academic year containing `referenceDate`, each tagged with its real calendar year. */
export function getAcademicMonths(referenceDate: Date = new Date()): AcademicMonthOption[] {
    const startYear = getAcademicYearStartYear(referenceDate);
    return ACADEMIC_MONTH_ORDER.map((month) => ({
        month,
        year: month >= 6 ? startYear : startYear + 1,
    }));
}

/** The academic month for `referenceDate` — itself if in-season, else the academic year's last month (March). */
export function getDefaultAcademicMonth(referenceDate: Date = new Date()): AcademicMonthOption {
    const months = getAcademicMonths(referenceDate);
    const currentMonth = referenceDate.getMonth() + 1;
    return months.find((m) => m.month === currentMonth) ?? months[months.length - 1];
}

const FULL_MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

/** "August 2026" — the one canonical label format for an academic month, everywhere. */
export function formatAcademicMonth(option: AcademicMonthOption): string {
    return `${FULL_MONTH_NAMES[option.month - 1]} ${option.year}`;
}
