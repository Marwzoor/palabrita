
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`
        w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg 
        shadow-sm hover:bg-indigo-700 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
        transition-all duration-200 ease-in-out transform active:scale-95
        disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
