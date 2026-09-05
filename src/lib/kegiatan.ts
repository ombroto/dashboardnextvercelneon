import { eq, desc, count, sql, asc } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { db } from '@/db';
import { kegiatan, sertifikat, type Kegiatan } from '@/db/schema';

const SEGMEN_VALUES = ['Aparatur Negara', 'Orsospol', 'KML', 'Purnapaskibraka'] as const;
const MODE_VALUES = ['Luring', 'Daring', 'Hybrid'] as const;

export interface CreateKegiatanInput {
  nama: string;
  jumlahJp: number;
  tahun: number;
  segmen: (typeof SEGMEN_VALUES)[number];
  tanggalMulai: string;
  tanggalSelesai: string;
  provinsi: string;
  kabupatenKota: string;
  modePenyelenggaraan?: (typeof MODE_VALUES)[number];
  logoUrl?: string | null;
}

export function parseKegiatanInput(body: Record<string, unknown>): { input?: CreateKegiatanInput; errors: string[] } {
  const errors: string[] = [];

  const nama = typeof body.nama === 'string' ? body.nama.trim() : '';
  if (!nama) errors.push('Nama kegiatan wajib diisi');

  const jumlahJp = Number(body.jumlahJp);
  if (!Number.isFinite(jumlahJp) || jumlahJp <= 0) errors.push('Jam pelajaran harus berupa angka positif');

  const tahun = Number(body.tahun);
  if (!Number.isInteger(tahun)) errors.push('Tahun wajib dipilih');

  const segmen = body.segmen as string;
  if (!SEGMEN_VALUES.includes(segmen as (typeof SEGMEN_VALUES)[number])) errors.push('Segmen kegiatan wajib dipilih');

  const tanggalMulai = typeof body.tanggalMulai === 'string' ? body.tanggalMulai : '';
  const tanggalSelesai = typeof body.tanggalSelesai === 'string' ? body.tanggalSelesai : '';
  if (!tanggalMulai) errors.push('Tanggal mulai wajib diisi');
  if (!tanggalSelesai) errors.push('Tanggal berakhir wajib diisi');
  if (tanggalMulai && tanggalSelesai && tanggalSelesai < tanggalMulai) errors.push('Tanggal berakhir harus setelah tanggal mulai');

  const provinsi = typeof body.provinsi === 'string' ? body.provinsi.trim() : '';
  if (!provinsi) errors.push('Provinsi kegiatan wajib diisi');

  const kabupatenKota = typeof body.kabupatenKota === 'string' ? body.kabupatenKota.trim() : '';
  if (!kabupatenKota) errors.push('Kab/kota kegiatan wajib diisi');

  const modePenyelenggaraanRaw = body.modePenyelenggaraan;
  const modePenyelenggaraan = MODE_VALUES.includes(modePenyelenggaraanRaw as (typeof MODE_VALUES)[number])
    ? (modePenyelenggaraanRaw as (typeof MODE_VALUES)[number])
    : undefined;

  const logoUrl = typeof body.logoUrl === 'string' ? body.logoUrl : body.logoUrl === null ? null : undefined;

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors,
    input: {
      nama,
      jumlahJp,
      tahun,
      segmen: segmen as CreateKegiatanInput['segmen'],
      tanggalMulai,
      tanggalSelesai,
      provinsi,
      kabupatenKota,
      modePenyelenggaraan,
      logoUrl,
    },
  };
}

export async function createKegiatan(input: CreateKegiatanInput): Promise<{ id: number }> {
  const [row] = await db.insert(kegiatan).values(input).returning({ id: kegiatan.id });
  return row;
}

export async function updateKegiatan(id: number, input: CreateKegiatanInput): Promise<void> {
  await db.update(kegiatan).set(input).where(eq(kegiatan.id, id));
}

export async function deleteKegiatan(id: number): Promise<void> {
  const [kegiatanRow] = await db.select({ logoUrl: kegiatan.logoUrl }).from(kegiatan).where(eq(kegiatan.id, id));
  const pesertaRows = await db.select({ fileUrl: sertifikat.fileUrl }).from(sertifikat).where(eq(sertifikat.kegiatanId, id));

  const blobUrls = [kegiatanRow?.logoUrl, ...pesertaRows.map((r) => r.fileUrl)].filter((url): url is string => Boolean(url));
  if (blobUrls.length > 0) {
    await del(blobUrls).catch(() => undefined);
  }

  await db.delete(kegiatan).where(eq(kegiatan.id, id));
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
