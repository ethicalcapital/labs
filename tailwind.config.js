/** @type {import('tailwindcss').Config} */
const daisyui = require("daisyui");

module.exports = {
  content: [
    "./PortfolioSimulator.jsx",
    "./public/**/*.html",
    "./divestment/**/*.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Raleway", "Segoe UI", "Arial", "sans-serif"],
        display: ["Outfit", "Raleway", "Segoe UI", "Arial", "sans-serif"],
      },
      colors: {
        ecic: {
          purple: "#581c87",
          teal: "#14b8a6",
          amber: "#f59e0b",
          red: "#ef4444",
        },
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [
    require("@tailwindcss/typography"),
    daisyui && daisyui.default ? daisyui.default : daisyui,
  ],
  daisyui: {
    themes: [
      {
        labs: {
          primary: "#581c87",
          "primary-focus": "#4b1872",
          "primary-content": "#ffffff",
          secondary: "#14b8a6",
          "secondary-focus": "#0f9c8c",
          accent: "#f59e0b",
          neutral: "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f3f4f6",
          "base-300": "#e5e7eb",
          info: "#2563eb",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    ],
    styled: true,
    base: false,
    utils: true,
    logs: false,
  },
};
