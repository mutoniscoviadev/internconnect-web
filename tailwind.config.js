/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F1A2E",
        paper: "#C7D2FE",
        surface: "#FFFFFF",
        "surface-deep": "#C7D2FE",
        link: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          400: "#3B82F6",
          500: "#2563EB",
          600: "#1D4ED8",
        },
        primary: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          400: "#3B82F6",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        slate: {
          150: "#E2E8F0",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        sans:    ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)",
      },
    },
  },
  plugins: [],
};