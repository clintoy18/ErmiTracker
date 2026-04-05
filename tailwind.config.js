/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f8f6",
          100: "#dce9e1",
          500: "#2f7d5b",
          600: "#26684c",
          700: "#1e503b",
          900: "#123127",
        },
        accent: "#f4b942",
      },
      boxShadow: {
        card: "0 18px 48px rgba(18, 49, 39, 0.08)",
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
