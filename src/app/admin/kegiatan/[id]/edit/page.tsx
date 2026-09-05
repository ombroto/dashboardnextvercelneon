import { notFound } from 'next/navigation';
import wilayahData from '@/data/wilayah-indonesia.json';
import { getKegiatanById } from '@/lib/kegiatan';
import { KegiatanForm, type KegiatanFormInitial } from '@/components/admin/KegiatanForm';

export default async function KegiatanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kegiatanId = Number(id);
  const kegiatan = await getKegiatanById(kegiatanId);
  if (!kegiatan) notFound();

  const initial: KegiatanFormInitial = {
    nama: kegiatan.nama,
    tahun: kegiatan.tahun ?? new Date().getFullYear(),
    segmen: kegiatan.segmen ?? '',
    tanggalMulai: kegiatan.tanggalMulai ?? '',
    tanggalSelesai: kegiatan.tanggalSelesai ?? '',
    jumlahJp: kegiatan.jumlahJp,
    provinsi: kegiatan.provinsi ?? '',
    kabupatenKota: kegiatan.kabupatenKota ?? '',
    modePenyelenggaraan: kegiatan.modePenyelenggaraan ?? '',
    logoUrl: kegiatan.logoUrl,
  };

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 18px' }}>Edit Kegiatan</h2>
        <KegiatanForm wilayah={wilayahData as Record<string, string[]>} kegiatanId={kegiatanId} initial={initial} />
      </div>
    </main>
  );
}
