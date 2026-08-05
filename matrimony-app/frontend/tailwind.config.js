/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#e0136a',
          50: '#fff0f6',
          100: '#ffe4ef',
          200: '#ffc9de',
          300: '#ffa3c8',
          400: '#ff7ab3',
          500: '#ff2a75',
          600: '#e0136a',
          700: '#c00f5c',
          900: '#8a0f45',
        },
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
        surface: {
          DEFAULT: '#ffffff',
          soft: '#fff5f9',
          muted: '#fdf2f7',
        },
        ink: {
          DEFAULT: '#2d1226',
          soft: '#5c4353',
          faint: '#8a7480',
        },
        stone: {
          bg: '#fff5f9',
        },
      },
      fontFamily: {
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(45,18,38,0.04), 0 8px 24px -8px rgba(224,19,106,0.08)',
        elevated: '0 2px 4px rgba(45,18,38,0.05), 0 16px 40px -12px rgba(224,19,106,0.18)',
        pop: '0 4px 8px rgba(45,18,38,0.06), 0 24px 56px -16px rgba(224,19,106,0.28)',
        glow: '0 8px 40px -8px rgba(255,42,117,0.35)',
        glass: '0 8px 32px 0 rgba(31,15,10,0.10)',
        'focus-ring': '0 0 0 4px rgba(224,19,106,0.18)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.35' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'scale-in': 'scale-in 0.25s ease-out both',
        ripple: 'ripple 0.6s ease-out both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
