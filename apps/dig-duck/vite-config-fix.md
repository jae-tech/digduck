# Vite에서 process is not defined 해결

## vite.config.ts에 추가:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // process 객체를 브라우저에서 사용 가능하게 함
    global: "globalThis",
    "process.env": {},
  },
  // 또는 Node.js polyfill 사용
  optimizeDeps: {
    include: ["buffer", "process"],
  },
});
```

## 또는 package.json에 polyfill 추가:

```bash
pnpm install --save-dev @types/node
pnpm install buffer process
```
