CREATE TYPE "public"."sertifikat_status" AS ENUM('siap', 'belum');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "kegiatan" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"tanggal_terbit" date NOT NULL,
	"jumlah_jp" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sertifikat" (
	"id" serial PRIMARY KEY NOT NULL,
	"kegiatan_id" integer NOT NULL,
	"nama" text NOT NULL,
	"nik" varchar(16) NOT NULL,
	"nomor" text NOT NULL,
	"file_url" text,
	"file_size" integer,
	"status" "sertifikat_status" DEFAULT 'belum' NOT NULL,
	"unduh_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sertifikat_nomor_unique" UNIQUE("nomor")
);
--> statement-breakpoint
CREATE TABLE "unduhan_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"sertifikat_id" integer NOT NULL,
	"waktu" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
ALTER TABLE "sertifikat" ADD CONSTRAINT "sertifikat_kegiatan_id_kegiatan_id_fk" FOREIGN KEY ("kegiatan_id") REFERENCES "public"."kegiatan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unduhan_log" ADD CONSTRAINT "unduhan_log_sertifikat_id_sertifikat_id_fk" FOREIGN KEY ("sertifikat_id") REFERENCES "public"."sertifikat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sertifikat_nik_idx" ON "sertifikat" USING btree ("nik");--> statement-breakpoint
CREATE INDEX "sertifikat_nama_lower_idx" ON "sertifikat" USING btree (lower("nama"));