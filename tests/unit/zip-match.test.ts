import { describe, it, expect } from 'vitest';
import { parseManifestCsv, matchEmailToCandidate, pickFirstFileAlphabetically } from '@/lib/zip-match';

describe('parseManifestCsv', () => {
  it('parses semicolon-delimited folder;email rows', () => {
    const csv = `folder;email
tri_joko;trijokoundip@gmail.com
prof._ir._bambang_sulistiyanto,_m.agr.sc.,_ph.d.;bsoel07@gmail.com`;
    expect(parseManifestCsv(csv)).toEqual([
      { folder: 'tri_joko', email: 'trijokoundip@gmail.com' },
      { folder: 'prof._ir._bambang_sulistiyanto,_m.agr.sc.,_ph.d.', email: 'bsoel07@gmail.com' },
    ]);
  });

  it('lowercases email for case-insensitive matching later', () => {
    const csv = `folder;email
budi;Budi.Santoso@Example.COM`;
    expect(parseManifestCsv(csv)).toEqual([{ folder: 'budi', email: 'budi.santoso@example.com' }]);
  });
});

describe('matchEmailToCandidate', () => {
  const candidates = [
    { id: 1, email: 'budi@example.com' },
    { id: 2, email: 'siti@example.com' },
    { id: 3, email: null },
  ];

  it('matches by email, case-insensitively', () => {
    expect(matchEmailToCandidate('Budi@Example.com', candidates)).toBe(1);
  });

  it('returns null when nothing matches', () => {
    expect(matchEmailToCandidate('unknown@example.com', candidates)).toBeNull();
  });

  it('ignores candidates with no email on file', () => {
    expect(matchEmailToCandidate('', candidates)).toBeNull();
  });
});

describe('pickFirstFileAlphabetically', () => {
  it('returns the alphabetically-first filename when there are multiple', () => {
    expect(pickFirstFileAlphabetically(['sertifikat.pdf', 'certificate.pdf', 'document.pdf'])).toBe('certificate.pdf');
  });

  it('returns the only filename when there is just one', () => {
    expect(pickFirstFileAlphabetically(['certificate.pdf'])).toBe('certificate.pdf');
  });

  it('returns null for an empty folder', () => {
    expect(pickFirstFileAlphabetically([])).toBeNull();
  });
});
