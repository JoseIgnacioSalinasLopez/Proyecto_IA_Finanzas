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
          900: '#0B022D', /* Fondo principal */
          800: '#130B42', /* Fondo de tarjetas/widgets */
          700: 'rgba(255, 255, 255, 0.08)', /* bordes sutiles */
          text: '#FFFFFF',
          muted: '#9EA3B0',
          primary: '#00D4FF', /* Cian brillante */
          primaryHover: 'rgba(0, 212, 255, 0.8)',
          danger: '#E600E6', /* Magenta vibrante */
          dangerHover: 'rgba(230, 0, 230, 0.8)',
          neon: '#39FF14', /* Verde neón */
          electric: '#00E5FF', /* Azul eléctrico */
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
