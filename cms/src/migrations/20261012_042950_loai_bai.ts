import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_bai_viet_loai_bai" AS ENUM('bai_viet', 'tin_tuc', 'huong_dan');
  CREATE TYPE "cms"."enum__bai_viet_v_version_loai_bai" AS ENUM('bai_viet', 'tin_tuc', 'huong_dan');
  ALTER TABLE "cms"."bai_viet" ADD COLUMN "loai_bai" "cms"."enum_bai_viet_loai_bai" DEFAULT 'bai_viet';
  ALTER TABLE "cms"."_bai_viet_v" ADD COLUMN "version_loai_bai" "cms"."enum__bai_viet_v_version_loai_bai" DEFAULT 'bai_viet';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."bai_viet" DROP COLUMN "loai_bai";
  ALTER TABLE "cms"."_bai_viet_v" DROP COLUMN "version_loai_bai";
  DROP TYPE "cms"."enum_bai_viet_loai_bai";
  DROP TYPE "cms"."enum__bai_viet_v_version_loai_bai";`)
}
