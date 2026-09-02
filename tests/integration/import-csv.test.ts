import { describe, it, expect, afterEach } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { POST } from '@/app/api/admin/import/csv/route';

const CSV = `nik,nama,kegiatan,tanggal_terbit,nomor,jam
4444444444444444,Peserta CSV Satu,Uji Import CSV,2026-02-01,TEST-CSV-0001/UJI/2026,16`;

describe('CSV import route', () => {
  afterEach(async () => {
    await db.delete(sertifikat).where(eq(sertifikat.nomor, 'TEST-CSV-0001/UJI/2026'));
    await db.delete(kegiatan).where(eq(kegiatan.nama, 'Uji Import CSV'));
  });

  it('creates a kegiatan and a sertifikat row from a valid CSV', async () => {
    const request = new Request('http://localhost/api/admin/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csv: CSV }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.imported).toBe(1);
    expect(body.errors).toHaveLength(0);

    const rows = await db.select().from(sertifikat).where(eq(sertifikat.nomor, 'TEST-CSV-0001/UJI/2026'));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('belum');
  });

  it('does not clobber an already-siap row on re-import', async () => {
    const request1 = new Request('http://localhost/api/admin/import/csv', { method: 'POST', body: JSON.stringify({ csv: CSV }) });
    await POST(request1);

    await db
      .update(sertifikat)
      .set({ status: 'siap', fileUrl: 'https://example.com/already-uploaded.pdf' })
      .where(eq(sertifikat.nomor, 'TEST-CSV-0001/UJI/2026'));

    const request2 = new Request('http://localhost/api/admin/import/csv', { method: 'POST', body: JSON.stringify({ csv: CSV }) });
    await POST(request2);

    const [row] = await db.select().from(sertifikat).where(eq(sertifikat.nomor, 'TEST-CSV-0001/UJI/2026'));
    expect(row.status).toBe('siap');
    expect(row.fileUrl).toBe('https://example.com/already-uploaded.pdf');
  });
});
