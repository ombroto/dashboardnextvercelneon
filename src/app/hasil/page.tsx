import { searchByName } from '@/lib/search';
import { maskNik } from '@/lib/nik';
import { redirect } from 'next/navigation';
import { CertificateCard } from '@/components/search/CertificateCard';
import { selectPersonAction } from './actions';

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
          {people.map((p, i) => (
            // key is intentionally the loop index, not p.nik: a React server-component
            // key is serialized verbatim into the RSC flight payload embedded in the
            // page's HTML (inline hydration <script>), so using the raw NIK here would
            // leak it into view-source even though it's never rendered as visible text
            // or placed in an href/hidden input. This list is a fixed, non-reorderable
            // render of a single query's results, so an index key is safe here.
            <form key={i} action={selectPersonAction}>
              <input type="hidden" name="nama" value={nama} />
              <input type="hidden" name="index" value={i} />
              <button
                type="submit"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'var(--glass-thin)', border: '1px solid var(--glass-border)', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
              >
                {p.nama} — <span style={{ fontFamily: 'var(--font-mono)' }}>{maskNik(p.nik)}</span>
              </button>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}
