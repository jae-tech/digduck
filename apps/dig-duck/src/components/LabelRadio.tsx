import React from "react";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
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
  success?: string;
  orientation?: "vertical" | "horizontal" | "grid";
  variant?: "default" | "card" | "glass" | "minimal";
  showValidation?: boolean;
  columns?: number;
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
  success,
  orientation = "vertical",
  variant = "default",
  showValidation = true,
  columns = 2,
  className,
}) => {
  const gridCols = orientation === "grid" ? `grid-cols-${columns}` : "";

  const renderOption = (option: RadioOption) => {
    const isSelected = value === option.value;

    if (variant === "card") {
      return (
        <div
          key={option.value}
          className={cn(
            "relative border rounded-lg p-4 cursor-pointer transition-all duration-200",
            "hover:border-primary/50 hover:bg-accent/50",
            isSelected && "border-primary bg-primary/5 shadow-sm",
            option.disabled &&
              "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent",
            error && !isSelected && "border-destructive/30",
            success && isSelected && "border-green-500 bg-green-500/5"
          )}
          onClick={() => !option.disabled && onValueChange?.(option.value)}
        >
          <div className="flex items-start gap-3">
            <RadioGroupItem
              value={option.value}
              id={`${name}-${option.value}`}
              disabled={option.disabled}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {option.icon && (
                  <div
                    className={cn(
                      "flex-shrink-0",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {option.icon}
                  </div>
                )}
                <Label
                  htmlFor={`${name}-${option.value}`}
                  className={cn(
                    "font-medium cursor-pointer",
                    isSelected && "text-primary",
                    option.disabled && "cursor-not-allowed"
                  )}
                >
                  {option.label}
                </Label>
              </div>
              {option.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
              )}
            </div>
          </div>

          {isSelected && (
            <div className="absolute top-2 right-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
          )}
        </div>
      );
    }

    if (variant === "glass") {
      return (
        <div
          key={option.value}
          className={cn(
            "relative glass-card p-3 cursor-pointer transition-all duration-200",
            "hover:bg-background/40 hover:border-primary/30",
            isSelected && "border-primary/50 bg-primary/5 shadow-glow-blue",
            option.disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !option.disabled && onValueChange?.(option.value)}
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem
              value={option.value}
              id={`${name}-${option.value}`}
              disabled={option.disabled}
            />
            <div className="flex items-center gap-2 flex-1">
              {option.icon && (
                <div
                  className={cn(
                    "flex-shrink-0",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {option.icon}
                </div>
              )}
              <div className="space-y-0.5">
                <Label
                  htmlFor={`${name}-${option.value}`}
                  className={cn(
                    "font-medium cursor-pointer text-foreground/90",
                    isSelected && "text-primary",
                    option.disabled && "cursor-not-allowed"
                  )}
                >
                  {option.label}
                </Label>
                {option.description && (
                  <p className="text-xs text-muted-foreground/80">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (variant === "minimal") {
      return (
        <div
          key={option.value}
          className={cn(
            "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all duration-200",
            "hover:bg-accent/50",
            isSelected && "bg-primary/5",
            option.disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !option.disabled && onValueChange?.(option.value)}
        >
          <RadioGroupItem
            value={option.value}
            id={`${name}-${option.value}`}
            disabled={option.disabled}
          />
          <div className="flex items-center gap-2 flex-1">
            {option.icon && (
              <div
                className={cn(
                  "flex-shrink-0 w-4 h-4",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              >
                {option.icon}
              </div>
            )}
            <Label
              htmlFor={`${name}-${option.value}`}
              className={cn(
                "cursor-pointer font-normal",
                isSelected && "font-medium text-primary",
                option.disabled && "cursor-not-allowed"
              )}
            >
              {option.label}
            </Label>
          </div>
        </div>
      );
    }

    // Default variant
    return (
      <div key={option.value} className="flex items-center space-x-3 p-1">
        <RadioGroupItem
          value={option.value}
          id={`${name}-${option.value}`}
          disabled={option.disabled}
        />
        <div className="flex items-center gap-2 flex-1">
          {option.icon && (
            <div
              className={cn(
                "flex-shrink-0",
                value === option.value
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {option.icon}
            </div>
          )}
          <Label
            htmlFor={`${name}-${option.value}`}
            className={cn(
              "cursor-pointer font-medium",
              option.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {option.label}
          </Label>
        </div>
        {option.description && (
          <p className="text-sm text-muted-foreground ml-7">
            {option.description}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>

        {showValidation && (error || success) && (
          <div className="flex items-center">
            {error && <AlertCircle className="h-4 w-4 text-destructive" />}
            {success && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>
        )}
      </div>

      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        name={name}
        className={cn(
          "space-y-2",
          orientation === "horizontal" && "flex flex-wrap gap-4 space-y-0",
          orientation === "grid" && `grid gap-3 ${gridCols} space-y-0`,
          variant === "card" && "space-y-3",
          variant === "glass" && "space-y-2",
          error && variant === "default" && "space-y-2"
        )}
      >
        {options.map(renderOption)}
      </RadioGroup>

      {(error || success) && (
        <div className="animate-fade-in">
          {error && (
            <div
              className={cn(
                "flex items-center gap-2 text-sm text-destructive",
                variant === "card" &&
                  "bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20",
                variant === "glass" &&
                  "glass-card border-destructive/30 px-3 py-2"
              )}
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div
              className={cn(
                "flex items-center gap-2 text-sm text-green-600",
                variant === "card" &&
                  "bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20",
                variant === "glass" &&
                  "glass-card border-green-500/30 px-3 py-2"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LabelRadio;
