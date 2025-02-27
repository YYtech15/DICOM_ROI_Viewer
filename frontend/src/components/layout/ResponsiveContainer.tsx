import React, { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  fullHeight?: boolean;
}

export default function ResponsiveContainer({
  children,
  className = '',
  fullHeight = false,
}: ResponsiveContainerProps) {
  return (
    <div 
      className={`
        w-full px-4 sm:px-6 md:px-8 
        ${fullHeight ? 'min-h-screen flex flex-col' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  );
}