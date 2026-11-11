import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { apDungKw6t, hoanTacKw6t } from '../lib/kw6t-bai-cu'

// KW-6T lần 2 — chỉ DỮ LIỆU. Lần chạy đầu (20261111_090000_kw6t_bai_cu) cho 3 bài phụ thôi xuất bản rồi bỏ qua cả 21 bài
// chính: trình soạn thảo CMS tự lưu bản nháp (2 giây) mỗi khi bài được mở, nên bài nào cũng "có bản nháp mới hơn". Nay chỉ
// coi là đang sửa dở khi bản nháp KHÁC bản xuất bản ở nội dung thật; bài chính nhận slug của bài phụ đã gộp (web 308);
// bài phụ chỉ thôi xuất bản SAU khi bài chính sửa xong. Chạy lại an toàn: bài đã sửa không đổi thêm.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  try {
    const kq = await apDungKw6t(payload, req)
    for (const r of kq) payload.logger.info(`KW-6T: ${r.slug} — ${r.viec}: ${r.ok ? 'xong' : 'CHƯA'}${r.ly_do ? ` (${r.ly_do})` : ''}`)
    payload.logger.info(`KW-6T: xong ${kq.filter((r) => r.ok).length}/${kq.length} bài`)
  } catch (e) {
    payload.logger.error(`KW-6T: chưa áp dụng được — ${(e as Error)?.message ?? e}`)
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  try {
    payload.logger.info(`KW-6T: đã khôi phục ${await hoanTacKw6t(payload)} bài về bản trước`)
  } catch (e) {
    payload.logger.error(`KW-6T: chưa khôi phục được — ${(e as Error)?.message ?? e}`)
  }
}
