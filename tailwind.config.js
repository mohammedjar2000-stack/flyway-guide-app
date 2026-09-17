/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f7ffe0',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#ccff00',
          500: '#b8f000',
          600: '#84cc16',
          700: '#65a30d',
          800: '#1a1a1a',
          900: '#111111',
          950: '#0a0a0a',
        },
        royal: {
          50: '#f7ffe0',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#ccff00',
          500: '#a3e635',
          600: '#84cc16',
          700: '#4d7c0f',
          800: '#171717',
          900: '#0a0a0a',
          950: '#050505',
        },
      },
      fontFamily: {
        sans: ['Cairo', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'slide-down': 'slideDown 0.3s ease forwards',
        'scale-in': 'scaleIn 0.3s ease forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 20px rgba(204,255,0,0.28)' }, '50%': { boxShadow: '0 0 40px rgba(204,255,0,0.5)' } },
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('light', '.light &');
    },
  ],
};
