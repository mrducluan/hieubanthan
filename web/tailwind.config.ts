import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// Token màu khai báo ở app/globals.css (biến CSS dạng "r g b") — xem docs/THIET-KE-UI.md §7.
const c = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1120px" } },
    extend: {
      colors: {
        bg: c("bg"),
        surface: { DEFAULT: c("surface"), 2: c("surface-2") },
        line: c("line"),
        fg: { DEFAULT: c("fg"), muted: c("fg-muted"), faint: c("fg-faint") },
        gold: c("gold"),
        jade: c("jade"),
        moon: c("moon"),
        cinnabar: c("cinnabar"),
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.5rem" },
      boxShadow: {
        glow: "0 0 40px -8px rgb(var(--gold) / 0.45)",
        card: "0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 12px 32px -16px rgb(0 0 0 / 0.6)",
      },
      keyframes: {
        twinkle: { "0%,100%": { opacity: "0.35" }, "50%": { opacity: "0.9" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        twinkle: "twinkle 6s ease-in-out infinite",
        "spin-slow": "spin-slow 60s linear infinite",
        "accordion-down": "accordion-down 0.22s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
};
export default config;
