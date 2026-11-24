import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { LO_HOI_DAP, taoBaiKhoiTao, xoaBaiKhoiTao } from '../bai-khoi-tao/tao'

// HD-TH (#353) — chỉ DỮ LIỆU, không đổi bảng: 12 tình huống hỏi đáp minh hoạ thành BÀI NHÁP "Gửi duyệt" (không xuất bản).
// Đã có slug → bỏ qua. Down chỉ xoá bài chưa từng xuất bản. Lỗi chỉ ghi log — không chặn deploy CMS.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  try {
    const da = await taoBaiKhoiTao(payload, req, LO_HOI_DAP)
    payload.logger.info(`HD-TH: tạo ${da.length} bài nháp${da.length ? `: ${da.join(', ')}` : ''}`)
  } catch (e) {
    payload.logger.error(`HD-TH: chưa tạo được bài nháp — ${(e as Error)?.message ?? e}`)
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  try {
    await xoaBaiKhoiTao(payload, req, LO_HOI_DAP)
  } catch (e) {
    payload.logger.error(`HD-TH: chưa xoá được bài nháp — ${(e as Error)?.message ?? e}`)
  }
}
