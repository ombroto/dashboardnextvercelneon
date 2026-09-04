import { pgTable, serial, text, varchar, integer, timestamp, pgEnum, date, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const sertifikatStatus = pgEnum('sertifikat_status', ['siap', 'belum']);

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
  tanggalTerbit: date('tanggal_terbit').notNull(),
  jumlahJp: integer('jumlah_jp').notNull(),
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
    nomor: text('nomor').notNull().unique(),
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
