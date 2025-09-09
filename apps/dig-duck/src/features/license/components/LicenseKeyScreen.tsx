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
    console.log("🚀 Starting license verification...");
    const result = await verifyLicense();

    console.log("📋 Verification result:", result);

    if (result) {
      if (result.success) {
        console.log("✅ License verification successful, calling onLicenseVerified...");
        setTimeout(() => {
          console.log("🔄 Calling onLicenseVerified callback");
          onLicenseVerified?.(licenseKey, result);
        }, 1000);
      } else {
        console.log("❌ License verification failed");
        onError?.(result.message || "검증에 실패했습니다.");
      }
    } else {
      console.log("⚠️ No result returned from verifyLicense");
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
            <span className="hidden sm:inline">
              Dig Duck을 시작하려면 라이센스 코드를 입력해주세요
            </span>
            <span className="sm:hidden">
              Dig Duck을 시작하려면
              <br />
              라이센스 코드를 입력해주세요
            </span>
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
        </CardContent>
      </Card>
    </div>
  );
};
