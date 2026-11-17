import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { apDungKw6t, hoanTacKw6t } from '../lib/kw6t-bai-cu'
import { apDungBienTap, DAU_NFBT } from '../lib/notfair-bien-tap'

// NF-BT (chủ dự án giao 2026-11-17) — chỉ DỮ LIỆU, không đổi bảng.
// 1) Chạy lại KW-6T (gộp 3 cặp, đổi 3 tiêu đề + đường dẫn, link đúng công cụ, đọc tiếp) KHÔNG dừng ở bản nháp máy để lại:
//    lần 2 trên production vẫn bỏ qua cả 21 bài chính. Bài đã có ghi chú KW-6T thì không đổi thêm.
// 2) Biên tập 21 bài NotFair theo audit (src/lib/notfair-bien-tap.ts): ảnh bìa có tiêu đề, alt ảnh, đoạn số liệu engine + ảnh,
//    đoạn kết dẫn đúng công cụ, hỏi đáp, bớt cụm sáo — rồi xuất bản. Bài đã có ghi chú NF-BT thì bỏ qua (chạy lại an toàn).
// Lỗi bất kỳ chỉ ghi log — không chặn deploy CMS. Down: khôi phục bản xuất bản trước NF-BT (lượt KW-6T giữ nguyên;
// muốn trả cả KW-6T thì down tiếp migration kw6t_lan_2).
const THU_MUC_ANH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../bai-khoi-tao/notfair/anh')

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  try {
    const kq = await apDungKw6t(payload, req, { boQuaNhap: true })
    for (const r of kq) payload.logger.info(`KW-6T: ${r.slug} — ${r.viec}: ${r.ok ? 'xong' : 'CHƯA'}${r.ly_do ? ` (${r.ly_do})` : ''}`)
    payload.logger.info(`KW-6T: xong ${kq.filter((r) => r.ok).length}/${kq.length} bài`)
  } catch (e) {
    payload.logger.error(`KW-6T: chưa áp dụng được — ${(e as Error)?.message ?? e}`)
  }
  try {
    const kq = await apDungBienTap(payload, req, THU_MUC_ANH)
    for (const r of kq) payload.logger.info(`${DAU_NFBT}: ${r.slug} — ${r.ok ? 'xong' : 'CHƯA'}${r.ly_do ? ` (${r.ly_do})` : ''}`)
    payload.logger.info(`${DAU_NFBT}: xong ${kq.filter((r) => r.ok).length}/${kq.length} bài`)
  } catch (e) {
    payload.logger.error(`${DAU_NFBT}: chưa áp dụng được — ${(e as Error)?.message ?? e}`)
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  try {
    payload.logger.info(`${DAU_NFBT}: đã khôi phục ${await hoanTacKw6t(payload, DAU_NFBT)} bài về bản trước`)
  } catch (e) {
    payload.logger.error(`${DAU_NFBT}: chưa khôi phục được — ${(e as Error)?.message ?? e}`)
  }
}
