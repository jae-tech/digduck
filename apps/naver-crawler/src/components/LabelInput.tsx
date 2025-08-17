import React from "react";

interface LabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
}

const LabelInput: React.FC<LabelInputProps> = ({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${
          error ? "border-red-500 focus-visible:ring-red-500" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default LabelInput;
