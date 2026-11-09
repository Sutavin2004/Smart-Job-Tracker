import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#F0F7F4',
          100: '#E7F2EE',
          200: '#C8E2D8',
          300: '#97C7B6',
          400: '#4FB394',
          500: '#22775F',
          600: '#1D6B57',
          700: '#175847',
          800: '#124537',
          900: '#0D3329',
        },
        // Neutral greys replace Tailwind's blue-tinted slate across the app.
        slate: {
          50:  '#F7F7F5',
          100: '#F0F0EE',
          200: '#E4E4E7',
          300: '#D1D1D6',
          400: '#A1A1AA',
          500: '#63636B',
          600: '#52525B',
          700: '#3A3B3F',
          800: '#26272A',
          900: '#18181B',
          950: '#0E0E10',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#F7F7F5',
          tertiary: '#F0F0EE',
          dark: '#121314',
          'dark-secondary': '#1A1B1D',
          'dark-tertiary': '#222326',
        },
      },
      fontFamily: {
        sans: ['"Instrument Sans Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Tighter corners than Tailwind's defaults: crisp, not bubbly.
      borderRadius: { lg: '0.375rem', xl: '0.5rem', '2xl': '0.625rem', '3xl': '0.75rem', '4xl': '1rem' },
      boxShadow: {
        'glow-brand':   'none',
        'glow-success': 'none',
        'card':         '0 1px 2px rgba(24,24,27,0.04)',
        'card-hover':   '0 1px 2px rgba(24,24,27,0.06),0 4px 12px rgba(24,24,27,0.06)',
        'panel':        '0 8px 24px rgba(24,24,27,0.10),0 1px 3px rgba(24,24,27,0.06)',
        'modal':        '0 16px 48px rgba(24,24,27,0.18)',
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
      // Kept as utilities so existing class names still work, but flat: no gradients.
      backgroundImage: {
        'gradient-brand':   'linear-gradient(#1D6B57,#1D6B57)',
        'gradient-success': 'linear-gradient(#1D6B57,#1D6B57)',
        'gradient-warm':    'linear-gradient(#B45309,#B45309)',
        'gradient-mesh':    'none',
      },
    },
  },
  plugins: [],
}
export default config
