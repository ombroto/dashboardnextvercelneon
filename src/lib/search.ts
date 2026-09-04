import { eq, ilike, or, and, asc, desc, count } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat, kegiatan, unduhanLog } from '@/db/schema';

export interface CertificateSummary {
  id: number;
  kegiatanNama: string;
  tanggalSelesai: string | null;
  jumlahJp: number;
  status: 'siap' | 'belum';
}

export interface PersonResult {
  nik: string;
  nama: string;
  certificates: CertificateSummary[];
}

type JoinedRow = { sertifikat: typeof sertifikat.$inferSelect; kegiatan: typeof kegiatan.$inferSelect };

function groupToPerson(nik: string, rows: JoinedRow[]): PersonResult | null {
  if (rows.length === 0) return null;
  return {
    nik,
    nama: rows[0].sertifikat.nama,
    certificates: rows.map((r) => ({
      id: r.sertifikat.id,
      kegiatanNama: r.kegiatan.nama,
      tanggalSelesai: r.kegiatan.tanggalSelesai,
      jumlahJp: r.kegiatan.jumlahJp,
      status: r.sertifikat.status,
    })),
  };
}

export async function searchByNik(nik: string, kegiatanId?: number): Promise<PersonResult | null> {
  const conditions = [eq(sertifikat.nik, nik)];
  if (kegiatanId) {
    conditions.push(eq(sertifikat.kegiatanId, kegiatanId));
  }

  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(and(...conditions));
  return groupToPerson(nik, rows);
}

function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export interface KegiatanOption {
  id: number;
  nama: string;
}

export async function searchKegiatanByName(name: string): Promise<KegiatanOption[]> {
  const trimmed = name.trim();
  if (trimmed.length < 4) return [];

  return db
    .select({ id: kegiatan.id, nama: kegiatan.nama })
    .from(kegiatan)
    .where(ilike(kegiatan.nama, `%${escapeIlikePattern(trimmed)}%`))
    .orderBy(kegiatan.nama)
    .limit(10);
}

export async function searchByName(name: string): Promise<PersonResult[]> {
  const trimmed = name.trim();
  if (trimmed.length < 3) return [];

  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(ilike(sertifikat.nama, `%${escapeIlikePattern(trimmed)}%`))
    .orderBy(sertifikat.nik, sertifikat.id);

  const byNik = new Map<string, JoinedRow[]>();
  for (const row of rows) {
    const list = byNik.get(row.sertifikat.nik) ?? [];
    list.push(row);
    byNik.set(row.sertifikat.nik, list);
  }

  const people: PersonResult[] = [];
  for (const [nik, personRows] of byNik) {
    const person = groupToPerson(nik, personRows);
    if (person) people.push(person);
  }
  return people.slice(0, 20);
}

export interface CertificateDetail extends CertificateSummary {
  nama: string;
  nik: string;
  fileUrl: string | null;
  fileSize: number | null;
}

export async function getCertificateById(id: number): Promise<CertificateDetail | null> {
  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(eq(sertifikat.id, id));

  if (rows.length === 0) return null;
  const { sertifikat: s, kegiatan: k } = rows[0];
  return {
    id: s.id,
    kegiatanNama: k.nama,
    tanggalSelesai: k.tanggalSelesai,
    jumlahJp: k.jumlahJp,
    status: s.status,
    nama: s.nama,
    nik: s.nik,
    fileUrl: s.fileUrl,
    fileSize: s.fileSize,
  };
}

import { del } from '@vercel/blob';

export async function deleteSertifikat(id: number): Promise<void> {
  const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, id));
  if (row?.fileUrl) {
    await del(row.fileUrl).catch(() => undefined);
  }
  await db.delete(sertifikat).where(eq(sertifikat.id, id));
}

export async function replaceSertifikatFile(id: number, blobUrl: string, fileSize: number): Promise<void> {
  const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, id));
  if (row?.fileUrl) {
    await del(row.fileUrl).catch(() => undefined);
  }
  await db
    .update(sertifikat)
    .set({ fileUrl: blobUrl, fileSize, status: 'siap', updatedAt: new Date() })
    .where(eq(sertifikat.id, id));
}

export interface AdminSertifikatRow {
  id: number;
  nama: string;
  nik: string;
  kegiatanNama: string;
  tanggalSelesai: string | null;
  status: 'siap' | 'belum';
  unduhCount: number;
}

export interface GetAllSertifikatFilter {
  q?: string;
  status?: 'siap' | 'belum';
  sort?: 'nama' | 'nik' | 'tanggal';
  dir?: 'asc' | 'desc';
}

const SORT_COLUMNS = {
  nama: sertifikat.nama,
  nik: sertifikat.nik,
  tanggal: kegiatan.tanggalSelesai,
} as const;

export async function getAllSertifikat(filter: GetAllSertifikatFilter = {}): Promise<AdminSertifikatRow[]> {
  const conditions = [];
  if (filter.q) {
    const pattern = `%${escapeIlikePattern(filter.q)}%`;
    conditions.push(or(ilike(sertifikat.nama, pattern), ilike(sertifikat.nik, pattern)));
  }
  if (filter.status) {
    conditions.push(eq(sertifikat.status, filter.status));
  }

  const sortColumn = SORT_COLUMNS[filter.sort ?? 'tanggal'] ?? sertifikat.createdAt;
  const orderExpr = filter.sort ? (filter.dir === 'desc' ? desc(sortColumn) : asc(sortColumn)) : desc(sertifikat.createdAt);

  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderExpr);

  return rows.map((r) => ({
    id: r.sertifikat.id,
    nama: r.sertifikat.nama,
    nik: r.sertifikat.nik,
    kegiatanNama: r.kegiatan.nama,
    tanggalSelesai: r.kegiatan.tanggalSelesai,
    status: r.sertifikat.status,
    unduhCount: r.sertifikat.unduhCount,
  }));
}

export interface UnduhanLogRow {
  waktu: Date;
  nama: string;
  ip: string;
}

export async function getUnduhanLog(options: { limit?: number } = {}): Promise<UnduhanLogRow[]> {
  const query = db
    .select({ waktu: unduhanLog.waktu, nama: sertifikat.nama, ip: unduhanLog.ip })
    .from(unduhanLog)
    .innerJoin(sertifikat, eq(unduhanLog.sertifikatId, sertifikat.id))
    .orderBy(desc(unduhanLog.waktu));

  return options.limit ? query.limit(options.limit) : query;
}

export async function countAllSertifikat(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(sertifikat);
  return row.value;
}
