import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_bai_viet_trang_thai_duyet" AS ENUM('dang_viet', 'cho_duyet', 'can_sua', 'da_duyet');
  CREATE TYPE "cms"."enum__bai_viet_v_version_trang_thai_duyet" AS ENUM('dang_viet', 'cho_duyet', 'can_sua', 'da_duyet');
  ALTER TYPE "cms"."enum_bien_tap_vien_vai_tro" ADD VALUE 'cong_tac_vien' BEFORE 'may_doc';
  ALTER TABLE "cms"."bai_viet" ADD COLUMN "trang_thai_duyet" "cms"."enum_bai_viet_trang_thai_duyet" DEFAULT 'dang_viet';
  ALTER TABLE "cms"."bai_viet" ADD COLUMN "ghi_chu_duyet" varchar;
  ALTER TABLE "cms"."bai_viet" ADD COLUMN "nguoi_tao_id" integer;
  ALTER TABLE "cms"."_bai_viet_v" ADD COLUMN "version_trang_thai_duyet" "cms"."enum__bai_viet_v_version_trang_thai_duyet" DEFAULT 'dang_viet';
  ALTER TABLE "cms"."_bai_viet_v" ADD COLUMN "version_ghi_chu_duyet" varchar;
  ALTER TABLE "cms"."_bai_viet_v" ADD COLUMN "version_nguoi_tao_id" integer;
  ALTER TABLE "cms"."media" ADD COLUMN "sizes_lon_url" varchar;
  ALTER TABLE "cms"."media" ADD COLUMN "sizes_lon_width" numeric;
  ALTER TABLE "cms"."media" ADD COLUMN "sizes_lon_height" numeric;
  ALTER TABLE "cms"."media" ADD COLUMN "sizes_lon_mime_type" varchar;
  ALTER TABLE "cms"."media" ADD COLUMN "sizes_lon_filesize" numeric;
  ALTER TABLE "cms"."media" ADD COLUMN "sizes_lon_filename" varchar;
  ALTER TABLE "cms"."bai_viet" ADD CONSTRAINT "bai_viet_nguoi_tao_id_bien_tap_vien_id_fk" FOREIGN KEY ("nguoi_tao_id") REFERENCES "cms"."bien_tap_vien"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_bai_viet_v" ADD CONSTRAINT "_bai_viet_v_version_nguoi_tao_id_bien_tap_vien_id_fk" FOREIGN KEY ("version_nguoi_tao_id") REFERENCES "cms"."bien_tap_vien"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "bai_viet_trang_thai_duyet_idx" ON "cms"."bai_viet" USING btree ("trang_thai_duyet");
  CREATE INDEX "bai_viet_nguoi_tao_idx" ON "cms"."bai_viet" USING btree ("nguoi_tao_id");
  CREATE INDEX "_bai_viet_v_version_version_trang_thai_duyet_idx" ON "cms"."_bai_viet_v" USING btree ("version_trang_thai_duyet");
  CREATE INDEX "_bai_viet_v_version_version_nguoi_tao_idx" ON "cms"."_bai_viet_v" USING btree ("version_nguoi_tao_id");
  CREATE INDEX "media_sizes_lon_sizes_lon_filename_idx" ON "cms"."media" USING btree ("sizes_lon_filename");
  UPDATE "cms"."bai_viet" SET "trang_thai_duyet" = 'da_duyet' WHERE "_status" = 'published';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   -- Rollback: tài khoản cộng tác viên KHÔNG được hạ thành bien_tap (sẽ thấy nháp mọi người) → chuyển sang may_doc
   -- và tắt khoá API (may_doc không vào được trang quản trị). Quản trị cấp lại vai trò sau khi lên bản mới.
   UPDATE "cms"."bien_tap_vien" SET "vai_tro" = 'may_doc', "enable_a_p_i_key" = false, "api_key" = NULL, "api_key_index" = NULL
     WHERE "vai_tro" = 'cong_tac_vien';
   ALTER TABLE "cms"."bai_viet" DROP CONSTRAINT "bai_viet_nguoi_tao_id_bien_tap_vien_id_fk";
  
  ALTER TABLE "cms"."_bai_viet_v" DROP CONSTRAINT "_bai_viet_v_version_nguoi_tao_id_bien_tap_vien_id_fk";
  
  ALTER TABLE "cms"."bien_tap_vien" ALTER COLUMN "vai_tro" SET DATA TYPE text;
  ALTER TABLE "cms"."bien_tap_vien" ALTER COLUMN "vai_tro" SET DEFAULT 'bien_tap'::text;
  DROP TYPE "cms"."enum_bien_tap_vien_vai_tro";
  CREATE TYPE "cms"."enum_bien_tap_vien_vai_tro" AS ENUM('quan_tri', 'chu_bien', 'bien_tap', 'may_doc');
  ALTER TABLE "cms"."bien_tap_vien" ALTER COLUMN "vai_tro" SET DEFAULT 'bien_tap'::"cms"."enum_bien_tap_vien_vai_tro";
  ALTER TABLE "cms"."bien_tap_vien" ALTER COLUMN "vai_tro" SET DATA TYPE "cms"."enum_bien_tap_vien_vai_tro" USING "vai_tro"::"cms"."enum_bien_tap_vien_vai_tro";
  DROP INDEX "cms"."bai_viet_trang_thai_duyet_idx";
  DROP INDEX "cms"."bai_viet_nguoi_tao_idx";
  DROP INDEX "cms"."_bai_viet_v_version_version_trang_thai_duyet_idx";
  DROP INDEX "cms"."_bai_viet_v_version_version_nguoi_tao_idx";
  DROP INDEX "cms"."media_sizes_lon_sizes_lon_filename_idx";
  ALTER TABLE "cms"."bai_viet" DROP COLUMN "trang_thai_duyet";
  ALTER TABLE "cms"."bai_viet" DROP COLUMN "ghi_chu_duyet";
  ALTER TABLE "cms"."bai_viet" DROP COLUMN "nguoi_tao_id";
  ALTER TABLE "cms"."_bai_viet_v" DROP COLUMN "version_trang_thai_duyet";
  ALTER TABLE "cms"."_bai_viet_v" DROP COLUMN "version_ghi_chu_duyet";
  ALTER TABLE "cms"."_bai_viet_v" DROP COLUMN "version_nguoi_tao_id";
  ALTER TABLE "cms"."media" DROP COLUMN "sizes_lon_url";
  ALTER TABLE "cms"."media" DROP COLUMN "sizes_lon_width";
  ALTER TABLE "cms"."media" DROP COLUMN "sizes_lon_height";
  ALTER TABLE "cms"."media" DROP COLUMN "sizes_lon_mime_type";
  ALTER TABLE "cms"."media" DROP COLUMN "sizes_lon_filesize";
  ALTER TABLE "cms"."media" DROP COLUMN "sizes_lon_filename";
  DROP TYPE "cms"."enum_bai_viet_trang_thai_duyet";
  DROP TYPE "cms"."enum__bai_viet_v_version_trang_thai_duyet";`)
}
