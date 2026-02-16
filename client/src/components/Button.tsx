import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button type="button" className={`btn ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
