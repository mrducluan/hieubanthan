import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."bien_tap_vien" ADD COLUMN "mfa_bat" boolean DEFAULT false;
  ALTER TABLE "cms"."bien_tap_vien" ADD COLUMN "mfa_bi_mat" varchar;
  ALTER TABLE "cms"."bien_tap_vien" ADD COLUMN "mfa_buoc_cuoi" numeric;
  ALTER TABLE "cms"."bien_tap_vien" ADD COLUMN "mfa_sai" numeric;
  ALTER TABLE "cms"."bien_tap_vien" ADD COLUMN "mfa_khoa_den" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."bien_tap_vien" DROP COLUMN "mfa_bat";
  ALTER TABLE "cms"."bien_tap_vien" DROP COLUMN "mfa_bi_mat";
  ALTER TABLE "cms"."bien_tap_vien" DROP COLUMN "mfa_buoc_cuoi";
  ALTER TABLE "cms"."bien_tap_vien" DROP COLUMN "mfa_sai";
  ALTER TABLE "cms"."bien_tap_vien" DROP COLUMN "mfa_khoa_den";`)
}
