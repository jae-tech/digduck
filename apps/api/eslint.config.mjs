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
      // 프로젝트별 특화 규칙은 여기에 추가
      // 대부분의 규칙은 base config에서 처리됨
    },
  },
];
