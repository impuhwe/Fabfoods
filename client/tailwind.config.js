/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFCF7',
          100: '#FAF5EA',
          200: '#F3EAD8',
          300: '#E7D7BB',
          400: '#D6BF98',
        },
        cocoa: {
          50: '#F6F1EA',
          100: '#EADFD2',
          200: '#D8C5B0',
          300: '#BFA589',
          400: '#A08466',
          500: '#7F6349',
          600: '#624B36',
          700: '#4A3728',
          800: '#31241A',
          900: '#211811',
          950: '#140F0A',
        },
        ember: {
          300: '#F0B48A',
          400: '#E79660',
          500: '#D97742',
          600: '#BC5F2F',
          700: '#984A25',
        },
        sage: {
          100: '#E8EDE2',
          500: '#6F7F5C',
          700: '#4C5A3D',
        },
        success: '#3F6B4A',
        danger: '#A6392F',
        warning: '#9A6B1F',
        info: '#3E5E7A',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'Cambria', 'serif'],
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        'display-xl': [
          'clamp(3rem, 7vw, 5.75rem)',
          { lineHeight: '0.95', letterSpacing: '-0.03em' },
        ],
        'display-lg': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1', letterSpacing: '-0.025em' }],
        'display-md': [
          'clamp(2rem, 3.5vw, 2.75rem)',
          { lineHeight: '1.05', letterSpacing: '-0.02em' },
        ],
        'display-sm': [
          'clamp(1.5rem, 2.5vw, 2rem)',
          { lineHeight: '1.15', letterSpacing: '-0.015em' },
        ],
      },
      boxShadow: {
        soft: '0 12px 40px -24px rgba(33, 24, 17, 0.35)',
        lift: '0 24px 60px -32px rgba(33, 24, 17, 0.45)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'slide-up': 'slide-up 220ms ease-out',
      },
    },
  },
  plugins: [],
};
