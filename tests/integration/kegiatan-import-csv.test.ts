import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { POST } from '@/app/api/admin/kegiatan/[id]/import/csv/route';

const CSV = `nama_peserta;Username;Email;Provinsi;Kabupaten / kota;Asal instansi
Peserta CSV Satu;4444444444444444;peserta.csv.satu@example.com;Jawa Tengah;KOTA SEMARANG;Universitas Diponegoro`;

describe('POST /api/admin/kegiatan/[id]/import/csv', () => {
  let kegiatanId: number;

  beforeAll(async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji Import CSV Scoped', jumlahJp: 16 }).returning();
    kegiatanId = k.id;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('creates a sertifikat row scoped to this kegiatan', async () => {
    const request = new Request(`http://localhost/api/admin/kegiatan/${kegiatanId}/import/csv`, {
      method: 'POST',
      body: JSON.stringify({ csv: CSV }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: String(kegiatanId) }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.imported).toBe(1);
    expect(body.errors).toHaveLength(0);

    const rows = await db
      .select()
      .from(sertifikat)
      .where(and(eq(sertifikat.kegiatanId, kegiatanId), eq(sertifikat.nik, '4444444444444444')));
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe('peserta.csv.satu@example.com');
    expect(rows[0].asalInstansi).toBe('Universitas Diponegoro');
  });

  it('does not clobber an already-siap row on re-import', async () => {
    await db
      .update(sertifikat)
      .set({ status: 'siap', fileUrl: 'https://example.com/already-uploaded.pdf' })
      .where(and(eq(sertifikat.kegiatanId, kegiatanId), eq(sertifikat.nik, '4444444444444444')));

    const request = new Request(`http://localhost/api/admin/kegiatan/${kegiatanId}/import/csv`, {
      method: 'POST',
      body: JSON.stringify({ csv: CSV }),
    });
    await POST(request, { params: Promise.resolve({ id: String(kegiatanId) }) });

    const [row] = await db
      .select()
      .from(sertifikat)
      .where(and(eq(sertifikat.kegiatanId, kegiatanId), eq(sertifikat.nik, '4444444444444444')));
    expect(row.status).toBe('siap');
    expect(row.fileUrl).toBe('https://example.com/already-uploaded.pdf');
  });
});
