import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[var(--color-accent)] text-[var(--color-on-accent)] active:opacity-80 disabled:opacity-40',
  secondary: 'bg-[var(--color-surface-raised)] text-[var(--color-text)] border border-[var(--color-border)] active:opacity-70',
  ghost: 'bg-transparent text-[var(--color-text)] active:bg-[var(--color-border)]/40',
  danger: 'bg-transparent text-red-500 active:bg-red-500/10',
};

const sizeClasses: Record<Size, string> = {
  md: 'h-11 px-5 text-[15px] rounded-2xl',
  lg: 'h-14 px-6 text-[17px] rounded-2xl',
  icon: 'h-11 w-11 rounded-full',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition-transform active:scale-[0.97] select-none disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
