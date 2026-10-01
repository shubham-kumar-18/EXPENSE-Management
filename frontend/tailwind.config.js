/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"]
      },
      colors: {
        ink: "#0f172a",
        accent: "#14b8a6",
        sand: "#f7f3ee",
        ember: "#f97316"
      }
    }
  },
  plugins: []
};
