import { describe, it, expect } from 'vitest';
import { listProvinsi, listKabupatenKota } from '@/lib/wilayah';

describe('wilayah', () => {
  it('lists all provinsi', () => {
    const provinsi = listProvinsi();
    expect(provinsi).toContain('Jawa Tengah');
    expect(provinsi.length).toBeGreaterThan(30);
  });

  it('lists kabupaten/kota for a given provinsi', () => {
    expect(listKabupatenKota('Jawa Tengah')).toContain('KOTA SEMARANG');
  });

  it('returns an empty array for an unknown provinsi', () => {
    expect(listKabupatenKota('Tidak Ada')).toEqual([]);
  });
});
