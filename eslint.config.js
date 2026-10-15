import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/", ".next/", "next-env.d.ts", ".wrangler/", ".vinext/", "node_modules/", "worker-configuration.d.ts", "backups/", "test-results/", "src/data/countries.ts", "playwright-report/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "worker/**/*.ts"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
    languageOptions: { globals: { ...globals.browser, ...globals.serviceworker } },
  },
  {
    files: ["scripts/**/*.{ts,mjs}", "tests/**/*.ts", "e2e/**/*.ts", "*.config.{js,ts,mjs}"],
    languageOptions: { globals: globals.node },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
);
