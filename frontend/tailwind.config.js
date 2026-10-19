/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: '#FFFFFF',
        surface: '#F8FAFC',
        border: '#E2E8F0',
        text: '#1E293B',
        muted: '#64748B',
        overdue: '#DC2626',
        soon: '#D97706',
        closed: '#16A34A',
        accent: '#0F172A',
      },
    },
  },
  plugins: [],
}