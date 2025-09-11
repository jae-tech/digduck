import { useState, useCallback } from "react";
import {
  type LicenseConfig,
  type GeneratedLicense,
  type LicenseGenerationResult,
} from "../types/licenseGenerator.types";
import { LicenseGeneratorService } from "../services/licenseGenerator.service";

export const useLicenseGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLicenses, setGeneratedLicenses] = useState<
    GeneratedLicense[]
  >([]);
  const [error, setError] = useState<string>("");

  const generateSingleLicense = useCallback(
    async (config: LicenseConfig): Promise<LicenseGenerationResult> => {
      setIsGenerating(true);
      setError("");

      try {
        // 유효성 검증
        const validationErrors =
          LicenseGeneratorService.validateLicenseConfig(config);
        if (validationErrors.length > 0) {
          const errorMessage = validationErrors.join(" ");
          setError(errorMessage);
          return {
            success: false,
            message: errorMessage,
            error: "VALIDATION_ERROR",
          };
        }

        const result = await LicenseGeneratorService.generateLicense(config);

        if (result.success && result.licenseKey) {
          const newLicense: GeneratedLicense = {
            licenseKey: result.licenseKey,
            config,
            generatedAt: new Date().toISOString(),
            status: "active",
          };

          setGeneratedLicenses((prev) => [newLicense, ...prev]);
        } else {
          setError(result.message);
        }

        return result;
      } catch (error) {
        const errorMessage = "라이센스 생성 중 오류가 발생했습니다.";
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage,
          error: "UNEXPECTED_ERROR",
        };
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  const generateBulkLicenses = useCallback(
    async (
      count: number,
      config: LicenseConfig,
    ): Promise<LicenseGenerationResult[]> => {
      setIsGenerating(true);
      setError("");

      try {
        const results: LicenseGenerationResult[] = [];

        for (let i = 0; i < count; i++) {
          const licenseConfig = {
            ...config,
            userEmail: config.userEmail.replace("@", `${i + 1}@`), // 이메일에 번호 추가
          };

          const result =
            await LicenseGeneratorService.generateLicense(licenseConfig);
          results.push(result);

          if (result.success && result.licenseKey) {
            const newLicense: GeneratedLicense = {
              licenseKey: result.licenseKey,
              config: licenseConfig,
              generatedAt: new Date().toISOString(),
              status: "active",
            };

            setGeneratedLicenses((prev) => [newLicense, ...prev]);
          }

          // 진행 상황 표시를 위한 작은 딜레이
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        return results;
      } catch (error) {
        const errorMessage = "대량 라이센스 생성 중 오류가 발생했습니다.";
        setError(errorMessage);
        return [];
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const clearGeneratedLicenses = useCallback(() => {
    setGeneratedLicenses([]);
  }, []);

  const removeLicense = useCallback((licenseKey: string) => {
    setGeneratedLicenses((prev) =>
      prev.filter((license) => license.licenseKey !== licenseKey),
    );
  }, []);

  return {
    isGenerating,
    generatedLicenses,
    error,
    generateSingleLicense,
    generateBulkLicenses,
    clearError,
    clearGeneratedLicenses,
    removeLicense,
  };
};
