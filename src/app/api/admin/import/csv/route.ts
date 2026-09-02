import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { parseParticipantCsv, type ParticipantRow } from '@/lib/csv';

async function findOrCreateKegiatan(row: ParticipantRow): Promise<number> {
  const [existing] = await db
    .select()
    .from(kegiatan)
    .where(and(eq(kegiatan.nama, row.kegiatan), eq(kegiatan.tanggalTerbit, row.tanggalTerbit), eq(kegiatan.jumlahJp, row.jam)));

  if (existing) return existing.id;

  const [created] = await db
    .insert(kegiatan)
    .values({ nama: row.kegiatan, tanggalTerbit: row.tanggalTerbit, jumlahJp: row.jam })
    .returning();
  return created.id;
}

export async function POST(request: Request) {
  const { csv } = (await request.json()) as { csv: string };
  const { rows, errors } = parseParticipantCsv(csv);

  let imported = 0;
  for (const row of rows) {
    const kegiatanId = row.kegiatan ? await findOrCreateKegiatan(row) : null;
    if (kegiatanId === null) continue;

    const [existing] = await db.select().from(sertifikat).where(eq(sertifikat.nomor, row.nomor));

    if (existing) {
      await db
        .update(sertifikat)
        .set({ nama: row.nama, nik: row.nik, kegiatanId, updatedAt: new Date() })
        .where(eq(sertifikat.id, existing.id));
    } else {
      await db.insert(sertifikat).values({
        kegiatanId,
        nama: row.nama,
        nik: row.nik,
        nomor: row.nomor,
        status: 'belum',
      });
    }
    imported += 1;
  }

  return NextResponse.json({ imported, errors });
}
