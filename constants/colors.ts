/**
 * BusFee Tracker — Centralized Design Tokens
 * Import from here instead of hard-coding values inline.
 */

export const Colors = {
    // ── Brand ──────────────────────────────────────────────
    primary:        "#2563EB",   // blue-600
    primaryDark:    "#1D4ED8",   // blue-700
    primaryLight:   "#EFF6FF",   // blue-50
    primaryBorder:  "#BFDBFE",   // blue-200

    // ── Semantic ────────────────────────────────────────────
    success:        "#059669",   // emerald-600
    successLight:   "#D1FAE5",   // emerald-100
    successBorder:  "#A7F3D0",   // emerald-200

    warning:        "#D97706",   // amber-600
    warningLight:   "#FEF3C7",   // amber-100
    warningBorder:  "#FDE68A",   // amber-200

    danger:         "#DC2626",   // red-600
    dangerLight:    "#FEE2E2",   // red-100
    dangerBorder:   "#FECACA",   // red-200

    info:           "#7C3AED",   // violet-600
    infoLight:      "#EDE9FE",   // violet-100

    // ── Surfaces ────────────────────────────────────────────
    background:     "#F8FAFC",   // slate-50  — app background
    card:           "#FFFFFF",   // white     — card background
    cardBorder:     "#E2E8F0",   // slate-200
    cardBorderLight:"#F1F5F9",   // slate-100
    inputBg:        "#F8FAFC",   // slate-50  — input fill
    inputBorder:    "#E2E8F0",   // slate-200

    // ── Text ────────────────────────────────────────────────
    textPrimary:    "#0F172A",   // slate-900
    textSecondary:  "#64748B",   // slate-500
    textMuted:      "#94A3B8",   // slate-400
    textDisabled:   "#CBD5E1",   // slate-300
    textOnDark:     "#FFFFFF",

    // ── Icons ───────────────────────────────────────────────
    iconDefault:    "#94A3B8",   // slate-400
    iconActive:     "#2563EB",   // blue-600
} as const;

/** Shadow preset for cards — use as style prop, not className */
export const Shadows = {
    card: {
        shadowColor:   "#000",
        shadowOpacity: 0.05,
        shadowRadius:  8,
        shadowOffset:  { width: 0, height: 2 },
        elevation:     2,
    },
    cardMd: {
        shadowColor:   "#000",
        shadowOpacity: 0.08,
        shadowRadius:  12,
        shadowOffset:  { width: 0, height: 4 },
        elevation:     4,
    },
} as const;

/** Shared border-radius values (in px) */
export const Radius = {
    input:  12,   // rounded-xl
    card:   16,   // rounded-2xl
    hero:   24,   // rounded-3xl
    button: 12,   // rounded-xl
    chip:   999,  // rounded-full
} as const;
