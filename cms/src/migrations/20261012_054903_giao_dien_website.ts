import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_dieu_huong_cot_lien_ket_loai" AS ENUM('duong_dan', 'bai', 'chuyen_muc');
  CREATE TABLE "cms"."trang_chu" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"thong_bao_bat" boolean DEFAULT false,
  	"thong_bao_chu" varchar,
  	"thong_bao_link" varchar,
  	"thong_bao_tu_ngay" timestamp(3) with time zone,
  	"thong_bao_den_ngay" timestamp(3) with time zone,
  	"banner_bat" boolean DEFAULT false,
  	"banner_nhan" varchar,
  	"banner_tieu_de" varchar,
  	"banner_mo_ta" varchar,
  	"banner_anh_id" integer,
  	"banner_nut_chu" varchar,
  	"banner_nut_link" varchar,
  	"banner_tu_ngay" timestamp(3) with time zone,
  	"banner_den_ngay" timestamp(3) with time zone,
  	"bai_viet_bat" boolean DEFAULT true,
  	"bai_viet_tieu_de" varchar DEFAULT 'Bài viết mới',
  	"bai_viet_so_bai" numeric DEFAULT 3,
  	"bai_theo_mang_bat" boolean DEFAULT true,
  	"bai_theo_mang_so_bai" numeric DEFAULT 3,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "cms"."trang_chu_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"bai_viet_id" integer
  );
  
  CREATE TABLE "cms"."dieu_huong_cot_lien_ket" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nhan" varchar NOT NULL,
  	"loai" "cms"."enum_dieu_huong_cot_lien_ket_loai" DEFAULT 'duong_dan',
  	"duong_dan" varchar,
  	"bai_id" integer,
  	"chuyen_muc_id" integer
  );
  
  CREATE TABLE "cms"."dieu_huong_cot" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ten" varchar NOT NULL
  );
  
  CREATE TABLE "cms"."dieu_huong" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "cms"."trang_chu" ADD CONSTRAINT "trang_chu_banner_anh_id_media_id_fk" FOREIGN KEY ("banner_anh_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."trang_chu_rels" ADD CONSTRAINT "trang_chu_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."trang_chu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."trang_chu_rels" ADD CONSTRAINT "trang_chu_rels_bai_viet_fk" FOREIGN KEY ("bai_viet_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."dieu_huong_cot_lien_ket" ADD CONSTRAINT "dieu_huong_cot_lien_ket_bai_id_bai_viet_id_fk" FOREIGN KEY ("bai_id") REFERENCES "cms"."bai_viet"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."dieu_huong_cot_lien_ket" ADD CONSTRAINT "dieu_huong_cot_lien_ket_chuyen_muc_id_chuyen_muc_id_fk" FOREIGN KEY ("chuyen_muc_id") REFERENCES "cms"."chuyen_muc"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."dieu_huong_cot_lien_ket" ADD CONSTRAINT "dieu_huong_cot_lien_ket_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."dieu_huong_cot"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."dieu_huong_cot" ADD CONSTRAINT "dieu_huong_cot_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."dieu_huong"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "trang_chu_banner_banner_anh_idx" ON "cms"."trang_chu" USING btree ("banner_anh_id");
  CREATE INDEX "trang_chu_rels_order_idx" ON "cms"."trang_chu_rels" USING btree ("order");
  CREATE INDEX "trang_chu_rels_parent_idx" ON "cms"."trang_chu_rels" USING btree ("parent_id");
  CREATE INDEX "trang_chu_rels_path_idx" ON "cms"."trang_chu_rels" USING btree ("path");
  CREATE INDEX "trang_chu_rels_bai_viet_id_idx" ON "cms"."trang_chu_rels" USING btree ("bai_viet_id");
  CREATE INDEX "dieu_huong_cot_lien_ket_order_idx" ON "cms"."dieu_huong_cot_lien_ket" USING btree ("_order");
  CREATE INDEX "dieu_huong_cot_lien_ket_parent_id_idx" ON "cms"."dieu_huong_cot_lien_ket" USING btree ("_parent_id");
  CREATE INDEX "dieu_huong_cot_lien_ket_bai_idx" ON "cms"."dieu_huong_cot_lien_ket" USING btree ("bai_id");
  CREATE INDEX "dieu_huong_cot_lien_ket_chuyen_muc_idx" ON "cms"."dieu_huong_cot_lien_ket" USING btree ("chuyen_muc_id");
  CREATE INDEX "dieu_huong_cot_order_idx" ON "cms"."dieu_huong_cot" USING btree ("_order");
  CREATE INDEX "dieu_huong_cot_parent_id_idx" ON "cms"."dieu_huong_cot" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms"."trang_chu" CASCADE;
  DROP TABLE "cms"."trang_chu_rels" CASCADE;
  DROP TABLE "cms"."dieu_huong_cot_lien_ket" CASCADE;
  DROP TABLE "cms"."dieu_huong_cot" CASCADE;
  DROP TABLE "cms"."dieu_huong" CASCADE;
  DROP TYPE "cms"."enum_dieu_huong_cot_lien_ket_loai";`)
}
