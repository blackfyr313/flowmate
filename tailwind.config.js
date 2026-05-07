/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          base:    '#0d0f14',
          raised:  '#13161e',
          overlay: '#1a1e2a',
          border:  '#252936',
          muted:   '#2e3446',
        },
        accent: {
          primary:   '#4f8ef7',
          secondary: '#7c5ff7',
          success:   '#22d3a2',
          warning:   '#f7a94f',
          danger:    '#f75f5f',
          pink:      '#f75fbb',
          glow:      'rgba(79,142,247,0.15)',
        },
        text: {
          primary:   '#e8ecf5',
          secondary: '#8b94ad',
          muted:     '#555f7a',
          inverse:   '#0d0f14',
        },
        // Step category colors
        category: {
          app:    '#4f8ef7',  // blue  — App & Browser
          timing: '#f7a94f',  // amber — Timing & Waiting
          key:    '#7c5ff7',  // violet — Keyboard
          mouse:  '#22d3a2',  // teal  — Mouse
          window: '#f75fbb',  // pink  — Window Management
          notif:  '#f7a94f',  // amber — Notifications
        },
      },
      fontFamily: {
        sans:    ['Outfit', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'glow-blue':   '0 0 24px rgba(79,142,247,0.3)',
        'glow-violet': '0 0 24px rgba(124,95,247,0.3)',
        'glow-green':  '0 0 24px rgba(34,211,162,0.3)',
        'glow-amber':  '0 0 24px rgba(247,169,79,0.3)',
        'glow-pink':   '0 0 24px rgba(247,95,187,0.3)',
        'card':        '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,142,247,0.15)',
        'card-active': '0 4px 20px rgba(79,142,247,0.2)',
        'float':       '0 20px 60px rgba(0,0,0,0.6)',
      },
      animation: {
        'fade-in':       'fadeIn 0.25s ease-out',
        'fade-in-slow':  'fadeIn 0.5s ease-out',
        'slide-in-right':'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-up':   'slideInUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':      'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        'bounce-in':     'bounceIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
        'pulse-glow':    'pulseGlow 2.5s ease-in-out infinite',
        'shimmer':       'shimmer 1.8s infinite',
        'float':         'float 4s ease-in-out infinite',
        'spin-slow':     'spin 3s linear infinite',
        'ping-slow':     'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'stagger-1':     'fadeSlideUp 0.3s 0.05s both ease-out',
        'stagger-2':     'fadeSlideUp 0.3s 0.10s both ease-out',
        'stagger-3':     'fadeSlideUp 0.3s 0.15s both ease-out',
        'stagger-4':     'fadeSlideUp 0.3s 0.20s both ease-out',
        'stagger-5':     'fadeSlideUp 0.3s 0.25s both ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        slideInLeft: {
          '0%':   { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',      opacity: '1' },
        },
        slideInUp: {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.94)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0.8)',    opacity: '0' },
          '60%':  { transform: 'scale(1.05)',   opacity: '1' },
          '100%': { transform: 'scale(1)',      opacity: '1' },
        },
        fadeSlideUp: {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(79,142,247,0.2)' },
          '50%':      { boxShadow: '0 0 24px rgba(79,142,247,0.6)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-5px)' },
        },
      },
      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
      },
    },
  },
  plugins: [],
}
