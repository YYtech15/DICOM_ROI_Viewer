import React, { ReactNode } from 'react';

type ColumnProps = {
  children: ReactNode;
  className?: string;
  width?: 'auto' | 'full' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4';
};

const Column = ({ children, className = '', width = 'full' }: ColumnProps) => {
  const widthClasses = {
    'auto': 'w-auto',
    'full': 'w-full',
    '1/2': 'sm:w-1/2',
    '1/3': 'sm:w-1/3',
    '2/3': 'sm:w-2/3',
    '1/4': 'sm:w-1/4',
    '3/4': 'sm:w-3/4',
  };

  return (
    <div className={`px-2 mb-4 w-full ${widthClasses[width]} ${className}`}>
      {children}
    </div>
  );
};

type GridProps = {
  children: ReactNode;
  className?: string;
  columns?: number;
  gap?: 'none' | 'small' | 'medium' | 'large';
};

export default function ResponsiveGrid({
  children,
  className = '',
  columns = 0, // 0 means auto columns based on child widths
  gap = 'medium',
}: GridProps) {
  const gapClasses = {
    'none': '',
    'small': 'gap-2',
    'medium': 'gap-4',
    'large': 'gap-6',
  };

  const columnClasses = columns > 0 
    ? `grid-cols-1 ${
        columns >= 2 ? 'sm:grid-cols-2' : ''
      } ${
        columns >= 3 ? 'md:grid-cols-3' : ''
      } ${
        columns >= 4 ? 'lg:grid-cols-4' : ''
      }`
    : '';

  return (
    <div className={`grid ${columnClasses} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

// Column コンポーネントをエクスポート
ResponsiveGrid.Column = Column;