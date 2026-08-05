/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#e64a8f',
          50: '#fff0f6',
          100: '#ffe4ef',
          200: '#ffc9de',
          400: '#ff7ab3',
          600: '#ff2a75',
          700: '#e0136a',
          900: '#8a0f45',
        },
        gold: {
          DEFAULT: '#ff5f9e',
          light: '#ffb6d9',
        },
        stone: {
          bg: '#fff5f9',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 8px 40px -8px rgba(255,42,117,0.35)',
        glass: '0 8px 32px 0 rgba(31,15,10,0.10)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
