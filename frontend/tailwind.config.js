/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff5fe",
          100: "#cee5fa",
          200: "#a9d0f5",
          500: "#3b7cf0",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        ink: "#282a2e",
        muted: "#636b6f",
        faint: "#999999",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
