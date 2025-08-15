import React from "react";

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
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
  onChange,
  required = false,
  error,
  orientation = "vertical",
  className = "",
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium leading-none">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div
        className={`${orientation === "horizontal" ? "flex flex-wrap gap-6" : "space-y-2"}`}
      >
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="radio"
              id={`${name}-${index}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              disabled={option.disabled}
              className="h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <label
              htmlFor={`${name}-${index}`}
              className={`text-sm font-medium leading-none cursor-pointer ${
                option.disabled
                  ? "cursor-not-allowed opacity-50"
                  : "peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              }`}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default LabelRadio;
