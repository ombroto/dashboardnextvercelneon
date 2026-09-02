import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { unduhanLog, sertifikat } from '@/db/schema';
import { Button } from '@/components/ui/Button';

export async function LogTab() {
  const rows = await db
    .select({ waktu: unduhanLog.waktu, nama: sertifikat.nama, ip: unduhanLog.ip })
    .from(unduhanLog)
    .innerJoin(sertifikat, eq(unduhanLog.sertifikatId, sertifikat.id))
    .orderBy(desc(unduhanLog.waktu))
    .limit(200);

  return (
    <div style={{ marginTop: 18, borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontWeight: 'var(--weight-semibold)' }}>Log Unduhan</div>
        <a href="/api/admin/log/export">
          <Button variant="glass" size="sm">Ekspor CSV</Button>
        </a>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '13px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 'var(--text-xs)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', width: 180 }}>{r.waktu.toISOString()}</span>
          <span style={{ flex: 1 }}>{r.nama}</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{r.ip}</span>
        </div>
      ))}
    </div>
  );
}
