/** Tailwind config. The storefront also uses named component styles in src/styles.css. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: { forest: '#0f3d2e', olive: '#6a7f43', harvest: '#d96b27', cream: '#f9f6f0' },
      fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Playfair Display', 'Georgia', 'serif'] },
    },
  },
  plugins: [],
};
