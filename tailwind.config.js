/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark backgrounds
        dark: {
          950: '#030812',
          900: '#060f1e',
          800: '#0d1a2e',
          700: '#152240',
          600: '#1e2f52',
        },
        // Neon green (primary brand, elevated)
        primary: {
          300: '#7dffcb',
          400: '#3dffb0',
          500: '#00f594',
          600: '#00cc7a',
          700: '#009958',
        },
        // Electric cyan (secondary accent)
        cyan: {
          neon: '#00d9ff',
          glow: '#00b8d9',
        },
        // Ember orange (CTA accent)
        secondary: {
          300: '#ffaa80',
          400: '#ff7a4a',
          500: '#ff5e1f',
          600: '#e04a0d',
        },
        // Neutral darks
        neutral: {
          100: '#f0f4ff',
          200: '#c8d0e0',
          300: '#a0aabf',
          400: '#6b7894',
          500: '#3d4a63',
          600: '#232d42',
          700: '#162038',
          800: '#0d1526',
          900: '#070d1a',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(135deg, #00f594 0%, #00d9ff 100%)',
        'dark-gradient': 'linear-gradient(180deg, #060f1e 0%, #030812 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'glow-radial': 'radial-gradient(ellipse at center, rgba(0,245,148,0.15) 0%, transparent 70%)',
        'hero-mesh': 'radial-gradient(ellipse at 20% 50%, rgba(0,217,255,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(0,245,148,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(255,94,31,0.08) 0%, transparent 50%)',
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0,245,148,0.4), 0 0 60px rgba(0,245,148,0.15)',
        'neon-cyan': '0 0 20px rgba(0,217,255,0.4), 0 0 60px rgba(0,217,255,0.15)',
        'neon-orange': '0 0 20px rgba(255,94,31,0.4), 0 0 60px rgba(255,94,31,0.15)',
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glass-lg': '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'scroll-x': 'scrollX 30s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'orbit': 'orbit 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,245,148,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(0,245,148,0.8), 0 0 80px rgba(0,245,148,0.3)' },
        },
        scrollX: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
