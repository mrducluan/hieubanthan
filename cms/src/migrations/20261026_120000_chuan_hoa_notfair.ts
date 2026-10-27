import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { coKhoaNotFair, dsNotFair, nhapBaiNotFair } from '../lib/notfair'
import { chuanHoaTatCaNotFair } from '../lib/chuan-hoa-notfair'

// BLOG-7 (chủ dự án giao 2026-10-26) — chỉ DỮ LIỆU, không đổi bảng: (1) nhập vào CMS mọi bài NotFair chưa có (nháp);
// (2) chuẩn hoá SEO mọi bài nguồn NotFair thành BẢN NHÁP "Gửi duyệt" — đường dẫn không dấu (cũ → 308), trường SEO thiếu,
// hỏi đáp, ảnh nền sáng, liên kết nội bộ. Không xuất bản: bản đang hiện trên web giữ nguyên tới khi Chủ biên bấm Xuất bản.
// Lỗi bất kỳ chỉ ghi log — không chặn deploy (chạy lại bằng nút "Chuẩn hoá SEO các bài đã nhập" ở danh sách Bài viết).
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  try {
    if (coKhoaNotFair()) {
      const ds = await dsNotFair()
      let moi = 0
      for (const p of ds) {
        try {
          const kq = await nhapBaiNotFair(payload, req, p.slug, { heThong: true })
          if (!kq.da_co) moi++
        } catch (e) {
          payload.logger.warn(`BLOG-7: chưa nhập được bài NotFair ${p.slug} — ${(e as Error)?.message ?? e}`)
        }
      }
      payload.logger.info(`BLOG-7: ${ds.length} bài NotFair, nhập mới ${moi}`)
    } else payload.logger.info('BLOG-7: CMS chưa đọc được NotFair (thiếu khoá / WEB_URL) — chỉ chuẩn hoá bài đã nhập')
    const kq = await chuanHoaTatCaNotFair(payload, req)
    for (const b of kq) {
      payload.logger.info(`BLOG-7: ${b.slug || b.id} — ${b.loi ? `lỗi: ${b.loi}` : b.thay_doi.length ? `${b.diem_truoc} → ${b.diem_sau}, ${b.thay_doi.length} thay đổi` : 'đã chuẩn'}`)
    }
  } catch (e) {
    payload.logger.error(`BLOG-7: chưa chuẩn hoá được — ${(e as Error)?.message ?? e}`)
  }
}

// Bản nháp chuẩn hoá là phiên bản mới trong lịch sử bài — muốn bỏ thì mở bài → Phiên bản → khôi phục bản trước.
export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('BLOG-7: không tự xoá — khôi phục phiên bản cũ của từng bài trong CMS nếu cần.')
}
