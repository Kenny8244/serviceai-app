import React from 'react';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator: React.FC<SeparatorProps> = ({
  className = '',
  orientation = 'horizontal',
  ...props
}) => {
  const orientationClasses =
    orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full';

  return (
    <div
      role="separator"
      className={`shrink-0 bg-slate-200 dark:bg-slate-700 ${orientationClasses} ${className}`}
      {...props}
    />
  );
};
