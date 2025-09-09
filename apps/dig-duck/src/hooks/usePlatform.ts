import { useState, useEffect } from "react";

export const usePlatform = () => {
  const [platform, setPlatform] = useState<"web" | "desktop">("web");

  useEffect(() => {
    // 동기적 체크 (즉시 실행)
    if (typeof window !== "undefined") {
      if (window.__TAURI__) {
        setPlatform("desktop");
      } else {
        setPlatform("web");
      }
    }
  }, []);

  return {
    isDesktop: platform === "desktop",
    isWeb: platform === "web",
    isLoading: platform === "web",
    platform,
  };
};
