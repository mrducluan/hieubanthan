import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_trang_dich_blocks_cong_cu_ds" AS ENUM('than_so', 'hom_nay', 'hop_doi', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy');
  CREATE TYPE "cms"."enum_trang_dich_blocks_bai_viet_mang" AS ENUM('tat_ca', 'than_so', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy', 'chung');
  CREATE TYPE "cms"."enum_trang_dich_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__trang_dich_v_blocks_cong_cu_ds" AS ENUM('than_so', 'hom_nay', 'hop_doi', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy');
  CREATE TYPE "cms"."enum__trang_dich_v_blocks_bai_viet_mang" AS ENUM('tat_ca', 'than_so', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy', 'chung');
  CREATE TYPE "cms"."enum__trang_dich_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "cms"."trang_dich_blocks_dau_trang" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nhan" varchar,
  	"tieu_de" varchar,
  	"mo_ta" varchar,
  	"anh_id" integer,
  	"nut_chu" varchar,
  	"nut_link" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."trang_dich_blocks_cong_cu_ds" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "cms"."enum_trang_dich_blocks_cong_cu_ds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "cms"."trang_dich_blocks_cong_cu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."trang_dich_blocks_bai_viet" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"mang" "cms"."enum_trang_dich_blocks_bai_viet_mang",
  	"so_bai" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."trang_dich_blocks_hoi_dap_ds" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cau_hoi" varchar,
  	"tra_loi" varchar
  );
  
  CREATE TABLE "cms"."trang_dich_blocks_hoi_dap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."trang_dich_blocks_loi_moi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar DEFAULT 'Mời bạn cùng xem — cả hai cùng nhận Sao',
  	"mo_ta" varchar,
  	"nut_chu" varchar DEFAULT 'Lấy link mời của tôi',
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."trang_dich_blocks_van_ban" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"noi_dung" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."trang_dich" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"mo_ta_seo" varchar,
  	"anh_chia_se_id" integer,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"het_han" timestamp(3) with time zone,
  	"noindex" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_trang_dich_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."trang_dich_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"bai_viet_id" integer
  );
  
  CREATE TABLE "cms"."_trang_dich_v_blocks_dau_trang" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"nhan" varchar,
  	"tieu_de" varchar,
  	"mo_ta" varchar,
  	"anh_id" integer,
  	"nut_chu" varchar,
  	"nut_link" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_trang_dich_v_blocks_cong_cu_ds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "cms"."enum__trang_dich_v_blocks_cong_cu_ds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "cms"."_trang_dich_v_blocks_cong_cu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_trang_dich_v_blocks_bai_viet" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"mang" "cms"."enum__trang_dich_v_blocks_bai_viet_mang",
  	"so_bai" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_trang_dich_v_blocks_hoi_dap_ds" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cau_hoi" varchar,
  	"tra_loi" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_trang_dich_v_blocks_hoi_dap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_trang_dich_v_blocks_loi_moi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar DEFAULT 'Mời bạn cùng xem — cả hai cùng nhận Sao',
  	"mo_ta" varchar,
  	"nut_chu" varchar DEFAULT 'Lấy link mời của tôi',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_trang_dich_v_blocks_van_ban" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"noi_dung" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_trang_dich_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_tieu_de" varchar,
  	"version_mo_ta_seo" varchar,
  	"version_anh_chia_se_id" integer,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_het_han" timestamp(3) with time zone,
  	"version_noindex" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__trang_dich_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "cms"."_trang_dich_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"bai_viet_id" integer
  );
  
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD COLUMN "trang_dich_id" integer;
  ALTER TABLE "cms"."trang_dich_blocks_dau_trang" ADD CONSTRAINT "trang_dich_blocks_dau_trang_anh_id_media_id_fk" FOREIGN KEY ("anh_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."trang_dich_blocks_dau_trang" ADD CONSTRAINT "trang_dich_blocks_dau_trang_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."trang_dich"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."trang_dich_blocks_cong_cu_ds" ADD CONSTRAINT "trang_dich_blocks_cong_cu_ds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."trang_dich_blocks_cong_cu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."trang_dich_blocks_cong_cu" ADD CONSTRAINT "trang_dich_blocks_cong_cu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."trang_dich"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."trang_dich_blocks_bai_viet" ADD CONSTRAINT "trang_dich_blocks_bai_viet_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."trang_dich"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."trang_dich_blocks_hoi_dap_ds" ADD CONSTRAINT "trang_dich_blocks_hoi_dap_ds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."trang_dich_blocks_hoi_dap"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."trang_dich_blocks_hoi_dap" ADD CONSTRAINT "trang_dich_blocks_hoi_dap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."trang_dich"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."trang_dich_blocks_loi_moi" ADD CONSTRAINT "trang_dich_blocks_loi_moi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."trang_dich"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."trang_dich_blocks_van_ban" ADD CONSTRAINT "trang_dich_blocks_van_ban_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."trang_dich"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."trang_dich" ADD CONSTRAINT "trang_dich_anh_chia_se_id_media_id_fk" FOREIGN KEY ("anh_chia_se_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."trang_dich_rels" ADD CONSTRAINT "trang_dich_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."trang_dich"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."trang_dich_rels" ADD CONSTRAINT "trang_dich_rels_bai_viet_fk" FOREIGN KEY ("bai_viet_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v_blocks_dau_trang" ADD CONSTRAINT "_trang_dich_v_blocks_dau_trang_anh_id_media_id_fk" FOREIGN KEY ("anh_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v_blocks_dau_trang" ADD CONSTRAINT "_trang_dich_v_blocks_dau_trang_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_trang_dich_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v_blocks_cong_cu_ds" ADD CONSTRAINT "_trang_dich_v_blocks_cong_cu_ds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_trang_dich_v_blocks_cong_cu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v_blocks_cong_cu" ADD CONSTRAINT "_trang_dich_v_blocks_cong_cu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_trang_dich_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v_blocks_bai_viet" ADD CONSTRAINT "_trang_dich_v_blocks_bai_viet_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_trang_dich_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v_blocks_hoi_dap_ds" ADD CONSTRAINT "_trang_dich_v_blocks_hoi_dap_ds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_trang_dich_v_blocks_hoi_dap"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v_blocks_hoi_dap" ADD CONSTRAINT "_trang_dich_v_blocks_hoi_dap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_trang_dich_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v_blocks_loi_moi" ADD CONSTRAINT "_trang_dich_v_blocks_loi_moi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_trang_dich_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v_blocks_van_ban" ADD CONSTRAINT "_trang_dich_v_blocks_van_ban_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_trang_dich_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v" ADD CONSTRAINT "_trang_dich_v_parent_id_trang_dich_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."trang_dich"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v" ADD CONSTRAINT "_trang_dich_v_version_anh_chia_se_id_media_id_fk" FOREIGN KEY ("version_anh_chia_se_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v_rels" ADD CONSTRAINT "_trang_dich_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_trang_dich_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_trang_dich_v_rels" ADD CONSTRAINT "_trang_dich_v_rels_bai_viet_fk" FOREIGN KEY ("bai_viet_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "trang_dich_blocks_dau_trang_order_idx" ON "cms"."trang_dich_blocks_dau_trang" USING btree ("_order");
  CREATE INDEX "trang_dich_blocks_dau_trang_parent_id_idx" ON "cms"."trang_dich_blocks_dau_trang" USING btree ("_parent_id");
  CREATE INDEX "trang_dich_blocks_dau_trang_path_idx" ON "cms"."trang_dich_blocks_dau_trang" USING btree ("_path");
  CREATE INDEX "trang_dich_blocks_dau_trang_anh_idx" ON "cms"."trang_dich_blocks_dau_trang" USING btree ("anh_id");
  CREATE INDEX "trang_dich_blocks_cong_cu_ds_order_idx" ON "cms"."trang_dich_blocks_cong_cu_ds" USING btree ("order");
  CREATE INDEX "trang_dich_blocks_cong_cu_ds_parent_idx" ON "cms"."trang_dich_blocks_cong_cu_ds" USING btree ("parent_id");
  CREATE INDEX "trang_dich_blocks_cong_cu_order_idx" ON "cms"."trang_dich_blocks_cong_cu" USING btree ("_order");
  CREATE INDEX "trang_dich_blocks_cong_cu_parent_id_idx" ON "cms"."trang_dich_blocks_cong_cu" USING btree ("_parent_id");
  CREATE INDEX "trang_dich_blocks_cong_cu_path_idx" ON "cms"."trang_dich_blocks_cong_cu" USING btree ("_path");
  CREATE INDEX "trang_dich_blocks_bai_viet_order_idx" ON "cms"."trang_dich_blocks_bai_viet" USING btree ("_order");
  CREATE INDEX "trang_dich_blocks_bai_viet_parent_id_idx" ON "cms"."trang_dich_blocks_bai_viet" USING btree ("_parent_id");
  CREATE INDEX "trang_dich_blocks_bai_viet_path_idx" ON "cms"."trang_dich_blocks_bai_viet" USING btree ("_path");
  CREATE INDEX "trang_dich_blocks_hoi_dap_ds_order_idx" ON "cms"."trang_dich_blocks_hoi_dap_ds" USING btree ("_order");
  CREATE INDEX "trang_dich_blocks_hoi_dap_ds_parent_id_idx" ON "cms"."trang_dich_blocks_hoi_dap_ds" USING btree ("_parent_id");
  CREATE INDEX "trang_dich_blocks_hoi_dap_order_idx" ON "cms"."trang_dich_blocks_hoi_dap" USING btree ("_order");
  CREATE INDEX "trang_dich_blocks_hoi_dap_parent_id_idx" ON "cms"."trang_dich_blocks_hoi_dap" USING btree ("_parent_id");
  CREATE INDEX "trang_dich_blocks_hoi_dap_path_idx" ON "cms"."trang_dich_blocks_hoi_dap" USING btree ("_path");
  CREATE INDEX "trang_dich_blocks_loi_moi_order_idx" ON "cms"."trang_dich_blocks_loi_moi" USING btree ("_order");
  CREATE INDEX "trang_dich_blocks_loi_moi_parent_id_idx" ON "cms"."trang_dich_blocks_loi_moi" USING btree ("_parent_id");
  CREATE INDEX "trang_dich_blocks_loi_moi_path_idx" ON "cms"."trang_dich_blocks_loi_moi" USING btree ("_path");
  CREATE INDEX "trang_dich_blocks_van_ban_order_idx" ON "cms"."trang_dich_blocks_van_ban" USING btree ("_order");
  CREATE INDEX "trang_dich_blocks_van_ban_parent_id_idx" ON "cms"."trang_dich_blocks_van_ban" USING btree ("_parent_id");
  CREATE INDEX "trang_dich_blocks_van_ban_path_idx" ON "cms"."trang_dich_blocks_van_ban" USING btree ("_path");
  CREATE INDEX "trang_dich_anh_chia_se_idx" ON "cms"."trang_dich" USING btree ("anh_chia_se_id");
  CREATE UNIQUE INDEX "trang_dich_slug_idx" ON "cms"."trang_dich" USING btree ("slug");
  CREATE INDEX "trang_dich_updated_at_idx" ON "cms"."trang_dich" USING btree ("updated_at");
  CREATE INDEX "trang_dich_created_at_idx" ON "cms"."trang_dich" USING btree ("created_at");
  CREATE INDEX "trang_dich__status_idx" ON "cms"."trang_dich" USING btree ("_status");
  CREATE INDEX "trang_dich_rels_order_idx" ON "cms"."trang_dich_rels" USING btree ("order");
  CREATE INDEX "trang_dich_rels_parent_idx" ON "cms"."trang_dich_rels" USING btree ("parent_id");
  CREATE INDEX "trang_dich_rels_path_idx" ON "cms"."trang_dich_rels" USING btree ("path");
  CREATE INDEX "trang_dich_rels_bai_viet_id_idx" ON "cms"."trang_dich_rels" USING btree ("bai_viet_id");
  CREATE INDEX "_trang_dich_v_blocks_dau_trang_order_idx" ON "cms"."_trang_dich_v_blocks_dau_trang" USING btree ("_order");
  CREATE INDEX "_trang_dich_v_blocks_dau_trang_parent_id_idx" ON "cms"."_trang_dich_v_blocks_dau_trang" USING btree ("_parent_id");
  CREATE INDEX "_trang_dich_v_blocks_dau_trang_path_idx" ON "cms"."_trang_dich_v_blocks_dau_trang" USING btree ("_path");
  CREATE INDEX "_trang_dich_v_blocks_dau_trang_anh_idx" ON "cms"."_trang_dich_v_blocks_dau_trang" USING btree ("anh_id");
  CREATE INDEX "_trang_dich_v_blocks_cong_cu_ds_order_idx" ON "cms"."_trang_dich_v_blocks_cong_cu_ds" USING btree ("order");
  CREATE INDEX "_trang_dich_v_blocks_cong_cu_ds_parent_idx" ON "cms"."_trang_dich_v_blocks_cong_cu_ds" USING btree ("parent_id");
  CREATE INDEX "_trang_dich_v_blocks_cong_cu_order_idx" ON "cms"."_trang_dich_v_blocks_cong_cu" USING btree ("_order");
  CREATE INDEX "_trang_dich_v_blocks_cong_cu_parent_id_idx" ON "cms"."_trang_dich_v_blocks_cong_cu" USING btree ("_parent_id");
  CREATE INDEX "_trang_dich_v_blocks_cong_cu_path_idx" ON "cms"."_trang_dich_v_blocks_cong_cu" USING btree ("_path");
  CREATE INDEX "_trang_dich_v_blocks_bai_viet_order_idx" ON "cms"."_trang_dich_v_blocks_bai_viet" USING btree ("_order");
  CREATE INDEX "_trang_dich_v_blocks_bai_viet_parent_id_idx" ON "cms"."_trang_dich_v_blocks_bai_viet" USING btree ("_parent_id");
  CREATE INDEX "_trang_dich_v_blocks_bai_viet_path_idx" ON "cms"."_trang_dich_v_blocks_bai_viet" USING btree ("_path");
  CREATE INDEX "_trang_dich_v_blocks_hoi_dap_ds_order_idx" ON "cms"."_trang_dich_v_blocks_hoi_dap_ds" USING btree ("_order");
  CREATE INDEX "_trang_dich_v_blocks_hoi_dap_ds_parent_id_idx" ON "cms"."_trang_dich_v_blocks_hoi_dap_ds" USING btree ("_parent_id");
  CREATE INDEX "_trang_dich_v_blocks_hoi_dap_order_idx" ON "cms"."_trang_dich_v_blocks_hoi_dap" USING btree ("_order");
  CREATE INDEX "_trang_dich_v_blocks_hoi_dap_parent_id_idx" ON "cms"."_trang_dich_v_blocks_hoi_dap" USING btree ("_parent_id");
  CREATE INDEX "_trang_dich_v_blocks_hoi_dap_path_idx" ON "cms"."_trang_dich_v_blocks_hoi_dap" USING btree ("_path");
  CREATE INDEX "_trang_dich_v_blocks_loi_moi_order_idx" ON "cms"."_trang_dich_v_blocks_loi_moi" USING btree ("_order");
  CREATE INDEX "_trang_dich_v_blocks_loi_moi_parent_id_idx" ON "cms"."_trang_dich_v_blocks_loi_moi" USING btree ("_parent_id");
  CREATE INDEX "_trang_dich_v_blocks_loi_moi_path_idx" ON "cms"."_trang_dich_v_blocks_loi_moi" USING btree ("_path");
  CREATE INDEX "_trang_dich_v_blocks_van_ban_order_idx" ON "cms"."_trang_dich_v_blocks_van_ban" USING btree ("_order");
  CREATE INDEX "_trang_dich_v_blocks_van_ban_parent_id_idx" ON "cms"."_trang_dich_v_blocks_van_ban" USING btree ("_parent_id");
  CREATE INDEX "_trang_dich_v_blocks_van_ban_path_idx" ON "cms"."_trang_dich_v_blocks_van_ban" USING btree ("_path");
  CREATE INDEX "_trang_dich_v_parent_idx" ON "cms"."_trang_dich_v" USING btree ("parent_id");
  CREATE INDEX "_trang_dich_v_version_version_anh_chia_se_idx" ON "cms"."_trang_dich_v" USING btree ("version_anh_chia_se_id");
  CREATE INDEX "_trang_dich_v_version_version_slug_idx" ON "cms"."_trang_dich_v" USING btree ("version_slug");
  CREATE INDEX "_trang_dich_v_version_version_updated_at_idx" ON "cms"."_trang_dich_v" USING btree ("version_updated_at");
  CREATE INDEX "_trang_dich_v_version_version_created_at_idx" ON "cms"."_trang_dich_v" USING btree ("version_created_at");
  CREATE INDEX "_trang_dich_v_version_version__status_idx" ON "cms"."_trang_dich_v" USING btree ("version__status");
  CREATE INDEX "_trang_dich_v_created_at_idx" ON "cms"."_trang_dich_v" USING btree ("created_at");
  CREATE INDEX "_trang_dich_v_updated_at_idx" ON "cms"."_trang_dich_v" USING btree ("updated_at");
  CREATE INDEX "_trang_dich_v_latest_idx" ON "cms"."_trang_dich_v" USING btree ("latest");
  CREATE INDEX "_trang_dich_v_autosave_idx" ON "cms"."_trang_dich_v" USING btree ("autosave");
  CREATE INDEX "_trang_dich_v_rels_order_idx" ON "cms"."_trang_dich_v_rels" USING btree ("order");
  CREATE INDEX "_trang_dich_v_rels_parent_idx" ON "cms"."_trang_dich_v_rels" USING btree ("parent_id");
  CREATE INDEX "_trang_dich_v_rels_path_idx" ON "cms"."_trang_dich_v_rels" USING btree ("path");
  CREATE INDEX "_trang_dich_v_rels_bai_viet_id_idx" ON "cms"."_trang_dich_v_rels" USING btree ("bai_viet_id");
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trang_dich_fk" FOREIGN KEY ("trang_dich_id") REFERENCES "cms"."trang_dich"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_trang_dich_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("trang_dich_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."trang_dich_blocks_dau_trang" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."trang_dich_blocks_cong_cu_ds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."trang_dich_blocks_cong_cu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."trang_dich_blocks_bai_viet" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."trang_dich_blocks_hoi_dap_ds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."trang_dich_blocks_hoi_dap" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."trang_dich_blocks_loi_moi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."trang_dich_blocks_van_ban" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."trang_dich" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."trang_dich_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_trang_dich_v_blocks_dau_trang" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_trang_dich_v_blocks_cong_cu_ds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_trang_dich_v_blocks_cong_cu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_trang_dich_v_blocks_bai_viet" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_trang_dich_v_blocks_hoi_dap_ds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_trang_dich_v_blocks_hoi_dap" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_trang_dich_v_blocks_loi_moi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_trang_dich_v_blocks_van_ban" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_trang_dich_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_trang_dich_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cms"."trang_dich_blocks_dau_trang" CASCADE;
  DROP TABLE "cms"."trang_dich_blocks_cong_cu_ds" CASCADE;
  DROP TABLE "cms"."trang_dich_blocks_cong_cu" CASCADE;
  DROP TABLE "cms"."trang_dich_blocks_bai_viet" CASCADE;
  DROP TABLE "cms"."trang_dich_blocks_hoi_dap_ds" CASCADE;
  DROP TABLE "cms"."trang_dich_blocks_hoi_dap" CASCADE;
  DROP TABLE "cms"."trang_dich_blocks_loi_moi" CASCADE;
  DROP TABLE "cms"."trang_dich_blocks_van_ban" CASCADE;
  DROP TABLE "cms"."trang_dich" CASCADE;
  DROP TABLE "cms"."trang_dich_rels" CASCADE;
  DROP TABLE "cms"."_trang_dich_v_blocks_dau_trang" CASCADE;
  DROP TABLE "cms"."_trang_dich_v_blocks_cong_cu_ds" CASCADE;
  DROP TABLE "cms"."_trang_dich_v_blocks_cong_cu" CASCADE;
  DROP TABLE "cms"."_trang_dich_v_blocks_bai_viet" CASCADE;
  DROP TABLE "cms"."_trang_dich_v_blocks_hoi_dap_ds" CASCADE;
  DROP TABLE "cms"."_trang_dich_v_blocks_hoi_dap" CASCADE;
  DROP TABLE "cms"."_trang_dich_v_blocks_loi_moi" CASCADE;
  DROP TABLE "cms"."_trang_dich_v_blocks_van_ban" CASCADE;
  DROP TABLE "cms"."_trang_dich_v" CASCADE;
  DROP TABLE "cms"."_trang_dich_v_rels" CASCADE;
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_trang_dich_fk";
  
  DROP INDEX "cms"."payload_locked_documents_rels_trang_dich_id_idx";
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP COLUMN "trang_dich_id";
  DROP TYPE "cms"."enum_trang_dich_blocks_cong_cu_ds";
  DROP TYPE "cms"."enum_trang_dich_blocks_bai_viet_mang";
  DROP TYPE "cms"."enum_trang_dich_status";
  DROP TYPE "cms"."enum__trang_dich_v_blocks_cong_cu_ds";
  DROP TYPE "cms"."enum__trang_dich_v_blocks_bai_viet_mang";
  DROP TYPE "cms"."enum__trang_dich_v_version_status";`)
}
