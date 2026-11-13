import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { apDungKw6t, hoanTacKw6t } from '../lib/kw6t-bai-cu'

// KW-6T (chủ dự án giao 2026-11-11: "vào CMS chỉnh sửa bài cũ theo đề xuất của em, chỉnh nội dung, ảnh, rà soát còn thiếu gì")
// — chỉ DỮ LIỆU, không đổi bảng. Theo tab "Bài cũ" của docs/KE-HOACH-TU-KHOA-SEO-6-THANG.md:
// (1) gộp 3 cặp bài trùng từ khoá: bài phụ thôi xuất bản, slug của nó vào slug_cu bài chính (web 308), phần riêng của bài phụ
//     chuyển sang bài chính; (2) sửa 3 tiêu đề nhồi từ khoá, đổi đường dẫn (đường cũ 308), vẽ lại ảnh bìa + ảnh có in tiêu đề;
// (3) mọi bài: link "Hiểu Bản Thân" về trang chủ → công cụ đúng mảng, đoạn "Đọc tiếp", bài liên quan, từ khoá chính không trùng,
//     sửa mảng của 6 bài. Bài có bản nháp đang sửa dở thì không đè. Mỗi thao tác tự cam kết; lỗi chỉ ghi log — không chặn deploy.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  try {
    const kq = await apDungKw6t(payload, req)
    for (const r of kq) payload.logger.info(`KW-6T: ${r.slug} — ${r.viec}: ${r.ok ? 'xong' : 'CHƯA'}${r.ly_do ? ` (${r.ly_do})` : ''}`)
    payload.logger.info(`KW-6T: xong ${kq.filter((r) => r.ok).length}/${kq.length} bài`)
  } catch (e) {
    payload.logger.error(`KW-6T: chưa áp dụng được — ${(e as Error)?.message ?? e}`)
  }
}

// Khôi phục phiên bản ngay trước KW-6T của từng bài (kể cả bài đã gộp). Ảnh mới vẽ giữ trong Thư viện ảnh.
export async function down({ payload }: MigrateDownArgs): Promise<void> {
  try {
    payload.logger.info(`KW-6T: đã khôi phục ${await hoanTacKw6t(payload)} bài về bản trước`)
  } catch (e) {
    payload.logger.error(`KW-6T: chưa khôi phục được — ${(e as Error)?.message ?? e}`)
  }
}
