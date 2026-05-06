import React from 'react';

interface WheatStalkProps extends React.SVGProps<SVGSVGElement> {
  tone?: 'neutral' | 'wheat';
  branded?: boolean;
  title?: string;
}

export const WheatStalk: React.FC<WheatStalkProps> = ({
  tone = 'neutral',
  branded = false,
  title = 'Wheat stalk illustration',
  className = '',
  ...props
}) => {
  const isWheat = tone === 'wheat' || branded;
  const strokeColor = isWheat ? 'var(--wheat-500)' : 'currentColor';

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label={title}
      {...props}
    >
      <title>{title}</title>
      <path d="M12 22V10" />
      <path d="M12 14c-2-1.5-3-3.5-3-5s1.5-2.5 3-2.5" />
      <path d="M12 14c2-1.5 3-3.5 3-5s-1.5-2.5-3-2.5" />
      <path d="M12 18c-2.5-1-4-3-4-5" />
      <path d="M12 18c2.5-1 4-3 4-5" />
      <path d="M12 10c-1-1.5-1.5-3-1.5-4.5S11 3.5 12 2" />
      <path d="M12 10c1-1.5 1.5-3 1.5-4.5S13 3.5 12 2" />
    </svg>
  );
};
