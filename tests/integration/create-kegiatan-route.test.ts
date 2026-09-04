import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan } from '@/db/schema';
import { POST } from '@/app/api/admin/kegiatan/route';

const VALID_PAYLOAD = {
  nama: 'Uji Route Kegiatan',
  jumlahJp: 16,
  tahun: 2026,
  segmen: 'Aparatur Negara',
  tanggalMulai: '2026-03-01',
  tanggalSelesai: '2026-03-05',
  provinsi: 'Jawa Tengah',
  kabupatenKota: 'KOTA SEMARANG',
};

describe('POST /api/admin/kegiatan', () => {
  let createdId: number | undefined;

  afterEach(async () => {
    if (createdId) {
      await db.delete(kegiatan).where(eq(kegiatan.id, createdId));
      createdId = undefined;
    }
  });

  it('creates a kegiatan from a valid payload', async () => {
    const request = new Request('http://localhost/api/admin/kegiatan', { method: 'POST', body: JSON.stringify(VALID_PAYLOAD) });
    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(200);
    createdId = body.id;

    const [row] = await db.select().from(kegiatan).where(eq(kegiatan.id, body.id));
    expect(row.nama).toBe('Uji Route Kegiatan');
  });

  it('rejects a payload missing required fields', async () => {
    const request = new Request('http://localhost/api/admin/kegiatan', { method: 'POST', body: JSON.stringify({ nama: '' }) });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errors.length).toBeGreaterThan(0);
  });

  it('rejects tanggal berakhir before tanggal mulai', async () => {
    const request = new Request('http://localhost/api/admin/kegiatan', {
      method: 'POST',
      body: JSON.stringify({ ...VALID_PAYLOAD, tanggalMulai: '2026-03-05', tanggalSelesai: '2026-03-01' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects an invalid segmen value', async () => {
    const request = new Request('http://localhost/api/admin/kegiatan', {
      method: 'POST',
      body: JSON.stringify({ ...VALID_PAYLOAD, segmen: 'Tidak Ada' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
