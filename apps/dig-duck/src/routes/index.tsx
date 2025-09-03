import { createFileRoute, redirect } from "@tanstack/react-router";
import { useLicenseStore } from "../features/license/store/license.store";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { isLicenseValid, isLicenseExpired } = useLicenseStore.getState();

    // 라이센스가 유효하면 크롤러 페이지로, 그렇지 않으면 라이센스 페이지로
    if (isLicenseValid && !isLicenseExpired()) {
      throw redirect({
        to: "/crawler/review",
      });
    } else {
      throw redirect({
        to: "/license",
      });
    }
  },
});
