import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { DigDuckIcon } from "@/components/icons/DigDuckIcon";

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
          <div className="mx-auto mb-4">
            <DigDuckIcon className="text-blue-600" size={96} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            라이센스 활성화
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2 px-2">
            Dig Duck을 시작하려면 라이센스 코드를 입력해주세요
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

        </CardContent>
      </Card>
    </div>
  );
};
