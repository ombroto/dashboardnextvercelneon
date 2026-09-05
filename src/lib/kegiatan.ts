import { eq, desc, count, sql, asc } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat, type Kegiatan } from '@/db/schema';

export interface CreateKegiatanInput {
  nama: string;
  jumlahJp: number;
  tahun: number;
  segmen: 'Aparatur Negara' | 'Orsospol' | 'KML' | 'Purnapaskibraka';
  tanggalMulai: string;
  tanggalSelesai: string;
  provinsi: string;
  kabupatenKota: string;
  modePenyelenggaraan?: 'Luring' | 'Daring' | 'Hybrid';
  logoUrl?: string;
}

export async function createKegiatan(input: CreateKegiatanInput): Promise<{ id: number }> {
  const [row] = await db.insert(kegiatan).values(input).returning({ id: kegiatan.id });
  return row;
}

export interface KegiatanListItem {
  id: number;
  nama: string;
  tahun: number | null;
  segmen: string | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  totalPeserta: number;
  jumlahLulus: number;
}

export async function listKegiatan(): Promise<KegiatanListItem[]> {
  const rows = await db
    .select({
      id: kegiatan.id,
      nama: kegiatan.nama,
      tahun: kegiatan.tahun,
      segmen: kegiatan.segmen,
      tanggalMulai: kegiatan.tanggalMulai,
      tanggalSelesai: kegiatan.tanggalSelesai,
      totalPeserta: count(sertifikat.id),
      jumlahLulus: sql<number>`count(*) filter (where ${sertifikat.status} = 'siap')`,
    })
    .from(kegiatan)
    .leftJoin(sertifikat, eq(sertifikat.kegiatanId, kegiatan.id))
    .groupBy(kegiatan.id)
    .orderBy(desc(kegiatan.createdAt));

  return rows.map((r) => ({ ...r, totalPeserta: Number(r.totalPeserta), jumlahLulus: Number(r.jumlahLulus) }));
}

export async function getKegiatanById(
  id: number
): Promise<(Kegiatan & { totalPeserta: number; jumlahLulus: number; jumlahTidakLulus: number }) | null> {
  const [row] = await db.select().from(kegiatan).where(eq(kegiatan.id, id));
  if (!row) return null;

  const [counts] = await db
    .select({
      totalPeserta: count(),
      jumlahLulus: sql<number>`count(*) filter (where ${sertifikat.status} = 'siap')`,
    })
    .from(sertifikat)
    .where(eq(sertifikat.kegiatanId, id));

  const totalPeserta = Number(counts.totalPeserta);
  const jumlahLulus = Number(counts.jumlahLulus);
  return { ...row, totalPeserta, jumlahLulus, jumlahTidakLulus: totalPeserta - jumlahLulus };
}

export interface KegiatanPesertaOption {
  id: number;
  nama: string;
  nik: string;
}

export async function listPesertaByKegiatan(kegiatanId: number): Promise<KegiatanPesertaOption[]> {
  return db
    .select({ id: sertifikat.id, nama: sertifikat.nama, nik: sertifikat.nik })
    .from(sertifikat)
    .where(eq(sertifikat.kegiatanId, kegiatanId))
    .orderBy(asc(sertifikat.nama));
}
