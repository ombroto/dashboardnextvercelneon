import { Icon } from '@/components/ui/Icon';

export function StatsCards({
  siapCount,
  belumCount,
  unduhanCount,
}: {
  siapCount: number;
  belumCount: number;
  unduhanCount: number;
}) {
  const stats = [
    { label: 'Total Peserta', value: siapCount + belumCount, icon: 'users', color: 'var(--ut-blue-600)' },
    { label: 'Sertifikat Siap', value: siapCount, icon: 'file-check-2', color: 'var(--ut-green)' },
    { label: 'Tidak Lulus', value: belumCount, icon: 'triangle-alert', color: 'var(--ut-orange)' },
    { label: 'Total Unduhan', value: unduhanCount, icon: 'download', color: 'var(--ut-cyan)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            padding: '16px 18px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--glass-regular)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-xs), var(--glass-edge-top)',
            backdropFilter: 'blur(18px) saturate(180%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            <span style={{ color: s.color, display: 'flex' }}>
              <Icon name={s.icon} size={15} />
            </span>
            {s.label}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 29, fontWeight: 'var(--weight-bold)', letterSpacing: '-0.03em', lineHeight: 1.2, marginTop: 5 }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
