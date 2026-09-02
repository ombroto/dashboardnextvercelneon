import { describe, it, expect } from 'vitest';
import { extractNomorPrefix, parseManifestCsv, matchFilenameToCandidate } from '@/lib/zip-match';

describe('extractNomorPrefix', () => {
  it('takes the part before the first slash', () => {
    expect(extractNomorPrefix('SK-1182/DIK/2026')).toBe('SK-1182');
  });

  it('returns the whole string when there is no slash', () => {
    expect(extractNomorPrefix('SK-1182')).toBe('SK-1182');
  });
});

describe('parseManifestCsv', () => {
  it('parses nik,nomor,file rows', () => {
    const csv = `nik,nomor,file
3204012509870007,SK-1182/DIK/2026,3204012509870007_SK-1182.pdf`;
    expect(parseManifestCsv(csv)).toEqual([
      { nik: '3204012509870007', nomor: 'SK-1182/DIK/2026', file: '3204012509870007_SK-1182.pdf' },
    ]);
  });
});

describe('matchFilenameToCandidate', () => {
  const candidates = [
    { id: 1, nik: '3204012509870007', nomor: 'SK-1182/DIK/2026' },
    { id: 2, nik: '3204012509870007', nomor: 'SK-0741/DIK/2026' },
    { id: 3, nik: '3174052003910012', nomor: 'SK-1183/DIK/2026' },
  ];

  it('matches by nik + nomor prefix', () => {
    expect(matchFilenameToCandidate('3204012509870007_SK-1182.pdf', candidates)).toBe(1);
  });

  it('disambiguates a nik with multiple certificates by nomor prefix', () => {
    expect(matchFilenameToCandidate('3204012509870007_SK-0741.pdf', candidates)).toBe(2);
  });

  it('returns null when nothing matches', () => {
    expect(matchFilenameToCandidate('9999999999999999_SK-9999.pdf', candidates)).toBeNull();
  });
});
