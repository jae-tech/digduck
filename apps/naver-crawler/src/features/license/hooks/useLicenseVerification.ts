import { useState, useCallback } from "react";
import {
  type LicenseState,
  type LicenseVerificationResult,
  type LicenseStatus,
} from "../types/license.types";
import { LicenseService } from "../services/licenseService";

export const useLicenseVerification = () => {
  const [state, setState] = useState<LicenseState>({
    licenseKey: "",
    isVerifying: false,
    error: "",
    isValid: false,
  });

  const [status, setStatus] = useState<LicenseStatus>("idle");

  const updateLicenseKey = useCallback((value: string) => {
    const formatted = LicenseService.formatLicenseKey(value);
    setState((prev) => ({
      ...prev,
      licenseKey: formatted,
      error: "",
      isValid: false,
    }));
    setStatus("idle");
  }, []);

  const verifyLicense =
    useCallback(async (): Promise<LicenseVerificationResult | null> => {
      if (!state.licenseKey.trim()) {
        const error = "라이센스 키를 입력해주세요.";
        setState((prev) => ({ ...prev, error }));
        return null;
      }

      if (!LicenseService.validateFormat(state.licenseKey)) {
        const error = "올바른 형식의 라이센스 키를 입력해주세요.";
        setState((prev) => ({ ...prev, error }));
        return null;
      }

      setState((prev) => ({ ...prev, isVerifying: true, error: "" }));
      setStatus("verifying");

      try {
        const result = await LicenseService.verifyLicense(state.licenseKey);

        setState((prev) => ({
          ...prev,
          isVerifying: false,
          isValid: result.success,
          error: result.success ? "" : result.message || "검증에 실패했습니다.",
          verificationResult: result,
        }));

        setStatus(result.success ? "valid" : "invalid");
        return result;
      } catch (error) {
        const errorMessage =
          "라이센스 키 검증 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
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
    verificationResult: state.verificationResult,
    status,
    updateLicenseKey,
    verifyLicense,
    reset,
    clearError,
  };
};
