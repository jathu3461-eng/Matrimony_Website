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
          800: '#a50e52',
          900: '#8a0f45',
          950: '#5c0a2f',
        },
        rose: {
          50: '#fff7fa',
          100: '#ffeef4',
          200: '#ffd9e8',
          300: '#ffc2db',
          400: '#ff9fc7',
          500: '#ff5f9e',
          600: '#e0136a',
          700: '#c00f5c',
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
        'glow-soft': '0 8px 32px -12px rgba(255,95,158,0.4)',
        glass: '0 8px 32px 0 rgba(31,15,10,0.10)',
        'glass-strong': '0 16px 48px -12px rgba(224,19,106,0.22)',
        'focus-ring': '0 0 0 4px rgba(224,19,106,0.18)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.9)',
        'dark-pop': '0 4px 8px rgba(0,0,0,0.5), 0 24px 56px -16px rgba(0,0,0,0.7)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'grad-hero':
          'linear-gradient(135deg, #fff0f6 0%, #ffe3ef 40%, #ffd3e6 75%, #ffc2dd 100%)',
        'grad-primary': 'linear-gradient(135deg, #e0136a 0%, #ff2a75 55%, #ff5f9e 100%)',
        'grad-primary-soft': 'linear-gradient(135deg, #ffe4ef 0%, #ffc9de 100%)',
        'grad-rose-sky': 'linear-gradient(135deg, #ffd9e8 0%, #e8d9ff 100%)',
        'grad-conic':
          'conic-gradient(from 210deg at 50% 50%, #ffe4ef 0deg, #ffc9de 60deg, #ffa3c8 120deg, #ffc9de 180deg, #ffe4ef 240deg, #ffd9e8 300deg, #ffe4ef 360deg)',
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
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.96)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.35' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-18px) rotate(2deg)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'heartbeat': {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.12)' },
          '40%': { transform: 'scale(0.96)' },
          '60%': { transform: 'scale(1.08)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'fade-in-down': 'fade-in-down 0.4s ease-out both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'scale-in': 'scale-in 0.25s ease-out both',
        'scale-out': 'scale-out 0.2s ease-in both',
        'slide-in-right': 'slide-in-right 0.35s ease-out both',
        'slide-in-left': 'slide-in-left 0.35s ease-out both',
        ripple: 'ripple 0.6s ease-out both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        'spin-slow': 'spin-slow 16s linear infinite',
        gradient: 'gradient 6s ease infinite',
        marquee: 'marquee 28s linear infinite',
        heartbeat: 'heartbeat 1.4s ease-in-out infinite',
        wiggle: 'wiggle 0.6s ease-in-out',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        400: '400ms',
      },
      rotate: {
        360: '360deg',
      },
      scale: {
        98: '0.98',
        102: '1.02',
      },
      zIndex: {
        1: '1',
        60: '60',
        70: '70',
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      maxWidth: {
        '8xl': '88rem',
      },
    },
  },
  plugins: [],
};
