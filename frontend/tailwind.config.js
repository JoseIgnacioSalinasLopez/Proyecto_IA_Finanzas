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
          900: '#05011a', /* Deepest Black/Blue for Page Background */
          800: '#11111d', /* Dark Card Background as per Epic style */
          700: 'rgba(255, 255, 255, 0.05)', /* Subtle Elite Border */
          text: '#FFFFFF',
          muted: '#94a3b8',
          primary: '#00D4FF', /* Cyan Elite */
          primaryHover: 'rgba(0, 212, 255, 0.8)',
          danger: '#8C30F5', /* Purple Elite - Replaced Magenta for consistency */
          dangerHover: 'rgba(140, 48, 245, 0.8)',
          neon: '#00FFFF', /* Electric Aqua */
          electric: '#7DF9FF', /* Electric Blue */
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
