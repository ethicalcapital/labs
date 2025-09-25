const js = require("@eslint/js");
const { browser: browserGlobals, node: nodeGlobals } = require("globals");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const jsxA11y = require("eslint-plugin-jsx-a11y");
const prettier = require("eslint-plugin-prettier");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "public/assets/**",
      "public/simulator/app.js",
      "public/divestment/**",
      "diagnostics/**"
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      parser: require("@babel/eslint-parser"),
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...browserGlobals,
        React: "readonly",
        ReactDOM: "readonly",
        Chart: "readonly",
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      prettier,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-filename-extension": ["error", { extensions: [".jsx"] }],
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "prettier/prettier": "error",
    },
  },
  {
    files: ["tailwind.config.js"],
    languageOptions: {
      parserOptions: {
        sourceType: "commonjs",
      },
      globals: nodeGlobals,
    },
  },
  {
    files: ["tools/**/*.mjs"],
    languageOptions: {
      parserOptions: {
        sourceType: "module",
      },
      globals: nodeGlobals,
    },
  },
];
