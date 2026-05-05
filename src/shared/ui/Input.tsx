import { InputHTMLAttributes, forwardRef } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { className = '', ...rest } = props;
  const baseClasses =
    'block w-full rounded-md border border-strong bg-primary px-3 py-2 text-sm shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500 text-primary';
  const mergedClassName = className
    ? `${baseClasses} ${className}`
    : baseClasses;

  return <input ref={ref} className={mergedClassName} {...rest} />;
});

Input.displayName = 'Input';

export default Input;
