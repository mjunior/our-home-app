/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          lime: "#D8F04F",
          teal: "#004F59",
          slate: "#101418",
          fog: "#f2f4f5",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        soft: "0 12px 40px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};
