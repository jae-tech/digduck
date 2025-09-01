import React from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import { DigDuckIcon } from "@/components/icons/DigDuckIcon";

interface LicenseKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isValid?: boolean;
  error?: string;
}

export const LicenseKeyInput: React.FC<LicenseKeyInputProps> = ({
  value,
  onChange,
  disabled = false,
  isValid = false,
}) => {
  const isAdminLicense = value.startsWith("ADMIN");

  return (
    <div className="space-y-3 w-full">
      <div className="text-center">
        <Label className="text-sm font-medium text-gray-700">
          라이센스 코드 (16자리)
        </Label>
        {isAdminLicense && (
          <div className="flex items-center justify-center mt-1 text-xs text-orange-600">
            <DigDuckIcon className="mr-1" size={12} />
            관리자 라이센스 감지됨
          </div>
        )}
      </div>

      {/* 완전 반응형 - 화면 크기에 따라 조정 */}
      <div className="w-full">
        {/* 큰 화면 (md 이상) - 한 줄로 표시 */}
        <div className="hidden md:flex justify-center">
          <div className="relative flex items-center">
            <InputOTP
              maxLength={16}
              value={value}
              onChange={onChange}
              disabled={disabled}
            >
              <InputOTPGroup>
                <InputOTPSlot
                  index={0}
                  className={`w-8 h-10 text-sm ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
                />
                <InputOTPSlot
                  index={1}
                  className={`w-8 h-10 text-sm ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
                />
                <InputOTPSlot
                  index={2}
                  className={`w-8 h-10 text-sm ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
                />
                <InputOTPSlot
                  index={3}
                  className={`w-8 h-10 text-sm ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
                />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot
                  index={4}
                  className={`w-8 h-10 text-sm ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
                />
                <InputOTPSlot index={5} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={6} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={7} className="w-8 h-10 text-sm" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={8} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={9} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={10} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={11} className="w-8 h-10 text-sm" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={12} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={13} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={14} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={15} className="w-8 h-10 text-sm" />
              </InputOTPGroup>
            </InputOTP>
            {isValid && (
              <CheckCircle2 className="ml-3 w-5 h-5 text-green-500" />
            )}
          </div>
        </div>

        {/* 작은 화면 (md 미만) - 더 작은 크기로 한 줄 */}
        <div className="md:hidden flex justify-center">
          <div className="relative flex items-center scale-90 origin-center">
            <InputOTP
              maxLength={16}
              value={value}
              onChange={onChange}
              disabled={disabled}
            >
              <InputOTPGroup>
                <InputOTPSlot
                  index={0}
                  className={`w-6 h-8 text-xs ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
                />
                <InputOTPSlot
                  index={1}
                  className={`w-6 h-8 text-xs ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
                />
                <InputOTPSlot
                  index={2}
                  className={`w-6 h-8 text-xs ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
                />
                <InputOTPSlot
                  index={3}
                  className={`w-6 h-8 text-xs ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
                />
              </InputOTPGroup>
              <InputOTPSeparator className="mx-0.5" />
              <InputOTPGroup>
                <InputOTPSlot
                  index={4}
                  className={`w-6 h-8 text-xs ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
                />
                <InputOTPSlot index={5} className="w-6 h-8 text-xs" />
                <InputOTPSlot index={6} className="w-6 h-8 text-xs" />
                <InputOTPSlot index={7} className="w-6 h-8 text-xs" />
              </InputOTPGroup>
              <InputOTPSeparator className="mx-0.5" />
              <InputOTPGroup>
                <InputOTPSlot index={8} className="w-6 h-8 text-xs" />
                <InputOTPSlot index={9} className="w-6 h-8 text-xs" />
                <InputOTPSlot index={10} className="w-6 h-8 text-xs" />
                <InputOTPSlot index={11} className="w-6 h-8 text-xs" />
              </InputOTPGroup>
              <InputOTPSeparator className="mx-0.5" />
              <InputOTPGroup>
                <InputOTPSlot index={12} className="w-6 h-8 text-xs" />
                <InputOTPSlot index={13} className="w-6 h-8 text-xs" />
                <InputOTPSlot index={14} className="w-6 h-8 text-xs" />
                <InputOTPSlot index={15} className="w-6 h-8 text-xs" />
              </InputOTPGroup>
            </InputOTP>
            {isValid && (
              <CheckCircle2 className="ml-2 w-4 h-4 text-green-500" />
            )}
          </div>
        </div>
      </div>

      <div className="text-center space-y-1 px-2">
        <p className="text-xs text-gray-500">
          {isAdminLicense
            ? "관리자 전용 라이센스입니다"
            : "라이센스 코드 16자리를 입력해주세요"}
        </p>
      </div>
    </div>
  );
};
