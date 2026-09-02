import { NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import path from 'node:path';
import unzipper from 'unzipper';
import { put } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat } from '@/db/schema';
import { parseManifestCsv, matchFilenameToCandidate, type MatchCandidate } from '@/lib/zip-match';

export const maxDuration = 300;

export async function POST(request: Request) {
  const { blobUrl } = (await request.json()) as { blobUrl: string };

  const response = await fetch(blobUrl);
  if (!response.body) {
    return NextResponse.json({ error: 'Arsip tidak dapat diunduh' }, { status: 400 });
  }
  const nodeStream = Readable.fromWeb(response.body as never);

  const candidates: MatchCandidate[] = await db.select({ id: sertifikat.id, nik: sertifikat.nik, nomor: sertifikat.nomor }).from(sertifikat);

  let manifestRows: { nik: string; nomor: string; file: string }[] | null = null;
  const pdfEntries: { filename: string; buffer: Buffer }[] = [];

  await nodeStream
    .pipe(unzipper.Parse())
    .on('entry', function (entry: unzipper.Entry) {
      // path.basename() strips any directory component (including a crafted
      // `../` traversal) from the archive entry's path before it's ever used as
      // a Blob key or matched against a candidate filename, so a malicious
      // archive can't write outside the intended Blob key prefixes, and PDFs
      // nested in subdirectories are matched the same way top-level ones are
      // instead of always landing in "unmatched" (a nested path never equals
      // `${nik}_${prefix}.pdf`, which has no `/`).
      const filename = path.basename(entry.path);
      const lower = filename.toLowerCase();
      if (lower === 'manifest.csv' || lower.endsWith('.pdf')) {
        const chunks: Buffer[] = [];
        entry.on('data', (chunk: Buffer) => chunks.push(chunk));
        entry.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (lower === 'manifest.csv') {
            manifestRows = parseManifestCsv(buffer.toString('utf-8'));
          } else {
            pdfEntries.push({ filename, buffer });
          }
        });
      } else {
        entry.autodrain();
      }
    })
    .promise();

  const unmatched: { filename: string; blobUrl: string; fileSize: number }[] = [];
  let matched = 0;

  // Read via an explicit assertion: manifestRows is only ever reassigned inside
  // the `entry`/`end` closures above, so TypeScript's control-flow analysis
  // can't see the assignment from here and narrows the bare variable to `never`
  // on `if (manifestRows)` — this sidesteps that without changing behavior.
  const manifest = manifestRows as { nik: string; nomor: string; file: string }[] | null;

  for (const pdf of pdfEntries) {
    let targetId: number | null = null;

    if (manifest) {
      const manifestMatch = manifest.find((m) => m.file === pdf.filename);
      if (manifestMatch) {
        const candidate = candidates.find((c) => c.nik === manifestMatch.nik && c.nomor === manifestMatch.nomor);
        targetId = candidate?.id ?? null;
      }
    } else {
      targetId = matchFilenameToCandidate(pdf.filename, candidates);
    }

    if (targetId === null) {
      const blob = await put(`unmatched/${pdf.filename}`, pdf.buffer, {
        access: 'public',
        addRandomSuffix: true,
        contentType: 'application/pdf',
      });
      unmatched.push({ filename: pdf.filename, blobUrl: blob.url, fileSize: pdf.buffer.byteLength });
      continue;
    }

    const blob = await put(`sertifikat/${targetId}-${pdf.filename}`, pdf.buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/pdf',
    });

    await db
      .update(sertifikat)
      .set({ fileUrl: blob.url, fileSize: pdf.buffer.byteLength, status: 'siap', updatedAt: new Date() })
      .where(eq(sertifikat.id, targetId));

    matched += 1;
  }

  return NextResponse.json({ matched, unmatched });
}
