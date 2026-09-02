import { count, eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat, unduhanLog } from '@/db/schema';

export async function StatsCards() {
  const [[kegiatanCount], [siapCount], [belumCount], [unduhanCount]] = await Promise.all([
    db.select({ value: count() }).from(kegiatan),
    db.select({ value: count() }).from(sertifikat).where(eq(sertifikat.status, 'siap')),
    db.select({ value: count() }).from(sertifikat).where(eq(sertifikat.status, 'belum')),
    db.select({ value: count() }).from(unduhanLog),
  ]);

  const stats = [
    { label: 'Kegiatan', value: kegiatanCount.value },
    { label: 'Sertifikat Siap', value: siapCount.value },
    { label: 'Belum Diproses', value: belumCount.value },
    { label: 'Total Unduhan', value: unduhanCount.value },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
      {stats.map((s) => (
        <div key={s.label} style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{s.label}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
