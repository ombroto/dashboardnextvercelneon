import { parse } from 'csv-parse/sync';

export interface ManifestRow {
  folder: string;
  email: string;
}

// manifest.csv uses `;` as its delimiter, not `,` -- participant folder names
// routinely contain commas (e.g. "Prof. Ir. Budi, M.Sc."), which would
// otherwise be ambiguous with a comma-delimited format.
export function parseManifestCsv(csvText: string): ManifestRow[] {
  const records: Record<string, string>[] = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: ';',
  });
  return records.map((r) => ({
    folder: r.folder,
    email: r.email.trim().toLowerCase(),
  }));
}

export interface MatchCandidate {
  id: number;
  email: string | null;
}

export function matchEmailToCandidate(email: string, candidates: MatchCandidate[]): number | null {
  const normalized = email.trim().toLowerCase();
  const matches = candidates.filter((c) => c.email?.trim().toLowerCase() === normalized);
  return matches.length === 1 ? matches[0].id : null;
}

// Per-participant folders may contain more than one file; the rule is to use
// whichever one sorts first alphabetically by filename.
export function pickFirstFileAlphabetically(filenames: string[]): string | null {
  if (filenames.length === 0) return null;
  return [...filenames].sort((a, b) => a.localeCompare(b))[0];
}
