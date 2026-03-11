/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        finance: {
          900: 'var(--bg-main)', /* Variable background */
          800: 'var(--bg-card)', /* Variable card background */
          700: 'rgba(255, 255, 255, 0.03)',
          text: 'var(--text-main)',
          muted: 'var(--text-muted)',
          primary: 'var(--epic-cyan)',
          primaryHover: 'rgba(0, 210, 255, 0.8)',
          danger: 'var(--epic-purple)',
          dangerHover: 'rgba(204, 32, 142, 0.8)',
          neon: 'var(--epic-aqua)',
          electric: 'var(--epic-indigo)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
