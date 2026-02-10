// File: tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#6fcd98', // Green theme color
          600: '#5bb885', // Darker green
        },
        secondary: {
          500: '#F97316', // Bright orange
          600: '#EA580C', // Darker orange
        },
        accent: {
          500: '#14B8A6', // Teal
          600: '#0D9488', // Darker teal
        },
        neutral: {
          100: '#F5F5F5', // Light gray
          800: '#1F2937', // Dark gray
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Ensure consistent typography
      },
    },
  },
  plugins: [],
};