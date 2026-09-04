import { describe, it, expect } from 'vitest';
import { parseParticipantCsv } from '@/lib/csv';

const VALID_CSV = `nik,nama,email,kegiatan,tanggal_terbit,nomor,jam
3204012509870007,Sri Wahyuni,sri.wahyuni@example.com,Diklat Pembudayaan Nilai Pancasila Angkatan VII,2026-06-18,SK-1182/DIK/2026,32
3174052003910012,Bayu Anggara Putra,bayu.anggara@example.com,Diklat Pembudayaan Nilai Pancasila Angkatan VII,2026-06-18,SK-1183/DIK/2026,32`;

describe('parseParticipantCsv', () => {
  it('parses valid rows', () => {
    const { rows, errors } = parseParticipantCsv(VALID_CSV);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      nik: '3204012509870007',
      nama: 'Sri Wahyuni',
      email: 'sri.wahyuni@example.com',
      kegiatan: 'Diklat Pembudayaan Nilai Pancasila Angkatan VII',
      tanggalTerbit: '2026-06-18',
      nomor: 'SK-1182/DIK/2026',
      jam: 32,
    });
  });

  it('reports a missing required column with its line number', () => {
    const csv = `nik,nama,email,kegiatan,tanggal_terbit,nomor,jam
,Sri Wahyuni,sri.wahyuni@example.com,Diklat X,2026-06-18,SK-1182/DIK/2026,32`;
    const { rows, errors } = parseParticipantCsv(csv);
    expect(rows).toHaveLength(0);
    expect(errors).toEqual([{ line: 2, message: "Kolom 'nik' kosong" }]);
  });

  it('reports a missing email column', () => {
    const csv = `nik,nama,email,kegiatan,tanggal_terbit,nomor,jam
3204012509870007,Sri Wahyuni,,Diklat X,2026-06-18,SK-1182/DIK/2026,32`;
    const { rows, errors } = parseParticipantCsv(csv);
    expect(rows).toHaveLength(0);
    expect(errors).toEqual([{ line: 2, message: "Kolom 'email' kosong" }]);
  });

  it('reports a non-numeric jam column', () => {
    const csv = `nik,nama,email,kegiatan,tanggal_terbit,nomor,jam
3204012509870007,Sri Wahyuni,sri.wahyuni@example.com,Diklat X,2026-06-18,SK-1182/DIK/2026,abc`;
    const { rows, errors } = parseParticipantCsv(csv);
    expect(rows).toHaveLength(0);
    expect(errors).toEqual([{ line: 2, message: "Kolom 'jam' harus berupa angka positif" }]);
  });
});
