-- Create new enums
CREATE TYPE "public"."kegiatan_segmen" AS ENUM('Aparatur Negara', 'Orsospol', 'KML', 'Purnapaskibraka');--> statement-breakpoint
CREATE TYPE "public"."mode_penyelenggaraan" AS ENUM('Luring', 'Daring', 'Hybrid');--> statement-breakpoint

-- Add new columns to kegiatan table
ALTER TABLE "kegiatan" ADD COLUMN "tahun" integer;--> statement-breakpoint
ALTER TABLE "kegiatan" ADD COLUMN "segmen" "public"."kegiatan_segmen";--> statement-breakpoint
ALTER TABLE "kegiatan" ADD COLUMN "tanggal_mulai" date;--> statement-breakpoint
ALTER TABLE "kegiatan" ADD COLUMN "tanggal_selesai" date;--> statement-breakpoint
ALTER TABLE "kegiatan" ADD COLUMN "provinsi" text;--> statement-breakpoint
ALTER TABLE "kegiatan" ADD COLUMN "kabupaten_kota" text;--> statement-breakpoint
ALTER TABLE "kegiatan" ADD COLUMN "mode_penyelenggaraan" "public"."mode_penyelenggaraan";--> statement-breakpoint
ALTER TABLE "kegiatan" ADD COLUMN "logo_url" text;--> statement-breakpoint

-- Drop tanggal_terbit from kegiatan
ALTER TABLE "kegiatan" DROP COLUMN "tanggal_terbit";--> statement-breakpoint

-- Add new columns to sertifikat table
ALTER TABLE "sertifikat" ADD COLUMN "provinsi" text;--> statement-breakpoint
ALTER TABLE "sertifikat" ADD COLUMN "kabupaten_kota" text;--> statement-breakpoint
ALTER TABLE "sertifikat" ADD COLUMN "asal_instansi" text;--> statement-breakpoint

-- Drop nomor column and its unique constraint from sertifikat
ALTER TABLE "sertifikat" DROP CONSTRAINT "sertifikat_nomor_unique";--> statement-breakpoint
ALTER TABLE "sertifikat" DROP COLUMN "nomor";
