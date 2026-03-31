/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {colors: {
        primary: '#8B5A2B',
        secondary: '#D4AF37',
        accent: '#F5F5DC',
      },} },
  plugins: [],
}