import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { CertificateSummary } from '@/lib/search';

export function CertificateCard({ certificate }: { certificate: CertificateSummary }) {
  const ready = certificate.status === 'siap';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '18px 20px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--glass-regular)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'var(--weight-semibold)' }}>{certificate.kegiatanNama}</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 5, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{certificate.nomor}</span>
          <span>Terbit {certificate.tanggalTerbit}</span>
          <span>{certificate.jumlahJp} JP</span>
        </div>
      </div>
      <Badge variant={ready ? 'success' : 'warning'}>{ready ? 'Siap' : 'Diproses'}</Badge>
      {ready ? (
        <Link href={`/pratinjau/${certificate.id}`}>
          <Button variant="glass" size="sm">Lihat</Button>
        </Link>
      ) : (
        <Button variant="ghost" size="sm">Sedang diproses</Button>
      )}
    </div>
  );
}
