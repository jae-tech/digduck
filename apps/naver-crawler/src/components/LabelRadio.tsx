import React from "react";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { cn } from "@/lib/utils";

interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface LabelRadioProps {
  label: string;
  name: string;
  options: RadioOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  error?: string;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

const LabelRadio: React.FC<LabelRadioProps> = ({
  label,
  name,
  options = [],
  value,
  onValueChange,
  required = false,
  error,
  orientation = "vertical",
  className,
}) => {
  return (
    <div className={cn("grid w-full items-center gap-1.5", className)}>
      <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        name={name}
        className={cn(
          orientation === "horizontal" ? "flex flex-wrap gap-6" : "grid gap-2"
        )}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value}
              id={`${name}-${option.value}`}
              disabled={option.disabled}
            />
            <Label
              htmlFor={`${name}-${option.value}`}
              className={cn(
                "text-sm font-medium leading-none cursor-pointer",
                option.disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
};

export default LabelRadio;
