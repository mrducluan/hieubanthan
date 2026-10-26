import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { capNhatAnhKhoiTao } from '../bai-khoi-tao/tao'

// 2026-10-26 — chỉ DỮ LIỆU, không đổi bảng: ảnh minh hoạ của 3 bài khởi tạo BLOG-6 nay có link + mã QR về đúng bài (tệp trong
// src/bai-khoi-tao/anh). Bài đã nhập từ trước → thay tệp ảnh cũ trong Thư viện ảnh, giữ id (bài không đổi). Chưa nhập → không
// có gì để thay (lần nhập sau đã dùng ảnh mới). Mỗi ảnh một giao dịch riêng (lỗi kho ở ảnh sau không làm hỏng ảnh đã thay);
// lỗi bất kỳ chỉ ghi log — không chặn deploy CMS.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  try {
    const { thay, loi } = await capNhatAnhKhoiTao(payload, req)
    payload.logger.info(`Ảnh QR bài khởi tạo: đã thay ${thay} ảnh${loi ? `, ${loi} ảnh lỗi kho (giữ ảnh cũ — tải lại tay từ src/bai-khoi-tao/anh)` : ''}`)
  } catch (e) {
    payload.logger.error(`Ảnh QR bài khởi tạo: chưa thay được — ${(e as Error)?.message ?? e} (tải lại tay từ src/bai-khoi-tao/anh)`)
  }
}

// Không khôi phục ảnh không QR (ảnh cũ chỉ còn trong lịch sử git) — ảnh có QR vẫn đúng nội dung bài.
export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Ảnh QR bài khởi tạo: down không đổi ảnh')
}
