import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { apDungSeoQ, hoanTacSeoQ } from '../lib/seo-q-bai-cu'

// SEO-Q (chủ dự án giao 2026-11-17: "phần sửa tiêu đề blog em gợi ý, em tự sửa luôn trong CMS") — chỉ DỮ LIỆU, không đổi bảng.
// Đổi tiêu đề SEO + mô tả của 6 bài (2 bài ngũ hành ở trang 1 Google mà 0 nhấp; 3 tiêu đề nhồi từ khoá; 1 lỗi dấu cách).
// Không đụng H1, đường dẫn, ảnh, thân bài. Bài có nháp đang sửa dở → bỏ qua. Lỗi chỉ ghi log — không chặn deploy CMS.
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  try {
    const kq = await apDungSeoQ(payload)
    for (const r of kq) payload.logger.info(`SEO-Q: ${r.slug}: ${r.ok ? 'xong' : 'CHƯA'}${r.ly_do ? ` (${r.ly_do})` : ''}`)
  } catch (e) {
    payload.logger.error(`SEO-Q: chưa áp dụng được — ${(e as Error)?.message ?? e}`)
  }
}

// Trả chữ cũ cho bài còn đúng chữ SEO-Q (bài đã sửa tay sau đó giữ nguyên).
export async function down({ payload }: MigrateDownArgs): Promise<void> {
  try {
    payload.logger.info(`SEO-Q: trả chữ cũ cho ${await hoanTacSeoQ(payload)} bài`)
  } catch (e) {
    payload.logger.error(`SEO-Q: chưa hoàn tác được — ${(e as Error)?.message ?? e}`)
  }
}
