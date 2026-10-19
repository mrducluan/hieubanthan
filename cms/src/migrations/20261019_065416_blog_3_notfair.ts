import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// BLOG-3 — bài nhập từ NotFair: cột "nguon_goc" (cms | notfair). Danh sách link đối tác (notfair_lien_ket, text hasMany)
// nằm trong bảng bai_viet_texts sẵn có → không cần bảng mới.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_bai_viet_nguon_goc" AS ENUM('cms', 'notfair');
  CREATE TYPE "cms"."enum__bai_viet_v_version_nguon_goc" AS ENUM('cms', 'notfair');
  ALTER TABLE "cms"."bai_viet" ADD COLUMN "nguon_goc" "cms"."enum_bai_viet_nguon_goc" DEFAULT 'cms';
  ALTER TABLE "cms"."_bai_viet_v" ADD COLUMN "version_nguon_goc" "cms"."enum__bai_viet_v_version_nguon_goc" DEFAULT 'cms';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."bai_viet" DROP COLUMN "nguon_goc";
  ALTER TABLE "cms"."_bai_viet_v" DROP COLUMN "version_nguon_goc";
  DROP TYPE "cms"."enum_bai_viet_nguon_goc";
  DROP TYPE "cms"."enum__bai_viet_v_version_nguon_goc";`)
}
