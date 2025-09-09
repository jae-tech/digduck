import CenteredLayout from "@/components/layouts/CenteredLayout";
import { getRedirectPath } from "@/lib/service-routes";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LicenseKeyScreen } from "../features/license";
import { useLicenseStore } from "../features/license/store/license.store";
import { type LicenseVerificationResult } from "../features/license/types/license.types";

export const Route = createFileRoute("/license")({
  beforeLoad: () => {
    // 스토어에서 직접 상태 확인 (React 훅 없이)
    const state = useLicenseStore.getState();
    const isAuthenticated =
      state.isLicenseValid && !!state.licenseKey && !state.isLicenseExpired();
    const isAdmin = state.licenseKey?.startsWith("ADMIN") || false;

    if (isAuthenticated) {
      const targetRoute = getRedirectPath(
        isAdmin,
        state.licenseInfo?.serviceCode
      );

      console.log("License beforeLoad redirect:", {
        isAdmin,
        serviceCode: state.licenseInfo?.serviceCode,
        targetRoute,
      });

      throw redirect({ to: targetRoute });
    }
  },
  component: LicenseRoute,
});

function LicenseRoute() {
  const navigate = useNavigate();
  const { isLicenseValid, setLicenseData } = useLicenseStore();

  // 이미 라이센스가 유효하다면 루트로 이동 (__root.tsx에서 서비스별 처리)
  useEffect(() => {
    if (isLicenseValid) {
      navigate({ to: "/" });
    }
  }, [isLicenseValid, navigate]);

  const handleLicenseVerified = (
    licenseKey: string,
    result: LicenseVerificationResult
  ) => {
    setLicenseData(licenseKey, result);
  };

  const handleLicenseError = (error: string) => {
    console.error("License verification error:", error);
    // 에러 토스트 메시지 등을 표시할 수 있습니다
  };

  return (
    <CenteredLayout>
      <LicenseKeyScreen
        onLicenseVerified={handleLicenseVerified}
        onError={handleLicenseError}
      />
    </CenteredLayout>
  );
}
