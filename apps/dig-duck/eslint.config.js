import { config } from "@repo/eslint-config/react-internal";

/**
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  // 제외할 디렉토리들
  {
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**",
      "src-tauri/**", 
      ".next/**",
      "coverage/**",
      "*.config.js",
      "*.config.ts",
      "eslint.config.js",
      "routeTree.gen.ts"
    ],
  },
  ...config,
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 프로젝트별 특화 규칙 (환경변수 관련)
      "turbo/no-undeclared-env-vars": "off",
    },
  },
];