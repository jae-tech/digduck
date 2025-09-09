import { useState, useCallback } from "react";
import {
  type LicenseState,
  type LicenseVerificationResult,
  type LicenseStatus,
} from "../types/license.types";
import { LicenseService } from "../services/license.service";
import { usePlatform } from "@/hooks/usePlatform";

export const useLicenseVerification = () => {
  const { platform } = usePlatform();
  const [state, setState] = useState<LicenseState>({
    licenseKey: "",
    isVerifying: false,
    error: "",
    isValid: false,
  });

  const [status, setStatus] = useState<LicenseStatus>("idle");

  const updateLicenseKey = useCallback((value: string) => {
    // 대문자로 변환하고 영숫자만 허용, 최대 16자리
    const cleaned = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 16);

    setState((prev) => ({
      ...prev,
      licenseKey: cleaned,
      error: "",
      isValid: false,
    }));
    setStatus("idle");
  }, []);

  const verifyLicense =
    useCallback(async (): Promise<LicenseVerificationResult | null> => {
      if (!state.licenseKey.trim()) {
        const error = "라이센스 코드를 입력해주세요.";
        setState((prev) => ({ ...prev, error }));
        return null;
      }

      if (state.licenseKey.length !== 16) {
        const error = "16자리 라이센스 코드를 모두 입력해주세요.";
        setState((prev) => ({ ...prev, error }));
        return null;
      }

      // 관리자 라이센스 형식 체크
      if (state.licenseKey.startsWith("ADMIN")) {
        const phoneNumber = state.licenseKey.substring(5);
        if (phoneNumber.length !== 11 || !/^[0-9]+$/.test(phoneNumber)) {
          const error = "ADMIN 다음에는 11자리 휴대폰 번호를 입력해주세요.";
          setState((prev) => ({ ...prev, error }));
          return null;
        }
      }

      setState((prev) => ({ ...prev, isVerifying: true, error: "" }));
      setStatus("verifying");

      try {
        const result = await LicenseService.verifyLicense(
          state.licenseKey,
          platform
        );

        setState((prev) => ({
          ...prev,
          isVerifying: false,
          isValid: result.success,
          userType: result.userType,
          error: result.success ? "" : result.message || "검증에 실패했습니다.",
          verificationResult: result,
        }));

        setStatus(result.success ? "valid" : "invalid");
        return result;
      } catch (error) {
        const errorMessage =
          "라이센스 코드 검증 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        setState((prev) => ({
          ...prev,
          isVerifying: false,
          error: errorMessage,
          isValid: false,
        }));
        setStatus("error");
        return null;
      }
    }, [state.licenseKey]);

  const reset = useCallback(() => {
    setState({
      licenseKey: "",
      isVerifying: false,
      error: "",
      isValid: false,
    });
    setStatus("idle");
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: "" }));
  }, []);

  return {
    licenseKey: state.licenseKey,
    isVerifying: state.isVerifying,
    error: state.error,
    isValid: state.isValid,
    userType: state.userType,
    verificationResult: state.verificationResult,
    status,
    updateLicenseKey,
    verifyLicense,
    reset,
    clearError,
  };
};
