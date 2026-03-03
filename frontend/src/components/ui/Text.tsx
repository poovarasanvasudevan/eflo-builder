import type { ReactNode } from 'react';

interface TextProps {
  children?: ReactNode;
  strong?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Text({ children, strong, className = '', style }: TextProps) {
  return (
    <span
      className={`text-sm ${strong ? 'font-semibold' : ''} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
