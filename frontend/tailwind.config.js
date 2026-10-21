import colors from 'tailwindcss/colors.js'

/** The site palette also covers legacy utility classes across every feature. */
const stone = {
  50: '#f3f1ea', 100: '#e7e3d8', 200: '#dcd8cc', 300: '#c4bfb3',
  400: '#938d81', 500: '#716b60', 600: '#59554d', 700: '#403d36',
  800: '#302d28', 900: '#24221e', 950: '#1b1a17'
}
const primary = { ...stone, 500: '#686156', 600: '#24221e', 700: '#161616' }
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    borderRadius: Object.fromEntries(['DEFAULT', 'none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'full'].map(key => [key, '0'])),
    boxShadow: Object.fromEntries(['DEFAULT', 'none', 'sm', 'md', 'lg', 'xl', '2xl', 'inner', 'glass', 'glass-sm', 'glow', 'glow-lg', 'card', 'card-hover', 'inner-glow'].map(key => [key, 'none'])),
    extend: {
      colors: {
        // Provider identities keep their original palettes independently of UI chrome.
        brand: Object.fromEntries(['orange', 'amber', 'green', 'emerald', 'blue', 'sky', 'purple', 'violet', 'indigo', 'pink', 'fuchsia', 'teal', 'cyan', 'rose', 'zinc', 'neutral', 'slate'].map(name => [name, colors[name]])),
        primary, accent: stone, dark: stone, gray: stone, slate: stone, zinc: stone, neutral: stone,
        blue: stone, cyan: stone, teal: stone, green: stone, emerald: stone,
        violet: stone, purple: stone, indigo: stone, sky: stone,
        yellow: stone, amber: stone, orange: stone, red: stone, rose: stone, pink: stone,
        paper: 'var(--ef-paper)', panel: 'var(--ef-panel)', ink: 'var(--ef-ink)',
        rule: 'var(--ef-rule)', signal: 'var(--ef-signal)'
      },
      fontFamily: {
        sans: ['Saira', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      backgroundImage: {
        'gradient-primary': 'none', 'gradient-dark': 'none', 'gradient-glass': 'none',
        'mesh-gradient': 'none', 'gradient-radial': 'none'
      },
      animation: {
        'fade-in': 'fadeIn 320ms cubic-bezier(0.16,1,0.3,1)',
        'slide-up': 'slideUp 320ms cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slideDown 320ms cubic-bezier(0.16,1,0.3,1)',
        'slide-in-right': 'slideInRight 280ms cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'slideDown 280ms cubic-bezier(0.16,1,0.3,1)',
        'pulse-slow': 'none', shimmer: 'none', glow: 'none'
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } }
      },
      backdropBlur: { xs: '0' }
    }
  },
  plugins: []
}
