import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LicenseKeyScreen } from "../feature/license";
import { useLicenseStore } from "../feature/license/store/licenseStore";
import { type LicenseVerificationResult } from "../feature/license/types/license.types";

export const Route = createFileRoute("/license")({
  component: LicenseRoute,
});

function LicenseRoute() {
  const navigate = useNavigate();
  const { isLicenseValid, setLicenseData } = useLicenseStore();

  // 이미 라이센스가 유효하다면 크롤러 페이지로 리다이렉트
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

    // 성공 시 크롤러 페이지로 이동
    setTimeout(() => {
      navigate({ to: "/crawler" });
    }, 1500);
  };

  const handleLicenseError = (error: string) => {
    console.error("License verification error:", error);
    // 에러 토스트 메시지 등을 표시할 수 있습니다
  };

  return (
    <LicenseKeyScreen
      onLicenseVerified={handleLicenseVerified}
      onError={handleLicenseError}
    />
  );
}
