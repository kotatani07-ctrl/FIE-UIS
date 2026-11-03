import jsxA11y from "eslint-plugin-jsx-a11y";
import noUnsanitized from "eslint-plugin-no-unsanitized";
import reactHooks from "eslint-plugin-react-hooks";
import security from "eslint-plugin-security";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "jsx-a11y": jsxA11y,
      "no-unsanitized": noUnsanitized,
      "react-hooks": reactHooks,
      security,
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "no-unsanitized/method": "error",
      "no-unsanitized/property": "error",
      "security/detect-eval-with-expression": "error",
    },
  },
);
