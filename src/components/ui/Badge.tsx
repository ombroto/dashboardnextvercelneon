export type BadgeVariant = 'success' | 'warning' | 'neutral';

const VARIANT_COLORS: Record<BadgeVariant, string> = {
  success: 'var(--ut-green)',
  warning: 'var(--ut-orange)',
  neutral: 'var(--ink-500)',
};

export function Badge({ variant = 'neutral', children }: { variant?: BadgeVariant; size?: 'sm'; children: React.ReactNode }) {
  const color = VARIANT_COLORS[variant];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 'var(--weight-semibold)',
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}
