import { StatsCards } from '@/components/admin/StatsCards';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { UploadTab } from '@/components/admin/UploadTab';
import { PenerimaTable } from '@/components/admin/PenerimaTable';
import { LogTab } from '@/components/admin/LogTab';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab = 'unggah', q } = await searchParams;

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Kelola Sertifikat</h2>
        <StatsCards />
        <AdminTabs current={tab} />
        {tab === 'unggah' && <UploadTab />}
        {tab === 'penerima' && <PenerimaTable q={q} />}
        {tab === 'log' && <LogTab />}
      </div>
    </main>
  );
}
