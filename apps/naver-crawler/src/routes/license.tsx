import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LicenseKeyScreen } from "../features/license";
import { useLicenseStore } from "../features/license/store/license.store";
import { type LicenseVerificationResult } from "../features/license/types/license.types";
import CenteredLayout from "@/components/layouts/CenteredLayout";

export const Route = createFileRoute("/license")({
  component: LicenseRoute,
});

function LicenseRoute() {
  const navigate = useNavigate();
  const { isLicenseValid, setLicenseData } = useLicenseStore();

  // 이미 라이센스가 유효하다면 대시보드로 리다이렉트
  useEffect(() => {
    if (isLicenseValid) {
      navigate({ to: "/crawler" });
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
        navigate({ to: "/crawler" });
      }
    }, 1500);
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
