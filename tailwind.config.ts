import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        plum: {
          DEFAULT: '#2B1E3F',
          50:  '#F3F0F8',
          100: '#E6E0F1',
          200: '#C9BBE2',
          300: '#AC97D3',
          400: '#8F72C4',
          500: '#724EB5',
          600: '#5A3A9A',
          700: '#44297A',
          800: '#2B1E3F',
          900: '#160F20',
        },
        coral: {
          DEFAULT: '#FF5E5B',
          50:  '#FFF0F0',
          100: '#FFE0DF',
          200: '#FFC1C0',
          300: '#FFA2A1',
          400: '#FF8382',
          500: '#FF5E5B',
          600: '#FF2926',
          700: '#F50003',
          800: '#C20002',
          900: '#8F0002',
        },
        brand: {
          cyan:  '#6DD3CE',
          amber: '#F5C842',
          coral: '#FF5E5B',
          plum:  '#2B1E3F',
        },
      },
      fontFamily: {
        heading: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow-violet':  '0 0 0 3px rgba(139, 92, 246, 0.35)',
        'glow-emerald': '0 0 0 3px rgba(52, 211, 153, 0.35)',
        'glow-coral':   '0 0 0 3px rgba(255, 94, 91, 0.35)',
        'card':         '0 2px 12px 0 rgba(0,0,0,0.06)',
        'card-hover':   '0 8px 32px 0 rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-slide':  'fadeSlideIn 0.4s ease-out both',
        'celebrate':   'celebratePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'pulse-soft':  'pulseSoft 2s ease-in-out infinite',
        'wrong-shake': 'wrongShake 0.3s ease-in-out',
        'bounce-slow': 'bounce 1.5s infinite',
      },
      keyframes: {
        fadeSlideIn: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        celebratePop: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '60%':  { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        wrongShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%':      { transform: 'translateX(-5px)' },
          '75%':      { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
