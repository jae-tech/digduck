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
      // React에서 any 타입 사용 시 경고만 발생 (엄격하게 막지 않음)
      "@typescript-eslint/no-explicit-any": "warn",
      // 사용하지 않는 변수는 경고만 발생
      "@typescript-eslint/no-unused-vars": "warn",
      // turbo 환경변수 경고 비활성화
      "turbo/no-undeclared-env-vars": "off",
    },
  },
];