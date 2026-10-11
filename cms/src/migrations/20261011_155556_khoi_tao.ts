import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Schema riêng của CMS (không lẫn với bảng của web ở schema public). Payload không tự tạo schema khi migrate.
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "cms";`)
  await db.execute(sql`
   CREATE TYPE "cms"."enum_bai_viet_mang" AS ENUM('than_so', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy', 'chung');
  CREATE TYPE "cms"."enum_bai_viet_ky_ten" AS ENUM('ban_bien_tap', 'tac_gia', 'tham_dinh');
  CREATE TYPE "cms"."enum_bai_viet_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__bai_viet_v_version_mang" AS ENUM('than_so', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy', 'chung');
  CREATE TYPE "cms"."enum__bai_viet_v_version_ky_ten" AS ENUM('ban_bien_tap', 'tac_gia', 'tham_dinh');
  CREATE TYPE "cms"."enum__bai_viet_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_bien_tap_vien_vai_tro" AS ENUM('quan_tri', 'chu_bien', 'bien_tap', 'may_doc');
  CREATE TYPE "cms"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "cms"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "cms"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TABLE "cms"."bai_viet_hoi_dap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cau_hoi" varchar,
  	"tra_loi" varchar
  );
  
  CREATE TABLE "cms"."bai_viet_nguon" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ten" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "cms"."bai_viet" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"anh_bia_id" integer,
  	"mo_ta_ngan" varchar,
  	"tra_loi_nhanh" varchar,
  	"noi_dung" jsonb,
  	"noi_dung_html" varchar,
  	"tu_khoa_chinh" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"canonical" varchar,
  	"noindex" boolean DEFAULT false,
  	"dua_vao_llms" boolean DEFAULT true,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"mang" "cms"."enum_bai_viet_mang" DEFAULT 'chung',
  	"ky_ten" "cms"."enum_bai_viet_ky_ten" DEFAULT 'ban_bien_tap',
  	"tac_gia_id" integer,
  	"nguoi_tham_dinh_id" integer,
  	"ngay_tham_dinh" timestamp(3) with time zone,
  	"xac_nhan_tham_dinh" boolean,
  	"published_at" timestamp(3) with time zone,
  	"diem_kiem_dinh" numeric,
  	"ghi_chu_kiem_dinh" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_bai_viet_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."bai_viet_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "cms"."bai_viet_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"chuyen_muc_id" integer,
  	"bai_viet_id" integer
  );
  
  CREATE TABLE "cms"."_bai_viet_v_version_hoi_dap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cau_hoi" varchar,
  	"tra_loi" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_bai_viet_v_version_nguon" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ten" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_bai_viet_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_tieu_de" varchar,
  	"version_anh_bia_id" integer,
  	"version_mo_ta_ngan" varchar,
  	"version_tra_loi_nhanh" varchar,
  	"version_noi_dung" jsonb,
  	"version_noi_dung_html" varchar,
  	"version_tu_khoa_chinh" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_canonical" varchar,
  	"version_noindex" boolean DEFAULT false,
  	"version_dua_vao_llms" boolean DEFAULT true,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_mang" "cms"."enum__bai_viet_v_version_mang" DEFAULT 'chung',
  	"version_ky_ten" "cms"."enum__bai_viet_v_version_ky_ten" DEFAULT 'ban_bien_tap',
  	"version_tac_gia_id" integer,
  	"version_nguoi_tham_dinh_id" integer,
  	"version_ngay_tham_dinh" timestamp(3) with time zone,
  	"version_xac_nhan_tham_dinh" boolean,
  	"version_published_at" timestamp(3) with time zone,
  	"version_diem_kiem_dinh" numeric,
  	"version_ghi_chu_kiem_dinh" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__bai_viet_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "cms"."_bai_viet_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "cms"."_bai_viet_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"chuyen_muc_id" integer,
  	"bai_viet_id" integer
  );
  
  CREATE TABLE "cms"."chuyen_muc" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ten" varchar NOT NULL,
  	"mo_ta" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."tac_gia_lien_ket" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "cms"."tac_gia" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ten" varchar NOT NULL,
  	"chuc_danh" varchar,
  	"gioi_thieu" varchar,
  	"anh_id" integer,
  	"trang_ho_so" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"chu_thich" varchar,
  	"nguon_anh" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_nho_url" varchar,
  	"sizes_nho_width" numeric,
  	"sizes_nho_height" numeric,
  	"sizes_nho_mime_type" varchar,
  	"sizes_nho_filesize" numeric,
  	"sizes_nho_filename" varchar,
  	"sizes_vua_url" varchar,
  	"sizes_vua_width" numeric,
  	"sizes_vua_height" numeric,
  	"sizes_vua_mime_type" varchar,
  	"sizes_vua_filesize" numeric,
  	"sizes_vua_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "cms"."bien_tap_vien_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "cms"."bien_tap_vien" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ten_hien_thi" varchar NOT NULL,
  	"vai_tro" "cms"."enum_bien_tap_vien_vai_tro" DEFAULT 'bien_tap' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "cms"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "cms"."payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "cms"."enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "cms"."enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "cms"."payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "cms"."enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"bai_viet_id" integer,
  	"chuyen_muc_id" integer,
  	"tac_gia_id" integer,
  	"media_id" integer,
  	"bien_tap_vien_id" integer
  );
  
  CREATE TABLE "cms"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"bien_tap_vien_id" integer
  );
  
  CREATE TABLE "cms"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."tinh_nang" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"blog_bat" boolean DEFAULT true,
  	"muc_luc" boolean DEFAULT true,
  	"bai_lien_quan" boolean DEFAULT true,
  	"keu_goi_cong_cu" boolean DEFAULT true,
  	"llms_txt" boolean DEFAULT true,
  	"ban_markdown" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "cms"."bai_viet_hoi_dap" ADD CONSTRAINT "bai_viet_hoi_dap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."bai_viet_nguon" ADD CONSTRAINT "bai_viet_nguon_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."bai_viet" ADD CONSTRAINT "bai_viet_anh_bia_id_media_id_fk" FOREIGN KEY ("anh_bia_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."bai_viet" ADD CONSTRAINT "bai_viet_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."bai_viet" ADD CONSTRAINT "bai_viet_tac_gia_id_tac_gia_id_fk" FOREIGN KEY ("tac_gia_id") REFERENCES "cms"."tac_gia"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."bai_viet" ADD CONSTRAINT "bai_viet_nguoi_tham_dinh_id_tac_gia_id_fk" FOREIGN KEY ("nguoi_tham_dinh_id") REFERENCES "cms"."tac_gia"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."bai_viet_texts" ADD CONSTRAINT "bai_viet_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."bai_viet_rels" ADD CONSTRAINT "bai_viet_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."bai_viet_rels" ADD CONSTRAINT "bai_viet_rels_chuyen_muc_fk" FOREIGN KEY ("chuyen_muc_id") REFERENCES "cms"."chuyen_muc"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."bai_viet_rels" ADD CONSTRAINT "bai_viet_rels_bai_viet_fk" FOREIGN KEY ("bai_viet_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_bai_viet_v_version_hoi_dap" ADD CONSTRAINT "_bai_viet_v_version_hoi_dap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_bai_viet_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_bai_viet_v_version_nguon" ADD CONSTRAINT "_bai_viet_v_version_nguon_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_bai_viet_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_bai_viet_v" ADD CONSTRAINT "_bai_viet_v_parent_id_bai_viet_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."bai_viet"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_bai_viet_v" ADD CONSTRAINT "_bai_viet_v_version_anh_bia_id_media_id_fk" FOREIGN KEY ("version_anh_bia_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_bai_viet_v" ADD CONSTRAINT "_bai_viet_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_bai_viet_v" ADD CONSTRAINT "_bai_viet_v_version_tac_gia_id_tac_gia_id_fk" FOREIGN KEY ("version_tac_gia_id") REFERENCES "cms"."tac_gia"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_bai_viet_v" ADD CONSTRAINT "_bai_viet_v_version_nguoi_tham_dinh_id_tac_gia_id_fk" FOREIGN KEY ("version_nguoi_tham_dinh_id") REFERENCES "cms"."tac_gia"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_bai_viet_v_texts" ADD CONSTRAINT "_bai_viet_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_bai_viet_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_bai_viet_v_rels" ADD CONSTRAINT "_bai_viet_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_bai_viet_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_bai_viet_v_rels" ADD CONSTRAINT "_bai_viet_v_rels_chuyen_muc_fk" FOREIGN KEY ("chuyen_muc_id") REFERENCES "cms"."chuyen_muc"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_bai_viet_v_rels" ADD CONSTRAINT "_bai_viet_v_rels_bai_viet_fk" FOREIGN KEY ("bai_viet_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."tac_gia_lien_ket" ADD CONSTRAINT "tac_gia_lien_ket_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."tac_gia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."tac_gia" ADD CONSTRAINT "tac_gia_anh_id_media_id_fk" FOREIGN KEY ("anh_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."bien_tap_vien_sessions" ADD CONSTRAINT "bien_tap_vien_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."bien_tap_vien"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bai_viet_fk" FOREIGN KEY ("bai_viet_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chuyen_muc_fk" FOREIGN KEY ("chuyen_muc_id") REFERENCES "cms"."chuyen_muc"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tac_gia_fk" FOREIGN KEY ("tac_gia_id") REFERENCES "cms"."tac_gia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "cms"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bien_tap_vien_fk" FOREIGN KEY ("bien_tap_vien_id") REFERENCES "cms"."bien_tap_vien"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_bien_tap_vien_fk" FOREIGN KEY ("bien_tap_vien_id") REFERENCES "cms"."bien_tap_vien"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "bai_viet_hoi_dap_order_idx" ON "cms"."bai_viet_hoi_dap" USING btree ("_order");
  CREATE INDEX "bai_viet_hoi_dap_parent_id_idx" ON "cms"."bai_viet_hoi_dap" USING btree ("_parent_id");
  CREATE INDEX "bai_viet_nguon_order_idx" ON "cms"."bai_viet_nguon" USING btree ("_order");
  CREATE INDEX "bai_viet_nguon_parent_id_idx" ON "cms"."bai_viet_nguon" USING btree ("_parent_id");
  CREATE INDEX "bai_viet_anh_bia_idx" ON "cms"."bai_viet" USING btree ("anh_bia_id");
  CREATE INDEX "bai_viet_meta_meta_image_idx" ON "cms"."bai_viet" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "bai_viet_slug_idx" ON "cms"."bai_viet" USING btree ("slug");
  CREATE INDEX "bai_viet_tac_gia_idx" ON "cms"."bai_viet" USING btree ("tac_gia_id");
  CREATE INDEX "bai_viet_nguoi_tham_dinh_idx" ON "cms"."bai_viet" USING btree ("nguoi_tham_dinh_id");
  CREATE INDEX "bai_viet_updated_at_idx" ON "cms"."bai_viet" USING btree ("updated_at");
  CREATE INDEX "bai_viet_created_at_idx" ON "cms"."bai_viet" USING btree ("created_at");
  CREATE INDEX "bai_viet__status_idx" ON "cms"."bai_viet" USING btree ("_status");
  CREATE INDEX "bai_viet_texts_order_parent" ON "cms"."bai_viet_texts" USING btree ("order","parent_id");
  CREATE INDEX "bai_viet_rels_order_idx" ON "cms"."bai_viet_rels" USING btree ("order");
  CREATE INDEX "bai_viet_rels_parent_idx" ON "cms"."bai_viet_rels" USING btree ("parent_id");
  CREATE INDEX "bai_viet_rels_path_idx" ON "cms"."bai_viet_rels" USING btree ("path");
  CREATE INDEX "bai_viet_rels_chuyen_muc_id_idx" ON "cms"."bai_viet_rels" USING btree ("chuyen_muc_id");
  CREATE INDEX "bai_viet_rels_bai_viet_id_idx" ON "cms"."bai_viet_rels" USING btree ("bai_viet_id");
  CREATE INDEX "_bai_viet_v_version_hoi_dap_order_idx" ON "cms"."_bai_viet_v_version_hoi_dap" USING btree ("_order");
  CREATE INDEX "_bai_viet_v_version_hoi_dap_parent_id_idx" ON "cms"."_bai_viet_v_version_hoi_dap" USING btree ("_parent_id");
  CREATE INDEX "_bai_viet_v_version_nguon_order_idx" ON "cms"."_bai_viet_v_version_nguon" USING btree ("_order");
  CREATE INDEX "_bai_viet_v_version_nguon_parent_id_idx" ON "cms"."_bai_viet_v_version_nguon" USING btree ("_parent_id");
  CREATE INDEX "_bai_viet_v_parent_idx" ON "cms"."_bai_viet_v" USING btree ("parent_id");
  CREATE INDEX "_bai_viet_v_version_version_anh_bia_idx" ON "cms"."_bai_viet_v" USING btree ("version_anh_bia_id");
  CREATE INDEX "_bai_viet_v_version_meta_version_meta_image_idx" ON "cms"."_bai_viet_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_bai_viet_v_version_version_slug_idx" ON "cms"."_bai_viet_v" USING btree ("version_slug");
  CREATE INDEX "_bai_viet_v_version_version_tac_gia_idx" ON "cms"."_bai_viet_v" USING btree ("version_tac_gia_id");
  CREATE INDEX "_bai_viet_v_version_version_nguoi_tham_dinh_idx" ON "cms"."_bai_viet_v" USING btree ("version_nguoi_tham_dinh_id");
  CREATE INDEX "_bai_viet_v_version_version_updated_at_idx" ON "cms"."_bai_viet_v" USING btree ("version_updated_at");
  CREATE INDEX "_bai_viet_v_version_version_created_at_idx" ON "cms"."_bai_viet_v" USING btree ("version_created_at");
  CREATE INDEX "_bai_viet_v_version_version__status_idx" ON "cms"."_bai_viet_v" USING btree ("version__status");
  CREATE INDEX "_bai_viet_v_created_at_idx" ON "cms"."_bai_viet_v" USING btree ("created_at");
  CREATE INDEX "_bai_viet_v_updated_at_idx" ON "cms"."_bai_viet_v" USING btree ("updated_at");
  CREATE INDEX "_bai_viet_v_latest_idx" ON "cms"."_bai_viet_v" USING btree ("latest");
  CREATE INDEX "_bai_viet_v_autosave_idx" ON "cms"."_bai_viet_v" USING btree ("autosave");
  CREATE INDEX "_bai_viet_v_texts_order_parent" ON "cms"."_bai_viet_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_bai_viet_v_rels_order_idx" ON "cms"."_bai_viet_v_rels" USING btree ("order");
  CREATE INDEX "_bai_viet_v_rels_parent_idx" ON "cms"."_bai_viet_v_rels" USING btree ("parent_id");
  CREATE INDEX "_bai_viet_v_rels_path_idx" ON "cms"."_bai_viet_v_rels" USING btree ("path");
  CREATE INDEX "_bai_viet_v_rels_chuyen_muc_id_idx" ON "cms"."_bai_viet_v_rels" USING btree ("chuyen_muc_id");
  CREATE INDEX "_bai_viet_v_rels_bai_viet_id_idx" ON "cms"."_bai_viet_v_rels" USING btree ("bai_viet_id");
  CREATE UNIQUE INDEX "chuyen_muc_slug_idx" ON "cms"."chuyen_muc" USING btree ("slug");
  CREATE INDEX "chuyen_muc_updated_at_idx" ON "cms"."chuyen_muc" USING btree ("updated_at");
  CREATE INDEX "chuyen_muc_created_at_idx" ON "cms"."chuyen_muc" USING btree ("created_at");
  CREATE INDEX "tac_gia_lien_ket_order_idx" ON "cms"."tac_gia_lien_ket" USING btree ("_order");
  CREATE INDEX "tac_gia_lien_ket_parent_id_idx" ON "cms"."tac_gia_lien_ket" USING btree ("_parent_id");
  CREATE INDEX "tac_gia_anh_idx" ON "cms"."tac_gia" USING btree ("anh_id");
  CREATE UNIQUE INDEX "tac_gia_slug_idx" ON "cms"."tac_gia" USING btree ("slug");
  CREATE INDEX "tac_gia_updated_at_idx" ON "cms"."tac_gia" USING btree ("updated_at");
  CREATE INDEX "tac_gia_created_at_idx" ON "cms"."tac_gia" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "cms"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "cms"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "cms"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_nho_sizes_nho_filename_idx" ON "cms"."media" USING btree ("sizes_nho_filename");
  CREATE INDEX "media_sizes_vua_sizes_vua_filename_idx" ON "cms"."media" USING btree ("sizes_vua_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "cms"."media" USING btree ("sizes_og_filename");
  CREATE INDEX "bien_tap_vien_sessions_order_idx" ON "cms"."bien_tap_vien_sessions" USING btree ("_order");
  CREATE INDEX "bien_tap_vien_sessions_parent_id_idx" ON "cms"."bien_tap_vien_sessions" USING btree ("_parent_id");
  CREATE INDEX "bien_tap_vien_updated_at_idx" ON "cms"."bien_tap_vien" USING btree ("updated_at");
  CREATE INDEX "bien_tap_vien_created_at_idx" ON "cms"."bien_tap_vien" USING btree ("created_at");
  CREATE UNIQUE INDEX "bien_tap_vien_email_idx" ON "cms"."bien_tap_vien" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "cms"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "cms"."payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "cms"."payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "cms"."payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "cms"."payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "cms"."payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "cms"."payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "cms"."payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "cms"."payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "cms"."payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "cms"."payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "cms"."payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "cms"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "cms"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "cms"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "cms"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "cms"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "cms"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_bai_viet_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("bai_viet_id");
  CREATE INDEX "payload_locked_documents_rels_chuyen_muc_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("chuyen_muc_id");
  CREATE INDEX "payload_locked_documents_rels_tac_gia_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("tac_gia_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_bien_tap_vien_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("bien_tap_vien_id");
  CREATE INDEX "payload_preferences_key_idx" ON "cms"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "cms"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "cms"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "cms"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "cms"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "cms"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_bien_tap_vien_id_idx" ON "cms"."payload_preferences_rels" USING btree ("bien_tap_vien_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "cms"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "cms"."payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms"."bai_viet_hoi_dap" CASCADE;
  DROP TABLE "cms"."bai_viet_nguon" CASCADE;
  DROP TABLE "cms"."bai_viet" CASCADE;
  DROP TABLE "cms"."bai_viet_texts" CASCADE;
  DROP TABLE "cms"."bai_viet_rels" CASCADE;
  DROP TABLE "cms"."_bai_viet_v_version_hoi_dap" CASCADE;
  DROP TABLE "cms"."_bai_viet_v_version_nguon" CASCADE;
  DROP TABLE "cms"."_bai_viet_v" CASCADE;
  DROP TABLE "cms"."_bai_viet_v_texts" CASCADE;
  DROP TABLE "cms"."_bai_viet_v_rels" CASCADE;
  DROP TABLE "cms"."chuyen_muc" CASCADE;
  DROP TABLE "cms"."tac_gia_lien_ket" CASCADE;
  DROP TABLE "cms"."tac_gia" CASCADE;
  DROP TABLE "cms"."media" CASCADE;
  DROP TABLE "cms"."bien_tap_vien_sessions" CASCADE;
  DROP TABLE "cms"."bien_tap_vien" CASCADE;
  DROP TABLE "cms"."payload_kv" CASCADE;
  DROP TABLE "cms"."payload_jobs_log" CASCADE;
  DROP TABLE "cms"."payload_jobs" CASCADE;
  DROP TABLE "cms"."payload_locked_documents" CASCADE;
  DROP TABLE "cms"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "cms"."payload_preferences" CASCADE;
  DROP TABLE "cms"."payload_preferences_rels" CASCADE;
  DROP TABLE "cms"."payload_migrations" CASCADE;
  DROP TABLE "cms"."tinh_nang" CASCADE;
  DROP TYPE "cms"."enum_bai_viet_mang";
  DROP TYPE "cms"."enum_bai_viet_ky_ten";
  DROP TYPE "cms"."enum_bai_viet_status";
  DROP TYPE "cms"."enum__bai_viet_v_version_mang";
  DROP TYPE "cms"."enum__bai_viet_v_version_ky_ten";
  DROP TYPE "cms"."enum__bai_viet_v_version_status";
  DROP TYPE "cms"."enum_bien_tap_vien_vai_tro";
  DROP TYPE "cms"."enum_payload_jobs_log_task_slug";
  DROP TYPE "cms"."enum_payload_jobs_log_state";
  DROP TYPE "cms"."enum_payload_jobs_task_slug";`)
}
