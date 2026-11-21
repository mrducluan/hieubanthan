import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// RY-1 — nhận bài RankYak: giá trị "rankyak" cho nguồn bài + cột rankyak_id (mã bài bên RankYak, để bản cập nhật ghi
// đúng bài). Kèm: thêm "nhan-tuong", "tarot" vào các enum của "Lối đi tiếp" — code đã có hai lựa chọn này (NT-1, TR-1)
// nhưng migration chưa thêm, chọn chúng trong CMS sẽ lỗi. IF NOT EXISTS: DB nào đã tự thêm thì bỏ qua.
// down: gỡ phần RankYak (bài "rankyak" đổi về "cms"); KHÔNG gỡ hai giá trị "Lối đi tiếp" (code đang dùng).

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "cms"."enum_bai_viet_nguon_goc" ADD VALUE IF NOT EXISTS 'rankyak';
  ALTER TYPE "cms"."enum__bai_viet_v_version_nguon_goc" ADD VALUE IF NOT EXISTS 'rankyak';
  ALTER TYPE "cms"."enum_noi_dung_trang_loi_di_tiep_hinh" ADD VALUE IF NOT EXISTS 'nhan-tuong';
  ALTER TYPE "cms"."enum_noi_dung_trang_loi_di_tiep_hinh" ADD VALUE IF NOT EXISTS 'tarot';
  ALTER TYPE "cms"."enum__noi_dung_trang_v_version_loi_di_tiep_hinh" ADD VALUE IF NOT EXISTS 'nhan-tuong';
  ALTER TYPE "cms"."enum__noi_dung_trang_v_version_loi_di_tiep_hinh" ADD VALUE IF NOT EXISTS 'tarot';
  ALTER TYPE "cms"."enum_loi_di_tiep_nhom_the_hinh" ADD VALUE IF NOT EXISTS 'nhan-tuong';
  ALTER TYPE "cms"."enum_loi_di_tiep_nhom_the_hinh" ADD VALUE IF NOT EXISTS 'tarot';
  ALTER TYPE "cms"."enum_loi_di_tiep_nhom_tru" ADD VALUE IF NOT EXISTS '/nhan-tuong' BEFORE 'chung';
  ALTER TYPE "cms"."enum_loi_di_tiep_nhom_tru" ADD VALUE IF NOT EXISTS '/tarot' BEFORE 'chung';
  ALTER TABLE "cms"."bai_viet" ADD COLUMN "rankyak_id" numeric;
  ALTER TABLE "cms"."_bai_viet_v" ADD COLUMN "version_rankyak_id" numeric;
  CREATE INDEX "bai_viet_rankyak_id_idx" ON "cms"."bai_viet" USING btree ("rankyak_id");
  CREATE INDEX "_bai_viet_v_version_version_rankyak_id_idx" ON "cms"."_bai_viet_v" USING btree ("version_rankyak_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "cms"."bai_viet" SET "nguon_goc" = 'cms' WHERE "nguon_goc" = 'rankyak';
  UPDATE "cms"."_bai_viet_v" SET "version_nguon_goc" = 'cms' WHERE "version_nguon_goc" = 'rankyak';
   ALTER TABLE "cms"."bai_viet" ALTER COLUMN "nguon_goc" SET DATA TYPE text;
  ALTER TABLE "cms"."bai_viet" ALTER COLUMN "nguon_goc" SET DEFAULT 'cms'::text;
  DROP TYPE "cms"."enum_bai_viet_nguon_goc";
  CREATE TYPE "cms"."enum_bai_viet_nguon_goc" AS ENUM('cms', 'notfair');
  ALTER TABLE "cms"."bai_viet" ALTER COLUMN "nguon_goc" SET DEFAULT 'cms'::"cms"."enum_bai_viet_nguon_goc";
  ALTER TABLE "cms"."bai_viet" ALTER COLUMN "nguon_goc" SET DATA TYPE "cms"."enum_bai_viet_nguon_goc" USING "nguon_goc"::"cms"."enum_bai_viet_nguon_goc";
  ALTER TABLE "cms"."_bai_viet_v" ALTER COLUMN "version_nguon_goc" SET DATA TYPE text;
  ALTER TABLE "cms"."_bai_viet_v" ALTER COLUMN "version_nguon_goc" SET DEFAULT 'cms'::text;
  DROP TYPE "cms"."enum__bai_viet_v_version_nguon_goc";
  CREATE TYPE "cms"."enum__bai_viet_v_version_nguon_goc" AS ENUM('cms', 'notfair');
  ALTER TABLE "cms"."_bai_viet_v" ALTER COLUMN "version_nguon_goc" SET DEFAULT 'cms'::"cms"."enum__bai_viet_v_version_nguon_goc";
  ALTER TABLE "cms"."_bai_viet_v" ALTER COLUMN "version_nguon_goc" SET DATA TYPE "cms"."enum__bai_viet_v_version_nguon_goc" USING "version_nguon_goc"::"cms"."enum__bai_viet_v_version_nguon_goc";
  DROP INDEX "cms"."bai_viet_rankyak_id_idx";
  DROP INDEX "cms"."_bai_viet_v_version_version_rankyak_id_idx";
  ALTER TABLE "cms"."bai_viet" DROP COLUMN "rankyak_id";
  ALTER TABLE "cms"."_bai_viet_v" DROP COLUMN "version_rankyak_id";`)
}
