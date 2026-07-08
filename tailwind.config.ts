// NOTE: This project uses Tailwind CSS v4, which is configured via CSS (app/globals.css).
// This file is provided for reference and IDE tooling support.
// Tailwind v4 does NOT load this file automatically.
// All custom RONDO theme tokens are defined in app/globals.css via @theme inline.

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class" as const,
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rondo: {
          yellow: "var(--gold)",
          accent: "var(--gold)",
          black: "var(--bg-page)",
          dark: "var(--bg-page)",
          card: "var(--bg-surface)",
          border: "var(--stroke)",
          muted: "var(--ink-low)",
          red: "var(--live)",
          blue: "var(--gold)",
        },
        border: "var(--stroke)",
        input: "var(--bg-inset)",
        ring: "var(--gold)",
        background: "var(--bg-page)",
        foreground: "var(--ink-hi)",
        primary: {
          DEFAULT: "var(--gold)",
          foreground: "var(--gold-ink)",
        },
        secondary: {
          DEFAULT: "var(--bg-inset)",
          foreground: "var(--ink-hi)",
        },
        destructive: {
          DEFAULT: "var(--live)",
          foreground: "var(--ink-hi)",
        },
        muted: {
          DEFAULT: "var(--bg-inset)",
          foreground: "var(--ink-low)",
        },
        accent: {
          DEFAULT: "var(--gold-dim)",
          foreground: "var(--gold)",
        },
        popover: {
          DEFAULT: "var(--bg-inset)",
          foreground: "var(--ink-hi)",
        },
        card: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--ink-hi)",
        },
      },
      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        full: "var(--r-pill)",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        heading: ["var(--font-barlow-condensed)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
