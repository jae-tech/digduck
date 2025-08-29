import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { type LicenseStatus } from "../types/license.types";

interface LicenseVerificationStatusProps {
  status: LicenseStatus;
  error?: string;
  successMessage?: string;
}

export const LicenseVerificationStatus: React.FC<
  LicenseVerificationStatusProps
> = ({
  status,
  error,
  successMessage = "라이센스가 성공적으로 활성화되었습니다!",
}) => {
  if (status === "idle" || status === "verifying") {
    return null;
  }

  if (status === "valid") {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          {successMessage}
        </AlertDescription>
      </Alert>
    );
  }

  if ((status === "invalid" || status === "error") && error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return null;
};
