import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LicenseVerificationResult } from "../types/license.types";

interface LicenseStore {
  isLicenseValid: boolean;
  licenseKey: string | null;
  licenseInfo: LicenseVerificationResult["licenseInfo"] | null;
  expiryDate: string | null;

  setLicenseValid: (valid: boolean) => void;
  setLicenseData: (key: string, result: LicenseVerificationResult) => void;
  clearLicense: () => void;
  isLicenseExpired: () => boolean;
}

export const useLicenseStore = create<LicenseStore>()(
  persist(
    (set, get) => ({
      isLicenseValid: false,
      licenseKey: null,
      licenseInfo: null,
      expiryDate: null,

      setLicenseValid: (valid) => set({ isLicenseValid: valid }),

      setLicenseData: (key, result) =>
        set({
          isLicenseValid: result.success,
          licenseKey: key,
          licenseInfo: result.licenseInfo,
          expiryDate: result.licenseInfo?.expiryDate || null,
        }),

      clearLicense: () =>
        set({
          isLicenseValid: false,
          licenseKey: null,
          licenseInfo: null,
          expiryDate: null,
        }),

      isLicenseExpired: () => {
        const { expiryDate } = get();
        if (!expiryDate) return true;
        return new Date(expiryDate) < new Date();
      },
    }),
    {
      name: "license-storage",
      partialize: (state) => ({
        isLicenseValid: state.isLicenseValid,
        licenseKey: state.licenseKey,
        licenseInfo: state.licenseInfo,
        expiryDate: state.expiryDate,
      }),
    }
  )
);
