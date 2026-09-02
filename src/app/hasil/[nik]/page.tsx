import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { searchByNik } from '@/lib/search';
import { maskNik } from '@/lib/nik';
import { CertificateCard } from '@/components/search/CertificateCard';

// This page renders a real participant's name and certificates — it has no
// business value being crawled/indexed, and shouldn't show up in search
// results for someone's own name.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function HasilPage({ params }: { params: Promise<{ nik: string }> }) {
  const { nik } = await params;
  const person = await searchByNik(nik);

  if (!person) {
    redirect('/?error=' + encodeURIComponent('Data sertifikat tidak ditemukan. Periksa kembali NIK yang dimasukkan.'));
  }

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ padding: '22px 24px', borderRadius: 'var(--radius-xl)', background: 'var(--ut-blue-700)', color: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>{person.nama}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>NIK {maskNik(person.nik)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {person.certificates.map((c) => (
            <CertificateCard key={c.id} certificate={c} />
          ))}
        </div>
      </div>
    </main>
  );
}
