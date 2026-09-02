import { Icon } from './Icon';
import type { ButtonSize, ButtonVariant } from './Button';

export interface IconButtonProps {
  icon: string;
  label: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  type?: 'button' | 'submit';
  onClick?: () => void;
}

export function IconButton({ icon, label, size = 'md', variant = 'ghost', type = 'button', onClick }: IconButtonProps) {
  const dimension = size === 'sm' ? 32 : size === 'lg' ? 50 : 40;
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: '50%',
        border: variant === 'glass' ? '1px solid var(--glass-border)' : '1px solid transparent',
        background: variant === 'glass' ? 'var(--glass-thin)' : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--ink-600)',
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
