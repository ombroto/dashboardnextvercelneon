import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getKegiatanById, listPesertaByKegiatan } from '@/lib/kegiatan';
import { KegiatanCsvUploadCard } from '@/components/admin/KegiatanCsvUploadCard';
import { KegiatanZipUploadCard } from '@/components/admin/KegiatanZipUploadCard';
import { Badge } from '@/components/ui/Badge';

export default async function KegiatanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kegiatanId = Number(id);
  const kegiatan = await getKegiatanById(kegiatanId);
  if (!kegiatan) notFound();

  const pesertaOptions = await listPesertaByKegiatan(kegiatanId);

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <Link
          href="/admin"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--ut-blue-700)', textDecoration: 'none' }}
        >
          ← Kembali ke Kelola Sertifikat
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          {kegiatan.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kegiatan.logoUrl} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          )}
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>{kegiatan.nama}</h2>
            <p style={{ margin: '3px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {kegiatan.tahun} · {kegiatan.segmen} · {kegiatan.totalPeserta} peserta ·{' '}
              <Badge variant="success">{kegiatan.jumlahLulus} lulus</Badge> <Badge variant="warning">{kegiatan.jumlahTidakLulus} tidak lulus</Badge>
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <KegiatanCsvUploadCard kegiatanId={kegiatanId} />
          <KegiatanZipUploadCard kegiatanId={kegiatanId} pesertaOptions={pesertaOptions} />
        </div>
      </div>
    </main>
  );
}
