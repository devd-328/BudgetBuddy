/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1a1a2e',
          light: '#16213e',
          card: '#0f3460',
        },
        accent: {
          DEFAULT: '#378ADD',
          light: '#5ba3f5',
          dark: '#2563b0',
        },
        income: {
          DEFAULT: '#5DCAA5',
          light: '#7edcbc',
          dark: '#3aaf88',
        },
        expense: {
          DEFAULT: '#F0997B',
          light: '#f5b89e',
          dark: '#e07050',
        },
        surface: {
          DEFAULT: '#1e1e3a',
          card: '#252545',
          input: '#2a2a4a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      maxWidth: {
        'mobile': '430px',
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}
