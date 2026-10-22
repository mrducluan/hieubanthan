import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// ND-7 đợt 2 — "Hình trên trang": cột jsonb `hinh` (khoá → ảnh chụp từ Thư viện ảnh) cho Trang website + Mẫu cụm trang;
// global "Chữ dùng chung" (bảng chu_chung: mac_dinh = bảng chữ gốc do đồng bộ ghi, chu = chữ thay).

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "cms"."chu_chung" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"mac_dinh" jsonb,
  	"chu" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "cms"."noi_dung_trang" ADD COLUMN "hinh" jsonb;
  ALTER TABLE "cms"."_noi_dung_trang_v" ADD COLUMN "version_hinh" jsonb;
  ALTER TABLE "cms"."mau_cum" ADD COLUMN "hinh" jsonb;
  ALTER TABLE "cms"."_mau_cum_v" ADD COLUMN "version_hinh" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms"."chu_chung" CASCADE;
  ALTER TABLE "cms"."noi_dung_trang" DROP COLUMN "hinh";
  ALTER TABLE "cms"."_noi_dung_trang_v" DROP COLUMN "version_hinh";
  ALTER TABLE "cms"."mau_cum" DROP COLUMN "hinh";
  ALTER TABLE "cms"."_mau_cum_v" DROP COLUMN "version_hinh";`)
}
