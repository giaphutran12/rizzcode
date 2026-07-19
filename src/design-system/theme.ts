export const rizzCodeTheme = {
  colors: {
    parchment: "#f2e8d5",
    parchmentDeep: "#e7d6bb",
    cream: "#fff8ed",
    ink: "#171612",
    inkSoft: "#302e28",
    oxblood: "#6d1f2a",
    oxbloodBright: "#9c3843",
    lime: "#c5f35f",
  },
  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    6: "24px",
    8: "32px",
    12: "48px",
    16: "64px",
    24: "96px",
  },
  typography: {
    sans: '"Satoshi", "Manrope", system-ui, sans-serif',
    editorial: '"Playfair Display", Georgia, serif',
    mono: '"DM Mono", ui-monospace, monospace',
  },
  radii: {
    none: "0",
    xs: "2px",
    sm: "6px",
    md: "10px",
    pill: "999px",
  },
} as const;

export type RizzCodeTheme = typeof rizzCodeTheme;
