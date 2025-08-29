import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, CheckCircle2 } from "lucide-react";

import { useLicenseVerification } from "../hooks/useLicenseVerification";
import { LicenseKeyInput } from "./LicenseKeyInput";
import { LicenseVerificationStatus } from "./LicenseVerificationStatus";
import { type LicenseVerificationProps } from "../types/license.types";

export const LicenseKeyScreen: React.FC<LicenseVerificationProps> = ({
  onLicenseVerified,
  onError,
}) => {
  const {
    licenseKey,
    isVerifying,
    error,
    isValid,
    status,
    updateLicenseKey,
    verifyLicense,
  } = useLicenseVerification();

  const handleVerify = async () => {
    const result = await verifyLicense();

    if (result) {
      if (result.success) {
        setTimeout(() => {
          onLicenseVerified?.(licenseKey, result);
        }, 1000);
      } else {
        onError?.(result.message || "검증에 실패했습니다.");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !isVerifying &&
      !isValid &&
      licenseKey.length === 16
    ) {
      handleVerify();
    }
  };

  return (
    <div className="w-full max-w-2xl" onKeyDown={handleKeyDown}>
      <Card className="shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            라이센스 활성화
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2 px-2">
            제품을 사용하려면 유효한 라이센스 코드를 입력해주세요
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-6">
            <LicenseKeyInput
              value={licenseKey}
              onChange={updateLicenseKey}
              disabled={isVerifying || isValid}
              isValid={isValid}
              error={error}
            />

            <LicenseVerificationStatus status={status} error={error} />

            <Button
              onClick={handleVerify}
              className="w-full bg-slate-700 text-white hover:bg-slate-800"
              disabled={isVerifying || isValid || licenseKey.length !== 16}
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  검증 중...
                </>
              ) : isValid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  활성화 완료
                </>
              ) : (
                "라이센스 활성화"
              )}
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">
                라이센스 코드가 없으신가요?
              </p>
              <Button
                variant="link"
                className="text-xs p-0 h-auto text-blue-600"
              >
                구매하기
              </Button>
            </div>
          </div>

          {/* 데모 코드 힌트 - 반응형으로 조정 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 text-center mb-2">
              <strong>데모 라이센스 코드:</strong>
            </p>
            <div className="text-xs text-blue-600 space-y-1 text-center">
              <div className="break-all">
                일반:{" "}
                <code className="bg-white px-1 rounded text-blue-800 text-xs">
                  ABC123DEF4567890
                </code>
              </div>
              <div className="break-all">
                일반:{" "}
                <code className="bg-white px-1 rounded text-blue-800 text-xs">
                  TEST1234DEMO567
                </code>
              </div>
              <div className="break-all">
                관리자:{" "}
                <code className="bg-white px-1 rounded text-orange-700 text-xs">
                  ADMIN01012345678
                </code>
              </div>
            </div>
          </div>

          {/* 개발 모드 정보 */}
          {import.meta.env.DEV && (
            <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
              <p className="font-semibold">개발 모드</p>
              <p>• Vite 환경에서 실행 중</p>
              <p>• 백엔드 API 미구축 상태</p>
              <p>• 시뮬레이션 모드로 동작</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
