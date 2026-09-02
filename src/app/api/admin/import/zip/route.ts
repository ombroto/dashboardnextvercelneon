import { NextResponse } from 'next/server';
import { Readable, PassThrough } from 'node:stream';
import path from 'node:path';
import unzipper from 'unzipper';
import { put } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat } from '@/db/schema';
import { parseManifestCsv, matchFilenameToCandidate, type MatchCandidate } from '@/lib/zip-match';

export const maxDuration = 300;

// A minimal `unzipper.Open.custom()` source backed by HTTP Range requests against
// the archive's own Blob URL, instead of reading the archive as one sequential
// stream. This buys two things a sequential parse can't: (1) the ZIP's central
// directory (a small index at the end of the file) tells us every entry's name
// and size upfront, so manifest.csv can be found and read regardless of where it
// sits in the archive — a sequential parser only knows what it's seen so far, so
// a manifest.csv appearing after some PDFs would be invisible to matching logic
// for those earlier entries; (2) each PDF can then be fetched and piped straight
// to its destination Blob key one at a time via `entry.stream()`, so memory use
// no longer scales with the archive's total size or entry count.
function blobRangeSource(url: string) {
  return {
    stream(offset: number, length?: number) {
      const end = length ? offset + length - 1 : '';
      const pass = new PassThrough();
      fetch(url, { headers: { Range: `bytes=${offset}-${end}` } })
        .then((response) => {
          if (!response.body) throw new Error('Respons range archive kosong');
          Readable.fromWeb(response.body as never).pipe(pass);
        })
        .catch((error) => pass.destroy(error));
      return pass;
    },
    async size() {
      const response = await fetch(url, { method: 'HEAD' });
      return Number(response.headers.get('content-length'));
    },
  };
}

export async function POST(request: Request) {
  const { blobUrl } = (await request.json()) as { blobUrl: string };

  const directory = await unzipper.Open.custom(blobRangeSource(blobUrl)).catch(() => null);
  if (!directory) {
    return NextResponse.json({ error: 'Arsip tidak dapat dibaca' }, { status: 400 });
  }

  const candidates: MatchCandidate[] = await db.select({ id: sertifikat.id, nik: sertifikat.nik, nomor: sertifikat.nomor }).from(sertifikat);

  // path.basename() strips any directory component (including a crafted `../`
  // traversal) from an archive entry's path before it's ever used as a Blob key
  // or matched against a candidate filename, so a malicious archive can't write
  // outside the intended Blob key prefixes, and PDFs nested in subdirectories
  // are matched the same way top-level ones are instead of always landing in
  // "unmatched" (a nested path never equals `${nik}_${prefix}.pdf`, which has no `/`).
  const manifestEntry = directory.files.find((f) => path.basename(f.path).toLowerCase() === 'manifest.csv');
  const manifest = manifestEntry ? parseManifestCsv((await manifestEntry.buffer()).toString('utf-8')) : null;

  const pdfEntries = directory.files.filter((f) => path.basename(f.path).toLowerCase().endsWith('.pdf'));

  const unmatched: { filename: string; blobUrl: string; fileSize: number }[] = [];
  let matched = 0;

  for (const entry of pdfEntries) {
    const filename = path.basename(entry.path);
    let targetId: number | null = null;

    if (manifest) {
      const manifestMatch = manifest.find((m) => m.file === filename);
      if (manifestMatch) {
        const candidate = candidates.find((c) => c.nik === manifestMatch.nik && c.nomor === manifestMatch.nomor);
        targetId = candidate?.id ?? null;
      }
    } else {
      targetId = matchFilenameToCandidate(filename, candidates);
    }

    const key = targetId === null ? `unmatched/${filename}` : `sertifikat/${targetId}-${filename}`;
    const blob = await put(key, entry.stream(), {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/pdf',
    });
    const fileSize = entry.uncompressedSize;

    if (targetId === null) {
      unmatched.push({ filename, blobUrl: blob.url, fileSize });
      continue;
    }

    await db
      .update(sertifikat)
      .set({ fileUrl: blob.url, fileSize, status: 'siap', updatedAt: new Date() })
      .where(eq(sertifikat.id, targetId));

    matched += 1;
  }

  return NextResponse.json({ matched, unmatched });
}
