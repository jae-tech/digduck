import { config } from "@repo/eslint-config/base";

/**
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // any 타입 사용 시 경고만 발생 (엄격하게 막지 않음)
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
