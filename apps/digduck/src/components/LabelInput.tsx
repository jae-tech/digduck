import React from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface LabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string | null;
  success?: string | null;
  required?: boolean;
  variant?: "default" | "floating" | "glass";
  showValidation?: boolean;
}

const LabelInput: React.FC<LabelInputProps> = ({
  id,
  label,
  required = false,
  error,
  success,
  variant = "default",
  showValidation = true,
  className,
  ...props
}) => {
  const [focused, setFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(
    !!props.value || !!props.defaultValue
  );

  const handleFocus = () => setFocused(true);
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    setHasValue(!!e.target.value);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  if (variant === "floating") {
    return (
      <div className="relative w-full">
        <Input
          id={id}
          placeholder=" "
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={cn(
            "peer h-12 pt-4 pb-2 transition-all duration-200",
            "bg-background/50 backdrop-blur-sm border-border/50",
            "focus:border-primary/50 focus:bg-background/80",
            error && "border-destructive focus:border-destructive",
            success && "border-green-500 focus:border-green-500",
            className
          )}
          {...props}
        />
        <Label
          htmlFor={id}
          className={cn(
            "absolute left-3 transition-all duration-200 pointer-events-none",
            "text-muted-foreground peer-placeholder-shown:text-base peer-placeholder-shown:top-3.5",
            "peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-primary",
            (focused || hasValue || props.value) &&
              "top-1.5 text-xs text-primary",
            error && "text-destructive",
            success && "text-green-600"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>

        {showValidation && (error || success) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {error && <AlertCircle className="h-4 w-4 text-destructive" />}
            {success && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>
        )}

        {(error || success) && (
          <div className="mt-2 animate-fade-in">
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                {success}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === "glass") {
    return (
      <div className="space-y-2 w-full">
        <Label
          htmlFor={id}
          className="text-sm font-medium text-foreground/90 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>

        <div className="relative">
          <Input
            id={id}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={cn(
              "h-11 transition-all duration-200",
              "glass-card bg-background/30 backdrop-blur-md border-white/20",
              "focus:bg-background/50 focus:border-primary/40 focus:shadow-glow-blue",
              "placeholder:text-muted-foreground/60",
              error &&
                "border-destructive/50 focus:border-destructive focus:shadow-glow-red",
              success &&
                "border-green-500/50 focus:border-green-500 focus:shadow-glow-green",
              showValidation && (error || success) && "pr-10",
              className
            )}
            {...props}
          />

          {showValidation && (error || success) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {error && (
                <AlertCircle className="h-4 w-4 text-destructive animate-pulse" />
              )}
              {success && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>
          )}
        </div>

        {(error || success) && (
          <div className="animate-slide-up">
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5 bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 flex items-center gap-1.5 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                {success}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="space-y-2 w-full">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-foreground flex items-center gap-1"
      >
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>

      <div className="relative">
        <Input
          id={id}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={cn(
            "h-11 transition-all duration-200",
            "border-border bg-background",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            error &&
              "border-destructive focus:border-destructive focus:ring-destructive/20",
            success &&
              "border-green-500 focus:border-green-500 focus:ring-green-500/20",
            showValidation && (error || success) && "pr-10",
            className
          )}
          {...props}
        />

        {showValidation && (error || success) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {error && <AlertCircle className="h-4 w-4 text-destructive" />}
            {success && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>
        )}
      </div>

      {(error || success) && (
        <div className="animate-fade-in">
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {success}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LabelInput;
