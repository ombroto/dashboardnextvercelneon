import { parse } from 'csv-parse/sync';
import { normalizeNik } from './nik';

export interface ParticipantRow {
  nama: string;
  nik: string;
  email: string;
  provinsi: string;
  kabupatenKota: string;
  asalInstansi: string;
}

export interface CsvRowError {
  line: number;
  message: string;
}

export interface ParseParticipantCsvResult {
  rows: ParticipantRow[];
  errors: CsvRowError[];
}

const REQUIRED_COLUMNS = ['nama_peserta', 'username', 'email'] as const;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function parseParticipantCsv(csvText: string): ParseParticipantCsvResult {
  const records: Record<string, string>[] = parse(csvText, {
    columns: (header: string[]) => header.map(normalizeHeader),
    skip_empty_lines: true,
    trim: true,
    delimiter: ';',
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

    rows.push({
      nama: record.nama_peserta,
      nik: normalizeNik(record.username),
      email: record.email,
      provinsi: record.provinsi ?? '',
      kabupatenKota: record['kabupaten / kota'] ?? '',
      asalInstansi: record['asal instansi'] ?? '',
    });
  });

  return { rows, errors };
}
