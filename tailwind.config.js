/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Libre Baskerville', 'Georgia', 'serif'],
        sans: ['Source Sans 3', '-apple-system', 'sans-serif'],
      },
      colors: {
        navy: '#1e3a5f',
        periwinkle: '#7480d4',
        'periwinkle-light': '#eef0fb',
        'periwinkle-muted': '#9ba6e0',
        'off-white': '#f8f7f5',
        'body-text': '#3a3a3a',
        'muted-text': '#6b7280',
      },
      boxShadow: {
        'compass': '0 25px 60px rgba(13,31,53,0.35), 0 8px 20px rgba(0,0,0,0.15)',
        'compass-sm': '0 20px 50px rgba(13,31,53,0.25), 0 4px 12px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}