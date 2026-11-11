import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { LO_KW6T, taoBaiKhoiTao, xoaBaiKhoiTao } from '../bai-khoi-tao/tao'

// KW-6T tuần 1–2 (chủ dự án giao 2026-11-11) — chỉ DỮ LIỆU, không đổi bảng: tạo 8 bài nháp "Gửi duyệt" của tuần 1–2
// kế hoạch từ khoá (xông đất, Tam tai, Kim lâu, Hoang ốc, mượn tuổi, La Hầu – Kế Đô, thần số cho người mới) từ
// src/bai-khoi-tao/kw6t/*.json + 32 ảnh minh hoạ có QR. Không xuất bản. Đã có slug → bỏ qua.
// Lỗi bất kỳ chỉ ghi log — không chặn deploy CMS.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  try {
    const da = await taoBaiKhoiTao(payload, req, LO_KW6T)
    payload.logger.info(`KW-6T: tạo ${da.length} bài nháp${da.length ? `: ${da.join(', ')}` : ''}`)
  } catch (e) {
    payload.logger.error(`KW-6T: chưa tạo được bài tuần 1–2 — ${(e as Error)?.message ?? e}`)
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  try {
    await xoaBaiKhoiTao(payload, req, LO_KW6T)
  } catch (e) {
    payload.logger.error(`KW-6T: chưa xoá được bài tuần 1–2 — ${(e as Error)?.message ?? e}`)
  }
}
