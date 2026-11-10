import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { tuDongNotFair } from '../lib/tu-dong-notfair'

// BLOG-10 (chủ dự án giao 2026-11-10: "kiểm tra lại toàn bộ bài NotFair, chưa đạt điểm thì sửa, cập nhật hình ảnh mới,
// đạt điểm thì xuất bản") — chỉ DỮ LIỆU, không đổi bảng. Chạy lúc deploy (CMS có đủ khoá NotFair qua web + kho ảnh S3):
// (1) nhập mọi bài NotFair chưa có trong CMS; (2) mọi nháp NotFair chưa từng xuất bản (cron đã nhập, đang chờ duyệt tay):
// chuẩn hoá SEO — bìa nền sáng thay bìa NotFair chữ sai dấu, bỏ ảnh NotFair trong thân bài, vẽ ảnh Tóm tắt / Lộ trình /
// Hỏi đáp, điền nguồn từ link tài liệu đã dẫn, hỏi đáp, mô tả, liên kết nội bộ; (3) xuất bản bài đạt điểm kiểm định ≥ ngưỡng
// (mặc định 85), không lỗi chặn, không trùng ≥ 50 %. Bài chưa đạt giữ nháp, ghi lý do vào "Ghi chú của Chủ biên".
// Bài ĐÃ xuất bản không đụng tới (đều ≥ 89 điểm lúc kiểm 2026-11-10). Mỗi thao tác tự cam kết (không dùng giao dịch của
// migration) để web làm mới đúng bản đã ghi. Lỗi bất kỳ chỉ ghi log — không chặn deploy.
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  try {
    const kq = await tuDongNotFair(payload, undefined, { hanMs: 20 * 60_000, toiDa: 200, thuLai: true })
    if (!kq.co_nguon) payload.logger.info('BLOG-10: CMS chưa đọc được NotFair (thiếu khoá / WEB_URL) — chỉ xử lý nháp đã nhập')
    for (const b of kq.moi) {
      payload.logger.info(`BLOG-10: ${b.slug || b.id} — ${b.loi ? `lỗi: ${b.loi}` : b.xuat_ban ? `xuất bản (${b.diem} điểm)` : `giữ nháp: ${b.ly_do ?? ''}`}`)
    }
    payload.logger.info(`BLOG-10: xử lý ${kq.moi.length} bài, xuất bản ${kq.moi.filter((b) => b.xuat_ban).length}, còn lại ${kq.con_lai}`)
  } catch (e) {
    payload.logger.error(`BLOG-10: chưa xử lý được — ${(e as Error)?.message ?? e}`)
  }
}

// Bài đã xuất bản không tự gỡ — gỡ từng bài bằng "Bỏ xuất bản" trong CMS nếu cần.
export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('BLOG-10: không tự gỡ bài — dùng "Bỏ xuất bản" trong CMS nếu cần.')
}
