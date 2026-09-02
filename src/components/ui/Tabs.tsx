export interface TabItem {
  key: string;
  label: string;
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
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
