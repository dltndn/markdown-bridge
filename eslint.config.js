const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx", "tests/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error"
    }
  },
  {
    ignores: ["dist/**", "node_modules/**", "eslint.config.js", "vitest.config.ts"]
  }
);
