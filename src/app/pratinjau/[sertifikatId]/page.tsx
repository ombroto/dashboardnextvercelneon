import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCertificateById } from '@/lib/search';
import { maskNik } from '@/lib/nik';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PratinjauPage({ params }: { params: Promise<{ sertifikatId: string }> }) {
  const { sertifikatId } = await params;
  const certificate = await getCertificateById(Number(sertifikatId));

  if (!certificate || certificate.status !== 'siap' || !certificate.fileUrl) {
    notFound();
  }

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)' }}>
          <iframe src={certificate.fileUrl} title="Sertifikat" style={{ width: '100%', height: 700, border: 'none' }} />
        </div>
        <Card title="Rincian Sertifikat">
          <dl style={{ fontSize: 'var(--text-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <dt style={{ color: 'var(--text-tertiary)' }}>Nama</dt>
              <dd>{certificate.nama}</dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <dt style={{ color: 'var(--text-tertiary)' }}>NIK</dt>
              <dd style={{ fontFamily: 'var(--font-mono)' }}>{maskNik(certificate.nik)}</dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0' }}>
              <dt style={{ color: 'var(--text-tertiary)' }}>Kegiatan</dt>
              <dd>{certificate.kegiatanNama}</dd>
            </div>
          </dl>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
            <a href={`/sertifikat/${certificate.id}/download`}>
              <Button variant="primary" block>Unduh PDF</Button>
            </a>
          </div>
        </Card>
      </div>
    </main>
  );
}
