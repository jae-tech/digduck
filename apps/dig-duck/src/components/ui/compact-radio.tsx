import React from "react";

interface CompactRadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface CompactRadioProps {
  value: string;
  onChange: (value: string) => void;
  options: CompactRadioOption[];
  name: string;
  size?: "sm" | "md" | "lg";
  variant?: "pills" | "cards" | "buttons";
}

export const CompactRadio: React.FC<CompactRadioProps> = ({
  value,
  onChange,
  options,
  name,
  size = "md",
  variant = "pills",
}) => {
  const sizeClasses = {
    sm: "p-2 text-xs",
    md: "p-3 text-sm", 
    lg: "p-4 text-base",
  };

  const baseClass = sizeClasses[size];

  if (variant === "pills") {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer transition-all duration-200 ${
              value === option.value ? "scale-105" : "hover:scale-102"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <div className={`${baseClass} rounded-full border-2 text-center transition-all duration-200 whitespace-nowrap ${
              value === option.value
                ? "border-blue-500 bg-blue-500 text-white shadow-md"
                : "border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50"
            }`}>
              <div className="flex items-center space-x-2">
                {option.icon}
                <span className="font-medium">{option.label}</span>
              </div>
            </div>
          </label>
        ))}
      </div>
    );
  }

  if (variant === "buttons") {
    return (
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex-1 cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <div className={`${baseClass} rounded-md text-center transition-all duration-200 ${
              value === option.value
                ? "bg-white shadow-sm text-blue-600 font-semibold"
                : "text-gray-600 hover:text-gray-800"
            }`}>
              {option.icon && (
                <div className="flex items-center justify-center space-x-1">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              )}
              {!option.icon && option.label}
              {option.description && (
                <div className="text-xs opacity-70 mt-1">{option.description}</div>
              )}
            </div>
          </label>
        ))}
      </div>
    );
  }

  // Default: cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={`cursor-pointer transition-all duration-200 ${
            value === option.value ? "scale-105" : "hover:scale-102"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <div className={`${baseClass} rounded-xl border-2 text-center transition-all duration-200 ${
            value === option.value
              ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md"
              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
          }`}>
            {option.icon && (
              <div className="flex justify-center mb-2">
                {option.icon}
              </div>
            )}
            <div className={`font-semibold ${
              value === option.value ? "text-blue-900" : "text-gray-700"
            }`}>
              {option.label}
            </div>
            {option.description && (
              <div className={`text-xs mt-1 ${
                value === option.value ? "text-blue-600" : "text-gray-500"
              }`}>
                {option.description}
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
};

export default CompactRadio;