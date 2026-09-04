import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { getAllSertifikat } from '@/lib/search';

describe('getAllSertifikat filter/sort', () => {
  let kegiatanId: number;

  beforeAll(async () => {
    const [k] = await db
      .insert(kegiatan)
      .values({ nama: 'Uji GetAll', tanggalSelesai: '2026-03-01', jumlahJp: 8 })
      .returning();
    kegiatanId = k.id;
    await db.insert(sertifikat).values([
      { kegiatanId, nama: 'Zeta Uji', nik: '4444444444444401', status: 'siap' },
      { kegiatanId, nama: 'Alpha Uji', nik: '4444444444444402', status: 'belum' },
    ]);
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('filters by status', async () => {
    const rows = await getAllSertifikat({ status: 'belum', q: 'Alpha Uji' });
    expect(rows.every((r) => r.status === 'belum')).toBe(true);
    expect(rows.some((r) => r.nama === 'Alpha Uji')).toBe(true);
  });

  it('sorts by nama ascending', async () => {
    const rows = await getAllSertifikat({ q: 'Uji', sort: 'nama', dir: 'asc' });
    const ours = rows.filter((r) => r.nama === 'Zeta Uji' || r.nama === 'Alpha Uji');
    expect(ours.map((r) => r.nama)).toEqual(['Alpha Uji', 'Zeta Uji']);
  });

  it('escapes ILIKE wildcards in q (does not broad-match on a lone %)', async () => {
    const rows = await getAllSertifikat({ q: '%' });
    expect(rows.some((r) => r.nama === 'Alpha Uji' || r.nama === 'Zeta Uji')).toBe(false);
  });
});
