import wilayahData from '@/data/wilayah-indonesia.json';
import { KegiatanForm } from '@/components/admin/KegiatanForm';

export default function KegiatanBaruPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 18px' }}>Kegiatan Baru</h2>
        <KegiatanForm wilayah={wilayahData as Record<string, string[]>} />
      </div>
    </main>
  );
}
