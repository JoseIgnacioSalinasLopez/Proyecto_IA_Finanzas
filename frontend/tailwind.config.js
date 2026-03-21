/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        finance: {
          900: 'var(--bg-main)',
          800: 'var(--bg-card)',
          700: 'rgba(255, 255, 255, 0.05)',
          text: 'var(--text-main)',
          muted: 'var(--text-muted)',
          primary: 'var(--epic-cyan)',
          primaryHover: 'var(--epic-blue)',
          danger: 'var(--epic-pink)',
          dangerHover: 'var(--epic-purple)',
          neon: 'var(--epic-cyan)',
          electric: 'var(--epic-indigo)',
          purple: 'var(--epic-purple)',
          mustard: 'var(--epic-sparkle)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
