import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#060E1A",
        surface: "#0D1B2E",
        "surface-raised": "#122338",
        foreground: "#F0F4F8",
        muted: "#8CA0B8",
        border: "#1E3251",
        "accent-muted": "#1A3045",
        primary: "#4ADE80",
        secondary: "#38BDF8",
        success: "#4ADE80",
        warning: "#FBBF24",
        error: "#F87171",
        chart: {
          primary: "#38BDF8",
          secondary: "#4ADE80",
          tertiary: "#FBBF24",
          quaternary: "#F87171",
          muted: "#1A3045",
        },
      },
      fontFamily: {
        sans: ["Geist", "DM Sans", "sans-serif"],
        mono: ["Geist Mono", "DM Sans", "sans-serif"],
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "16px" }],
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "20px" }],
        base: ["14px", { lineHeight: "20px" }],
        lg: ["16px", { lineHeight: "24px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["32px", { lineHeight: "40px" }],
        "4xl": ["40px", { lineHeight: "48px" }],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(0,0,0,0.3)",
        medium: "0 4px 16px rgba(0,0,0,0.4)",
        strong: "0 8px 32px rgba(0,0,0,0.5)",
        "glow-success": "0 0 12px rgba(74,222,128,0.15)",
        "glow-info": "0 0 12px rgba(56,189,248,0.15)",
      },
      letterSpacing: {
        tightest: "-0.02em",
        widest: "0.2em",
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(30,50,81,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(30,50,81,0.45) 1px, transparent 1px)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
