/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './pos.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'hsl(0, 0%, 98%)',
          100: 'hsl(0, 0%, 96.1%)',
          200: 'hsl(0, 0%, 89.8%)',
          300: 'hsl(0, 0%, 80%)',
          400: 'hsl(0, 0%, 45.1%)',
          500: 'hsl(0, 0%, 9%)',
          600: 'hsl(0, 0%, 6%)',
          700: 'hsl(0, 0%, 3.9%)',
          800: 'hsl(0, 0%, 2%)',
          900: 'hsl(0, 0%, 0%)',
        },
      },
    },
  },
  plugins: [],
}
