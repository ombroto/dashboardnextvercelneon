import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat } from '@/db/schema';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kegiatanId = Number(id);
  const { pesertaId, blobUrl, fileSize } = (await request.json()) as {
    pesertaId: number;
    blobUrl: string;
    fileSize: number;
  };

  const [existing] = await db
    .select()
    .from(sertifikat)
    .where(and(eq(sertifikat.id, pesertaId), eq(sertifikat.kegiatanId, kegiatanId)));
  if (!existing) {
    return NextResponse.json({ error: `Peserta ${pesertaId} tidak ditemukan pada kegiatan ini` }, { status: 404 });
  }

  await db
    .update(sertifikat)
    .set({ fileUrl: blobUrl, fileSize, status: 'siap', updatedAt: new Date() })
    .where(eq(sertifikat.id, existing.id));

  return NextResponse.json({ ok: true });
}
