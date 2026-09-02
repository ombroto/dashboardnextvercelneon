import { parse } from 'csv-parse/sync';
import { normalizeNik } from './nik';

export interface ParticipantRow {
  nik: string;
  nama: string;
  kegiatan: string;
  tanggalTerbit: string;
  nomor: string;
  jam: number;
}

export interface CsvRowError {
  line: number;
  message: string;
}

export interface ParseParticipantCsvResult {
  rows: ParticipantRow[];
  errors: CsvRowError[];
}

const REQUIRED_COLUMNS = ['nik', 'nama', 'kegiatan', 'tanggal_terbit', 'nomor', 'jam'] as const;

export function parseParticipantCsv(csvText: string): ParseParticipantCsvResult {
  const records: Record<string, string>[] = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const rows: ParticipantRow[] = [];
  const errors: CsvRowError[] = [];

  records.forEach((record, index) => {
    const line = index + 2;
    const missing = REQUIRED_COLUMNS.find((col) => !record[col]);
    if (missing) {
      errors.push({ line, message: `Kolom '${missing}' kosong` });
      return;
    }

    const jam = Number(record.jam);
    if (!Number.isFinite(jam) || jam <= 0) {
      errors.push({ line, message: "Kolom 'jam' harus berupa angka positif" });
      return;
    }

    rows.push({
      nik: normalizeNik(record.nik),
      nama: record.nama,
      kegiatan: record.kegiatan,
      tanggalTerbit: record.tanggal_terbit,
      nomor: record.nomor,
      jam,
    });
  });

  return { rows, errors };
}
