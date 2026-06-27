/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core palette
        forest:    '#1A3C2A',   // deep anchor green — nav, headings
        cream:     '#F7F2E8',   // primary background
        terracotta:'#C4622D',   // dominant accent — CTAs, dividers, highlights
        sand:      '#E8DCC8',   // secondary surface — cards, alternating sections
        ink:       '#1C1C1A',   // primary body text

        // Extended shades
        'forest-light': '#2A5C40',
        'forest-dark':  '#0F2419',
        'terracotta-light': '#D4784A',
        'terracotta-dark':  '#A0501F',
        'sand-light': '#F2EAD8',
        'sand-dark':  '#D4C8B0',
        'ink-muted':  '#5C5C58',
        'ink-faint':  '#9C9C96',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Fluid type scale
        'display-2xl': ['clamp(3.5rem, 8vw, 7rem)',   { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-xl':  ['clamp(2.8rem, 6vw, 5.5rem)', { lineHeight: '1.0',  letterSpacing: '-0.02em' }],
        'display-lg':  ['clamp(2.2rem, 4.5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        'display-md':  ['clamp(1.7rem, 3vw, 2.8rem)', { lineHeight: '1.1',  letterSpacing: '-0.01em' }],
        'display-sm':  ['clamp(1.3rem, 2.5vw, 2rem)', { lineHeight: '1.2'  }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        'sm':  '4px',
        DEFAULT: '8px',
        'md':  '12px',
        'lg':  '16px',
        'xl':  '24px',
        '2xl': '32px',
      },
      boxShadow: {
        'card':    '0 2px 16px rgba(28,28,26,0.08), 0 1px 4px rgba(28,28,26,0.04)',
        'card-lg': '0 8px 40px rgba(28,28,26,0.12), 0 2px 8px rgba(28,28,26,0.06)',
        'terra':   '0 4px 20px rgba(196,98,45,0.25)',
        'terra-lg':'0 8px 40px rgba(196,98,45,0.35)',
        'inset':   'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backgroundImage: {
        'terra-gradient':   'linear-gradient(135deg, #C4622D 0%, #A0501F 100%)',
        'forest-gradient':  'linear-gradient(180deg, #1A3C2A 0%, #0F2419 100%)',
        'cream-gradient':   'linear-gradient(180deg, #F7F2E8 0%, #E8DCC8 100%)',
        'hero-overlay':     'linear-gradient(to right, rgba(26,60,42,0.85) 0%, rgba(26,60,42,0.4) 60%, transparent 100%)',
        'hero-overlay-mob': 'linear-gradient(to bottom, rgba(26,60,42,0.3) 0%, rgba(26,60,42,0.85) 70%)',
        'shimmer':          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
      },
      animation: {
        'shimmer':       'shimmer 1.8s ease-in-out infinite',
        'fade-up':       'fadeUp 0.6s ease-out forwards',
        'fade-in':       'fadeIn 0.4s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'float':         'float 6s ease-in-out infinite',
        'spin-slow':     'spin 8s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)'     },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)'   },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};