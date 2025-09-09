import { NotFoundPage } from "@/components/pages/NotFoundPage";
import { getServiceRoute } from "@/lib/service-routes";
import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useEffect } from "react";
import { useLicenseStore } from "../features/license/store/license.store";

interface RootContext {
  isLicenseValid: boolean;
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  context: (): RootContext => ({
    isLicenseValid: false, // 기본값, 실제 값은 컴포넌트에서 설정
  }),
});

function RootComponent() {
  const navigate = useNavigate();
  const { isLicenseValid, isLicenseExpired, clearLicense, licenseInfo } =
    useLicenseStore();

  useEffect(() => {
    // 라이센스 만료 체크
    if (isLicenseValid && isLicenseExpired()) {
      clearLicense();
      navigate({ to: "/license" });
      return;
    }

    // 라이센스가 유효하지 않은 경우 라이센스 페이지로
    if (!isLicenseValid && window.location.pathname !== "/license") {
      navigate({ to: "/license" });
      return;
    }

    // 라이센스가 유효하고 서비스 코드가 있다면 서비스별 기본 페이지로 리다이렉트
    // (루트 경로이거나 라이센스 페이지에 있을 때)
    const shouldRedirectToService =
      isLicenseValid &&
      licenseInfo?.serviceCode &&
      (window.location.pathname === "/" ||
        window.location.pathname === "/license");

    if (shouldRedirectToService) {
      const defaultRoute = getServiceRoute(licenseInfo.serviceCode);
      navigate({ to: defaultRoute });
    }
  }, [isLicenseValid, navigate, isLicenseExpired, clearLicense, licenseInfo]);

  return (
    <>
      <Outlet />
      {import.meta.env.MODE === "development" && <TanStackRouterDevtools />}
    </>
  );
}
