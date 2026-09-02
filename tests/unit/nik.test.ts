import { describe, it, expect } from 'vitest';
import { normalizeNik, maskNik } from '@/lib/nik';

describe('normalizeNik', () => {
  it('strips non-digit characters', () => {
    expect(normalizeNik('3204-0125-0987-0007')).toBe('3204012509870007');
  });

  it('leaves plain digits unchanged', () => {
    expect(normalizeNik('3204012509870007')).toBe('3204012509870007');
  });
});

describe('maskNik', () => {
  it('keeps the first 4 and last 2 digits, masks the rest', () => {
    expect(maskNik('3204012509870007')).toBe('3204**********07');
  });

  it('returns short input unchanged', () => {
    expect(maskNik('12345')).toBe('12345');
  });
});
