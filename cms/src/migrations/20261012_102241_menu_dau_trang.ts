import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_menu_dau_trang_muc_con_loai" AS ENUM('duong_dan', 'bai', 'chuyen_muc');
  CREATE TYPE "cms"."enum_menu_dau_trang_muc_loai" AS ENUM('duong_dan', 'bai', 'chuyen_muc');
  CREATE TYPE "cms"."enum_menu_dau_trang_muc_bieu_tuong" AS ENUM('lap_lanh', 'trai_tim', 'la_ban', 'sach', 'bao', 'sao', 'lich', 'nguoi');
  CREATE TABLE "cms"."menu_dau_trang_muc_con" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nhan" varchar NOT NULL,
  	"loai" "cms"."enum_menu_dau_trang_muc_con_loai" DEFAULT 'duong_dan',
  	"duong_dan" varchar,
  	"bai_id" integer,
  	"chuyen_muc_id" integer,
  	"mo_ta" varchar
  );
  
  CREATE TABLE "cms"."menu_dau_trang_muc" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nhan" varchar NOT NULL,
  	"loai" "cms"."enum_menu_dau_trang_muc_loai" DEFAULT 'duong_dan',
  	"duong_dan" varchar,
  	"bai_id" integer,
  	"chuyen_muc_id" integer,
  	"bieu_tuong" "cms"."enum_menu_dau_trang_muc_bieu_tuong" DEFAULT 'la_ban',
  	"di_dong" boolean DEFAULT true
  );
  
  CREATE TABLE "cms"."menu_dau_trang" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "cms"."menu_dau_trang_muc_con" ADD CONSTRAINT "menu_dau_trang_muc_con_bai_id_bai_viet_id_fk" FOREIGN KEY ("bai_id") REFERENCES "cms"."bai_viet"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."menu_dau_trang_muc_con" ADD CONSTRAINT "menu_dau_trang_muc_con_chuyen_muc_id_chuyen_muc_id_fk" FOREIGN KEY ("chuyen_muc_id") REFERENCES "cms"."chuyen_muc"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."menu_dau_trang_muc_con" ADD CONSTRAINT "menu_dau_trang_muc_con_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."menu_dau_trang_muc"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."menu_dau_trang_muc" ADD CONSTRAINT "menu_dau_trang_muc_bai_id_bai_viet_id_fk" FOREIGN KEY ("bai_id") REFERENCES "cms"."bai_viet"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."menu_dau_trang_muc" ADD CONSTRAINT "menu_dau_trang_muc_chuyen_muc_id_chuyen_muc_id_fk" FOREIGN KEY ("chuyen_muc_id") REFERENCES "cms"."chuyen_muc"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."menu_dau_trang_muc" ADD CONSTRAINT "menu_dau_trang_muc_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."menu_dau_trang"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "menu_dau_trang_muc_con_order_idx" ON "cms"."menu_dau_trang_muc_con" USING btree ("_order");
  CREATE INDEX "menu_dau_trang_muc_con_parent_id_idx" ON "cms"."menu_dau_trang_muc_con" USING btree ("_parent_id");
  CREATE INDEX "menu_dau_trang_muc_con_bai_idx" ON "cms"."menu_dau_trang_muc_con" USING btree ("bai_id");
  CREATE INDEX "menu_dau_trang_muc_con_chuyen_muc_idx" ON "cms"."menu_dau_trang_muc_con" USING btree ("chuyen_muc_id");
  CREATE INDEX "menu_dau_trang_muc_order_idx" ON "cms"."menu_dau_trang_muc" USING btree ("_order");
  CREATE INDEX "menu_dau_trang_muc_parent_id_idx" ON "cms"."menu_dau_trang_muc" USING btree ("_parent_id");
  CREATE INDEX "menu_dau_trang_muc_bai_idx" ON "cms"."menu_dau_trang_muc" USING btree ("bai_id");
  CREATE INDEX "menu_dau_trang_muc_chuyen_muc_idx" ON "cms"."menu_dau_trang_muc" USING btree ("chuyen_muc_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms"."menu_dau_trang_muc_con" CASCADE;
  DROP TABLE "cms"."menu_dau_trang_muc" CASCADE;
  DROP TABLE "cms"."menu_dau_trang" CASCADE;
  DROP TYPE "cms"."enum_menu_dau_trang_muc_con_loai";
  DROP TYPE "cms"."enum_menu_dau_trang_muc_loai";
  DROP TYPE "cms"."enum_menu_dau_trang_muc_bieu_tuong";`)
}
