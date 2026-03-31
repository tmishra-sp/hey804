/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,css}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFFCF8",
        sand: "#FAF7F2",
        warm: {
          50: "#FFF8F0",
          100: "#FFF5EE",
          200: "#F5EDE3",
          300: "#F0EBE4",
          400: "#E8DFD4",
          500: "#D9CFC3",
          600: "#C5A572",
          700: "#B0A194",
          800: "#9A7B6B",
          900: "#7A6A5E",
        },
        bark: {
          100: "#4A3A2E",
          200: "#3D2B1F",
          300: "#2D1F14",
          400: "#1E1209",
        },
        terra: {
          light: "#D4884A",
          DEFAULT: "#C2633A",
          dark: "#8B4228",
          muted: "#B85C38",
        },
        gold: {
          light: "#F5D89A",
          DEFAULT: "#D4A855",
        },
        forest: {
          light: "#F0F7F2",
          border: "#B5DABE",
          DEFAULT: "#2D6B42",
          dark: "#245A36",
          hover: "#DFF0E3",
        },
      },
      fontFamily: {
        sans: [
          "'DM Sans'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        widget: "22px",
        card: "16px",
        input: "14px",
        badge: "10px",
      },
      boxShadow: {
        widget:
          "0 12px 48px rgba(45,31,20,0.2), 0 4px 12px rgba(45,31,20,0.1), 0 0 0 1.5px rgba(194,99,58,0.15)",
        panel:
          "0 25px 60px rgba(45,31,20,.14), 0 8px 24px rgba(45,31,20,.06), 0 0 0 1px rgba(45,31,20,.04)",
      },
      animation: {
        shimmer: "shimmer 1.2s ease-in-out infinite",
        "fade-up": "fade-up 0.4s ease",
        "pulse-mic": "pulse-mic 1.5s ease-in-out infinite",
        "gold-shimmer": "gold-shimmer 4s ease-in-out infinite",
        "wave-bar": "wave-bar 0.8s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        "pulse-mic": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.3)" },
          "50%": { boxShadow: "0 0 0 10px rgba(239,68,68,0)" },
        },
        "gold-shimmer": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        "wave-bar": {
          "0%, 100%": { transform: "scaleY(0.5)" },
          "50%": { transform: "scaleY(1.2)" },
        },
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
