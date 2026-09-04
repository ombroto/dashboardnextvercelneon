import { describe, it, expect } from 'vitest';
import { parseParticipantCsv } from '@/lib/csv';

const HEADER = 'nama_peserta;Username;Email;Provinsi;Kabupaten / kota;Asal instansi';

describe('parseParticipantCsv', () => {
  it('parses a valid peserta CSV row', () => {
    const csv = `${HEADER}\nTriyono, SH., M.Kn;3374082512670005;triyono1225@gmail.com;Jawa Tengah;KABUPATEN WONOGIRI;Universitas Diponegoro`;
    const { rows, errors } = parseParticipantCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toEqual([
      {
        nama: 'Triyono, SH., M.Kn',
        nik: '3374082512670005',
        email: 'triyono1225@gmail.com',
        provinsi: 'Jawa Tengah',
        kabupatenKota: 'KABUPATEN WONOGIRI',
        asalInstansi: 'Universitas Diponegoro',
      },
    ]);
  });

  it('allows blank Provinsi/Kabupaten-kota/Asal instansi', () => {
    const csv = `${HEADER}\nBudi;1234567890123456;budi@example.com;;;`;
    const { rows, errors } = parseParticipantCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows[0]).toEqual({
      nama: 'Budi',
      nik: '1234567890123456',
      email: 'budi@example.com',
      provinsi: '',
      kabupatenKota: '',
      asalInstansi: '',
    });
  });

  it('reports a missing nama_peserta column', () => {
    const csv = `${HEADER}\n;1234567890123456;budi@example.com;Jawa Tengah;KOTA SEMARANG;Undip`;
    const { errors } = parseParticipantCsv(csv);
    expect(errors).toEqual([{ line: 2, message: "Kolom 'nama_peserta' kosong" }]);
  });

  it('reports a missing Email column', () => {
    const csv = `${HEADER}\nBudi;1234567890123456;;Jawa Tengah;KOTA SEMARANG;Undip`;
    const { errors } = parseParticipantCsv(csv);
    expect(errors).toEqual([{ line: 2, message: "Kolom 'email' kosong" }]);
  });

  it('reports a missing Username (NIK) column', () => {
    const csv = `${HEADER}\nBudi;;budi@example.com;Jawa Tengah;KOTA SEMARANG;Undip`;
    const { errors } = parseParticipantCsv(csv);
    expect(errors).toEqual([{ line: 2, message: "Kolom 'username' kosong" }]);
  });
});
