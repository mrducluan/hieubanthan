import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
// CTA-2 — global "Lối đi tiếp cuối trang" (nhóm thẻ theo mảng) + tab "Lối đi tiếp" của Trang website (thẻ ưu tiên từng URL).
// Chỉ thêm bảng mới; down xoá đúng các bảng / kiểu đó.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_noi_dung_trang_loi_di_tiep_nhan" AS ENUM('kien_thuc', 'cong_cu', 'thu_vien');
  CREATE TYPE "cms"."enum_noi_dung_trang_loi_di_tiep_hinh" AS ENUM('than-so', 'tu-vi', 'bat-tu', 'kinh-dich', 'phong-thuy');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_loi_di_tiep_nhan" AS ENUM('kien_thuc', 'cong_cu', 'thu_vien');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_loi_di_tiep_hinh" AS ENUM('than-so', 'tu-vi', 'bat-tu', 'kinh-dich', 'phong-thuy');
  CREATE TYPE "cms"."enum_loi_di_tiep_nhom_the_nhan" AS ENUM('kien_thuc', 'cong_cu', 'thu_vien');
  CREATE TYPE "cms"."enum_loi_di_tiep_nhom_the_hinh" AS ENUM('than-so', 'tu-vi', 'bat-tu', 'kinh-dich', 'phong-thuy');
  CREATE TYPE "cms"."enum_loi_di_tiep_nhom_tru" AS ENUM('/than-so', '/hop-doi', '/tu-vi', '/bat-tu', '/kinh-dich', '/phong-thuy', 'chung');
  CREATE TABLE "cms"."noi_dung_trang_loi_di_tiep" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"duong" varchar,
  	"ten" varchar,
  	"mo_ta" varchar,
  	"nhan" "cms"."enum_noi_dung_trang_loi_di_tiep_nhan" DEFAULT 'kien_thuc',
  	"hinh" "cms"."enum_noi_dung_trang_loi_di_tiep_hinh" DEFAULT 'than-so'
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_version_loi_di_tiep" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"duong" varchar,
  	"ten" varchar,
  	"mo_ta" varchar,
  	"nhan" "cms"."enum__noi_dung_trang_v_version_loi_di_tiep_nhan" DEFAULT 'kien_thuc',
  	"hinh" "cms"."enum__noi_dung_trang_v_version_loi_di_tiep_hinh" DEFAULT 'than-so',
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."loi_di_tiep_nhom_the" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"duong" varchar NOT NULL,
  	"ten" varchar NOT NULL,
  	"mo_ta" varchar NOT NULL,
  	"nhan" "cms"."enum_loi_di_tiep_nhom_the_nhan" DEFAULT 'kien_thuc' NOT NULL,
  	"hinh" "cms"."enum_loi_di_tiep_nhom_the_hinh" DEFAULT 'than-so' NOT NULL
  );
  
  CREATE TABLE "cms"."loi_di_tiep_nhom" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tru" "cms"."enum_loi_di_tiep_nhom_tru" NOT NULL
  );
  
  CREATE TABLE "cms"."loi_di_tiep" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bat" boolean DEFAULT true,
  	"cum_truoc" boolean DEFAULT true,
  	"tu_xep" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "cms"."noi_dung_trang_loi_di_tiep" ADD CONSTRAINT "noi_dung_trang_loi_di_tiep_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_version_loi_di_tiep" ADD CONSTRAINT "_noi_dung_trang_v_version_loi_di_tiep_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."loi_di_tiep_nhom_the" ADD CONSTRAINT "loi_di_tiep_nhom_the_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."loi_di_tiep_nhom"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."loi_di_tiep_nhom" ADD CONSTRAINT "loi_di_tiep_nhom_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."loi_di_tiep"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "noi_dung_trang_loi_di_tiep_order_idx" ON "cms"."noi_dung_trang_loi_di_tiep" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_loi_di_tiep_parent_id_idx" ON "cms"."noi_dung_trang_loi_di_tiep" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_version_loi_di_tiep_order_idx" ON "cms"."_noi_dung_trang_v_version_loi_di_tiep" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_version_loi_di_tiep_parent_id_idx" ON "cms"."_noi_dung_trang_v_version_loi_di_tiep" USING btree ("_parent_id");
  CREATE INDEX "loi_di_tiep_nhom_the_order_idx" ON "cms"."loi_di_tiep_nhom_the" USING btree ("_order");
  CREATE INDEX "loi_di_tiep_nhom_the_parent_id_idx" ON "cms"."loi_di_tiep_nhom_the" USING btree ("_parent_id");
  CREATE INDEX "loi_di_tiep_nhom_order_idx" ON "cms"."loi_di_tiep_nhom" USING btree ("_order");
  CREATE INDEX "loi_di_tiep_nhom_parent_id_idx" ON "cms"."loi_di_tiep_nhom" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms"."noi_dung_trang_loi_di_tiep" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_version_loi_di_tiep" CASCADE;
  DROP TABLE "cms"."loi_di_tiep_nhom_the" CASCADE;
  DROP TABLE "cms"."loi_di_tiep_nhom" CASCADE;
  DROP TABLE "cms"."loi_di_tiep" CASCADE;
  DROP TYPE "cms"."enum_noi_dung_trang_loi_di_tiep_nhan";
  DROP TYPE "cms"."enum_noi_dung_trang_loi_di_tiep_hinh";
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_loi_di_tiep_nhan";
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_loi_di_tiep_hinh";
  DROP TYPE "cms"."enum_loi_di_tiep_nhom_the_nhan";
  DROP TYPE "cms"."enum_loi_di_tiep_nhom_the_hinh";
  DROP TYPE "cms"."enum_loi_di_tiep_nhom_tru";`)
}
