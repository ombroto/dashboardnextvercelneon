import wilayahData from '@/data/wilayah-indonesia.json';

const DATA = wilayahData as Record<string, string[]>;

export function listProvinsi(): string[] {
  return Object.keys(DATA);
}

export function listKabupatenKota(provinsi: string): string[] {
  return DATA[provinsi] ?? [];
}
