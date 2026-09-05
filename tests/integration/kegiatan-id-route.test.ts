import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan } from '@/db/schema';
import { createKegiatan, type CreateKegiatanInput } from '@/lib/kegiatan';
import { PATCH, DELETE } from '@/app/api/admin/kegiatan/[id]/route';

const VALID_PAYLOAD: CreateKegiatanInput = {
  nama: 'Uji Route Kegiatan Id',
  jumlahJp: 16,
  tahun: 2026,
  segmen: 'Aparatur Negara',
  tanggalMulai: '2026-03-01',
  tanggalSelesai: '2026-03-05',
  provinsi: 'Jawa Tengah',
  kabupatenKota: 'KOTA SEMARANG',
};

describe('PATCH /api/admin/kegiatan/[id]', () => {
  let createdId: number | undefined;

  afterEach(async () => {
    if (createdId) {
      await db.delete(kegiatan).where(eq(kegiatan.id, createdId));
      createdId = undefined;
    }
  });

  it('updates a kegiatan from a valid payload', async () => {
    const { id } = await createKegiatan(VALID_PAYLOAD);
    createdId = id;

    const request = new Request(`http://localhost/api/admin/kegiatan/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...VALID_PAYLOAD, nama: 'Uji Route Kegiatan Id (diubah)' }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: String(id) }) });
    expect(response.status).toBe(200);

    const [row] = await db.select().from(kegiatan).where(eq(kegiatan.id, id));
    expect(row.nama).toBe('Uji Route Kegiatan Id (diubah)');
  });

  it('rejects a payload missing required fields', async () => {
    const { id } = await createKegiatan(VALID_PAYLOAD);
    createdId = id;

    const request = new Request(`http://localhost/api/admin/kegiatan/${id}`, { method: 'PATCH', body: JSON.stringify({ nama: '' }) });
    const response = await PATCH(request, { params: Promise.resolve({ id: String(id) }) });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errors.length).toBeGreaterThan(0);
  });
});

describe('DELETE /api/admin/kegiatan/[id]', () => {
  it('deletes the kegiatan row', async () => {
    const { id } = await createKegiatan(VALID_PAYLOAD);

    const request = new Request(`http://localhost/api/admin/kegiatan/${id}`, { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: String(id) }) });
    expect(response.status).toBe(200);

    const rows = await db.select().from(kegiatan).where(eq(kegiatan.id, id));
    expect(rows).toHaveLength(0);
  });
});
