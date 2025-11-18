/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
 
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        text: {
          primary: "rgba(255,255,255,1)",
          secondary: "rgba(255,255,255,0.4)",
        },
        pink: {
          primary: "rgba(238,171,189,1)",
        },
        row: {
          hover: "rgba(244,188,204,1)",
        },
        up: "rgba(70,193,127,1)",
        down: "rgba(229,56,56,1)",
        bg: "rgba(0,0,0,1)",
        border: "rgba(60,43,47,1)",
      },
    },
  },
  plugins: [],
}

