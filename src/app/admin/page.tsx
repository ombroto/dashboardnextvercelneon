import { StatsCards } from '@/components/admin/StatsCards';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { KegiatanList } from '@/components/admin/KegiatanList';
import { PesertaTable } from '@/components/admin/PesertaTable';
import { LogTab } from '@/components/admin/LogTab';
import { Button } from '@/components/ui/Button';
import { logoutAction } from '@/app/admin/actions';
import { countAllSertifikat } from '@/lib/search';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; status?: 'siap' | 'belum'; sort?: 'nama' | 'nik' | 'tanggal'; dir?: 'asc' | 'desc' }>;
}) {
  const { tab = 'kegiatan', q, status, sort, dir } = await searchParams;
  const pesertaCount = await countAllSertifikat();

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Kelola Sertifikat</h2>
            <p style={{ margin: '3px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Diklat BPIP RI · Sekretariat Diklat</p>
          </div>
          <form action={logoutAction}>
            <Button variant="glass" type="submit">Keluar</Button>
          </form>
        </div>
        <StatsCards />
        <AdminTabs current={tab} pesertaCount={pesertaCount} />
        {tab === 'kegiatan' && <KegiatanList />}
        {tab === 'peserta' && <PesertaTable q={q} status={status} sort={sort} dir={dir} />}
        {tab === 'log' && <LogTab />}
      </div>
    </main>
  );
}
