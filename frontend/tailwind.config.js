/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      /* ── Color Tokens ─────────────────────────────────────── */
      colors: {
        /* Brand */
        brand: {
          50:  '#f0f4ff', 100: '#e0e9ff', 200: '#c7d7fe',
          300: '#a5b8fc', 400: '#8193f8', 500: '#6366f1',
          600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
          950: '#1e1b4b',
        },
        /* Violet accent */
        violet: {
          50:  '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe',
          300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6',
          600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95',
          950: '#2e1065',
        },
        /* Success / Stock OK */
        success: {
          50:  '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
          300: '#6ee7b7', 400: '#34d399', 500: '#10b981',
          600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
        },
        /* Warning / Low stock */
        warning: {
          50:  '#fffbeb', 100: '#fef3c7', 200: '#fde68a',
          300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b',
          600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f',
        },
        /* Danger / Out of stock */
        danger: {
          50:  '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3',
          300: '#fda4af', 400: '#fb7185', 500: '#f43f5e',
          600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337',
        },
        /* Info / Analytics */
        info: {
          50:  '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe',
          300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6',
          600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a',
        },
        /* Neutral surface system */
        surface: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#080f1e',
        },
      },

      /* ── Typography ───────────────────────────────────────── */
      fontFamily: {
        sans:  ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs:    ['0.75rem',  { lineHeight: '1rem' }],
        sm:    ['0.8125rem',{ lineHeight: '1.25rem' }],
        base:  ['0.9375rem',{ lineHeight: '1.5rem' }],
        lg:    ['1.0625rem',{ lineHeight: '1.625rem' }],
        xl:    ['1.1875rem',{ lineHeight: '1.75rem' }],
        '2xl': ['1.375rem', { lineHeight: '1.875rem' }],
        '3xl': ['1.625rem', { lineHeight: '2rem' }],
        '4xl': ['2rem',     { lineHeight: '2.375rem' }],
        '5xl': ['2.5rem',   { lineHeight: '2.875rem' }],
      },
      fontWeight: {
        thin:       '100',
        light:      '300',
        normal:     '400',
        medium:     '500',
        semibold:   '600',
        bold:       '700',
        extrabold:  '800',
        black:      '900',
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter:  '-0.02em',
        tight:    '-0.01em',
        normal:   '0em',
        wide:     '0.02em',
        wider:    '0.05em',
        widest:   '0.1em',
      },

      /* ── Spacing ──────────────────────────────────────────── */
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '26':  '6.5rem',
        '30':  '7.5rem',
        '68':  '17rem',
        '72':  '18rem',
        '76':  '19rem',
        '80':  '20rem',
        '88':  '22rem',
        '96':  '24rem',
        '104': '26rem',
        '112': '28rem',
        '120': '30rem',
      },

      /* ── Border Radius ────────────────────────────────────── */
      borderRadius: {
        none:  '0',
        sm:    '0.25rem',
        DEFAULT:'0.375rem',
        md:    '0.5rem',
        lg:    '0.625rem',
        xl:    '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
        '5xl': '2rem',
        full:  '9999px',
      },

      /* ── Shadows ──────────────────────────────────────────── */
      boxShadow: {
        'xs':      '0 1px 2px 0 rgba(0,0,0,0.05)',
        'sm':      '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        DEFAULT:   '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
        'md':      '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
        'lg':      '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
        'xl':      '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        '2xl':     '0 25px 50px -12px rgba(0,0,0,0.25)',
        'inner':   'inset 0 2px 4px 0 rgba(0,0,0,0.05)',
        /* Brand shadows */
        'brand-sm':  '0 4px 14px 0 rgba(99,102,241,0.2)',
        'brand-md':  '0 8px 24px 0 rgba(99,102,241,0.25)',
        'brand-lg':  '0 16px 40px 0 rgba(99,102,241,0.3)',
        'violet-sm': '0 4px 14px 0 rgba(124,58,237,0.2)',
        'violet-md': '0 8px 24px 0 rgba(124,58,237,0.25)',
        'success-sm':'0 4px 14px 0 rgba(16,185,129,0.2)',
        'danger-sm': '0 4px 14px 0 rgba(244,63,94,0.2)',
        'warning-sm':'0 4px 14px 0 rgba(245,158,11,0.2)',
        /* Dark mode card */
        'card-dark': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-dark-hover': '0 8px 24px rgba(0,0,0,0.5)',
        /* Glow */
        'glow-brand':   '0 0 20px rgba(99,102,241,0.4)',
        'glow-violet':  '0 0 20px rgba(124,58,237,0.4)',
        'glow-success': '0 0 20px rgba(16,185,129,0.4)',
        'glow-danger':  '0 0 20px rgba(244,63,94,0.4)',
        'glow-warning': '0 0 20px rgba(245,158,11,0.4)',
        'none': 'none',
      },

      /* ── Background Images ────────────────────────────────── */
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':   'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-brand':       'radial-gradient(at 40% 20%, hsla(240,100%,74%,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,0.05) 0px, transparent 50%)',
        'mesh-dark':        'radial-gradient(at 40% 20%, hsla(263,70%,50%,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(220,70%,50%,0.06) 0px, transparent 50%)',
        'noise':            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },

      /* ── Animations ───────────────────────────────────────── */
      keyframes: {
        'fade-in':       { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in-fast':  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-in-left': { '0%': { opacity: '0', transform: 'translateX(-12px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'slide-in-right':{ '0%': { opacity: '0', transform: 'translateX(12px)' },  '100%': { opacity: '1', transform: 'translateX(0)' } },
        'slide-in-up':   { '0%': { opacity: '0', transform: 'translateY(12px)' },  '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-down': { '0%': { opacity: '0', transform: 'translateY(-12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in':      { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'scale-in-bounce':{ '0%': { opacity: '0', transform: 'scale(0.85)' }, '70%': { transform: 'scale(1.03)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'shimmer':       { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'float':         { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
        'pulse-ring':    { '0%': { transform: 'scale(0.8)', opacity: '1' }, '100%': { transform: 'scale(2)', opacity: '0' } },
        'spin-slow':     { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        'count-up':      { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'progress':      { '0%': { width: '0%' }, '100%': { width: '100%' } },
        'notif-slide':   { '0%': { opacity: '0', transform: 'translateX(100%)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'sidebar-in':    { '0%': { opacity: '0', transform: 'translateX(-100%)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'blob':          { '0%,100%': { borderRadius: '60% 40% 30% 70%/60% 30% 70% 40%' }, '50%': { borderRadius: '30% 60% 70% 40%/50% 60% 30% 60%' } },
      },
      animation: {
        'fade-in':        'fade-in 0.35s ease-out both',
        'fade-in-fast':   'fade-in-fast 0.2s ease-out both',
        'slide-in-left':  'slide-in-left 0.3s ease-out both',
        'slide-in-right': 'slide-in-right 0.3s ease-out both',
        'slide-in-up':    'slide-in-up 0.3s ease-out both',
        'slide-in-down':  'slide-in-down 0.3s ease-out both',
        'scale-in':       'scale-in 0.25s cubic-bezier(0.175,0.885,0.32,1.275) both',
        'scale-in-bounce':'scale-in-bounce 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both',
        'shimmer':        'shimmer 1.8s linear infinite',
        'float':          'float 3s ease-in-out infinite',
        'pulse-ring':     'pulse-ring 1.5s cubic-bezier(0.215,0.61,0.355,1) infinite',
        'spin-slow':      'spin-slow 8s linear infinite',
        'count-up':       'count-up 0.4s ease-out both',
        'progress':       'progress 1s ease-out both',
        'notif-slide':    'notif-slide 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both',
        'sidebar-in':     'sidebar-in 0.3s ease-out both',
        'blob':           'blob 7s ease-in-out infinite',
      },

      /* ── Transitions ──────────────────────────────────────── */
      transitionTimingFunction: {
        'spring':       'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth':       'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in':    'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'ease-out-expo':'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      transitionDuration: {
        '0':   '0ms',
        '75':  '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '700': '700ms',
        '1000':'1000ms',
      },

      /* ── Z-index ──────────────────────────────────────────── */
      zIndex: {
        '0': '0', '10': '10', '20': '20', '30': '30', '40': '40',
        '50': '50', '60': '60', '70': '70', '80': '80', '90': '90',
        '100': '100', 'auto': 'auto',
      },

      /* ── Blur ─────────────────────────────────────────────── */
      blur: {
        xs: '2px', sm: '4px', DEFAULT: '8px', md: '12px',
        lg: '16px', xl: '24px', '2xl': '40px', '3xl': '64px',
      },
    },
  },
  plugins: [],
};
