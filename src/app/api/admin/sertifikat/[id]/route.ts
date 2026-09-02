import { NextResponse } from 'next/server';
import { deleteSertifikat, replaceSertifikatFile } from '@/lib/search';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteSertifikat(Number(id));
  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { blobUrl, fileSize } = (await request.json()) as { blobUrl: string; fileSize: number };
  await replaceSertifikatFile(Number(id), blobUrl, fileSize);
  return NextResponse.json({ ok: true });
}
