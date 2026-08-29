/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'homepage-main-light': '#FAF9F6',
        'text-main': '#111111',
        'text-sec': '#666666',
        'stroke-gray': '#E4E4E4',
      },
      fontFamily: {
        sans: ['"Noto Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
