import { parse } from 'csv-parse/sync';
import { normalizeNik } from './nik';

export interface ManifestRow {
  nik: string;
  nomor: string;
  file: string;
}

export function parseManifestCsv(csvText: string): ManifestRow[] {
  const records: Record<string, string>[] = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records.map((r) => ({
    nik: normalizeNik(r.nik),
    nomor: r.nomor,
    file: r.file,
  }));
}

export function extractNomorPrefix(nomor: string): string {
  const slashIndex = nomor.indexOf('/');
  return slashIndex === -1 ? nomor : nomor.slice(0, slashIndex);
}

export interface MatchCandidate {
  id: number;
  nik: string;
  nomor: string;
}

export function matchFilenameToCandidate(filename: string, candidates: MatchCandidate[]): number | null {
  const baseName = filename.replace(/\.pdf$/i, '');
  const matches = candidates.filter((c) => baseName === `${c.nik}_${extractNomorPrefix(c.nomor)}`);
  return matches.length === 1 ? matches[0].id : null;
}
