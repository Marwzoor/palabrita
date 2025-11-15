
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`
        w-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold py-3 px-6 rounded-lg
        shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-slate-300 dark:focus:ring-offset-slate-900
        transition-all duration-200 ease-in-out transform active:scale-95
        disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
