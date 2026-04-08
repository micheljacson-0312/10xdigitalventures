/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8f1fb',
          100: '#b5d4f4',
          500: '#185FA5',
          600: '#0C447C',
          700: '#042C53',
        },
      },
    },
  },
  plugins: [],
}
