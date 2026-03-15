import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: "#CCFF00",
        "glass-border": "rgba(255,255,255,0.08)",
        "glass-bg": "rgba(24,24,27,0.55)",
        "glass-bg-strong": "rgba(24,24,27,0.75)",
      },
      backdropBlur: {
        glass: "16px",
        "glass-lg": "24px",
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0,0,0,0.2)",
        "glass-glow":
          "0 0 20px rgba(204,255,0,0.15), 0 0 40px rgba(204,255,0,0.05)",
        "neon-glow":
          "0 0 12px rgba(204,255,0,0.4), 0 0 24px rgba(204,255,0,0.15)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 8px rgba(204,255,0,0.2), 0 0 20px rgba(204,255,0,0.05)",
          },
          "50%": {
            boxShadow: "0 0 16px rgba(204,255,0,0.4), 0 0 40px rgba(204,255,0,0.1)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        "fade-in-up": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "slide-in-right": "slide-in-right 0.35s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-in",
        "fade-in-up": "fade-in-up 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
