export type ButtonVariant = 'primary' | 'glass' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  children: React.ReactNode;
}

const HEIGHTS: Record<ButtonSize, string> = {
  sm: 'var(--control-sm)',
  md: 'var(--control-md)',
  lg: 'var(--control-lg)',
};

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--ut-blue-600)',
    color: 'var(--text-on-brand)',
    border: '1px solid transparent',
  },
  glass: {
    background: 'var(--glass-regular)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(var(--glass-blur-md)) saturate(var(--glass-saturate))',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)',
  },
};

export function Button({ variant = 'primary', size = 'md', block, type = 'button', onClick, children }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        ...VARIANT_STYLES[variant],
        height: HEIGHTS[size],
        width: block ? '100%' : undefined,
        borderRadius: 'var(--radius-pill)',
        padding: '0 20px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--weight-semibold)',
        fontSize: 'var(--text-sm)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
