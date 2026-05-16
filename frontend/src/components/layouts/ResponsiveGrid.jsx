import React from 'react';

/**
 * ResponsiveGrid - A mobile-first grid layout component
 * 
 * Breakpoints:
 * - Mobile: Single column (default)
 * - sm (640px): Optional 2 columns
 * - md (768px): Optional 2-3 columns
 * - lg (1024px): Optional 3-4 columns
 * - xl (1280px): Optional 4-6 columns
 */
const ResponsiveGrid = ({ 
  children, 
  cols = {
    base: 1,    // Mobile: 1 column
    sm: 1,      // Small: 1-2 columns
    md: 2,      // Medium: 2-3 columns
    lg: 3,      // Large: 3-4 columns
    xl: 3       // Extra large: 3-6 columns
  },
  gap = 'gap-4 sm:gap-6',
  className = ''
}) => {
  const gridCols = `
    grid-cols-${cols.base}
    ${cols.sm ? `sm:grid-cols-${cols.sm}` : ''}
    ${cols.md ? `md:grid-cols-${cols.md}` : ''}
    ${cols.lg ? `lg:grid-cols-${cols.lg}` : ''}
    ${cols.xl ? `xl:grid-cols-${cols.xl}` : ''}
  `;

  return (
    <div className={`grid ${gridCols} ${gap} ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
