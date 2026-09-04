ALTER TABLE "sertifikat" ADD COLUMN "email" text;--> statement-breakpoint
CREATE INDEX "sertifikat_email_lower_idx" ON "sertifikat" USING btree (lower("email"));