/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: '#200589',
        neonhover: '#fff',
        bgcolor: '#fff',
        temp: '#fff'
      },
    },
  },
  plugins: [],
};
