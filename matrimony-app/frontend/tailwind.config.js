/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#800000',
          50: '#fbeceb',
          100: '#f3cfcd',
          400: '#a33a3a',
          600: '#800000',
          700: '#600000',
          900: '#3d0000',
        },
        gold: {
          DEFAULT: '#78350f',
          light: '#b8874a',
        },
        stone: {
          bg: '#fafaf9',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 8px 40px -8px rgba(128,0,0,0.35)',
        glass: '0 8px 32px 0 rgba(31,15,10,0.10)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
