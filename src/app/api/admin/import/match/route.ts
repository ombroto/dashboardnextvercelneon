import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat } from '@/db/schema';

export async function POST(request: Request) {
  const { nomor, blobUrl, fileSize } = (await request.json()) as {
    nomor: string;
    blobUrl: string;
    fileSize: number;
  };

  const [existing] = await db.select().from(sertifikat).where(eq(sertifikat.nomor, nomor));
  if (!existing) {
    return NextResponse.json({ error: `Tidak ada sertifikat dengan nomor ${nomor}` }, { status: 404 });
  }

  await db
    .update(sertifikat)
    .set({ fileUrl: blobUrl, fileSize, status: 'siap', updatedAt: new Date() })
    .where(eq(sertifikat.id, existing.id));

  return NextResponse.json({ ok: true });
}
