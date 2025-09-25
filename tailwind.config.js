/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './PortfolioSimulator.jsx',
    './public/**/*.html',
    './divestment/**/*.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Raleway', 'Segoe UI', 'Arial', 'sans-serif'],
        display: ['Outfit', 'Raleway', 'Segoe UI', 'Arial', 'sans-serif']
      },
      colors: {
        ecic: {
          purple: '#581c87',
          teal: '#14b8a6',
          amber: '#f59e0b',
          red: '#ef4444'
        }
      }
    }
  },
  corePlugins: {
    preflight: false
  },
  plugins: [require('@tailwindcss/typography')]
};
