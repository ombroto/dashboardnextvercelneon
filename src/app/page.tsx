import { SearchForm } from '@/components/search/SearchForm';
import { Icon } from '@/components/ui/Icon';

const FEATURES = [
  {
    icon: 'id-card',
    color: 'var(--ut-blue-600)',
    title: 'Satu Kunci Pencarian',
    body: 'NIK memberi hasil paling tepat; nama boleh sebagian.',
  },
  {
    icon: 'file-check-2',
    color: 'var(--ut-green)',
    title: 'Berkas Resmi',
    body: 'PDF bertanda tangan elektronik, siap dicetak A4 lanskap.',
  },
  {
    icon: 'life-buoy',
    color: 'var(--ut-orange)',
    title: 'Data Tidak Ditemukan?',
    body: (
      <>
        Hubungi sekretariat diklat di <a href="mailto:diklat@bpip.go.id">diklat@bpip.go.id</a>.
      </>
    ),
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 720, margin: '34px auto 0', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px 6px 10px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--glass-thin)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-edge-top)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--ut-blue-700)',
            backdropFilter: 'blur(14px) saturate(180%)',
          }}
        >
          <Icon name="shield-check" size={15} />
          Verifikasi &amp; unduh sertifikat resmi
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1.08, letterSpacing: '-0.028em', fontWeight: 'var(--weight-bold)', margin: '18px 0 10px' }}>
          Cari sertifikat Anda
        </h1>
        <p style={{ margin: '0 auto', maxWidth: 520, fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Masukkan NIK atau nama lengkap sesuai data pendaftaran. Sertifikat yang tersedia akan langsung dapat diunduh dalam format PDF.
        </p>
      </div>

      <SearchForm error={error} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, maxWidth: 920, margin: '34px auto 0' }}>
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              padding: '18px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--glass-thin)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-xs), var(--glass-edge-top)',
              backdropFilter: 'blur(16px) saturate(180%)',
            }}
          >
            <div style={{ color: f.color, marginBottom: 8 }}>
              <Icon name={f.icon} size={22} />
            </div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', marginBottom: 3 }}>{f.title}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.body}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
