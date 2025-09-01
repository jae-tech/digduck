import React from "react";

interface DigDuckIconProps {
  className?: string;
  size?: number;
}

export const DigDuckIcon: React.FC<DigDuckIconProps> = ({
  className = "",
  size = 24,
}) => {
  return (
    <img
      src="/dig-duck-logo.svg"
      alt="Dig Duck"
      width={size}
      height={size}
      className={className}
    />
  );
};
