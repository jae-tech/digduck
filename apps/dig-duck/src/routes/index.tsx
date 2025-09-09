import { createFileRoute, redirect } from "@tanstack/react-router";
import { useLicenseStore } from "../features/license/store/license.store";
import { getServiceRoute } from "@/lib/service-routes";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { isLicenseValid, isLicenseExpired, licenseInfo } = useLicenseStore.getState();

    // 라이센스가 유효하면 서비스별 페이지로, 그렇지 않으면 라이센스 페이지로
    if (isLicenseValid && !isLicenseExpired()) {
      const targetRoute = licenseInfo?.serviceCode 
        ? getServiceRoute(licenseInfo.serviceCode)
        : "/dashboard";
      
      console.log("Index route redirect:", { 
        serviceCode: licenseInfo?.serviceCode, 
        targetRoute 
      });
      
      throw redirect({
        to: targetRoute,
      });
    } else {
      throw redirect({
        to: "/license",
      });
    }
  },
});
