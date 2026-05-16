import React, { useTheme } from 'react';

/**
 * ResponsiveCard - A mobile-first card component
 * 
 * Features:
 * - Responsive padding (smaller on mobile)
 * - Optional hover effects
 * - Consistent theming
 * - Flexible layout
 */
const ResponsiveCard = ({ 
  children, 
  className = '',
  noPadding = false,
  hover = false,
  onClick
}) => {
  const { theme } = useTheme();

  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg border
        ${theme === 'dark' 
          ? 'bg-[#1c2027] border-[#282f39]' 
          : 'bg-white border-gray-200'
        }
        ${noPadding ? '' : 'p-4 sm:p-6'}
        ${hover ? (theme === 'dark' ? 'hover:border-[#4b5563]' : 'hover:border-gray-300') + ' transition-colors' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default ResponsiveCard;
