import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useEffect } from "react";
import { useLicenseStore } from "../features/license/store/licenseStore";
import MainLayout from "@/components/layout/MainLayout";

interface RootContext {
  isLicenseValid: boolean;
}

export const Route = createRootRoute({
  component: RootComponent,
  context: (): RootContext => ({
    isLicenseValid: false, // 기본값, 실제 값은 컴포넌트에서 설정
  }),
});

function RootComponent() {
  const navigate = useNavigate();
  const { isLicenseValid, isLicenseExpired, clearLicense } = useLicenseStore();

  useEffect(() => {
    // 라이센스 만료 체크
    if (isLicenseValid && isLicenseExpired()) {
      clearLicense();
      navigate({ to: "/license" });
      return;
    }

    // 현재 경로가 라이센스 페이지가 아니고 라이센스가 유효하지 않다면
    if (!isLicenseValid && window.location.pathname !== "/license") {
      navigate({ to: "/license" });
    }
  }, [isLicenseValid, navigate, isLicenseExpired, clearLicense]);

  return (
    <MainLayout>
      <Outlet />
      {import.meta.env.MODE === "development" && <TanStackRouterDevtools />}
    </MainLayout>
  );
}
