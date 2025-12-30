import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  // Editorial UI: Rectangular, 6px radius, thin borders, specific colors.
  
  const baseStyles = "px-6 py-3 rounded-[6px] font-editorial font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed tracking-wide text-sm";
  
  const variants = {
    primary: "bg-[#0E9B62] text-white hover:bg-[#0C8554] border border-transparent",
    secondary: "bg-transparent text-[#E5ECEA] border border-[#123C33] hover:border-[#0E9B62] hover:text-white",
    ghost: "text-[#A5B5AF] hover:text-[#E5ECEA] hover:bg-[#123C33]/30"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          PROCESSING...
        </>
      ) : children}
    </button>
  );
};
