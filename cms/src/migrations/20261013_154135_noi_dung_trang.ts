// ND-0 + ND-1 (docs/KIEN-TRUC-NOI-DUNG-TRANG.md mục 3.9): collection "Trang website" (noi_dung_trang) + "Mẫu cụm trang"
// (mau_cum) kèm bảng phiên bản/khối, job dong-bo-so-trang (+ payload_jobs_stats cho lịch), cột chữ chân trang ở dieu_huong.
// Down: xoá job đồng bộ còn trong hàng đợi trước khi đổi lại kiểu enum task_slug.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_noi_dung_trang_lien_ket_loai" AS ENUM('duong_dan', 'bai', 'chuyen_muc');
  CREATE TYPE "cms"."enum_noi_dung_trang_blocks_banner_kieu_chu_co" AS ENUM('nho', 'thuong', 'lon', 'rat_lon');
  CREATE TYPE "cms"."enum_noi_dung_trang_blocks_banner_kieu_chu_can" AS ENUM('trai', 'giua');
  CREATE TYPE "cms"."enum_noi_dung_trang_blocks_banner_kieu_chu_nen" AS ENUM('khong', 'nhan', 'vang', 'ngoc');
  CREATE TYPE "cms"."enum_noi_dung_trang_blocks_nut_moi_kieu" AS ENUM('chinh', 'phu');
  CREATE TYPE "cms"."enum_noi_dung_trang_blocks_ghi_chu_kieu" AS ENUM('luu_y', 'meo', 'tu_soi', 'tom_tat');
  CREATE TYPE "cms"."enum_noi_dung_trang_blocks_keu_goi_cong_cu" AS ENUM('/than-so', '/hom-nay', '/hop-doi', '/tu-vi', '/bat-tu', '/kinh-dich', '/phong-thuy');
  CREATE TYPE "cms"."enum_noi_dung_trang_blocks_cong_cu_ds" AS ENUM('than_so', 'hom_nay', 'hop_doi', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy');
  CREATE TYPE "cms"."enum_noi_dung_trang_blocks_bai_viet_mang" AS ENUM('tat_ca', 'than_so', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy', 'chung');
  CREATE TYPE "cms"."enum_noi_dung_trang_nhom" AS ENUM('cong_cu', 'tinh', 'phap_ly', 'chu_de', 'kien_thuc', 'tuoi', 'la_so_mau', 'blog_khung');
  CREATE TYPE "cms"."enum_noi_dung_trang_kieu_chu_co" AS ENUM('nho', 'thuong', 'lon', 'rat_lon');
  CREATE TYPE "cms"."enum_noi_dung_trang_kieu_chu_can" AS ENUM('trai', 'giua');
  CREATE TYPE "cms"."enum_noi_dung_trang_kieu_chu_nen" AS ENUM('khong', 'nhan', 'vang', 'ngoc');
  CREATE TYPE "cms"."enum_noi_dung_trang_loai_sua" AS ENUM('sua_chu', 'thay_doi_noi_dung');
  CREATE TYPE "cms"."enum_noi_dung_trang_che_do_mau_tren" AS ENUM('thay', 'them_sau', 'an_mau');
  CREATE TYPE "cms"."enum_noi_dung_trang_che_do_mau_duoi" AS ENUM('thay', 'them_sau', 'an_mau');
  CREATE TYPE "cms"."enum_noi_dung_trang_che_do_mau_cuoi" AS ENUM('thay', 'them_sau', 'an_mau');
  CREATE TYPE "cms"."enum_noi_dung_trang_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_lien_ket_loai" AS ENUM('duong_dan', 'bai', 'chuyen_muc');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_blocks_banner_kieu_chu_co" AS ENUM('nho', 'thuong', 'lon', 'rat_lon');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_blocks_banner_kieu_chu_can" AS ENUM('trai', 'giua');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_blocks_banner_kieu_chu_nen" AS ENUM('khong', 'nhan', 'vang', 'ngoc');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_blocks_nut_moi_kieu" AS ENUM('chinh', 'phu');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_blocks_ghi_chu_kieu" AS ENUM('luu_y', 'meo', 'tu_soi', 'tom_tat');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_blocks_keu_goi_cong_cu" AS ENUM('/than-so', '/hom-nay', '/hop-doi', '/tu-vi', '/bat-tu', '/kinh-dich', '/phong-thuy');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_blocks_cong_cu_ds" AS ENUM('than_so', 'hom_nay', 'hop_doi', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_blocks_bai_viet_mang" AS ENUM('tat_ca', 'than_so', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy', 'chung');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_nhom" AS ENUM('cong_cu', 'tinh', 'phap_ly', 'chu_de', 'kien_thuc', 'tuoi', 'la_so_mau', 'blog_khung');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_kieu_chu_co" AS ENUM('nho', 'thuong', 'lon', 'rat_lon');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_kieu_chu_can" AS ENUM('trai', 'giua');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_kieu_chu_nen" AS ENUM('khong', 'nhan', 'vang', 'ngoc');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_loai_sua" AS ENUM('sua_chu', 'thay_doi_noi_dung');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_che_do_mau_tren" AS ENUM('thay', 'them_sau', 'an_mau');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_che_do_mau_duoi" AS ENUM('thay', 'them_sau', 'an_mau');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_che_do_mau_cuoi" AS ENUM('thay', 'them_sau', 'an_mau');
  CREATE TYPE "cms"."enum__noi_dung_trang_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_mau_cum_blocks_banner_kieu_chu_co" AS ENUM('nho', 'thuong', 'lon', 'rat_lon');
  CREATE TYPE "cms"."enum_mau_cum_blocks_banner_kieu_chu_can" AS ENUM('trai', 'giua');
  CREATE TYPE "cms"."enum_mau_cum_blocks_banner_kieu_chu_nen" AS ENUM('khong', 'nhan', 'vang', 'ngoc');
  CREATE TYPE "cms"."enum_mau_cum_blocks_nut_moi_kieu" AS ENUM('chinh', 'phu');
  CREATE TYPE "cms"."enum_mau_cum_blocks_ghi_chu_kieu" AS ENUM('luu_y', 'meo', 'tu_soi', 'tom_tat');
  CREATE TYPE "cms"."enum_mau_cum_blocks_keu_goi_cong_cu" AS ENUM('/than-so', '/hom-nay', '/hop-doi', '/tu-vi', '/bat-tu', '/kinh-dich', '/phong-thuy');
  CREATE TYPE "cms"."enum_mau_cum_blocks_cong_cu_ds" AS ENUM('than_so', 'hom_nay', 'hop_doi', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy');
  CREATE TYPE "cms"."enum_mau_cum_blocks_bai_viet_mang" AS ENUM('tat_ca', 'than_so', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy', 'chung');
  CREATE TYPE "cms"."enum_mau_cum_nhom" AS ENUM('cong_cu', 'tinh', 'phap_ly', 'chu_de', 'kien_thuc', 'tuoi', 'la_so_mau', 'blog_khung');
  CREATE TYPE "cms"."enum_mau_cum_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__mau_cum_v_blocks_banner_kieu_chu_co" AS ENUM('nho', 'thuong', 'lon', 'rat_lon');
  CREATE TYPE "cms"."enum__mau_cum_v_blocks_banner_kieu_chu_can" AS ENUM('trai', 'giua');
  CREATE TYPE "cms"."enum__mau_cum_v_blocks_banner_kieu_chu_nen" AS ENUM('khong', 'nhan', 'vang', 'ngoc');
  CREATE TYPE "cms"."enum__mau_cum_v_blocks_nut_moi_kieu" AS ENUM('chinh', 'phu');
  CREATE TYPE "cms"."enum__mau_cum_v_blocks_ghi_chu_kieu" AS ENUM('luu_y', 'meo', 'tu_soi', 'tom_tat');
  CREATE TYPE "cms"."enum__mau_cum_v_blocks_keu_goi_cong_cu" AS ENUM('/than-so', '/hom-nay', '/hop-doi', '/tu-vi', '/bat-tu', '/kinh-dich', '/phong-thuy');
  CREATE TYPE "cms"."enum__mau_cum_v_blocks_cong_cu_ds" AS ENUM('than_so', 'hom_nay', 'hop_doi', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy');
  CREATE TYPE "cms"."enum__mau_cum_v_blocks_bai_viet_mang" AS ENUM('tat_ca', 'than_so', 'tu_vi', 'bat_tu', 'kinh_dich', 'phong_thuy', 'chung');
  CREATE TYPE "cms"."enum__mau_cum_v_version_nhom" AS ENUM('cong_cu', 'tinh', 'phap_ly', 'chu_de', 'kien_thuc', 'tuoi', 'la_so_mau', 'blog_khung');
  CREATE TYPE "cms"."enum__mau_cum_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_dieu_huong_thuong_hieu_cam_ket_bieu_tuong" AS ENUM('khien', 'may_chu', 'lap_lanh', 'khoa', 'bat_tay', 'sach', 'can', 'la_ban');
  ALTER TYPE "cms"."enum_payload_jobs_log_task_slug" ADD VALUE 'dong-bo-so-trang' BEFORE 'schedulePublish';
  ALTER TYPE "cms"."enum_payload_jobs_task_slug" ADD VALUE 'dong-bo-so-trang' BEFORE 'schedulePublish';
  CREATE TABLE "cms"."noi_dung_trang_doan" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"chu" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_hoi_dap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cau_hoi" varchar,
  	"tra_loi" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_lien_ket" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nhan" varchar,
  	"loai" "cms"."enum_noi_dung_trang_lien_ket_loai" DEFAULT 'duong_dan',
  	"duong_dan" varchar,
  	"bai_id" integer,
  	"chuyen_muc_id" integer
  );
  
  CREATE TABLE "cms"."noi_dung_trang_muc" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"neo" varchar,
  	"tieu_de" varchar,
  	"noi_dung" jsonb,
  	"noi_dung_html" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_banner" (
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
  	"tu_ngay" timestamp(3) with time zone,
  	"den_ngay" timestamp(3) with time zone,
  	"kieu_chu_co" "cms"."enum_noi_dung_trang_blocks_banner_kieu_chu_co" DEFAULT 'thuong',
  	"kieu_chu_can" "cms"."enum_noi_dung_trang_blocks_banner_kieu_chu_can" DEFAULT 'trai',
  	"kieu_chu_nen" "cms"."enum_noi_dung_trang_blocks_banner_kieu_chu_nen" DEFAULT 'khong',
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_nut_moi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"chu" varchar,
  	"link" varchar,
  	"kieu" "cms"."enum_noi_dung_trang_blocks_nut_moi_kieu" DEFAULT 'chinh',
  	"ma_do" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_ghi_chu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kieu" "cms"."enum_noi_dung_trang_blocks_ghi_chu_kieu" DEFAULT 'luu_y',
  	"tieu_de" varchar,
  	"noi_dung" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_keu_goi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cong_cu" "cms"."enum_noi_dung_trang_blocks_keu_goi_cong_cu",
  	"loi_moi" varchar,
  	"nut" varchar DEFAULT 'Xem của tôi',
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_trich_dan" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cau" varchar,
  	"nguon" varchar,
  	"dich_nghia" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"tieu_de" varchar,
  	"chu_thich" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_cong_cu_ds" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "cms"."enum_noi_dung_trang_blocks_cong_cu_ds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_cong_cu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_bai_viet" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"mang" "cms"."enum_noi_dung_trang_blocks_bai_viet_mang",
  	"so_bai" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_hoi_dap_ds" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cau_hoi" varchar,
  	"tra_loi" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_hoi_dap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_loi_moi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar DEFAULT 'Mời bạn cùng xem — cả hai cùng nhận Sao',
  	"mo_ta" varchar,
  	"nut_chu" varchar DEFAULT 'Lấy link mời của tôi',
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang_blocks_van_ban" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"noi_dung" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."noi_dung_trang" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"duong" varchar,
  	"ten" varchar,
  	"nhom" "cms"."enum_noi_dung_trang_nhom",
  	"mau_id" integer,
  	"tren_web" boolean DEFAULT true,
  	"o" jsonb,
  	"tieu_de_seo" varchar,
  	"mo_ta_seo" varchar,
  	"anh_chia_se_id" integer,
  	"h1" varchar,
  	"loi_dan" varchar,
  	"kieu_chu_co" "cms"."enum_noi_dung_trang_kieu_chu_co" DEFAULT 'thuong',
  	"kieu_chu_can" "cms"."enum_noi_dung_trang_kieu_chu_can" DEFAULT 'trai',
  	"kieu_chu_nen" "cms"."enum_noi_dung_trang_kieu_chu_nen" DEFAULT 'khong',
  	"loai_sua" "cms"."enum_noi_dung_trang_loai_sua" DEFAULT 'sua_chu',
  	"ngay_hieu_luc" timestamp(3) with time zone,
  	"che_do_mau_tren" "cms"."enum_noi_dung_trang_che_do_mau_tren" DEFAULT 'thay',
  	"che_do_mau_duoi" "cms"."enum_noi_dung_trang_che_do_mau_duoi" DEFAULT 'thay',
  	"che_do_mau_cuoi" "cms"."enum_noi_dung_trang_che_do_mau_cuoi" DEFAULT 'thay',
  	"mac_dinh" jsonb,
  	"ghi_chu_kiem_dinh" varchar,
  	"nguoi_sua_id" integer,
  	"ghi_chu_noi_bo" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_noi_dung_trang_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."noi_dung_trang_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"bai_viet_id" integer
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_version_doan" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"chu" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_version_hoi_dap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cau_hoi" varchar,
  	"tra_loi" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_version_lien_ket" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"nhan" varchar,
  	"loai" "cms"."enum__noi_dung_trang_v_version_lien_ket_loai" DEFAULT 'duong_dan',
  	"duong_dan" varchar,
  	"bai_id" integer,
  	"chuyen_muc_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_version_muc" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"neo" varchar,
  	"tieu_de" varchar,
  	"noi_dung" jsonb,
  	"noi_dung_html" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_banner" (
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
  	"tu_ngay" timestamp(3) with time zone,
  	"den_ngay" timestamp(3) with time zone,
  	"kieu_chu_co" "cms"."enum__noi_dung_trang_v_blocks_banner_kieu_chu_co" DEFAULT 'thuong',
  	"kieu_chu_can" "cms"."enum__noi_dung_trang_v_blocks_banner_kieu_chu_can" DEFAULT 'trai',
  	"kieu_chu_nen" "cms"."enum__noi_dung_trang_v_blocks_banner_kieu_chu_nen" DEFAULT 'khong',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_nut_moi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"chu" varchar,
  	"link" varchar,
  	"kieu" "cms"."enum__noi_dung_trang_v_blocks_nut_moi_kieu" DEFAULT 'chinh',
  	"ma_do" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_ghi_chu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kieu" "cms"."enum__noi_dung_trang_v_blocks_ghi_chu_kieu" DEFAULT 'luu_y',
  	"tieu_de" varchar,
  	"noi_dung" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_keu_goi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cong_cu" "cms"."enum__noi_dung_trang_v_blocks_keu_goi_cong_cu",
  	"loi_moi" varchar,
  	"nut" varchar DEFAULT 'Xem của tôi',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_trich_dan" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cau" varchar,
  	"nguon" varchar,
  	"dich_nghia" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"tieu_de" varchar,
  	"chu_thich" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_cong_cu_ds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "cms"."enum__noi_dung_trang_v_blocks_cong_cu_ds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_cong_cu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_bai_viet" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"mang" "cms"."enum__noi_dung_trang_v_blocks_bai_viet_mang",
  	"so_bai" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_hoi_dap_ds" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cau_hoi" varchar,
  	"tra_loi" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_hoi_dap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_loi_moi" (
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
  
  CREATE TABLE "cms"."_noi_dung_trang_v_blocks_van_ban" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"noi_dung" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_duong" varchar,
  	"version_ten" varchar,
  	"version_nhom" "cms"."enum__noi_dung_trang_v_version_nhom",
  	"version_mau_id" integer,
  	"version_tren_web" boolean DEFAULT true,
  	"version_o" jsonb,
  	"version_tieu_de_seo" varchar,
  	"version_mo_ta_seo" varchar,
  	"version_anh_chia_se_id" integer,
  	"version_h1" varchar,
  	"version_loi_dan" varchar,
  	"version_kieu_chu_co" "cms"."enum__noi_dung_trang_v_version_kieu_chu_co" DEFAULT 'thuong',
  	"version_kieu_chu_can" "cms"."enum__noi_dung_trang_v_version_kieu_chu_can" DEFAULT 'trai',
  	"version_kieu_chu_nen" "cms"."enum__noi_dung_trang_v_version_kieu_chu_nen" DEFAULT 'khong',
  	"version_loai_sua" "cms"."enum__noi_dung_trang_v_version_loai_sua" DEFAULT 'sua_chu',
  	"version_ngay_hieu_luc" timestamp(3) with time zone,
  	"version_che_do_mau_tren" "cms"."enum__noi_dung_trang_v_version_che_do_mau_tren" DEFAULT 'thay',
  	"version_che_do_mau_duoi" "cms"."enum__noi_dung_trang_v_version_che_do_mau_duoi" DEFAULT 'thay',
  	"version_che_do_mau_cuoi" "cms"."enum__noi_dung_trang_v_version_che_do_mau_cuoi" DEFAULT 'thay',
  	"version_mac_dinh" jsonb,
  	"version_ghi_chu_kiem_dinh" varchar,
  	"version_nguoi_sua_id" integer,
  	"version_ghi_chu_noi_bo" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__noi_dung_trang_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "cms"."_noi_dung_trang_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"bai_viet_id" integer
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_banner" (
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
  	"tu_ngay" timestamp(3) with time zone,
  	"den_ngay" timestamp(3) with time zone,
  	"kieu_chu_co" "cms"."enum_mau_cum_blocks_banner_kieu_chu_co" DEFAULT 'thuong',
  	"kieu_chu_can" "cms"."enum_mau_cum_blocks_banner_kieu_chu_can" DEFAULT 'trai',
  	"kieu_chu_nen" "cms"."enum_mau_cum_blocks_banner_kieu_chu_nen" DEFAULT 'khong',
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_nut_moi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"chu" varchar,
  	"link" varchar,
  	"kieu" "cms"."enum_mau_cum_blocks_nut_moi_kieu" DEFAULT 'chinh',
  	"ma_do" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_ghi_chu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kieu" "cms"."enum_mau_cum_blocks_ghi_chu_kieu" DEFAULT 'luu_y',
  	"tieu_de" varchar,
  	"noi_dung" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_keu_goi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cong_cu" "cms"."enum_mau_cum_blocks_keu_goi_cong_cu",
  	"loi_moi" varchar,
  	"nut" varchar DEFAULT 'Xem của tôi',
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_trich_dan" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cau" varchar,
  	"nguon" varchar,
  	"dich_nghia" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"tieu_de" varchar,
  	"chu_thich" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_cong_cu_ds" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "cms"."enum_mau_cum_blocks_cong_cu_ds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_cong_cu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_bai_viet" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"mang" "cms"."enum_mau_cum_blocks_bai_viet_mang",
  	"so_bai" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_hoi_dap_ds" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cau_hoi" varchar,
  	"tra_loi" varchar
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_hoi_dap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_loi_moi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar DEFAULT 'Mời bạn cùng xem — cả hai cùng nhận Sao',
  	"mo_ta" varchar,
  	"nut_chu" varchar DEFAULT 'Lấy link mời của tôi',
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."mau_cum_blocks_van_ban" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"noi_dung" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."mau_cum" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"mau_duong" varchar,
  	"ten" varchar,
  	"nhom" "cms"."enum_mau_cum_nhom",
  	"tren_web" boolean DEFAULT true,
  	"bien" jsonb,
  	"o" jsonb,
  	"nguon_kb" jsonb,
  	"ghi_chu_kiem_dinh" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_mau_cum_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."mau_cum_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"bai_viet_id" integer
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_banner" (
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
  	"tu_ngay" timestamp(3) with time zone,
  	"den_ngay" timestamp(3) with time zone,
  	"kieu_chu_co" "cms"."enum__mau_cum_v_blocks_banner_kieu_chu_co" DEFAULT 'thuong',
  	"kieu_chu_can" "cms"."enum__mau_cum_v_blocks_banner_kieu_chu_can" DEFAULT 'trai',
  	"kieu_chu_nen" "cms"."enum__mau_cum_v_blocks_banner_kieu_chu_nen" DEFAULT 'khong',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_nut_moi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"chu" varchar,
  	"link" varchar,
  	"kieu" "cms"."enum__mau_cum_v_blocks_nut_moi_kieu" DEFAULT 'chinh',
  	"ma_do" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_ghi_chu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kieu" "cms"."enum__mau_cum_v_blocks_ghi_chu_kieu" DEFAULT 'luu_y',
  	"tieu_de" varchar,
  	"noi_dung" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_keu_goi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cong_cu" "cms"."enum__mau_cum_v_blocks_keu_goi_cong_cu",
  	"loi_moi" varchar,
  	"nut" varchar DEFAULT 'Xem của tôi',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_trich_dan" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cau" varchar,
  	"nguon" varchar,
  	"dich_nghia" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"tieu_de" varchar,
  	"chu_thich" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_cong_cu_ds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "cms"."enum__mau_cum_v_blocks_cong_cu_ds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_cong_cu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_bai_viet" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"mang" "cms"."enum__mau_cum_v_blocks_bai_viet_mang",
  	"so_bai" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_hoi_dap_ds" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cau_hoi" varchar,
  	"tra_loi" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_hoi_dap" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_loi_moi" (
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
  
  CREATE TABLE "cms"."_mau_cum_v_blocks_van_ban" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tieu_de" varchar,
  	"noi_dung" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_mau_cum_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_mau_duong" varchar,
  	"version_ten" varchar,
  	"version_nhom" "cms"."enum__mau_cum_v_version_nhom",
  	"version_tren_web" boolean DEFAULT true,
  	"version_bien" jsonb,
  	"version_o" jsonb,
  	"version_nguon_kb" jsonb,
  	"version_ghi_chu_kiem_dinh" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__mau_cum_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "cms"."_mau_cum_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"bai_viet_id" integer
  );
  
  CREATE TABLE "cms"."dieu_huong_thuong_hieu_cam_ket" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"chu" varchar NOT NULL,
  	"bieu_tuong" "cms"."enum_dieu_huong_thuong_hieu_cam_ket_bieu_tuong" DEFAULT 'khien' NOT NULL
  );
  
  CREATE TABLE "cms"."payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "cms"."payload_jobs" ADD COLUMN "meta" jsonb;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD COLUMN "noi_dung_trang_id" integer;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD COLUMN "mau_cum_id" integer;
  ALTER TABLE "cms"."dieu_huong" ADD COLUMN "thuong_hieu_gioi_thieu" varchar DEFAULT 'Năm hệ thống văn hoá — thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi chứ không để phán.';
  ALTER TABLE "cms"."dieu_huong" ADD COLUMN "mien_tru" varchar DEFAULT 'Nội dung biên soạn từ thư tịch văn hoá cổ điển, để tham khảo và tự suy ngẫm, không phải dự báo. Nội dung không thay thế ý kiến chuyên môn về y tế, tâm lý, pháp lý, tài chính. Nội dung do Ban biên tập Hiểu Bản Thân biên soạn từ cổ thư và tài liệu tham khảo, chủ biên Đức Luân chịu trách nhiệm.' NOT NULL;
  ALTER TABLE "cms"."dieu_huong" ADD COLUMN "nhan_ung_ho" varchar DEFAULT 'Ủng hộ đội ngũ phát triển';
  ALTER TABLE "cms"."noi_dung_trang_doan" ADD CONSTRAINT "noi_dung_trang_doan_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_hoi_dap" ADD CONSTRAINT "noi_dung_trang_hoi_dap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_lien_ket" ADD CONSTRAINT "noi_dung_trang_lien_ket_bai_id_bai_viet_id_fk" FOREIGN KEY ("bai_id") REFERENCES "cms"."bai_viet"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_lien_ket" ADD CONSTRAINT "noi_dung_trang_lien_ket_chuyen_muc_id_chuyen_muc_id_fk" FOREIGN KEY ("chuyen_muc_id") REFERENCES "cms"."chuyen_muc"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_lien_ket" ADD CONSTRAINT "noi_dung_trang_lien_ket_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_muc" ADD CONSTRAINT "noi_dung_trang_muc_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_banner" ADD CONSTRAINT "noi_dung_trang_blocks_banner_anh_id_media_id_fk" FOREIGN KEY ("anh_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_banner" ADD CONSTRAINT "noi_dung_trang_blocks_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_nut_moi" ADD CONSTRAINT "noi_dung_trang_blocks_nut_moi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_ghi_chu" ADD CONSTRAINT "noi_dung_trang_blocks_ghi_chu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_keu_goi" ADD CONSTRAINT "noi_dung_trang_blocks_keu_goi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_trich_dan" ADD CONSTRAINT "noi_dung_trang_blocks_trich_dan_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_video" ADD CONSTRAINT "noi_dung_trang_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_cong_cu_ds" ADD CONSTRAINT "noi_dung_trang_blocks_cong_cu_ds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."noi_dung_trang_blocks_cong_cu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_cong_cu" ADD CONSTRAINT "noi_dung_trang_blocks_cong_cu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_bai_viet" ADD CONSTRAINT "noi_dung_trang_blocks_bai_viet_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_hoi_dap_ds" ADD CONSTRAINT "noi_dung_trang_blocks_hoi_dap_ds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang_blocks_hoi_dap"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_hoi_dap" ADD CONSTRAINT "noi_dung_trang_blocks_hoi_dap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_loi_moi" ADD CONSTRAINT "noi_dung_trang_blocks_loi_moi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_blocks_van_ban" ADD CONSTRAINT "noi_dung_trang_blocks_van_ban_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang" ADD CONSTRAINT "noi_dung_trang_mau_id_mau_cum_id_fk" FOREIGN KEY ("mau_id") REFERENCES "cms"."mau_cum"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang" ADD CONSTRAINT "noi_dung_trang_anh_chia_se_id_media_id_fk" FOREIGN KEY ("anh_chia_se_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang" ADD CONSTRAINT "noi_dung_trang_nguoi_sua_id_bien_tap_vien_id_fk" FOREIGN KEY ("nguoi_sua_id") REFERENCES "cms"."bien_tap_vien"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_rels" ADD CONSTRAINT "noi_dung_trang_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."noi_dung_trang_rels" ADD CONSTRAINT "noi_dung_trang_rels_bai_viet_fk" FOREIGN KEY ("bai_viet_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_version_doan" ADD CONSTRAINT "_noi_dung_trang_v_version_doan_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_version_hoi_dap" ADD CONSTRAINT "_noi_dung_trang_v_version_hoi_dap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_version_lien_ket" ADD CONSTRAINT "_noi_dung_trang_v_version_lien_ket_bai_id_bai_viet_id_fk" FOREIGN KEY ("bai_id") REFERENCES "cms"."bai_viet"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_version_lien_ket" ADD CONSTRAINT "_noi_dung_trang_v_version_lien_ket_chuyen_muc_id_chuyen_muc_id_fk" FOREIGN KEY ("chuyen_muc_id") REFERENCES "cms"."chuyen_muc"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_version_lien_ket" ADD CONSTRAINT "_noi_dung_trang_v_version_lien_ket_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_version_muc" ADD CONSTRAINT "_noi_dung_trang_v_version_muc_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_banner" ADD CONSTRAINT "_noi_dung_trang_v_blocks_banner_anh_id_media_id_fk" FOREIGN KEY ("anh_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_banner" ADD CONSTRAINT "_noi_dung_trang_v_blocks_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_nut_moi" ADD CONSTRAINT "_noi_dung_trang_v_blocks_nut_moi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_ghi_chu" ADD CONSTRAINT "_noi_dung_trang_v_blocks_ghi_chu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_keu_goi" ADD CONSTRAINT "_noi_dung_trang_v_blocks_keu_goi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_trich_dan" ADD CONSTRAINT "_noi_dung_trang_v_blocks_trich_dan_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_video" ADD CONSTRAINT "_noi_dung_trang_v_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_cong_cu_ds" ADD CONSTRAINT "_noi_dung_trang_v_blocks_cong_cu_ds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_noi_dung_trang_v_blocks_cong_cu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_cong_cu" ADD CONSTRAINT "_noi_dung_trang_v_blocks_cong_cu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_bai_viet" ADD CONSTRAINT "_noi_dung_trang_v_blocks_bai_viet_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_hoi_dap_ds" ADD CONSTRAINT "_noi_dung_trang_v_blocks_hoi_dap_ds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v_blocks_hoi_dap"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_hoi_dap" ADD CONSTRAINT "_noi_dung_trang_v_blocks_hoi_dap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_loi_moi" ADD CONSTRAINT "_noi_dung_trang_v_blocks_loi_moi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_van_ban" ADD CONSTRAINT "_noi_dung_trang_v_blocks_van_ban_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v" ADD CONSTRAINT "_noi_dung_trang_v_parent_id_noi_dung_trang_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v" ADD CONSTRAINT "_noi_dung_trang_v_version_mau_id_mau_cum_id_fk" FOREIGN KEY ("version_mau_id") REFERENCES "cms"."mau_cum"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v" ADD CONSTRAINT "_noi_dung_trang_v_version_anh_chia_se_id_media_id_fk" FOREIGN KEY ("version_anh_chia_se_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v" ADD CONSTRAINT "_noi_dung_trang_v_version_nguoi_sua_id_bien_tap_vien_id_fk" FOREIGN KEY ("version_nguoi_sua_id") REFERENCES "cms"."bien_tap_vien"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_rels" ADD CONSTRAINT "_noi_dung_trang_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_noi_dung_trang_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_noi_dung_trang_v_rels" ADD CONSTRAINT "_noi_dung_trang_v_rels_bai_viet_fk" FOREIGN KEY ("bai_viet_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_banner" ADD CONSTRAINT "mau_cum_blocks_banner_anh_id_media_id_fk" FOREIGN KEY ("anh_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_banner" ADD CONSTRAINT "mau_cum_blocks_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_nut_moi" ADD CONSTRAINT "mau_cum_blocks_nut_moi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_ghi_chu" ADD CONSTRAINT "mau_cum_blocks_ghi_chu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_keu_goi" ADD CONSTRAINT "mau_cum_blocks_keu_goi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_trich_dan" ADD CONSTRAINT "mau_cum_blocks_trich_dan_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_video" ADD CONSTRAINT "mau_cum_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_cong_cu_ds" ADD CONSTRAINT "mau_cum_blocks_cong_cu_ds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."mau_cum_blocks_cong_cu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_cong_cu" ADD CONSTRAINT "mau_cum_blocks_cong_cu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_bai_viet" ADD CONSTRAINT "mau_cum_blocks_bai_viet_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_hoi_dap_ds" ADD CONSTRAINT "mau_cum_blocks_hoi_dap_ds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum_blocks_hoi_dap"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_hoi_dap" ADD CONSTRAINT "mau_cum_blocks_hoi_dap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_loi_moi" ADD CONSTRAINT "mau_cum_blocks_loi_moi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_blocks_van_ban" ADD CONSTRAINT "mau_cum_blocks_van_ban_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_rels" ADD CONSTRAINT "mau_cum_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."mau_cum_rels" ADD CONSTRAINT "mau_cum_rels_bai_viet_fk" FOREIGN KEY ("bai_viet_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_banner" ADD CONSTRAINT "_mau_cum_v_blocks_banner_anh_id_media_id_fk" FOREIGN KEY ("anh_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_banner" ADD CONSTRAINT "_mau_cum_v_blocks_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_nut_moi" ADD CONSTRAINT "_mau_cum_v_blocks_nut_moi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_ghi_chu" ADD CONSTRAINT "_mau_cum_v_blocks_ghi_chu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_keu_goi" ADD CONSTRAINT "_mau_cum_v_blocks_keu_goi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_trich_dan" ADD CONSTRAINT "_mau_cum_v_blocks_trich_dan_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_video" ADD CONSTRAINT "_mau_cum_v_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_cong_cu_ds" ADD CONSTRAINT "_mau_cum_v_blocks_cong_cu_ds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_mau_cum_v_blocks_cong_cu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_cong_cu" ADD CONSTRAINT "_mau_cum_v_blocks_cong_cu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_bai_viet" ADD CONSTRAINT "_mau_cum_v_blocks_bai_viet_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_hoi_dap_ds" ADD CONSTRAINT "_mau_cum_v_blocks_hoi_dap_ds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v_blocks_hoi_dap"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_hoi_dap" ADD CONSTRAINT "_mau_cum_v_blocks_hoi_dap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_loi_moi" ADD CONSTRAINT "_mau_cum_v_blocks_loi_moi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_blocks_van_ban" ADD CONSTRAINT "_mau_cum_v_blocks_van_ban_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v" ADD CONSTRAINT "_mau_cum_v_parent_id_mau_cum_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."mau_cum"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_rels" ADD CONSTRAINT "_mau_cum_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_mau_cum_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_mau_cum_v_rels" ADD CONSTRAINT "_mau_cum_v_rels_bai_viet_fk" FOREIGN KEY ("bai_viet_id") REFERENCES "cms"."bai_viet"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."dieu_huong_thuong_hieu_cam_ket" ADD CONSTRAINT "dieu_huong_thuong_hieu_cam_ket_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."dieu_huong"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "noi_dung_trang_doan_order_idx" ON "cms"."noi_dung_trang_doan" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_doan_parent_id_idx" ON "cms"."noi_dung_trang_doan" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_hoi_dap_order_idx" ON "cms"."noi_dung_trang_hoi_dap" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_hoi_dap_parent_id_idx" ON "cms"."noi_dung_trang_hoi_dap" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_lien_ket_order_idx" ON "cms"."noi_dung_trang_lien_ket" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_lien_ket_parent_id_idx" ON "cms"."noi_dung_trang_lien_ket" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_lien_ket_bai_idx" ON "cms"."noi_dung_trang_lien_ket" USING btree ("bai_id");
  CREATE INDEX "noi_dung_trang_lien_ket_chuyen_muc_idx" ON "cms"."noi_dung_trang_lien_ket" USING btree ("chuyen_muc_id");
  CREATE INDEX "noi_dung_trang_muc_order_idx" ON "cms"."noi_dung_trang_muc" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_muc_parent_id_idx" ON "cms"."noi_dung_trang_muc" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_banner_order_idx" ON "cms"."noi_dung_trang_blocks_banner" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_banner_parent_id_idx" ON "cms"."noi_dung_trang_blocks_banner" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_banner_path_idx" ON "cms"."noi_dung_trang_blocks_banner" USING btree ("_path");
  CREATE INDEX "noi_dung_trang_blocks_banner_anh_idx" ON "cms"."noi_dung_trang_blocks_banner" USING btree ("anh_id");
  CREATE INDEX "noi_dung_trang_blocks_nut_moi_order_idx" ON "cms"."noi_dung_trang_blocks_nut_moi" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_nut_moi_parent_id_idx" ON "cms"."noi_dung_trang_blocks_nut_moi" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_nut_moi_path_idx" ON "cms"."noi_dung_trang_blocks_nut_moi" USING btree ("_path");
  CREATE INDEX "noi_dung_trang_blocks_ghi_chu_order_idx" ON "cms"."noi_dung_trang_blocks_ghi_chu" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_ghi_chu_parent_id_idx" ON "cms"."noi_dung_trang_blocks_ghi_chu" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_ghi_chu_path_idx" ON "cms"."noi_dung_trang_blocks_ghi_chu" USING btree ("_path");
  CREATE INDEX "noi_dung_trang_blocks_keu_goi_order_idx" ON "cms"."noi_dung_trang_blocks_keu_goi" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_keu_goi_parent_id_idx" ON "cms"."noi_dung_trang_blocks_keu_goi" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_keu_goi_path_idx" ON "cms"."noi_dung_trang_blocks_keu_goi" USING btree ("_path");
  CREATE INDEX "noi_dung_trang_blocks_trich_dan_order_idx" ON "cms"."noi_dung_trang_blocks_trich_dan" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_trich_dan_parent_id_idx" ON "cms"."noi_dung_trang_blocks_trich_dan" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_trich_dan_path_idx" ON "cms"."noi_dung_trang_blocks_trich_dan" USING btree ("_path");
  CREATE INDEX "noi_dung_trang_blocks_video_order_idx" ON "cms"."noi_dung_trang_blocks_video" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_video_parent_id_idx" ON "cms"."noi_dung_trang_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_video_path_idx" ON "cms"."noi_dung_trang_blocks_video" USING btree ("_path");
  CREATE INDEX "noi_dung_trang_blocks_cong_cu_ds_order_idx" ON "cms"."noi_dung_trang_blocks_cong_cu_ds" USING btree ("order");
  CREATE INDEX "noi_dung_trang_blocks_cong_cu_ds_parent_idx" ON "cms"."noi_dung_trang_blocks_cong_cu_ds" USING btree ("parent_id");
  CREATE INDEX "noi_dung_trang_blocks_cong_cu_order_idx" ON "cms"."noi_dung_trang_blocks_cong_cu" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_cong_cu_parent_id_idx" ON "cms"."noi_dung_trang_blocks_cong_cu" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_cong_cu_path_idx" ON "cms"."noi_dung_trang_blocks_cong_cu" USING btree ("_path");
  CREATE INDEX "noi_dung_trang_blocks_bai_viet_order_idx" ON "cms"."noi_dung_trang_blocks_bai_viet" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_bai_viet_parent_id_idx" ON "cms"."noi_dung_trang_blocks_bai_viet" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_bai_viet_path_idx" ON "cms"."noi_dung_trang_blocks_bai_viet" USING btree ("_path");
  CREATE INDEX "noi_dung_trang_blocks_hoi_dap_ds_order_idx" ON "cms"."noi_dung_trang_blocks_hoi_dap_ds" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_hoi_dap_ds_parent_id_idx" ON "cms"."noi_dung_trang_blocks_hoi_dap_ds" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_hoi_dap_order_idx" ON "cms"."noi_dung_trang_blocks_hoi_dap" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_hoi_dap_parent_id_idx" ON "cms"."noi_dung_trang_blocks_hoi_dap" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_hoi_dap_path_idx" ON "cms"."noi_dung_trang_blocks_hoi_dap" USING btree ("_path");
  CREATE INDEX "noi_dung_trang_blocks_loi_moi_order_idx" ON "cms"."noi_dung_trang_blocks_loi_moi" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_loi_moi_parent_id_idx" ON "cms"."noi_dung_trang_blocks_loi_moi" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_loi_moi_path_idx" ON "cms"."noi_dung_trang_blocks_loi_moi" USING btree ("_path");
  CREATE INDEX "noi_dung_trang_blocks_van_ban_order_idx" ON "cms"."noi_dung_trang_blocks_van_ban" USING btree ("_order");
  CREATE INDEX "noi_dung_trang_blocks_van_ban_parent_id_idx" ON "cms"."noi_dung_trang_blocks_van_ban" USING btree ("_parent_id");
  CREATE INDEX "noi_dung_trang_blocks_van_ban_path_idx" ON "cms"."noi_dung_trang_blocks_van_ban" USING btree ("_path");
  CREATE UNIQUE INDEX "noi_dung_trang_duong_idx" ON "cms"."noi_dung_trang" USING btree ("duong");
  CREATE INDEX "noi_dung_trang_nhom_idx" ON "cms"."noi_dung_trang" USING btree ("nhom");
  CREATE INDEX "noi_dung_trang_mau_idx" ON "cms"."noi_dung_trang" USING btree ("mau_id");
  CREATE INDEX "noi_dung_trang_tren_web_idx" ON "cms"."noi_dung_trang" USING btree ("tren_web");
  CREATE INDEX "noi_dung_trang_anh_chia_se_idx" ON "cms"."noi_dung_trang" USING btree ("anh_chia_se_id");
  CREATE INDEX "noi_dung_trang_nguoi_sua_idx" ON "cms"."noi_dung_trang" USING btree ("nguoi_sua_id");
  CREATE INDEX "noi_dung_trang_updated_at_idx" ON "cms"."noi_dung_trang" USING btree ("updated_at");
  CREATE INDEX "noi_dung_trang_created_at_idx" ON "cms"."noi_dung_trang" USING btree ("created_at");
  CREATE INDEX "noi_dung_trang__status_idx" ON "cms"."noi_dung_trang" USING btree ("_status");
  CREATE INDEX "noi_dung_trang_rels_order_idx" ON "cms"."noi_dung_trang_rels" USING btree ("order");
  CREATE INDEX "noi_dung_trang_rels_parent_idx" ON "cms"."noi_dung_trang_rels" USING btree ("parent_id");
  CREATE INDEX "noi_dung_trang_rels_path_idx" ON "cms"."noi_dung_trang_rels" USING btree ("path");
  CREATE INDEX "noi_dung_trang_rels_bai_viet_id_idx" ON "cms"."noi_dung_trang_rels" USING btree ("bai_viet_id");
  CREATE INDEX "_noi_dung_trang_v_version_doan_order_idx" ON "cms"."_noi_dung_trang_v_version_doan" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_version_doan_parent_id_idx" ON "cms"."_noi_dung_trang_v_version_doan" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_version_hoi_dap_order_idx" ON "cms"."_noi_dung_trang_v_version_hoi_dap" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_version_hoi_dap_parent_id_idx" ON "cms"."_noi_dung_trang_v_version_hoi_dap" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_version_lien_ket_order_idx" ON "cms"."_noi_dung_trang_v_version_lien_ket" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_version_lien_ket_parent_id_idx" ON "cms"."_noi_dung_trang_v_version_lien_ket" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_version_lien_ket_bai_idx" ON "cms"."_noi_dung_trang_v_version_lien_ket" USING btree ("bai_id");
  CREATE INDEX "_noi_dung_trang_v_version_lien_ket_chuyen_muc_idx" ON "cms"."_noi_dung_trang_v_version_lien_ket" USING btree ("chuyen_muc_id");
  CREATE INDEX "_noi_dung_trang_v_version_muc_order_idx" ON "cms"."_noi_dung_trang_v_version_muc" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_version_muc_parent_id_idx" ON "cms"."_noi_dung_trang_v_version_muc" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_banner_order_idx" ON "cms"."_noi_dung_trang_v_blocks_banner" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_banner_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_banner" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_banner_path_idx" ON "cms"."_noi_dung_trang_v_blocks_banner" USING btree ("_path");
  CREATE INDEX "_noi_dung_trang_v_blocks_banner_anh_idx" ON "cms"."_noi_dung_trang_v_blocks_banner" USING btree ("anh_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_nut_moi_order_idx" ON "cms"."_noi_dung_trang_v_blocks_nut_moi" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_nut_moi_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_nut_moi" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_nut_moi_path_idx" ON "cms"."_noi_dung_trang_v_blocks_nut_moi" USING btree ("_path");
  CREATE INDEX "_noi_dung_trang_v_blocks_ghi_chu_order_idx" ON "cms"."_noi_dung_trang_v_blocks_ghi_chu" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_ghi_chu_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_ghi_chu" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_ghi_chu_path_idx" ON "cms"."_noi_dung_trang_v_blocks_ghi_chu" USING btree ("_path");
  CREATE INDEX "_noi_dung_trang_v_blocks_keu_goi_order_idx" ON "cms"."_noi_dung_trang_v_blocks_keu_goi" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_keu_goi_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_keu_goi" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_keu_goi_path_idx" ON "cms"."_noi_dung_trang_v_blocks_keu_goi" USING btree ("_path");
  CREATE INDEX "_noi_dung_trang_v_blocks_trich_dan_order_idx" ON "cms"."_noi_dung_trang_v_blocks_trich_dan" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_trich_dan_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_trich_dan" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_trich_dan_path_idx" ON "cms"."_noi_dung_trang_v_blocks_trich_dan" USING btree ("_path");
  CREATE INDEX "_noi_dung_trang_v_blocks_video_order_idx" ON "cms"."_noi_dung_trang_v_blocks_video" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_video_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_video_path_idx" ON "cms"."_noi_dung_trang_v_blocks_video" USING btree ("_path");
  CREATE INDEX "_noi_dung_trang_v_blocks_cong_cu_ds_order_idx" ON "cms"."_noi_dung_trang_v_blocks_cong_cu_ds" USING btree ("order");
  CREATE INDEX "_noi_dung_trang_v_blocks_cong_cu_ds_parent_idx" ON "cms"."_noi_dung_trang_v_blocks_cong_cu_ds" USING btree ("parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_cong_cu_order_idx" ON "cms"."_noi_dung_trang_v_blocks_cong_cu" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_cong_cu_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_cong_cu" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_cong_cu_path_idx" ON "cms"."_noi_dung_trang_v_blocks_cong_cu" USING btree ("_path");
  CREATE INDEX "_noi_dung_trang_v_blocks_bai_viet_order_idx" ON "cms"."_noi_dung_trang_v_blocks_bai_viet" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_bai_viet_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_bai_viet" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_bai_viet_path_idx" ON "cms"."_noi_dung_trang_v_blocks_bai_viet" USING btree ("_path");
  CREATE INDEX "_noi_dung_trang_v_blocks_hoi_dap_ds_order_idx" ON "cms"."_noi_dung_trang_v_blocks_hoi_dap_ds" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_hoi_dap_ds_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_hoi_dap_ds" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_hoi_dap_order_idx" ON "cms"."_noi_dung_trang_v_blocks_hoi_dap" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_hoi_dap_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_hoi_dap" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_hoi_dap_path_idx" ON "cms"."_noi_dung_trang_v_blocks_hoi_dap" USING btree ("_path");
  CREATE INDEX "_noi_dung_trang_v_blocks_loi_moi_order_idx" ON "cms"."_noi_dung_trang_v_blocks_loi_moi" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_loi_moi_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_loi_moi" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_loi_moi_path_idx" ON "cms"."_noi_dung_trang_v_blocks_loi_moi" USING btree ("_path");
  CREATE INDEX "_noi_dung_trang_v_blocks_van_ban_order_idx" ON "cms"."_noi_dung_trang_v_blocks_van_ban" USING btree ("_order");
  CREATE INDEX "_noi_dung_trang_v_blocks_van_ban_parent_id_idx" ON "cms"."_noi_dung_trang_v_blocks_van_ban" USING btree ("_parent_id");
  CREATE INDEX "_noi_dung_trang_v_blocks_van_ban_path_idx" ON "cms"."_noi_dung_trang_v_blocks_van_ban" USING btree ("_path");
  CREATE INDEX "_noi_dung_trang_v_parent_idx" ON "cms"."_noi_dung_trang_v" USING btree ("parent_id");
  CREATE INDEX "_noi_dung_trang_v_version_version_duong_idx" ON "cms"."_noi_dung_trang_v" USING btree ("version_duong");
  CREATE INDEX "_noi_dung_trang_v_version_version_nhom_idx" ON "cms"."_noi_dung_trang_v" USING btree ("version_nhom");
  CREATE INDEX "_noi_dung_trang_v_version_version_mau_idx" ON "cms"."_noi_dung_trang_v" USING btree ("version_mau_id");
  CREATE INDEX "_noi_dung_trang_v_version_version_tren_web_idx" ON "cms"."_noi_dung_trang_v" USING btree ("version_tren_web");
  CREATE INDEX "_noi_dung_trang_v_version_version_anh_chia_se_idx" ON "cms"."_noi_dung_trang_v" USING btree ("version_anh_chia_se_id");
  CREATE INDEX "_noi_dung_trang_v_version_version_nguoi_sua_idx" ON "cms"."_noi_dung_trang_v" USING btree ("version_nguoi_sua_id");
  CREATE INDEX "_noi_dung_trang_v_version_version_updated_at_idx" ON "cms"."_noi_dung_trang_v" USING btree ("version_updated_at");
  CREATE INDEX "_noi_dung_trang_v_version_version_created_at_idx" ON "cms"."_noi_dung_trang_v" USING btree ("version_created_at");
  CREATE INDEX "_noi_dung_trang_v_version_version__status_idx" ON "cms"."_noi_dung_trang_v" USING btree ("version__status");
  CREATE INDEX "_noi_dung_trang_v_created_at_idx" ON "cms"."_noi_dung_trang_v" USING btree ("created_at");
  CREATE INDEX "_noi_dung_trang_v_updated_at_idx" ON "cms"."_noi_dung_trang_v" USING btree ("updated_at");
  CREATE INDEX "_noi_dung_trang_v_latest_idx" ON "cms"."_noi_dung_trang_v" USING btree ("latest");
  CREATE INDEX "_noi_dung_trang_v_autosave_idx" ON "cms"."_noi_dung_trang_v" USING btree ("autosave");
  CREATE INDEX "_noi_dung_trang_v_rels_order_idx" ON "cms"."_noi_dung_trang_v_rels" USING btree ("order");
  CREATE INDEX "_noi_dung_trang_v_rels_parent_idx" ON "cms"."_noi_dung_trang_v_rels" USING btree ("parent_id");
  CREATE INDEX "_noi_dung_trang_v_rels_path_idx" ON "cms"."_noi_dung_trang_v_rels" USING btree ("path");
  CREATE INDEX "_noi_dung_trang_v_rels_bai_viet_id_idx" ON "cms"."_noi_dung_trang_v_rels" USING btree ("bai_viet_id");
  CREATE INDEX "mau_cum_blocks_banner_order_idx" ON "cms"."mau_cum_blocks_banner" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_banner_parent_id_idx" ON "cms"."mau_cum_blocks_banner" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_banner_path_idx" ON "cms"."mau_cum_blocks_banner" USING btree ("_path");
  CREATE INDEX "mau_cum_blocks_banner_anh_idx" ON "cms"."mau_cum_blocks_banner" USING btree ("anh_id");
  CREATE INDEX "mau_cum_blocks_nut_moi_order_idx" ON "cms"."mau_cum_blocks_nut_moi" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_nut_moi_parent_id_idx" ON "cms"."mau_cum_blocks_nut_moi" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_nut_moi_path_idx" ON "cms"."mau_cum_blocks_nut_moi" USING btree ("_path");
  CREATE INDEX "mau_cum_blocks_ghi_chu_order_idx" ON "cms"."mau_cum_blocks_ghi_chu" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_ghi_chu_parent_id_idx" ON "cms"."mau_cum_blocks_ghi_chu" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_ghi_chu_path_idx" ON "cms"."mau_cum_blocks_ghi_chu" USING btree ("_path");
  CREATE INDEX "mau_cum_blocks_keu_goi_order_idx" ON "cms"."mau_cum_blocks_keu_goi" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_keu_goi_parent_id_idx" ON "cms"."mau_cum_blocks_keu_goi" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_keu_goi_path_idx" ON "cms"."mau_cum_blocks_keu_goi" USING btree ("_path");
  CREATE INDEX "mau_cum_blocks_trich_dan_order_idx" ON "cms"."mau_cum_blocks_trich_dan" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_trich_dan_parent_id_idx" ON "cms"."mau_cum_blocks_trich_dan" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_trich_dan_path_idx" ON "cms"."mau_cum_blocks_trich_dan" USING btree ("_path");
  CREATE INDEX "mau_cum_blocks_video_order_idx" ON "cms"."mau_cum_blocks_video" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_video_parent_id_idx" ON "cms"."mau_cum_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_video_path_idx" ON "cms"."mau_cum_blocks_video" USING btree ("_path");
  CREATE INDEX "mau_cum_blocks_cong_cu_ds_order_idx" ON "cms"."mau_cum_blocks_cong_cu_ds" USING btree ("order");
  CREATE INDEX "mau_cum_blocks_cong_cu_ds_parent_idx" ON "cms"."mau_cum_blocks_cong_cu_ds" USING btree ("parent_id");
  CREATE INDEX "mau_cum_blocks_cong_cu_order_idx" ON "cms"."mau_cum_blocks_cong_cu" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_cong_cu_parent_id_idx" ON "cms"."mau_cum_blocks_cong_cu" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_cong_cu_path_idx" ON "cms"."mau_cum_blocks_cong_cu" USING btree ("_path");
  CREATE INDEX "mau_cum_blocks_bai_viet_order_idx" ON "cms"."mau_cum_blocks_bai_viet" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_bai_viet_parent_id_idx" ON "cms"."mau_cum_blocks_bai_viet" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_bai_viet_path_idx" ON "cms"."mau_cum_blocks_bai_viet" USING btree ("_path");
  CREATE INDEX "mau_cum_blocks_hoi_dap_ds_order_idx" ON "cms"."mau_cum_blocks_hoi_dap_ds" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_hoi_dap_ds_parent_id_idx" ON "cms"."mau_cum_blocks_hoi_dap_ds" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_hoi_dap_order_idx" ON "cms"."mau_cum_blocks_hoi_dap" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_hoi_dap_parent_id_idx" ON "cms"."mau_cum_blocks_hoi_dap" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_hoi_dap_path_idx" ON "cms"."mau_cum_blocks_hoi_dap" USING btree ("_path");
  CREATE INDEX "mau_cum_blocks_loi_moi_order_idx" ON "cms"."mau_cum_blocks_loi_moi" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_loi_moi_parent_id_idx" ON "cms"."mau_cum_blocks_loi_moi" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_loi_moi_path_idx" ON "cms"."mau_cum_blocks_loi_moi" USING btree ("_path");
  CREATE INDEX "mau_cum_blocks_van_ban_order_idx" ON "cms"."mau_cum_blocks_van_ban" USING btree ("_order");
  CREATE INDEX "mau_cum_blocks_van_ban_parent_id_idx" ON "cms"."mau_cum_blocks_van_ban" USING btree ("_parent_id");
  CREATE INDEX "mau_cum_blocks_van_ban_path_idx" ON "cms"."mau_cum_blocks_van_ban" USING btree ("_path");
  CREATE UNIQUE INDEX "mau_cum_mau_duong_idx" ON "cms"."mau_cum" USING btree ("mau_duong");
  CREATE INDEX "mau_cum_updated_at_idx" ON "cms"."mau_cum" USING btree ("updated_at");
  CREATE INDEX "mau_cum_created_at_idx" ON "cms"."mau_cum" USING btree ("created_at");
  CREATE INDEX "mau_cum__status_idx" ON "cms"."mau_cum" USING btree ("_status");
  CREATE INDEX "mau_cum_rels_order_idx" ON "cms"."mau_cum_rels" USING btree ("order");
  CREATE INDEX "mau_cum_rels_parent_idx" ON "cms"."mau_cum_rels" USING btree ("parent_id");
  CREATE INDEX "mau_cum_rels_path_idx" ON "cms"."mau_cum_rels" USING btree ("path");
  CREATE INDEX "mau_cum_rels_bai_viet_id_idx" ON "cms"."mau_cum_rels" USING btree ("bai_viet_id");
  CREATE INDEX "_mau_cum_v_blocks_banner_order_idx" ON "cms"."_mau_cum_v_blocks_banner" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_banner_parent_id_idx" ON "cms"."_mau_cum_v_blocks_banner" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_banner_path_idx" ON "cms"."_mau_cum_v_blocks_banner" USING btree ("_path");
  CREATE INDEX "_mau_cum_v_blocks_banner_anh_idx" ON "cms"."_mau_cum_v_blocks_banner" USING btree ("anh_id");
  CREATE INDEX "_mau_cum_v_blocks_nut_moi_order_idx" ON "cms"."_mau_cum_v_blocks_nut_moi" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_nut_moi_parent_id_idx" ON "cms"."_mau_cum_v_blocks_nut_moi" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_nut_moi_path_idx" ON "cms"."_mau_cum_v_blocks_nut_moi" USING btree ("_path");
  CREATE INDEX "_mau_cum_v_blocks_ghi_chu_order_idx" ON "cms"."_mau_cum_v_blocks_ghi_chu" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_ghi_chu_parent_id_idx" ON "cms"."_mau_cum_v_blocks_ghi_chu" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_ghi_chu_path_idx" ON "cms"."_mau_cum_v_blocks_ghi_chu" USING btree ("_path");
  CREATE INDEX "_mau_cum_v_blocks_keu_goi_order_idx" ON "cms"."_mau_cum_v_blocks_keu_goi" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_keu_goi_parent_id_idx" ON "cms"."_mau_cum_v_blocks_keu_goi" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_keu_goi_path_idx" ON "cms"."_mau_cum_v_blocks_keu_goi" USING btree ("_path");
  CREATE INDEX "_mau_cum_v_blocks_trich_dan_order_idx" ON "cms"."_mau_cum_v_blocks_trich_dan" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_trich_dan_parent_id_idx" ON "cms"."_mau_cum_v_blocks_trich_dan" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_trich_dan_path_idx" ON "cms"."_mau_cum_v_blocks_trich_dan" USING btree ("_path");
  CREATE INDEX "_mau_cum_v_blocks_video_order_idx" ON "cms"."_mau_cum_v_blocks_video" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_video_parent_id_idx" ON "cms"."_mau_cum_v_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_video_path_idx" ON "cms"."_mau_cum_v_blocks_video" USING btree ("_path");
  CREATE INDEX "_mau_cum_v_blocks_cong_cu_ds_order_idx" ON "cms"."_mau_cum_v_blocks_cong_cu_ds" USING btree ("order");
  CREATE INDEX "_mau_cum_v_blocks_cong_cu_ds_parent_idx" ON "cms"."_mau_cum_v_blocks_cong_cu_ds" USING btree ("parent_id");
  CREATE INDEX "_mau_cum_v_blocks_cong_cu_order_idx" ON "cms"."_mau_cum_v_blocks_cong_cu" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_cong_cu_parent_id_idx" ON "cms"."_mau_cum_v_blocks_cong_cu" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_cong_cu_path_idx" ON "cms"."_mau_cum_v_blocks_cong_cu" USING btree ("_path");
  CREATE INDEX "_mau_cum_v_blocks_bai_viet_order_idx" ON "cms"."_mau_cum_v_blocks_bai_viet" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_bai_viet_parent_id_idx" ON "cms"."_mau_cum_v_blocks_bai_viet" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_bai_viet_path_idx" ON "cms"."_mau_cum_v_blocks_bai_viet" USING btree ("_path");
  CREATE INDEX "_mau_cum_v_blocks_hoi_dap_ds_order_idx" ON "cms"."_mau_cum_v_blocks_hoi_dap_ds" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_hoi_dap_ds_parent_id_idx" ON "cms"."_mau_cum_v_blocks_hoi_dap_ds" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_hoi_dap_order_idx" ON "cms"."_mau_cum_v_blocks_hoi_dap" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_hoi_dap_parent_id_idx" ON "cms"."_mau_cum_v_blocks_hoi_dap" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_hoi_dap_path_idx" ON "cms"."_mau_cum_v_blocks_hoi_dap" USING btree ("_path");
  CREATE INDEX "_mau_cum_v_blocks_loi_moi_order_idx" ON "cms"."_mau_cum_v_blocks_loi_moi" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_loi_moi_parent_id_idx" ON "cms"."_mau_cum_v_blocks_loi_moi" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_loi_moi_path_idx" ON "cms"."_mau_cum_v_blocks_loi_moi" USING btree ("_path");
  CREATE INDEX "_mau_cum_v_blocks_van_ban_order_idx" ON "cms"."_mau_cum_v_blocks_van_ban" USING btree ("_order");
  CREATE INDEX "_mau_cum_v_blocks_van_ban_parent_id_idx" ON "cms"."_mau_cum_v_blocks_van_ban" USING btree ("_parent_id");
  CREATE INDEX "_mau_cum_v_blocks_van_ban_path_idx" ON "cms"."_mau_cum_v_blocks_van_ban" USING btree ("_path");
  CREATE INDEX "_mau_cum_v_parent_idx" ON "cms"."_mau_cum_v" USING btree ("parent_id");
  CREATE INDEX "_mau_cum_v_version_version_mau_duong_idx" ON "cms"."_mau_cum_v" USING btree ("version_mau_duong");
  CREATE INDEX "_mau_cum_v_version_version_updated_at_idx" ON "cms"."_mau_cum_v" USING btree ("version_updated_at");
  CREATE INDEX "_mau_cum_v_version_version_created_at_idx" ON "cms"."_mau_cum_v" USING btree ("version_created_at");
  CREATE INDEX "_mau_cum_v_version_version__status_idx" ON "cms"."_mau_cum_v" USING btree ("version__status");
  CREATE INDEX "_mau_cum_v_created_at_idx" ON "cms"."_mau_cum_v" USING btree ("created_at");
  CREATE INDEX "_mau_cum_v_updated_at_idx" ON "cms"."_mau_cum_v" USING btree ("updated_at");
  CREATE INDEX "_mau_cum_v_latest_idx" ON "cms"."_mau_cum_v" USING btree ("latest");
  CREATE INDEX "_mau_cum_v_autosave_idx" ON "cms"."_mau_cum_v" USING btree ("autosave");
  CREATE INDEX "_mau_cum_v_rels_order_idx" ON "cms"."_mau_cum_v_rels" USING btree ("order");
  CREATE INDEX "_mau_cum_v_rels_parent_idx" ON "cms"."_mau_cum_v_rels" USING btree ("parent_id");
  CREATE INDEX "_mau_cum_v_rels_path_idx" ON "cms"."_mau_cum_v_rels" USING btree ("path");
  CREATE INDEX "_mau_cum_v_rels_bai_viet_id_idx" ON "cms"."_mau_cum_v_rels" USING btree ("bai_viet_id");
  CREATE INDEX "dieu_huong_thuong_hieu_cam_ket_order_idx" ON "cms"."dieu_huong_thuong_hieu_cam_ket" USING btree ("_order");
  CREATE INDEX "dieu_huong_thuong_hieu_cam_ket_parent_id_idx" ON "cms"."dieu_huong_thuong_hieu_cam_ket" USING btree ("_parent_id");
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_noi_dung_trang_fk" FOREIGN KEY ("noi_dung_trang_id") REFERENCES "cms"."noi_dung_trang"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mau_cum_fk" FOREIGN KEY ("mau_cum_id") REFERENCES "cms"."mau_cum"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_noi_dung_trang_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("noi_dung_trang_id");
  CREATE INDEX "payload_locked_documents_rels_mau_cum_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("mau_cum_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."noi_dung_trang_doan" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_hoi_dap" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_lien_ket" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_muc" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_nut_moi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_ghi_chu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_keu_goi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_trich_dan" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_cong_cu_ds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_cong_cu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_bai_viet" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_hoi_dap_ds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_hoi_dap" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_loi_moi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_blocks_van_ban" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."noi_dung_trang_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_version_doan" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_version_hoi_dap" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_version_lien_ket" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_version_muc" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_nut_moi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_ghi_chu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_keu_goi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_trich_dan" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_cong_cu_ds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_cong_cu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_bai_viet" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_hoi_dap_ds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_hoi_dap" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_loi_moi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_blocks_van_ban" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_noi_dung_trang_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_nut_moi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_ghi_chu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_keu_goi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_trich_dan" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_cong_cu_ds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_cong_cu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_bai_viet" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_hoi_dap_ds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_hoi_dap" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_loi_moi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_blocks_van_ban" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."mau_cum_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_nut_moi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_ghi_chu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_keu_goi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_trich_dan" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_cong_cu_ds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_cong_cu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_bai_viet" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_hoi_dap_ds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_hoi_dap" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_loi_moi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_blocks_van_ban" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."_mau_cum_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."dieu_huong_thuong_hieu_cam_ket" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cms"."noi_dung_trang_doan" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_hoi_dap" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_lien_ket" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_muc" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_banner" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_nut_moi" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_ghi_chu" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_keu_goi" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_trich_dan" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_video" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_cong_cu_ds" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_cong_cu" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_bai_viet" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_hoi_dap_ds" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_hoi_dap" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_loi_moi" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_blocks_van_ban" CASCADE;
  DROP TABLE "cms"."noi_dung_trang" CASCADE;
  DROP TABLE "cms"."noi_dung_trang_rels" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_version_doan" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_version_hoi_dap" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_version_lien_ket" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_version_muc" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_banner" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_nut_moi" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_ghi_chu" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_keu_goi" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_trich_dan" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_video" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_cong_cu_ds" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_cong_cu" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_bai_viet" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_hoi_dap_ds" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_hoi_dap" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_loi_moi" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_blocks_van_ban" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v" CASCADE;
  DROP TABLE "cms"."_noi_dung_trang_v_rels" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_banner" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_nut_moi" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_ghi_chu" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_keu_goi" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_trich_dan" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_video" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_cong_cu_ds" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_cong_cu" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_bai_viet" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_hoi_dap_ds" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_hoi_dap" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_loi_moi" CASCADE;
  DROP TABLE "cms"."mau_cum_blocks_van_ban" CASCADE;
  DROP TABLE "cms"."mau_cum" CASCADE;
  DROP TABLE "cms"."mau_cum_rels" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_banner" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_nut_moi" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_ghi_chu" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_keu_goi" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_trich_dan" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_video" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_cong_cu_ds" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_cong_cu" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_bai_viet" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_hoi_dap_ds" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_hoi_dap" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_loi_moi" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_blocks_van_ban" CASCADE;
  DROP TABLE "cms"."_mau_cum_v" CASCADE;
  DROP TABLE "cms"."_mau_cum_v_rels" CASCADE;
  DROP TABLE "cms"."dieu_huong_thuong_hieu_cam_ket" CASCADE;
  DROP TABLE "cms"."payload_jobs_stats" CASCADE;
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_noi_dung_trang_fk";
  
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_mau_cum_fk";
  
  DELETE FROM "cms"."payload_jobs_log" WHERE "task_slug" = 'dong-bo-so-trang';
  DELETE FROM "cms"."payload_jobs" WHERE "task_slug" = 'dong-bo-so-trang';
  ALTER TABLE "cms"."payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "cms"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "cms"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "cms"."payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "cms"."enum_payload_jobs_log_task_slug" USING "task_slug"::"cms"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "cms"."payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "cms"."enum_payload_jobs_task_slug";
  CREATE TYPE "cms"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "cms"."payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "cms"."enum_payload_jobs_task_slug" USING "task_slug"::"cms"."enum_payload_jobs_task_slug";
  DROP INDEX "cms"."payload_locked_documents_rels_noi_dung_trang_id_idx";
  DROP INDEX "cms"."payload_locked_documents_rels_mau_cum_id_idx";
  ALTER TABLE "cms"."payload_jobs" DROP COLUMN "meta";
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP COLUMN "noi_dung_trang_id";
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP COLUMN "mau_cum_id";
  ALTER TABLE "cms"."dieu_huong" DROP COLUMN "thuong_hieu_gioi_thieu";
  ALTER TABLE "cms"."dieu_huong" DROP COLUMN "mien_tru";
  ALTER TABLE "cms"."dieu_huong" DROP COLUMN "nhan_ung_ho";
  DROP TYPE "cms"."enum_noi_dung_trang_lien_ket_loai";
  DROP TYPE "cms"."enum_noi_dung_trang_blocks_banner_kieu_chu_co";
  DROP TYPE "cms"."enum_noi_dung_trang_blocks_banner_kieu_chu_can";
  DROP TYPE "cms"."enum_noi_dung_trang_blocks_banner_kieu_chu_nen";
  DROP TYPE "cms"."enum_noi_dung_trang_blocks_nut_moi_kieu";
  DROP TYPE "cms"."enum_noi_dung_trang_blocks_ghi_chu_kieu";
  DROP TYPE "cms"."enum_noi_dung_trang_blocks_keu_goi_cong_cu";
  DROP TYPE "cms"."enum_noi_dung_trang_blocks_cong_cu_ds";
  DROP TYPE "cms"."enum_noi_dung_trang_blocks_bai_viet_mang";
  DROP TYPE "cms"."enum_noi_dung_trang_nhom";
  DROP TYPE "cms"."enum_noi_dung_trang_kieu_chu_co";
  DROP TYPE "cms"."enum_noi_dung_trang_kieu_chu_can";
  DROP TYPE "cms"."enum_noi_dung_trang_kieu_chu_nen";
  DROP TYPE "cms"."enum_noi_dung_trang_loai_sua";
  DROP TYPE "cms"."enum_noi_dung_trang_che_do_mau_tren";
  DROP TYPE "cms"."enum_noi_dung_trang_che_do_mau_duoi";
  DROP TYPE "cms"."enum_noi_dung_trang_che_do_mau_cuoi";
  DROP TYPE "cms"."enum_noi_dung_trang_status";
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_lien_ket_loai";
  DROP TYPE "cms"."enum__noi_dung_trang_v_blocks_banner_kieu_chu_co";
  DROP TYPE "cms"."enum__noi_dung_trang_v_blocks_banner_kieu_chu_can";
  DROP TYPE "cms"."enum__noi_dung_trang_v_blocks_banner_kieu_chu_nen";
  DROP TYPE "cms"."enum__noi_dung_trang_v_blocks_nut_moi_kieu";
  DROP TYPE "cms"."enum__noi_dung_trang_v_blocks_ghi_chu_kieu";
  DROP TYPE "cms"."enum__noi_dung_trang_v_blocks_keu_goi_cong_cu";
  DROP TYPE "cms"."enum__noi_dung_trang_v_blocks_cong_cu_ds";
  DROP TYPE "cms"."enum__noi_dung_trang_v_blocks_bai_viet_mang";
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_nhom";
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_kieu_chu_co";
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_kieu_chu_can";
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_kieu_chu_nen";
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_loai_sua";
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_che_do_mau_tren";
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_che_do_mau_duoi";
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_che_do_mau_cuoi";
  DROP TYPE "cms"."enum__noi_dung_trang_v_version_status";
  DROP TYPE "cms"."enum_mau_cum_blocks_banner_kieu_chu_co";
  DROP TYPE "cms"."enum_mau_cum_blocks_banner_kieu_chu_can";
  DROP TYPE "cms"."enum_mau_cum_blocks_banner_kieu_chu_nen";
  DROP TYPE "cms"."enum_mau_cum_blocks_nut_moi_kieu";
  DROP TYPE "cms"."enum_mau_cum_blocks_ghi_chu_kieu";
  DROP TYPE "cms"."enum_mau_cum_blocks_keu_goi_cong_cu";
  DROP TYPE "cms"."enum_mau_cum_blocks_cong_cu_ds";
  DROP TYPE "cms"."enum_mau_cum_blocks_bai_viet_mang";
  DROP TYPE "cms"."enum_mau_cum_nhom";
  DROP TYPE "cms"."enum_mau_cum_status";
  DROP TYPE "cms"."enum__mau_cum_v_blocks_banner_kieu_chu_co";
  DROP TYPE "cms"."enum__mau_cum_v_blocks_banner_kieu_chu_can";
  DROP TYPE "cms"."enum__mau_cum_v_blocks_banner_kieu_chu_nen";
  DROP TYPE "cms"."enum__mau_cum_v_blocks_nut_moi_kieu";
  DROP TYPE "cms"."enum__mau_cum_v_blocks_ghi_chu_kieu";
  DROP TYPE "cms"."enum__mau_cum_v_blocks_keu_goi_cong_cu";
  DROP TYPE "cms"."enum__mau_cum_v_blocks_cong_cu_ds";
  DROP TYPE "cms"."enum__mau_cum_v_blocks_bai_viet_mang";
  DROP TYPE "cms"."enum__mau_cum_v_version_nhom";
  DROP TYPE "cms"."enum__mau_cum_v_version_status";
  DROP TYPE "cms"."enum_dieu_huong_thuong_hieu_cam_ket_bieu_tuong";`)
}
