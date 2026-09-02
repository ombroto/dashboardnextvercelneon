import { SearchForm } from '@/components/search/SearchForm';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 660, margin: '60px auto 0' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', textAlign: 'center' }}>
          Cari sertifikat Anda
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Masukkan NIK atau nama lengkap sesuai data pendaftaran.
        </p>
        <SearchForm error={error} />
      </div>
    </main>
  );
}
