// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'marathon-primary-blue': '#0F1969', // Özel rengimiz
      },
    },
  },
  plugins: [],
}