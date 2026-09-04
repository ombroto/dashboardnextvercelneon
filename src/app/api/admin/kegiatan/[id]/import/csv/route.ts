import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat } from '@/db/schema';
import { parseParticipantCsv } from '@/lib/csv';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kegiatanId = Number(id);
  const { csv } = (await request.json()) as { csv: string };
  const { rows, errors } = parseParticipantCsv(csv);

  let imported = 0;
  for (const row of rows) {
    const [existing] = await db
      .select()
      .from(sertifikat)
      .where(and(eq(sertifikat.kegiatanId, kegiatanId), eq(sertifikat.nik, row.nik)));

    if (existing) {
      await db
        .update(sertifikat)
        .set({
          nama: row.nama,
          email: row.email,
          provinsi: row.provinsi,
          kabupatenKota: row.kabupatenKota,
          asalInstansi: row.asalInstansi,
          updatedAt: new Date(),
        })
        .where(eq(sertifikat.id, existing.id));
    } else {
      await db.insert(sertifikat).values({
        kegiatanId,
        nama: row.nama,
        nik: row.nik,
        email: row.email,
        provinsi: row.provinsi,
        kabupatenKota: row.kabupatenKota,
        asalInstansi: row.asalInstansi,
        status: 'belum',
      });
    }
    imported += 1;
  }

  return NextResponse.json({ imported, errors });
}
