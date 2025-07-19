// src/components/ui/button.tsx

import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'default' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = "py-2 px-4 rounded font-medium transition-colors duration-200";

  const variantClasses = {
    default: "bg-[#0F1969] hover:bg-[#0F1969] text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;