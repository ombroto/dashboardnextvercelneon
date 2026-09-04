import { NextResponse } from 'next/server';
import { Readable, PassThrough } from 'node:stream';
import path from 'node:path';
import unzipper from 'unzipper';
import { put } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat } from '@/db/schema';
import { parseManifestCsv, matchEmailToCandidate, pickFirstFileAlphabetically, type MatchCandidate } from '@/lib/zip-match';

export const maxDuration = 300;

// A minimal `unzipper.Open.custom()` source backed by HTTP Range requests against
// the archive's own Blob URL, instead of reading the archive as one sequential
// stream. This buys two things a sequential parse can't: (1) the ZIP's central
// directory (a small index at the end of the file) tells us every entry's name
// and size upfront, so manifest.csv can be found regardless of where it sits in
// the archive; (2) each matched file can then be fetched and piped straight to
// its destination Blob key one at a time via `entry.stream()`, so memory use
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

// A participant's folder is the top-level path segment: "folder/file.pdf" ->
// "folder". Files nested deeper than one level are intentionally not treated
// as candidates -- the expected shape is exactly one level of folder, then
// the certificate file directly inside it.
function directChildFilesOfFolder(files: { path: string; type: string }[], folder: string): string[] {
  const prefix = `${folder}/`;
  return files
    .filter((f) => f.type === 'File' && f.path.startsWith(prefix) && !f.path.slice(prefix.length).includes('/'))
    .map((f) => f.path);
}

export async function POST(request: Request) {
  const { blobUrl } = (await request.json()) as { blobUrl: string };

  const directory = await unzipper.Open.custom(blobRangeSource(blobUrl)).catch(() => null);
  if (!directory) {
    return NextResponse.json({ error: 'Arsip tidak dapat dibaca' }, { status: 400 });
  }

  const manifestEntry = directory.files.find((f) => path.basename(f.path).toLowerCase() === 'manifest.csv');
  if (!manifestEntry) {
    return NextResponse.json({ error: 'manifest.csv tidak ditemukan di akar arsip' }, { status: 400 });
  }
  const manifest = parseManifestCsv((await manifestEntry.buffer()).toString('utf-8'));

  const candidates: MatchCandidate[] = await db.select({ id: sertifikat.id, email: sertifikat.email }).from(sertifikat);

  const unmatched: { folder: string; email: string; blobUrl: string; fileSize: number }[] = [];
  const errors: string[] = [];
  let matched = 0;

  for (const row of manifest) {
    const candidateFiles = directChildFilesOfFolder(directory.files, row.folder);
    const filePath = pickFirstFileAlphabetically(candidateFiles);

    if (!filePath) {
      errors.push(`Folder "${row.folder}" tidak ditemukan atau kosong di dalam arsip.`);
      continue;
    }

    const entry = directory.files.find((f) => f.path === filePath)!;
    const filename = path.basename(filePath);
    const targetId = matchEmailToCandidate(row.email, candidates);

    const key = targetId === null ? `unmatched/${row.folder}-${filename}` : `sertifikat/${targetId}-${filename}`;
    const blob = await put(key, entry.stream(), {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/pdf',
    });
    const fileSize = entry.uncompressedSize;

    if (targetId === null) {
      unmatched.push({ folder: row.folder, email: row.email, blobUrl: blob.url, fileSize });
      continue;
    }

    await db
      .update(sertifikat)
      .set({ fileUrl: blob.url, fileSize, status: 'siap', updatedAt: new Date() })
      .where(eq(sertifikat.id, targetId));

    matched += 1;
  }

  return NextResponse.json({ matched, unmatched, errors });
}
