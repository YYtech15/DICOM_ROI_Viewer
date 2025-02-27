import React from 'react';

interface SkipLinkProps {
  targetId: string;
  label?: string;
}

export default function SkipLink({ targetId, label = 'Skip to main content' }: SkipLinkProps) {
  return (
    
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-primary-600 focus:outline-primary-500"
    >
      {label}
    </a>
  );
}