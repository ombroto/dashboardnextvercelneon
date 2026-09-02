import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { searchByNik, searchByName } from '@/lib/search';
import { eq } from 'drizzle-orm';

describe('search', () => {
  let kegiatanId: number;

  beforeAll(async () => {
    const [k] = await db
      .insert(kegiatan)
      .values({ nama: 'Uji Coba Diklat', tanggalTerbit: '2026-01-01', jumlahJp: 16 })
      .returning();
    kegiatanId = k.id;
    await db.insert(sertifikat).values({
      kegiatanId,
      nama: 'Nama Uji Coba',
      nik: '1111111111111111',
      nomor: 'TEST-0001/UJI/2026',
      status: 'belum',
    });
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('finds a person by exact NIK', async () => {
    const result = await searchByNik('1111111111111111');
    expect(result?.nama).toBe('Nama Uji Coba');
    expect(result?.certificates).toHaveLength(1);
    expect(result?.certificates[0].kegiatanNama).toBe('Uji Coba Diklat');
  });

  it('finds a person by partial name', async () => {
    const results = await searchByName('Uji Coba');
    expect(results.some((p) => p.nik === '1111111111111111')).toBe(true);
  });

  it('returns null for an unknown NIK', async () => {
    expect(await searchByNik('0000000000000000')).toBeNull();
  });
});
