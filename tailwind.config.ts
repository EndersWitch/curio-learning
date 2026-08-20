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
        paper: {
          DEFAULT: '#F6F0E2',
          dim: '#EAE0C6',
          raised: '#FBF8EF',
        },
        ink: {
          DEFAULT: '#211A13',
          70: 'rgba(33,26,19,0.72)',
          55: 'rgba(33,26,19,0.55)',
          35: 'rgba(33,26,19,0.35)',
          15: 'rgba(33,26,19,0.15)',
          8:  'rgba(33,26,19,0.08)',
        },
        rust: {
          DEFAULT: '#B8451F',
          50:  '#FBEEE7',
          100: '#F3D6C6',
          200: '#E4AF8C',
          300: '#D48A5B',
          400: '#C4652F',
          500: '#B8451F',
          600: '#963A1B',
          700: '#732B14',
          800: '#511E0E',
          900: '#2F1108',
        },
        moss: {
          DEFAULT: '#3F6B3D',
          50:  '#EEF3ED',
          100: '#D7E4D5',
        },
        brick: {
          DEFAULT: '#9C3428',
          50:  '#F5E7E4',
          100: '#E7C4BC',
        },
        ochre: {
          DEFAULT: '#A9752A',
          50:  '#F4ECDD',
          100: '#E5D1A8',
        },
        brand: {
          rust:  '#B8451F',
          moss:  '#3F6B3D',
          ochre: '#A9752A',
          ink:   '#211A13',
        },
      },
      fontFamily: {
        heading: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body:    ['var(--font-worksans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '1.25rem',
        '5xl': '1.5rem',
      },
      animation: {
        'fade-slide':  'fadeSlideIn 0.4s ease-out both',
        'celebrate':   'celebratePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'pulse-soft':  'pulseSoft 2s ease-in-out infinite',
        'wrong-shake': 'wrongShake 0.3s ease-in-out',
        'bounce-slow': 'bounce 1.5s infinite',
        'correct-bounce': 'correctBounce 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'wrong-bump':  'wrongBump 0.45s cubic-bezier(.36,.07,.19,.97) both',
        'pop-in':      'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'ring-pulse':  'ringPulse 0.6s ease-out',
        'xp-bump':     'xpBump 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'burst':       'burstParticle 0.7s ease-out forwards',
        'wiggle':      'wiggle 0.5s ease-in-out',
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
        correctBounce: {
          '0%':   { transform: 'scale(1)' },
          '30%':  { transform: 'scale(1.06) translateY(-4px)' },
          '55%':  { transform: 'scale(0.97) translateY(1px)' },
          '75%':  { transform: 'scale(1.02) translateY(-1px)' },
          '100%': { transform: 'scale(1) translateY(0)' },
        },
        wrongBump: {
          '0%':   { transform: 'translateX(0) rotate(0deg)' },
          '15%':  { transform: 'translateX(-10px) rotate(-2deg)' },
          '30%':  { transform: 'translateX(8px) rotate(2deg)' },
          '45%':  { transform: 'translateX(-6px) rotate(-1.5deg)' },
          '60%':  { transform: 'translateX(4px) rotate(1deg)' },
          '75%':  { transform: 'translateX(-2px) rotate(-0.5deg)' },
          '100%': { transform: 'translateX(0) rotate(0deg)' },
        },
        popIn: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '60%':  { transform: 'scale(1.25)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        ringPulse: {
          '0%':   { boxShadow: '0 0 0 0 rgba(52,211,153,0.55)' },
          '100%': { boxShadow: '0 0 0 18px rgba(52,211,153,0)' },
        },
        xpBump: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.35) rotate(-4deg)' },
          '70%':  { transform: 'scale(0.95) rotate(2deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        burstParticle: {
          '0%':   { transform: 'translate(0,0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(var(--bx), var(--by)) scale(0)', opacity: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%':      { transform: 'rotate(-3deg)' },
          '75%':      { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
