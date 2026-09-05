import { pgTable, serial, text, varchar, integer, timestamp, pgEnum, date, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const sertifikatStatus = pgEnum('sertifikat_status', ['siap', 'belum']);
export const kegiatanSegmen = pgEnum('kegiatan_segmen', ['Aparatur Negara', 'Orsospol', 'KML', 'Purnapaskibraka']);
export const modePenyelenggaraan = pgEnum('mode_penyelenggaraan', ['Luring', 'Daring', 'Hybrid']);

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const kegiatan = pgTable('kegiatan', {
  id: serial('id').primaryKey(),
  nama: text('nama').notNull(),
  jumlahJp: integer('jumlah_jp').notNull(),
  tahun: integer('tahun'),
  segmen: kegiatanSegmen('segmen'),
  tanggalMulai: date('tanggal_mulai'),
  tanggalSelesai: date('tanggal_selesai'),
  provinsi: text('provinsi'),
  kabupatenKota: text('kabupaten_kota'),
  modePenyelenggaraan: modePenyelenggaraan('mode_penyelenggaraan'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sertifikat = pgTable(
  'sertifikat',
  {
    id: serial('id').primaryKey(),
    kegiatanId: integer('kegiatan_id')
      .notNull()
      .references(() => kegiatan.id, { onDelete: 'cascade' }),
    nama: text('nama').notNull(),
    nik: varchar('nik', { length: 16 }).notNull(),
    email: text('email'),
    provinsi: text('provinsi'),
    kabupatenKota: text('kabupaten_kota'),
    asalInstansi: text('asal_instansi'),
    fileUrl: text('file_url'),
    fileSize: integer('file_size'),
    status: sertifikatStatus('status').notNull().default('belum'),
    unduhCount: integer('unduh_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('sertifikat_nik_idx').on(table.nik),
    index('sertifikat_nama_lower_idx').on(sql`lower(${table.nama})`),
    index('sertifikat_email_lower_idx').on(sql`lower(${table.email})`),
    uniqueIndex('sertifikat_kegiatan_nik_unique').on(table.kegiatanId, table.nik),
  ]
);

export const unduhanLog = pgTable('unduhan_log', {
  id: serial('id').primaryKey(),
  sertifikatId: integer('sertifikat_id')
    .notNull()
    .references(() => sertifikat.id, { onDelete: 'cascade' }),
  waktu: timestamp('waktu', { withTimezone: true }).notNull().defaultNow(),
  ip: text('ip').notNull(),
  userAgent: text('user_agent'),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type Kegiatan = typeof kegiatan.$inferSelect;
export type Sertifikat = typeof sertifikat.$inferSelect;
export type UnduhanLog = typeof unduhanLog.$inferSelect;
