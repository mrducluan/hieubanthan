import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// ND-7 — "Chữ trên trang": cột jsonb `chu` (khoá → chữ thay) cho Trang website + Mẫu cụm trang; Mẫu cụm thêm `mac_dinh`
// (bảng chữ mặc định do sổ trang gửi); nhóm mới `cong_cu_con` (trang con theo ngày/năm của công cụ, tác giả — ghi đè).
// Down: xoá tài liệu nhóm cong_cu_con (chỉ là khối/chữ ghi đè, web tự về chữ trong code) trước khi thu hẹp kiểu enum.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "cms"."enum_noi_dung_trang_nhom" ADD VALUE 'cong_cu_con';
  ALTER TYPE "cms"."enum__noi_dung_trang_v_version_nhom" ADD VALUE 'cong_cu_con';
  ALTER TYPE "cms"."enum_mau_cum_nhom" ADD VALUE 'cong_cu_con';
  ALTER TYPE "cms"."enum__mau_cum_v_version_nhom" ADD VALUE 'cong_cu_con';
  ALTER TABLE "cms"."noi_dung_trang" ADD COLUMN "chu" jsonb;
  ALTER TABLE "cms"."_noi_dung_trang_v" ADD COLUMN "version_chu" jsonb;
  ALTER TABLE "cms"."mau_cum" ADD COLUMN "mac_dinh" jsonb;
  ALTER TABLE "cms"."mau_cum" ADD COLUMN "chu" jsonb;
  ALTER TABLE "cms"."_mau_cum_v" ADD COLUMN "version_mac_dinh" jsonb;
  ALTER TABLE "cms"."_mau_cum_v" ADD COLUMN "version_chu" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DELETE FROM "cms"."_noi_dung_trang_v" WHERE "version_nhom"::text = 'cong_cu_con';
  DELETE FROM "cms"."noi_dung_trang" WHERE "nhom"::text = 'cong_cu_con';
  DELETE FROM "cms"."_mau_cum_v" WHERE "version_nhom"::text = 'cong_cu_con';
  DELETE FROM "cms"."mau_cum" WHERE "nhom"::text = 'cong_cu_con';
   ALTER TABLE "cms"."noi_dung_trang" ALTER COLUMN "nhom" SET DATA TYPE text;
  DROP TYPE "cms"."enum_noi_dung_trang_nhom";
  CREATE TYPE "cms"."enum_noi_dung_trang_nhom" AS ENUM('cong_cu', 'tinh', 'phap_ly', 'chu_de', 'kien_thuc', 'tuoi', 'la_so_mau', 'blog_khung');
  ALTER TABLE "cms"."noi_dung_trang" ALTER COLUMN "nhom" SET DATA TYPE "cms"."enum_noi_dung_trang_nhom" USING "nhom"::"cms"."enum_noi_dung_trang_nhom";
  ALTER TABLE "cms"."_noi_dung_trang_v" ALTER COLUMN "version_nhom" SET DATA TYPE text;
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_nhom";
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_nhom" AS ENUM('cong_cu', 'tinh', 'phap_ly', 'chu_de', 'kien_thuc', 'tuoi', 'la_so_mau', 'blog_khung');
  ALTER TABLE "cms"."_noi_dung_trang_v" ALTER COLUMN "version_nhom" SET DATA TYPE "cms"."enum__noi_dung_trang_v_version_nhom" USING "version_nhom"::"cms"."enum__noi_dung_trang_v_version_nhom";
  ALTER TABLE "cms"."mau_cum" ALTER COLUMN "nhom" SET DATA TYPE text;
  DROP TYPE "cms"."enum_mau_cum_nhom";
  CREATE TYPE "cms"."enum_mau_cum_nhom" AS ENUM('cong_cu', 'tinh', 'phap_ly', 'chu_de', 'kien_thuc', 'tuoi', 'la_so_mau', 'blog_khung');
  ALTER TABLE "cms"."mau_cum" ALTER COLUMN "nhom" SET DATA TYPE "cms"."enum_mau_cum_nhom" USING "nhom"::"cms"."enum_mau_cum_nhom";
  ALTER TABLE "cms"."_mau_cum_v" ALTER COLUMN "version_nhom" SET DATA TYPE text;
  DROP TYPE "cms"."enum__mau_cum_v_version_nhom";
  CREATE TYPE "cms"."enum__mau_cum_v_version_nhom" AS ENUM('cong_cu', 'tinh', 'phap_ly', 'chu_de', 'kien_thuc', 'tuoi', 'la_so_mau', 'blog_khung');
  ALTER TABLE "cms"."_mau_cum_v" ALTER COLUMN "version_nhom" SET DATA TYPE "cms"."enum__mau_cum_v_version_nhom" USING "version_nhom"::"cms"."enum__mau_cum_v_version_nhom";
  ALTER TABLE "cms"."noi_dung_trang" DROP COLUMN "chu";
  ALTER TABLE "cms"."_noi_dung_trang_v" DROP COLUMN "version_chu";
  ALTER TABLE "cms"."mau_cum" DROP COLUMN "mac_dinh";
  ALTER TABLE "cms"."mau_cum" DROP COLUMN "chu";
  ALTER TABLE "cms"."_mau_cum_v" DROP COLUMN "version_mac_dinh";
  ALTER TABLE "cms"."_mau_cum_v" DROP COLUMN "version_chu";`)
}
