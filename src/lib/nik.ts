export function normalizeNik(input: string): string {
  return input.replace(/\D/g, '');
}

export function maskNik(nik: string): string {
  const digits = normalizeNik(nik);
  if (digits.length <= 6) return digits;
  const start = digits.slice(0, 4);
  const end = digits.slice(-2);
  const middle = '*'.repeat(digits.length - 6);
  return `${start}${middle}${end}`;
}
