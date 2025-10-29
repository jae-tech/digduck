import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { LicenseKeyScreen } from "../features/license";
import { useLicenseStore } from "../features/license/store/license.store";
import { type LicenseVerificationResult } from "../features/license/types/license.types";
import CenteredLayout from "@/components/layouts/CenteredLayout";

export const Route = createFileRoute("/license")({
  beforeLoad: () => {
    // 스토어에서 직접 상태 확인 (React 훅 없이)
    const state = useLicenseStore.getState();
    const isAuthenticated =
      state.isLicenseValid && !!state.licenseKey && !state.isLicenseExpired();
    const isAdmin = state.licenseKey?.startsWith("ADMIN") || false;

    if (isAuthenticated) {
      if (isAdmin) {
        throw redirect({ to: "/admin/dashboard" });
      } else {
        throw redirect({ to: "/crawler/review" });
      }
    }
  },
  component: LicenseRoute,
});

function LicenseRoute() {
  const navigate = useNavigate();
  const { isLicenseValid, setLicenseData } = useLicenseStore();

  // 이미 라이센스가 유효하다면 크롤러 페이지로 리다이렉트
  useEffect(() => {
    if (isLicenseValid) {
      navigate({ to: "/crawler/review" });
    }
  }, [isLicenseValid, navigate]);

  const handleLicenseVerified = (
    licenseKey: string,
    result: LicenseVerificationResult
  ) => {
    setLicenseData(licenseKey, result);

    // 사용자 타입에 따라 다른 페이지로 이동
    setTimeout(() => {
      if (result.userType === "admin") {
        navigate({ to: "/admin/dashboard" });
      } else {
        navigate({ to: "/crawler/review" });
      }
    }, 1500);
  };

  const handleLicenseError = (error: string) => {
    console.error("라이센스 검증 오류:", error);
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
