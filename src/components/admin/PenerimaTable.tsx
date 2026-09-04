import Link from 'next/link';
import { getAllSertifikat, type GetAllSertifikatFilter } from '@/lib/search';
import { maskNik } from '@/lib/nik';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { ReplaceFileButton } from '@/components/admin/ReplaceFileButton';
import { deleteSertifikatAction } from '@/app/admin/actions';

interface PenerimaTableProps {
  q?: string;
  status?: 'siap' | 'belum';
  sort?: 'nama' | 'nik' | 'tanggal';
  dir?: 'asc' | 'desc';
}

function buildHref(params: PenerimaTableProps, overrides: Partial<PenerimaTableProps>): string {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams({ tab: 'penerima' });
  if (merged.q) search.set('q', merged.q);
  if (merged.status) search.set('status', merged.status);
  if (merged.sort) search.set('sort', merged.sort);
  if (merged.dir) search.set('dir', merged.dir);
  return `/admin?${search.toString()}`;
}

function sortHeaderHref(params: PenerimaTableProps, column: 'nama' | 'nik' | 'tanggal'): string {
  const nextDir = params.sort === column && params.dir === 'asc' ? 'desc' : 'asc';
  return buildHref(params, { sort: column, dir: nextDir });
}

function sortIndicator(params: PenerimaTableProps, column: 'nama' | 'nik' | 'tanggal'): string {
  if (params.sort !== column) return '';
  return params.dir === 'desc' ? '↓' : '↑';
}

export async function PenerimaTable(props: PenerimaTableProps) {
  const { q, status, sort, dir } = props;
  const filter: GetAllSertifikatFilter = { q, status, sort, dir };
  const rows = await getAllSertifikat(filter);

  const statusFilters: { label: string; value: 'siap' | 'belum' | undefined }[] = [
    { label: 'Semua', value: undefined },
    { label: 'Siap', value: 'siap' },
    { label: 'Belum', value: 'belum' },
  ];

  return (
    <div style={{ marginTop: 18, borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <form method="get" style={{ width: 290 }}>
          <input type="hidden" name="tab" value="penerima" />
          {status && <input type="hidden" name="status" value={status} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          {dir && <input type="hidden" name="dir" value={dir} />}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Cari nama atau NIK"
            style={{ width: '100%', height: 40, padding: '0 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.7)', fontSize: 'var(--text-sm)' }}
          />
        </form>
        <div style={{ display: 'flex', gap: 5, padding: 4, borderRadius: 'var(--radius-pill)', background: 'rgba(11,22,38,0.05)' }}>
          {statusFilters.map((f) => {
            const active = status === f.value;
            return (
              <Link
                key={f.label}
                href={buildHref(props, { status: f.value })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  textDecoration: 'none',
                  background: active ? '#fff' : 'transparent',
                  color: active ? 'var(--ut-blue-700)' : 'var(--ink-500)',
                }}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <div style={{ flex: 1 }}></div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{rows.length} baris</span>
      </div>
      <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 11 }}>
              <Link href={sortHeaderHref(props, 'nama')} style={{ color: 'inherit', textDecoration: 'none' }}>
                Nama {sortIndicator(props, 'nama')}
              </Link>
            </th>
            <th style={{ textAlign: 'left', padding: 11 }}>
              <Link href={sortHeaderHref(props, 'nik')} style={{ color: 'inherit', textDecoration: 'none' }}>
                NIK {sortIndicator(props, 'nik')}
              </Link>
            </th>
            <th style={{ textAlign: 'left', padding: 11 }}>Kegiatan</th>
            <th style={{ textAlign: 'left', padding: 11 }}>
              <Link href={sortHeaderHref(props, 'tanggal')} style={{ color: 'inherit', textDecoration: 'none' }}>
                Tanggal {sortIndicator(props, 'tanggal')}
              </Link>
            </th>
            <th style={{ textAlign: 'left', padding: 11 }}>Status</th>
            <th style={{ textAlign: 'right', padding: 11 }}>Unduh</th>
            <th style={{ padding: 11 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: 11 }}>{r.nama}</td>
              <td style={{ padding: 11, fontFamily: 'var(--font-mono)' }}>{maskNik(r.nik)}</td>
              <td style={{ padding: 11 }}>{r.kegiatanNama}</td>
              <td style={{ padding: 11, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{r.tanggalSelesai}</td>
              <td style={{ padding: 11 }}>
                <Badge variant={r.status === 'siap' ? 'success' : 'warning'}>{r.status === 'siap' ? 'Siap' : 'Belum'}</Badge>
              </td>
              <td style={{ padding: 11, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{r.unduhCount}</td>
              <td style={{ padding: 11 }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <ReplaceFileButton sertifikatId={r.id} />
                  <form action={deleteSertifikatAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <IconButton icon="trash-2" label="Hapus berkas" type="submit" />
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div style={{ padding: 38, textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
          Tidak ada data yang cocok dengan filter ini.
        </div>
      )}
    </div>
  );
}
