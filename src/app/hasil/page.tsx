import Link from 'next/link';
import { searchByName } from '@/lib/search';
import { maskNik } from '@/lib/nik';
import { redirect } from 'next/navigation';
import { CertificateCard } from '@/components/search/CertificateCard';

export default async function HasilByNamePage({
  searchParams,
}: {
  searchParams: Promise<{ nama?: string }>;
}) {
  const { nama } = await searchParams;
  if (!nama) redirect('/');

  const people = await searchByName(nama);

  if (people.length === 0) {
    redirect('/?error=' + encodeURIComponent('Tidak ditemukan sertifikat untuk pencarian tersebut.'));
  }

  if (people.length === 1) {
    redirect(`/hasil/${people[0].nik}`);
  }

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 600, margin: '40px auto 0' }}>
        <h2>Beberapa orang cocok dengan pencarian ini — pilih salah satu:</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {people.map((p) => (
            <Link
              key={p.nik}
              href={`/hasil/${p.nik}`}
              style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'var(--glass-thin)', border: '1px solid var(--glass-border)' }}
            >
              {p.nama} — <span style={{ fontFamily: 'var(--font-mono)' }}>{maskNik(p.nik)}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
