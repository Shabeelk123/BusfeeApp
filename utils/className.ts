export function splitClassName(value?: string | null) {
    const normalized = (value ?? "").trim();

    if (!normalized) {
        return { classLevel: "", division: "" };
    }

    const match = normalized.match(/^(.+?)[\s-\/]+([A-Za-z0-9].*)$/);

    if (!match) {
        return { classLevel: normalized, division: "" };
    }

    return {
        classLevel: match[1].trim(),
        division: match[2].trim(),
    };
}

export function composeClassName(classLevel: string, division: string) {
    const cleanClass = classLevel.trim();
    const cleanDivision = division.trim();

    if (cleanClass && cleanDivision) {
        return `${cleanClass}-${cleanDivision}`;
    }

    return cleanClass || cleanDivision;
}
