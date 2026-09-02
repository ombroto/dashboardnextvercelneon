import { getAllSertifikat } from '@/lib/search';
import { maskNik } from '@/lib/nik';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { deleteSertifikatAction } from '@/app/admin/actions';

export async function PenerimaTable({ q }: { q?: string }) {
  const rows = await getAllSertifikat({ q });

  return (
    <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: 11 }}>Nama</th>
          <th style={{ textAlign: 'left', padding: 11 }}>NIK</th>
          <th style={{ textAlign: 'left', padding: 11 }}>Kegiatan</th>
          <th style={{ textAlign: 'left', padding: 11 }}>Status</th>
          <th style={{ padding: 11 }}></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <td style={{ padding: 11 }}>{r.nama}</td>
            <td style={{ padding: 11, fontFamily: 'var(--font-mono)' }}>{maskNik(r.nik)}</td>
            <td style={{ padding: 11 }}>{r.kegiatanNama}</td>
            <td style={{ padding: 11 }}>
              <Badge variant={r.status === 'siap' ? 'success' : 'warning'}>{r.status === 'siap' ? 'Siap' : 'Belum'}</Badge>
            </td>
            <td style={{ padding: 11 }}>
              <form action={deleteSertifikatAction}>
                <input type="hidden" name="id" value={r.id} />
                <IconButton icon="trash-2" label="Hapus berkas" type="submit" />
              </form>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
