import { count, eq } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat, unduhanLog } from '@/db/schema';
import { Icon } from '@/components/ui/Icon';

export async function StatsCards() {
  const [[siapCount], [belumCount], [unduhanCount]] = await Promise.all([
    db.select({ value: count() }).from(sertifikat).where(eq(sertifikat.status, 'siap')),
    db.select({ value: count() }).from(sertifikat).where(eq(sertifikat.status, 'belum')),
    db.select({ value: count() }).from(unduhanLog),
  ]);

  const stats = [
    { label: 'Total Penerima', value: siapCount.value + belumCount.value, icon: 'users', color: 'var(--ut-blue-600)' },
    { label: 'Sertifikat Siap', value: siapCount.value, icon: 'file-check-2', color: 'var(--ut-green)' },
    { label: 'Belum Cocok', value: belumCount.value, icon: 'triangle-alert', color: 'var(--ut-orange)' },
    { label: 'Total Unduhan', value: unduhanCount.value, icon: 'download', color: 'var(--ut-cyan)' },
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
