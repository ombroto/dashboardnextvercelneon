import { useId } from 'react';
import { Icon } from './Icon';

export interface InputProps {
  label?: string;
  icon?: string;
  size?: 'md' | 'lg';
  type?: 'text' | 'password' | 'email';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function Input({ label, icon, size = 'md', type = 'text', placeholder, value, onChange, onKeyDown }: InputProps) {
  const id = useId();
  const height = size === 'lg' ? 'var(--control-lg)' : 'var(--control-md)';

  return (
    <div>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height, padding: '0 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.7)' }}>
        {icon && <Icon name={icon} size={16} />}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--text-base)', fontFamily: 'inherit' }}
        />
      </div>
    </div>
  );
}
