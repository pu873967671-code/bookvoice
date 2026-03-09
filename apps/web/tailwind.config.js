/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#fffaf5',
        foreground: '#18181b',
        accent: '#f97316',
        'accent-soft': '#fff7ed',
      },
    },
  },
  plugins: [],
}
