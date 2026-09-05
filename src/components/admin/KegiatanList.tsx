import Link from 'next/link';
import { listKegiatan } from '@/lib/kegiatan';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export async function KegiatanList() {
  const items = await listKegiatan();

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Link href="/admin/kegiatan/baru">
          <Button variant="primary">Kegiatan Baru</Button>
        </Link>
      </div>
      <div style={{ borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 11 }}>Nama Kegiatan</th>
              <th style={{ textAlign: 'left', padding: 11 }}>Tahun</th>
              <th style={{ textAlign: 'left', padding: 11 }}>Segmen</th>
              <th style={{ textAlign: 'left', padding: 11 }}>Tanggal</th>
              <th style={{ textAlign: 'right', padding: 11 }}>Peserta</th>
              <th style={{ textAlign: 'right', padding: 11 }}>Lulus</th>
              <th style={{ textAlign: 'right', padding: 11 }}>Tidak Lulus</th>
            </tr>
          </thead>
          <tbody>
            {items.map((k) => (
              <tr key={k.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 11 }}>
                  <Link href={`/admin/kegiatan/${k.id}`} style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}>
                    {k.nama}
                  </Link>
                </td>
                <td style={{ padding: 11 }}>{k.tahun ?? '-'}</td>
                <td style={{ padding: 11 }}>{k.segmen ?? '-'}</td>
                <td style={{ padding: 11, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                  {k.tanggalMulai && k.tanggalSelesai ? `${k.tanggalMulai} – ${k.tanggalSelesai}` : '-'}
                </td>
                <td style={{ padding: 11, textAlign: 'right' }}>{k.totalPeserta}</td>
                <td style={{ padding: 11, textAlign: 'right' }}>
                  <Badge variant="success">{k.jumlahLulus}</Badge>
                </td>
                <td style={{ padding: 11, textAlign: 'right' }}>
                  <Badge variant="warning">{k.totalPeserta - k.jumlahLulus}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div style={{ padding: 38, textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            Belum ada kegiatan. Klik &quot;Kegiatan Baru&quot; untuk memulai.
          </div>
        )}
      </div>
    </div>
  );
}
