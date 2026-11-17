import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { LO_KW6T_T3, taoBaiKhoiTao, xoaBaiKhoiTao } from '../bai-khoi-tao/tao'

// KW-6T tuần 3 (chủ dự án giao 2026-11-17) — chỉ DỮ LIỆU, không đổi bảng: tạo 4 bài của tuần 3 kế hoạch từ khoá
// (src/bai-khoi-tao/kw6t-tuan-3/*.json + 16 ảnh WebP có alt và QR), xuất bản khi đủ ảnh và không lỗi chặn kiểm định
// (vẫn "Gửi duyệt", Ban biên tập đứng tên). Đã có slug → bỏ qua. Lỗi chỉ ghi log — không chặn deploy CMS.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  try {
    const da = await taoBaiKhoiTao(payload, req, LO_KW6T_T3)
    payload.logger.info(`KW-6T tuần 3: tạo ${da.length} bài${da.length ? `: ${da.join(', ')}` : ''}`)
  } catch (e) {
    payload.logger.error(`KW-6T tuần 3: chưa tạo được bài — ${(e as Error)?.message ?? e}`)
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  try {
    await xoaBaiKhoiTao(payload, req, LO_KW6T_T3)
  } catch (e) {
    payload.logger.error(`KW-6T tuần 3: chưa xoá được bài — ${(e as Error)?.message ?? e}`)
  }
}
