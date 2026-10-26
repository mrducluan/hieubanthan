import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { taoBaiKhoiTao, xoaBaiKhoiTao } from '../bai-khoi-tao/tao'

// BLOG-6 (chủ dự án giao 2026-10-26) — chỉ DỮ LIỆU, không đổi bảng: tạo 3 bài nháp "Gửi duyệt" cho mảng chưa có bài
// (Kinh Dịch · Bát tự · Phong thuỷ) từ src/bai-khoi-tao/*.json + ảnh minh hoạ. Không xuất bản. Đã có slug → bỏ qua.
// Lỗi bất kỳ chỉ ghi log — không chặn deploy CMS (bài thiếu thì Chủ biên nhập tay từ phiếu nhập).
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  try {
    const da = await taoBaiKhoiTao(payload, req)
    payload.logger.info(`BLOG-6: tạo ${da.length} bài nháp${da.length ? `: ${da.join(', ')}` : ''}`)
  } catch (e) {
    payload.logger.error(`BLOG-6: chưa tạo được bài khởi tạo — ${(e as Error)?.message ?? e}`)
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  try {
    await xoaBaiKhoiTao(payload, req)
  } catch (e) {
    payload.logger.error(`BLOG-6: chưa xoá được bài khởi tạo — ${(e as Error)?.message ?? e}`)
  }
}
