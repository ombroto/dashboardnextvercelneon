import { Icon } from './Icon';

export interface TabItem {
  key: string;
  label: string;
  icon?: string;
  badge?: number;
}

export function Tabs({ items, value, onChange }: { items: TabItem[]; value: string; onChange: (key: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 'var(--radius-pill)', background: 'rgba(11,22,38,0.05)' }}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 18px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              background: active ? '#fff' : 'transparent',
              color: active ? 'var(--ut-blue-700)' : 'var(--ink-500)',
              boxShadow: active ? 'var(--shadow-xs)' : 'none',
            }}
          >
            {item.icon && <Icon name={item.icon} size={15} />}
            {item.label}
            {typeof item.badge === 'number' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  borderRadius: 'var(--radius-pill)',
                  background: active ? 'rgba(0,74,147,0.12)' : 'rgba(11,22,38,0.08)',
                  color: active ? 'var(--ut-blue-700)' : 'var(--ink-500)',
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 700,
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
