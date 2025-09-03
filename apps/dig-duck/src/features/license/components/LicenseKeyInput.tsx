import React, { useRef } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

interface LicenseKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isValid?: boolean;
  error?: string;
}

interface MobileInputOTPProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isAdminLicense: boolean;
  isValid: boolean;
}

const MobileInputOTP: React.FC<MobileInputOTPProps> = ({
  value,
  onChange,
  disabled,
  isAdminLicense,
  isValid,
}) => {
  const firstRowRef = useRef<HTMLDivElement>(null);
  const secondRowRef = useRef<HTMLDivElement>(null);

  const handleFirstRowChange = (newValue: string) => {
    const fullValue = newValue + value.slice(8);
    onChange(fullValue);

    // 첫 번째 줄이 다 채워지면 두 번째 줄로 포커스 이동
    if (newValue.length === 8 && secondRowRef.current) {
      const firstInput = secondRowRef.current.querySelector("input");
      if (firstInput) {
        firstInput.focus();
      }
    }
  };

  const handleSecondRowChange = (newValue: string) => {
    const fullValue = value.slice(0, 8) + newValue;
    onChange(fullValue);
  };

  const handleFirstRowKeyDown = (e: React.KeyboardEvent) => {
    // 백스페이스로 첫 번째 줄이 비워지면 첫 번째 줄로 포커스 이동
    if (
      e.key === "Backspace" &&
      value.slice(8).length === 0 &&
      value.slice(0, 8).length > 0
    ) {
      if (firstRowRef.current) {
        const lastInput = firstRowRef.current.querySelector("input:last-child");
        if (lastInput) {
          (lastInput as HTMLInputElement).focus();
        }
      }
    }
  };

  return (
    <>
      {/* 첫 번째 줄: 8자리 */}
      <div className="flex justify-center" ref={firstRowRef}>
        <InputOTP
          maxLength={8}
          value={value.slice(0, 8)}
          onChange={handleFirstRowChange}
          disabled={disabled}
          pattern={`[A-Za-z0-9]*`}
        >
          <InputOTPGroup className="flex-shrink-0">
            <InputOTPSlot
              index={0}
              className={`w-6 h-8 text-sm ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
            />
            <InputOTPSlot
              index={1}
              className={`w-6 h-8 text-sm ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
            />
            <InputOTPSlot
              index={2}
              className={`w-6 h-8 text-sm ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
            />
            <InputOTPSlot
              index={3}
              className={`w-6 h-8 text-sm ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
            />
          </InputOTPGroup>
          <InputOTPSeparator className="mx-1" />
          <InputOTPGroup className="flex-shrink-0">
            <InputOTPSlot
              index={4}
              className={`w-6 h-8 text-sm ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
            />
            <InputOTPSlot index={5} className="w-6 h-8 text-sm" />
            <InputOTPSlot index={6} className="w-6 h-8 text-sm" />
            <InputOTPSlot index={7} className="w-6 h-8 text-sm" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {/* 두 번째 줄: 나머지 8자리 */}
      <div className="flex justify-center" ref={secondRowRef}>
        <div className="relative flex items-center">
          <InputOTP
            maxLength={8}
            value={value.slice(8, 16)}
            onChange={handleSecondRowChange}
            disabled={disabled}
            onKeyDown={handleFirstRowKeyDown}
            pattern={`[A-Za-z0-9]*`}
          >
            <InputOTPGroup className="flex-shrink-0">
              <InputOTPSlot index={0} className="w-6 h-8 text-sm" />
              <InputOTPSlot index={1} className="w-6 h-8 text-sm" />
              <InputOTPSlot index={2} className="w-6 h-8 text-sm" />
              <InputOTPSlot index={3} className="w-6 h-8 text-sm" />
            </InputOTPGroup>
            <InputOTPSeparator className="mx-1" />
            <InputOTPGroup className="flex-shrink-0">
              <InputOTPSlot index={4} className="w-6 h-8 text-sm" />
              <InputOTPSlot index={5} className="w-6 h-8 text-sm" />
              <InputOTPSlot index={6} className="w-6 h-8 text-sm" />
              <InputOTPSlot index={7} className="w-6 h-8 text-sm" />
            </InputOTPGroup>
          </InputOTP>
          {isValid && <CheckCircle2 className="ml-3 w-5 h-5 text-green-500" />}
        </div>
      </div>
    </>
  );
};

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
          <span>라이센스 코드 (16자리)</span>
        </Label>
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
              pattern={`[A-Za-z0-9]*`}
            >
              <InputOTPGroup className="flex-shrink-0">
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
              <InputOTPGroup className="flex-shrink-0">
                <InputOTPSlot
                  index={4}
                  className={`w-8 h-10 text-sm ${isAdminLicense ? "bg-orange-50 border-orange-200" : ""}`}
                />
                <InputOTPSlot index={5} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={6} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={7} className="w-8 h-10 text-sm" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="flex-shrink-0">
                <InputOTPSlot index={8} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={9} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={10} className="w-8 h-10 text-sm" />
                <InputOTPSlot index={11} className="w-8 h-10 text-sm" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="flex-shrink-0">
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

        {/* 작은 화면 (md 미만) - 2줄로 나누어 표시 */}
        <div className="md:hidden space-y-2">
          <MobileInputOTP
            value={value}
            onChange={onChange}
            disabled={disabled}
            isAdminLicense={isAdminLicense}
            isValid={isValid}
          />
        </div>
      </div>
    </div>
  );
};
