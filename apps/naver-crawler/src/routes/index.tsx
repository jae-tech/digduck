import { createFileRoute, redirect } from "@tanstack/react-router";
import { useLicenseStore } from "../feature/license/store/licenseStore";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { isLicenseValid, isLicenseExpired } = useLicenseStore.getState();

    // 라이센스가 유효하면 대시보드로, 그렇지 않으면 라이센스 페이지로
    if (isLicenseValid && !isLicenseExpired()) {
      throw redirect({
        to: "/crawler",
      });
    } else {
      throw redirect({
        to: "/license",
      });
    }
  },
});
