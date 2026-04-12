import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f0ff',
          100: '#e4e4ff',
          200: '#cdcdff',
          300: '#b4a6ff',
          400: '#9a7aff',
          500: '#8448ff',
          600: '#7928ca',
          700: '#6020a0',
          800: '#4b1878',
          900: '#3b1260',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8f7ff',
          tertiary: '#f1f0fe',
          dark: '#0f0e1a',
          'dark-secondary': '#1a1826',
          'dark-tertiary': '#241f36',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        'glow-brand':   '0 0 20px rgba(132,72,255,0.25)',
        'glow-success': '0 0 20px rgba(16,185,129,0.25)',
        'card':         '0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)',
        'card-hover':   '0 4px 12px rgba(0,0,0,0.10),0 12px 32px rgba(0,0,0,0.08)',
        'panel':        '0 8px 32px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.06)',
        'modal':        '0 24px 64px rgba(0,0,0,0.2)',
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-up':    'slideInUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':        'fadeIn 0.2s ease-out',
        'scale-in':       'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':        'shimmer 2s linear infinite',
        'pulse-soft':     'pulseSoft 2s ease-in-out infinite',
        'float':          'float 3s ease-in-out infinite',
        'bounce-in':      'bounceIn 0.5s cubic-bezier(0.68,-0.55,0.265,1.55)',
      },
      keyframes: {
        slideInRight: { from: { transform: 'translateX(100%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        slideInUp:    { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        scaleIn:      { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        shimmer:      { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
        pulseSoft:    { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        float:        { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        bounceIn:     { '0%': { transform: 'scale(0.3)', opacity: '0' }, '50%': { transform: 'scale(1.1)' }, '70%': { transform: 'scale(0.9)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg,#8448ff 0%,#4f8fff 100%)',
        'gradient-success': 'linear-gradient(135deg,#10b981 0%,#059669 100%)',
        'gradient-warm':    'linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)',
        'gradient-mesh':    'radial-gradient(at 40% 20%,#8448ff18 0,transparent 50%),radial-gradient(at 80% 0%,#4f8fff18 0,transparent 50%)',
      },
    },
  },
  plugins: [],
}
export default config
