/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        'mint': {
          50: '#f0faf5',
          100: '#dcf5e9',
          200: '#bae8d4',
          300: '#8dd5b5',
          400: '#5dbd93',
          500: '#3ba179',
          600: '#2d8363',
          700: '#276852',
          800: '#245343',
          900: '#214539',
        },
        'sky-blue': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        'cream': {
          50: '#fefdf7',
          100: '#fdf9e9',
          200: '#faf2c8',
          300: '#f7e6a1',
          400: '#f2d16c',
          500: '#e9b43d',
          600: '#d89922',
          700: '#b47318',
          800: '#915a18',
          900: '#764b18',
        },
      },
      padding: {
        '10': '10px',
        '15': '15px',
        '20': '20px',
        '25': '25px',
        '30': '30px',
        '35': '35px',
        '40': '40px',
        '45': '45px',
        '50': '50px',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 15px 0 rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 25px 0 rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 