import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."bai_viet" ADD COLUMN "vecto" jsonb;
  ALTER TABLE "cms"."_bai_viet_v" ADD COLUMN "version_vecto" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."bai_viet" DROP COLUMN "vecto";
  ALTER TABLE "cms"."_bai_viet_v" DROP COLUMN "version_vecto";`)
}
