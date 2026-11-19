/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B0DAD',
          hover: '#6E13CF',
          light: '#851FE3',
        },
        accent: {
          DEFAULT: '#C026D3',
          hover: '#D946EF',
          light: '#E879F9',
        },
        bgDark: '#1A052B',
        bgLight: '#F6EEFF',
        surface: '#FFFFFF',
        textPrimary: '#1F1726',
        textSecondary: '#6B5F76',
        gold: {
          DEFAULT: '#FBBF24',
          dark: '#D97706',
        },
        diamond: {
          DEFAULT: '#38BDF8',
          dark: '#0284C7',
        }
      },
      fontFamily: {
        comfortaa: ['Comfortaa', 'cursive', 'sans-serif'],
        sans: ['Comfortaa', 'cursive', 'sans-serif'],
      },
      boxShadow: {
        'neon-purple': '0 0 25px rgba(91, 13, 173, 0.55)',
        'neon-magenta': '0 0 25px rgba(192, 38, 211, 0.55)',
        'neon-card': '0 10px 30px rgba(192, 38, 211, 0.25)',
      }
    },
  },
  plugins: [],
}
