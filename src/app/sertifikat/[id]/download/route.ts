import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sertifikat, unduhanLog } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCertificateById } from '@/lib/search';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certificateId = Number(id);
  const certificate = await getCertificateById(certificateId);

  if (!certificate || certificate.status !== 'siap' || !certificate.fileUrl) {
    return NextResponse.json({ error: 'Sertifikat tidak ditemukan atau belum siap' }, { status: 404 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const userAgent = request.headers.get('user-agent');

  await db.insert(unduhanLog).values({ sertifikatId: certificateId, ip, userAgent });
  await db
    .update(sertifikat)
    .set({ unduhCount: sql`${sertifikat.unduhCount} + 1` })
    .where(eq(sertifikat.id, certificateId));

  return NextResponse.redirect(certificate.fileUrl, 307);
}
