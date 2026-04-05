/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ═══════════════════ COLOR TOKENS ═══════════════════ */
      colors: {
        // Primitive gray scale (warm dark)
        canvas:      '#0A0A0F',
        surface:     '#111118',
        elevated:    '#18181F',
        card:        '#1F1F28',
        interactive: '#2A2A35',

        // Semantic border
        border: {
          subtle:  'rgba(58, 58, 72, 0.4)',
          DEFAULT: '#3A3A48',
          focus:   '#60A5FA',
        },

        // Semantic text
        txt: {
          primary:   '#E8E8F0',
          secondary: '#8A8A9E',
          muted:     '#5A5A6E',
          inverted:  '#0A0A0F',
          bright:    '#F5F5FA',
        },

        // Accent
        accent: {
          DEFAULT: '#60A5FA',
          hover:   '#3B82F6',
          tint:    '#0D1B2A',
        },

        // Semantic colors
        income: {
          DEFAULT: '#34D399',
          hover:   '#10B981',
          tint:    '#0D2818',
        },
        expense: {
          DEFAULT: '#FB7185',
          hover:   '#F43F5E',
          tint:    '#2D1414',
        },
        warning: {
          DEFAULT: '#FBBF24',
          tint:    '#2D2814',
        },

        // Chart palette
        chart: {
          purple: '#A78BFA',
          teal:   '#2DD4BF',
          orange: '#FB923C',
          pink:   '#F472B6',
        },
      },

      /* ═══════════════════ TYPOGRAPHY ═══════════════════ */
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],    // 10px
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight:   '-0.015em',
        wide:    '0.06em',
      },

      /* ═══════════════════ SPACING ═══════════════════ */
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      maxWidth: {
        'mobile': '430px',
        'content': '1200px',
      },

      /* ═══════════════════ SHADOWS ═══════════════════ */
      boxShadow: {
        'xs':      '0 1px 2px rgba(0,0,0,0.3)',
        'sm':      '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'md':      '0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2)',
        'lg':      '0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px rgba(0,0,0,0.2)',
        'xl':      '0 20px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.2)',
        'glow-accent':  '0 0 0 1px rgba(96,165,250,0.1), 0 4px 16px rgba(96,165,250,0.15)',
        'glow-income':  '0 0 0 1px rgba(52,211,153,0.1), 0 4px 16px rgba(52,211,153,0.15)',
        'glow-expense': '0 0 0 1px rgba(251,113,133,0.1), 0 4px 16px rgba(251,113,133,0.15)',
      },

      /* ═══════════════════ ANIMATION ═══════════════════ */
      transitionDuration: {
        'instant': '100ms',
        'fast':    '150ms',
        'normal':  '250ms',
        'slow':    '400ms',
        'slower':  '600ms',
      },
      transitionTimingFunction: {
        'out-expo':     'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-back':     'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'in-out-circ':  'cubic-bezier(0.85, 0, 0.15, 1)',
        'spring':       'cubic-bezier(0.22, 1.36, 0.36, 1)',
      },
      keyframes: {
        'shimmer': {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'count-up': {
          '0%':   { opacity: '0.3' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'shimmer':   'shimmer 1.5s ease-in-out infinite',
        'fade-in':   'fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in':  'scale-in 0.25s cubic-bezier(0.22, 1.36, 0.36, 1) forwards',
        'slide-up':  'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down':'slide-down 0.3s cubic-bezier(0.22, 1.36, 0.36, 1) forwards',
      },

      /* ═══════════════════ SCREENS ═══════════════════ */
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}
