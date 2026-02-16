import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id?: string;
}

export function Input({ label, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="input-wrap">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} className={`input ${className}`.trim()} {...props} />
    </div>
  );
}
