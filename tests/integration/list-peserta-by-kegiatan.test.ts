import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { createKegiatan, listPesertaByKegiatan } from '@/lib/kegiatan';

describe('listPesertaByKegiatan', () => {
  let kegiatanId: number | undefined;

  afterEach(async () => {
    if (kegiatanId) {
      await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
      kegiatanId = undefined;
    }
  });

  it('lists peserta scoped to the given kegiatan, ordered by nama', async () => {
    const { id } = await createKegiatan({
      nama: 'Uji List Peserta',
      jumlahJp: 8,
      tahun: 2026,
      segmen: 'KML',
      tanggalMulai: '2026-06-01',
      tanggalSelesai: '2026-06-02',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
    });
    kegiatanId = id;

    await db.insert(sertifikat).values([
      { kegiatanId: id, nama: 'Zeta Peserta', nik: '8888888888888801', status: 'belum' },
      { kegiatanId: id, nama: 'Alpha Peserta', nik: '8888888888888802', status: 'belum' },
    ]);

    const list = await listPesertaByKegiatan(id);
    expect(list.map((p) => p.nama)).toEqual(['Alpha Peserta', 'Zeta Peserta']);
  });
});
