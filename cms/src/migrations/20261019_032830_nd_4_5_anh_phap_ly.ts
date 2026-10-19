import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_noi_dung_trang_blocks_anh_co" AS ENUM('vua', 'rong', 'nho');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_blocks_anh_co" AS ENUM('vua', 'rong', 'nho');
  CREATE TYPE "cms"."enum_mau_cum_blocks_anh_co" AS ENUM('vua', 'rong', 'nho');
  CREATE TYPE "cms"."enum__mau_cum_v_blocks_anh_co" AS ENUM('vua', 'rong', 'nho');
  CREATE TABLE "cms"."noi_dung_trang_blocks_anh" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anh_id" integer,
  	"chu_thich" varchar,
  	"link" varchar,
  	"co" "cms"."enum_noi_dung_trang_blocks_anh_co" DEFAULT 'vua',
  	"tu_ngay" timestamp(3) with time zone,
  	"den_ngay" timestamp(3) with time zone,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_anh" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anh_id" integer,
  	"chu_thich" varchar,
  	"link" varchar,
  	"co" "cms"."enum__noi_dung_trang_v_blocks_anh_co" DEFAULT 'vua',
  	"tu_ngay" timestamp(3) with time zone,
  	"den_ngay" timestamp(3) with time zone,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_anh" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anh_id" integer,
  	"chu_thich" varchar,
  	"link" varchar,
  	"co" "cms"."enum_mau_cum_blocks_anh_co" DEFAULT 'vua',
  	"tu_ngay" timestamp(3) with time zone,
  	"den_ngay" timestamp(3) with time zone,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_anh" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anh_id" integer,
  	"chu_thich" varchar,
  	"link" varchar,
  	"co" "cms"."enum__mau_cum_v_blocks_anh_co" DEFAULT 'vua',
  	"tu_ngay" timestamp(3) with time zone,
  	"den_ngay" timestamp(3) with time zone,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "cms"."noi_dung_trang" ADD COLUMN "da_doi_chieu_phap_ly" boolean;
  ALTER TABLE "cms"."_noi_dung_trang_v" ADD COLUMN "version_da_doi_chieu_phap_ly" boolean;
  ALTER TABLE "cms"."noi_dung_trang_blocks_anh" ADD CONSTRAINT "noi_dung_trang_blocks_anh_anh_id_media_id_fk" FOREIGN KEY ("anh_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_anh" ADD CONSTRAINT "noi_dung_trang_blocks_anh_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_anh" ADD CONSTRAINT "_noi_dung_trang_v_blocks_anh_anh_id_media_id_fk" FOREIGN KEY ("anh_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_anh" ADD CONSTRAINT "_noi_dung_trang_v_blocks_anh_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_anh" ADD CONSTRAINT "mau_cum_blocks_anh_anh_id_media_id_fk" FOREIGN KEY ("anh_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_anh" ADD CONSTRAINT "mau_cum_blocks_anh_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_anh" ADD CONSTRAINT "_mau_cum_v_blocks_anh_anh_id_media_id_fk" FOREIGN KEY ("anh_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_anh" ADD CONSTRAINT "_mau_cum_v_blocks_anh_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "noi_dung_trang_blocks_anh_order_idx" ON "cms"."noi_dung_trang_blocks_anh" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_anh_parent_id_idx" ON "cms"."noi_dung_trang_blocks_anh" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_anh_path_idx" ON "cms"."noi_dung_trang_blocks_anh" USING btree ("_path");
  CREATE INDEX "noi_dung_trang_blocks_anh_anh_idx" ON "cms"."noi_dung_trang_blocks_anh" USING btree ("anh_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_anh_order_idx" ON "cms"."_noi_dung_trang_v_blocks_anh" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_anh_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_anh" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_anh_path_idx" ON "cms"."_noi_dung_trang_v_blocks_anh" USING btree ("_path");
  CREATE INDEX "_noi_dung_trang_v_blocks_anh_anh_idx" ON "cms"."_noi_dung_trang_v_blocks_anh" USING btree ("anh_id");
  CREATE INDEX "mau_cum_blocks_anh_order_idx" ON "cms"."mau_cum_blocks_anh" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_anh_parent_id_idx" ON "cms"."mau_cum_blocks_anh" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_anh_path_idx" ON "cms"."mau_cum_blocks_anh" USING btree ("_path");
  CREATE INDEX "mau_cum_blocks_anh_anh_idx" ON "cms"."mau_cum_blocks_anh" USING btree ("anh_id");
  CREATE INDEX "_mau_cum_v_blocks_anh_order_idx" ON "cms"."_mau_cum_v_blocks_anh" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_anh_parent_id_idx" ON "cms"."_mau_cum_v_blocks_anh" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_anh_path_idx" ON "cms"."_mau_cum_v_blocks_anh" USING btree ("_path");
  CREATE INDEX "_mau_cum_v_blocks_anh_anh_idx" ON "cms"."_mau_cum_v_blocks_anh" USING btree ("anh_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms"."noi_dung_trang_blocks_anh" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_anh" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_anh" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_anh" CASCADE;
  ALTER TABLE "cms"."noi_dung_trang" DROP COLUMN "da_doi_chieu_phap_ly";
  ALTER TABLE "cms"."_noi_dung_trang_v" DROP COLUMN "version_da_doi_chieu_phap_ly";
  DROP TYPE "cms"."enum_noi_dung_trang_blocks_anh_co";
  DROP TYPE "cms"."enum__noi_dung_trang_v_blocks_anh_co";
  DROP TYPE "cms"."enum_mau_cum_blocks_anh_co";
  DROP TYPE "cms"."enum__mau_cum_v_blocks_anh_co";`)
}
