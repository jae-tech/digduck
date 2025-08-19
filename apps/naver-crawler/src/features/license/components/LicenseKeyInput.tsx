import React from "react";
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

export const LicenseKeyInput: React.FC<LicenseKeyInputProps> = ({
  value,
  onChange,
  disabled = false,
  isValid = false,
  error,
}) => {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <Label className="text-sm font-medium text-gray-700">
          라이센스 코드 (16자리)
        </Label>
      </div>

      <div className="flex justify-center">
        <div className="relative">
          <InputOTP
            maxLength={16}
            value={value}
            onChange={onChange}
            disabled={disabled}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
              <InputOTPSlot index={6} />
              <InputOTPSlot index={7} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={8} />
              <InputOTPSlot index={9} />
              <InputOTPSlot index={10} />
              <InputOTPSlot index={11} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={12} />
              <InputOTPSlot index={13} />
              <InputOTPSlot index={14} />
              <InputOTPSlot index={15} />
            </InputOTPGroup>
          </InputOTP>

          {isValid && (
            <CheckCircle2 className="absolute -right-8 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          구매 확인 이메일에서 16자리 숫자 코드를 확인하세요
        </p>
      </div>
    </div>
  );
};
