import { count, eq } from 'drizzle-orm';
import { StatsCards } from '@/components/admin/StatsCards';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { KegiatanList } from '@/components/admin/KegiatanList';
import { PesertaTable } from '@/components/admin/PesertaTable';
import { LogTab } from '@/components/admin/LogTab';
import { db } from '@/db';
import { sertifikat, unduhanLog } from '@/db/schema';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; status?: 'siap' | 'belum'; sort?: 'nama' | 'nik' | 'tanggal'; dir?: 'asc' | 'desc' }>;
}) {
  const { tab = 'kegiatan', q, status, sort, dir } = await searchParams;
  const [[siapCount], [belumCount], [unduhanCount]] = await Promise.all([
    db.select({ value: count() }).from(sertifikat).where(eq(sertifikat.status, 'siap')),
    db.select({ value: count() }).from(sertifikat).where(eq(sertifikat.status, 'belum')),
    db.select({ value: count() }).from(unduhanLog),
  ]);
  const pesertaCount = siapCount.value + belumCount.value;

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Kelola Sertifikat</h2>
          <p style={{ margin: '3px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Diklat BPIP RI · Sekretariat Diklat</p>
        </div>
        <StatsCards siapCount={siapCount.value} belumCount={belumCount.value} unduhanCount={unduhanCount.value} />
        <AdminTabs current={tab} pesertaCount={pesertaCount} />
        {tab === 'kegiatan' && <KegiatanList />}
        {tab === 'peserta' && <PesertaTable q={q} status={status} sort={sort} dir={dir} />}
        {tab === 'log' && <LogTab />}
      </div>
    </main>
  );
}
