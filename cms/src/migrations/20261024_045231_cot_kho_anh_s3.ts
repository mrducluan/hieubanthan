// BLOG-5 / sự cố 2026-10-24: tải ảnh trên cms.hieuban.com báo "There was a problem while uploading the file."
// Nguyên nhân: khi đủ biến S3_* (Supabase Storage), @payloadcms/storage-s3 thêm hai trường ẩn `prefix` + `_objectKey`
// vào collection Ảnh, nhưng mọi migration trước đây được sinh lúc CHƯA có S3 → bảng cms.media trên production thiếu hai
// cột này → câu select kiểm trùng tên tệp hỏng (column "prefix" does not exist) → Payload gom thành lỗi chung chung.
// Sinh bằng `payload migrate:create` với S3 bật. Cột không bắt buộc, không ảnh hưởng khi chạy máy không có S3.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."media" ADD COLUMN "prefix" varchar DEFAULT 'cms';
  ALTER TABLE "cms"."media" ADD COLUMN "_objectkey" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."media" DROP COLUMN "prefix";
  ALTER TABLE "cms"."media" DROP COLUMN "_objectkey";`)
}
