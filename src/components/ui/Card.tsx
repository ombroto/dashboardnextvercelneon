export function Card({ title, children }: { variant?: 'glass'; title?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 'var(--radius-xl)',
        background: 'var(--glass-regular)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-sm), var(--glass-edge-top)',
        backdropFilter: 'blur(var(--glass-blur-md)) saturate(var(--glass-saturate))',
      }}
    >
      {title && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 8 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
