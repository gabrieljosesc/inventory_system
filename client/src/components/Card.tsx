import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`.trim()}>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
}
